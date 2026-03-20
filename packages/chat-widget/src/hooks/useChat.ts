import { useState, useEffect, useRef, useCallback } from 'react';
import type { VeinClinicChatConfig } from '../index';
import type { Message } from '../components/MessageBubble';
import { chatApi, SendMessageResponse, FileUploadResponse } from '../services/api';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

interface UseChatReturn {
  messages: Message[];
  isTyping: boolean;
  connectionStatus: ConnectionStatus;
  sendMessage: (text: string) => void;
  sendFile: (file: File, label: 'front' | 'back') => void;
  sessionId: string | null;
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

  const wsRef = useRef<WebSocket | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const lastMessageIdRef = useRef<string | null>(null);
  const api = useRef(chatApi(config.apiUrl));

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      try {
        const session = await api.current.createSession({
          locationId: config.locationId,
          channel: config.channel || 'web',
        });
        setSessionId(session.sessionId);

        // Add greeting message
        const greeting = config.greeting ||
          "Welcome! I'm your patient coordinator. I can help you schedule a consultation, answer questions about vein treatments, or assist with insurance information. How can I help you today?";

        setMessages([
          {
            id: generateId(),
            role: 'bot',
            content: greeting,
            timestamp: new Date(),
            type: 'text',
          },
        ]);

        // Connect real-time transport
        if (config.wsUrl) {
          connectWebSocket(session.sessionId);
        } else {
          startPolling(session.sessionId);
        }
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
            const newMessages: Message[] = response.messages.map((m: any) => ({
              id: m.id || generateId(),
              role: 'bot' as const,
              content: m.content,
              timestamp: new Date(m.timestamp || Date.now()),
              type: m.type || 'text',
            }));
            setMessages((prev) => [...prev, ...newMessages]);
            lastMessageIdRef.current = newMessages[newMessages.length - 1].id;
          }
          setIsTyping(response.isTyping || false);
        } catch (err) {
          console.error('[VeinClinicChat] Polling error:', err);
        }
      }, POLL_INTERVAL_MS);
    },
    []
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

        // If using polling, the bot response may come from the poll.
        // If the API returns a synchronous reply, add it immediately.
        if (response.reply) {
          const botMsg: Message = {
            id: response.messageId || generateId(),
            role: 'bot',
            content: response.reply,
            timestamp: new Date(),
            type: 'text',
          };
          setMessages((prev) => [...prev, botMsg]);
          setIsTyping(false);
          lastMessageIdRef.current = botMsg.id;
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
    [sessionId]
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
  };
}
