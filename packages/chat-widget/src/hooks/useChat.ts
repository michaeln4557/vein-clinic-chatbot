import { useState, useEffect, useRef, useCallback } from 'react';
import type { VeinClinicChatConfig } from '../index';
import type { Message } from '../components/MessageBubble';
import { chatApi, SendMessageResponse, FileUploadResponse } from '../services/api';
import { chunkResponse, chunkDelay, interChunkDelay } from './chunkResponse';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

/** Typing speed: ms per character of the response to simulate typing delay */
export type TypingSpeed = 'instant' | 'fast' | 'natural' | 'slow';

/**
 * Category-based typing delay with randomization.
 * Simulates a real person texting — short replies come faster, longer ones take more time.
 * Ranges per the humanization spec:
 *   short (≤40 chars):  400–900 ms
 *   medium (41–160):    900–1800 ms
 *   long (>160):        1500–2800 ms
 * Speed multipliers shift the range without breaking the feel.
 */
const SPEED_MULTIPLIER: Record<TypingSpeed, number> = {
  instant: 0,
  fast: 0.5,
  natural: 1.0,
  slow: 1.4,
};

function randomBetween(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min));
}

function calculateTypingDelay(text: string, speed: TypingSpeed): number {
  const mult = SPEED_MULTIPLIER[speed];
  if (mult === 0) return 0;

  const len = text.length;
  let baseDelay: number;

  if (len <= 40) {
    baseDelay = randomBetween(100, 250);
  } else if (len <= 160) {
    baseDelay = randomBetween(200, 450);
  } else {
    baseDelay = randomBetween(350, 650);
  }

  return Math.round(baseDelay * mult);
}

interface UseChatReturn {
  messages: Message[];
  isTyping: boolean;
  connectionStatus: ConnectionStatus;
  sendMessage: (text: string) => void;
  sendFile: (file: File, label: 'front' | 'back') => void;
  sessionId: string | null;
  typingSpeed: TypingSpeed;
  setTypingSpeed: (speed: TypingSpeed) => void;
}

const POLL_INTERVAL_MS = 2000;
const WS_RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function useChat(config: VeinClinicChatConfig): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [typingSpeed, setTypingSpeed] = useState<TypingSpeed>('natural');

  const wsRef = useRef<WebSocket | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const lastMessageIdRef = useRef<string | null>(null);
  const greetingContentRef = useRef<Set<string>>(new Set());
  const initCalledRef = useRef(false);
  const api = useRef(chatApi(config.apiUrl));

  // Channel-specific greeting messages (split into 2 for natural feel)
  const getGreetingParts = (channel: string): [string, string] => {
    switch (channel) {
      case 'social':
      case 'facebook':
      case 'instagram':
        return [
          "Hi, I'm Maya with Vein Treatment Clinic.",
          "I'm glad you reached out. I can help with any questions or next steps.\nWhat's been going on?",
        ];
      case 'sms':
      case 'missed_call':
        return [
          "Hi, I'm Maya with Vein Treatment Clinic. Sorry we missed your call earlier.",
          "I can help you here by text if that's easier.\nWhat's going on?",
        ];
      default: // web
        return [
          "Hi, I'm Maya with Vein Treatment Clinic.",
          "I'm happy to answer any questions and help you figure out next steps.\nWhat's been going on?",
        ];
    }
  };

  // Initialize session (guarded against React Strict Mode double-invocation)
  useEffect(() => {
    if (initCalledRef.current) return;
    initCalledRef.current = true;

    const initSession = async () => {
      try {
        const channel = config.channel || 'web';
        const [greeting1, greeting2] = getGreetingParts(channel);
        const fullGreeting = `${greeting1}\n\n${greeting2}`;

        const session = await api.current.createSession({
          locationId: config.locationId,
          channel,
          greeting: fullGreeting,
        });
        setSessionId(session.sessionId);

        // Show first message immediately
        const msg1: Message = {
          id: generateId(),
          role: 'bot',
          content: greeting1,
          timestamp: new Date(),
          type: 'text',
        };
        setMessages([msg1]);

        // Show typing dots, then second message after a short delay
        setIsTyping(true);
        const delay = randomBetween(300, 700);
        setTimeout(() => {
          const msg2: Message = {
            id: generateId(),
            role: 'bot',
            content: greeting2,
            timestamp: new Date(),
            type: 'text',
          };
          setMessages((prev) => [...prev, msg2]);
          setIsTyping(false);

          // Mark greeting content so polling skips duplicates
          greetingContentRef.current.add(greeting1);
          greetingContentRef.current.add(greeting2);

          // Start real-time transport AFTER greetings are shown
          if (config.wsUrl) {
            connectWebSocket(session.sessionId);
          } else {
            startPolling(session.sessionId);
          }
        }, delay);
      } catch (err) {
        console.error('[VeinClinicChat] Failed to initialize session:', err);
        setConnectionStatus('error');
      }
    };

    initSession();

    return () => {
      wsRef.current?.close();
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.apiUrl, config.wsUrl]);

  // WebSocket connection
  const connectWebSocket = useCallback(
    (sid: string) => {
      if (!config.wsUrl) return;

      setConnectionStatus('connecting');
      const ws = new WebSocket(`${config.wsUrl}?sessionId=${sid}`);

      ws.onopen = () => {
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'typing') {
            setIsTyping(data.isTyping);
            return;
          }

          if (data.type === 'message') {
            const msg: Message = {
              id: data.id || generateId(),
              role: 'bot',
              content: data.content,
              timestamp: new Date(data.timestamp || Date.now()),
              type: data.messageType || 'text',
            };
            setMessages((prev) => [...prev, msg]);
            setIsTyping(false);
            lastMessageIdRef.current = msg.id;
          }
        } catch (err) {
          console.error('[VeinClinicChat] Failed to parse WS message:', err);
        }
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          setTimeout(() => connectWebSocket(sid), WS_RECONNECT_DELAY_MS);
        } else {
          // Fall back to polling
          startPolling(sid);
        }
      };

      ws.onerror = () => {
        setConnectionStatus('error');
        ws.close();
      };

      wsRef.current = ws;
    },
    [config.wsUrl]
  );

  // Polling fallback
  const startPolling = useCallback(
    (sid: string) => {
      setConnectionStatus('connected');
      pollTimerRef.current = setInterval(async () => {
        try {
          const response = await api.current.pollMessages(sid, lastMessageIdRef.current);
          if (response.messages && response.messages.length > 0) {
            // Filter out messages that match greeting content (already shown client-side)
            const filtered = response.messages.filter(
              (m: any) => !greetingContentRef.current.has(m.content)
            );
            if (filtered.length > 0) {
              const newMessages: Message[] = filtered.map((m: any) => ({
                id: m.id || generateId(),
                role: 'bot' as const,
                content: m.content,
                timestamp: new Date(m.timestamp || Date.now()),
                type: m.type || 'text',
              }));
              setMessages((prev) => [...prev, ...newMessages]);
              lastMessageIdRef.current = newMessages[newMessages.length - 1].id;
            }
            // Still update lastMessageIdRef to skip these in future polls
            const lastMsg = response.messages[response.messages.length - 1];
            if (lastMsg?.id) lastMessageIdRef.current = lastMsg.id;
          }
          setIsTyping(response.isTyping || false);
        } catch (err) {
          console.error('[VeinClinicChat] Polling error:', err);
        }
      }, POLL_INTERVAL_MS);
    },
    []
  );

  /**
   * Render a queue of message chunks with typing indicator between each.
   * The typing indicator stays visible continuously until each chunk renders.
   */
  const renderChunkQueue = useCallback(
    (chunks: string[], baseId: string) => {
      const mult = SPEED_MULTIPLIER[typingSpeed];

      const renderNext = (index: number) => {
        if (index >= chunks.length) {
          setIsTyping(false);
          return;
        }

        const chunk = chunks[index];
        const isFirst = index === 0;
        const delay = isFirst
          ? (mult === 0 ? 0 : chunkDelay(chunk, mult))
          : (mult === 0 ? 0 : interChunkDelay() + chunkDelay(chunk, mult * 0.6));

        // Keep typing indicator ON while waiting
        setIsTyping(true);

        const showChunk = () => {
          const msgId = index === 0 ? baseId : generateId();
          const botMsg: Message = {
            id: msgId,
            role: 'bot',
            content: chunk,
            timestamp: new Date(),
            type: 'text',
          };
          setMessages((prev) => [...prev, botMsg]);

          // Add chunk content to greeting filter to prevent polling duplicates
          greetingContentRef.current.add(chunk);

          if (index < chunks.length - 1) {
            // More chunks coming. Show typing dots briefly before next chunk.
            setIsTyping(true);
            // Small gap so dots are visible before next chunk delay begins
            setTimeout(() => renderNext(index + 1), mult === 0 ? 0 : 150);
          } else {
            // Last chunk, done
            setIsTyping(false);
          }
        };

        if (delay > 0) {
          setTimeout(showChunk, delay);
        } else {
          showChunk();
        }
      };

      renderNext(0);
    },
    [typingSpeed]
  );

  // Send a text message
  const sendMessage = useCallback(
    async (text: string) => {
      if (!sessionId) return;

      const patientMsg: Message = {
        id: generateId(),
        role: 'patient',
        content: text,
        timestamp: new Date(),
        type: 'text',
      };
      setMessages((prev) => [...prev, patientMsg]);
      setIsTyping(true);

      try {
        const response: SendMessageResponse = await api.current.sendMessage(sessionId, text);

        if (response.reply) {
          const replyId = response.messageId || generateId();
          // Update lastMessageIdRef IMMEDIATELY so polling doesn't duplicate it
          lastMessageIdRef.current = replyId;

          // Add the FULL original reply to the filter so polling skips it
          // (polling returns the full message, not the chunked pieces)
          greetingContentRef.current.add(response.reply);

          // Split response into chunks and render with typing indicators
          const chunks = chunkResponse(response.reply);
          renderChunkQueue(chunks, replyId);
        }
      } catch (err) {
        console.error('[VeinClinicChat] Failed to send message:', err);
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: 'bot',
            content: "I'm sorry, I'm having trouble connecting. Please try again in a moment.",
            timestamp: new Date(),
            type: 'system',
          },
        ]);
      }
    },
    [sessionId, renderChunkQueue]
  );

  // Send a file (insurance card)
  const sendFile = useCallback(
    async (file: File, label: 'front' | 'back') => {
      if (!sessionId) return;

      const fileMsg: Message = {
        id: generateId(),
        role: 'patient',
        content: `Uploaded insurance card (${label})`,
        timestamp: new Date(),
        type: 'file',
        fileName: file.name,
      };
      setMessages((prev) => [...prev, fileMsg]);
      setIsTyping(true);

      try {
        const response: FileUploadResponse = await api.current.uploadFile(
          sessionId,
          file,
          label
        );

        if (response.reply) {
          setMessages((prev) => [
            ...prev,
            {
              id: generateId(),
              role: 'bot',
              content: response.reply,
              timestamp: new Date(),
              type: 'text',
            },
          ]);
        }
        setIsTyping(false);
      } catch (err) {
        console.error('[VeinClinicChat] Failed to upload file:', err);
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: 'bot',
            content: 'Sorry, there was an issue uploading your file. Please try again.',
            timestamp: new Date(),
            type: 'system',
          },
        ]);
      }
    },
    [sessionId]
  );

  return {
    messages,
    isTyping,
    connectionStatus,
    sendMessage,
    sendFile,
    sessionId,
    typingSpeed,
    setTypingSpeed,
  };
}
