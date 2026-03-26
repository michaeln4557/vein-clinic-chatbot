import { useState, useEffect, useRef, useCallback } from 'react';
import type { VeinClinicChatConfig } from '../index';
import type { Message } from '../components/MessageBubble';
import { chatApi, SendMessageResponse, FileUploadResponse, PresetTiming } from '../services/api';
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
  const presetTimingRef = useRef<PresetTiming>({
    minTypingDelay: 400, maxTypingDelay: 800,
    interBubblePauseMin: 200, interBubblePauseMax: 450,
  });
  const api = useRef(chatApi(config.apiUrl));

  // ── Inactivity follow-up system ──
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const secondFollowupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waitingTurnIdRef = useRef<string | null>(null);
  const firstFollowupSentRef = useRef(false);
  const secondFollowupSentRef = useRef(false);
  const conversationCompletedRef = useRef(false);

  const FIRST_FOLLOWUP_MS = 60_000;  // 60 seconds
  const SECOND_FOLLOWUP_MS = 60_000; // 60 more seconds after first

  /** Cancel all inactivity timers and reset flags */
  const cancelInactivityTimers = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
      console.log('[Inactivity] Timers canceled (user replied or new turn)');
    }
    if (secondFollowupTimerRef.current) {
      clearTimeout(secondFollowupTimerRef.current);
      secondFollowupTimerRef.current = null;
    }
    waitingTurnIdRef.current = null;
    firstFollowupSentRef.current = false;
    secondFollowupSentRef.current = false;
  };

  /** Start inactivity tracking for a bot message that requires a response */
  const startInactivityTimer = (turnId: string) => {
    // Don't start if conversation is completed (confirmation sent, closing done)
    if (conversationCompletedRef.current) {
      console.log('[Inactivity] Skipped — conversation completed');
      return;
    }

    cancelInactivityTimers();
    waitingTurnIdRef.current = turnId;
    console.log('[Inactivity] Timer started for turn:', turnId);

    inactivityTimerRef.current = setTimeout(() => {
      // Verify we're still waiting on the same turn
      if (waitingTurnIdRef.current !== turnId) return;
      if (firstFollowupSentRef.current) return;

      console.log('[Inactivity] First follow-up firing for turn:', turnId);
      firstFollowupSentRef.current = true;

      const followupMsg: Message = {
        id: generateId(),
        role: 'bot',
        content: "Just checking in — are you still there?",
        timestamp: new Date(),
        type: 'text',
      };
      setMessages((prev) => [...prev, followupMsg]);

      // Start second follow-up timer
      secondFollowupTimerRef.current = setTimeout(() => {
        if (waitingTurnIdRef.current !== turnId) return;
        if (secondFollowupSentRef.current) return;

        console.log('[Inactivity] Second follow-up firing for turn:', turnId);
        secondFollowupSentRef.current = true;

        const secondMsg: Message = {
          id: generateId(),
          role: 'bot',
          content: "I know the day can get busy. If it's easier, I can have someone call or text you with more information. What works better for you?",
          timestamp: new Date(),
          type: 'text',
        };
        setMessages((prev) => [...prev, secondMsg]);
      }, SECOND_FOLLOWUP_MS);

    }, FIRST_FOLLOWUP_MS);
  };

  // Channel-specific greeting messages (split into 2 for natural feel)
  const getGreetingParts = (channel: string): [string, string] => {
    switch (channel) {
      case 'social':
      case 'facebook':
      case 'instagram':
        return [
          "Hi, I'm Maya from the Front Desk at Vein Treatment Clinic.",
          "How can I help you today?",
        ];
      case 'sms':
      case 'missed_call':
        return [
          "Hi, I'm Maya from the Front Desk at Vein Treatment Clinic. Sorry we missed your call earlier.",
          "How can I help you today?",
        ];
      default: // web
        return [
          "Hi, I'm Maya from the Front Desk at Vein Treatment Clinic.",
          "How can I help you today?",
        ];
    }
  };

  // Initialize session (guarded against React Strict Mode double-invocation)
  useEffect(() => {
    if (initCalledRef.current) return;
    initCalledRef.current = true;

    const initSession = async () => {
      try {
        // Fetch active preset timing from backend
        try {
          const presetData = await api.current.getPresets();
          const active = presetData.presets.find((p) => p.active);
          if (active) presetTimingRef.current = active.timing;
        } catch { /* use defaults */ }

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

        // Show typing dots, then second message after a noticeable delay (feels like real typing)
        setIsTyping(true);
        const delay = randomBetween(800, 1400);
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
      cancelInactivityTimers();
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
  /**
   * Render a queue of message chunks with typing indicator between each.
   * Uses preset timing from the backend (Layer 3: Delivery).
   * The typing indicator stays visible continuously until each chunk renders.
   */
  const renderChunkQueue = useCallback(
    (chunks: string[], baseId: string) => {
      const mult = SPEED_MULTIPLIER[typingSpeed];

      /**
       * Length-proportional delay: longer text = longer "thinking" time.
       * Jitter of ±150-300ms makes it feel non-robotic.
       */
      const typingDelayForChunk = (text: string, isFirst: boolean): number => {
        if (mult === 0) return 0;
        const len = text.length;

        let base: number;
        if (isFirst) {
          // First bubble: reads patient message, thinks, starts typing
          // Needs to feel like a human reading and processing before responding
          if (len <= 30) base = randomBetween(2800, 3800);
          else if (len <= 80) base = randomBetween(3500, 4800);
          else base = randomBetween(4200, 5500);
        } else {
          // Between bubbles: human pauses, thinks about next thought, types it out
          // This is the critical gap — must feel like thinking + typing, not instant
          if (len <= 30) base = randomBetween(2500, 3500);
          else if (len <= 80) base = randomBetween(3200, 4500);
          else base = randomBetween(4000, 5200);
        }

        // Add jitter ±200-400ms so it never feels robotic
        const jitter = randomBetween(-400, 400);
        return Math.max(1500, Math.round((base + jitter) * mult));
      };

      const renderNext = (index: number) => {
        if (index >= chunks.length) {
          setIsTyping(false);
          return;
        }

        const chunk = chunks[index];
        const delay = typingDelayForChunk(chunk, index === 0);

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
            // More chunks: immediately start typing indicator for next
            setIsTyping(true);
            renderNext(index + 1);
          } else {
            setIsTyping(false);

            // Start inactivity timer if the last chunk ends with ? (bot is waiting for reply)
            const lastChunk = chunk.trim();
            const endsWithQuestion = lastChunk.endsWith('?');
            // Also check for common closing patterns that mean conversation is done
            const isClosing = lastChunk.includes('look forward to seeing you') ||
              lastChunk.includes('Reach out anytime') ||
              lastChunk.includes('Appointment Confirmation');

            if (isClosing) {
              conversationCompletedRef.current = true;
              console.log('[Inactivity] Conversation marked complete — no timer');
            } else if (endsWithQuestion) {
              startInactivityTimer(msgId);
            }
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

      // Cancel any pending inactivity follow-ups immediately
      cancelInactivityTimers();

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
      cancelInactivityTimers();

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
