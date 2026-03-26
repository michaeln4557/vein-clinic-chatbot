import React, { useState, useRef, useEffect, useCallback } from 'react';

// VTC Logo fallback SVG as data URI
const VTC_LOGO_FALLBACK = `data:image/svg+xml,${encodeURIComponent(`<svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="a" x1="8" y1="6" x2="24" y2="44" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#F472B6"/><stop offset="40%" stop-color="#EC4899"/><stop offset="100%" stop-color="#06B6D4"/></linearGradient><linearGradient id="b" x1="36" y1="6" x2="36" y2="44" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#A855F7"/><stop offset="50%" stop-color="#7C3AED"/><stop offset="100%" stop-color="#6D28D9"/></linearGradient><linearGradient id="c" x1="20" y1="20" x2="40" y2="50" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#818CF8"/><stop offset="100%" stop-color="#7C3AED"/></linearGradient></defs><path d="M10 10 L22 38 L30 22" fill="url(#a)" opacity="0.9"/><path d="M50 10 L38 38 L30 22" fill="url(#b)" opacity="0.9"/><path d="M26 30 L30 22 L34 30 L30 38 Z" fill="url(#c)" opacity="0.7"/></svg>`)}`;
import type { VeinClinicChatConfig } from '../index';
import { MessageBubble, Message } from './MessageBubble';
import { FileUpload } from './FileUpload';
import { TypingIndicator } from './TypingIndicator';
import { useChat, ConnectionStatus, TypingSpeed } from '../hooks/useChat';

interface ChatWidgetProps {
  config: VeinClinicChatConfig;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ config }) => {
  const [inputValue, setInputValue] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [showSpeedControl, setShowSpeedControl] = useState(false);

  const {
    messages,
    isTyping,
    connectionStatus,
    sendMessage,
    sendFile,
    sessionId,
    typingSpeed,
    setTypingSpeed,
  } = useChat(config);

  const speedOptions: { value: TypingSpeed; label: string }[] = [
    { value: 'instant', label: 'Instant' },
    { value: 'fast', label: 'Fast' },
    { value: 'natural', label: 'Natural' },
    { value: 'slow', label: 'Slow' },
  ];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;
    sendMessage(text);
    setInputValue('');
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (file: File, label: 'front' | 'back') => {
    sendFile(file, label);
  };

  const connectionLabel: Record<ConnectionStatus, string> = {
    connected: 'Connected',
    connecting: 'Connecting...',
    disconnected: 'Reconnecting...',
    error: 'Connection error',
  };

  const connectionDotClass: Record<ConnectionStatus, string> = {
    connected: 'vc-status-dot--connected',
    connecting: 'vc-status-dot--connecting',
    disconnected: 'vc-status-dot--disconnected',
    error: 'vc-status-dot--error',
  };

  return (
    <div className="vc-chat-standalone">
      <div
        className="vc-chat-window"
        role="main"
        aria-label="Chat with our patient coordinator"
      >
        {/* Header - iOS style slim bar */}
        <div className="vc-chat-header">
          <div className="vc-header-info">
            <div className="vc-header-logo" aria-hidden="true">
              <img
                src="/vtc-logo.png"
                alt="Vein Treatment Clinic"
                className="vc-header-logo-img"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = VTC_LOGO_FALLBACK;
                }}
              />
            </div>
            <div className="vc-header-text">
              <h2 className="vc-header-title">Maya - Front Desk</h2>
              <div className="vc-status-row">
                <span
                  className={`vc-status-dot ${connectionDotClass[connectionStatus]}`}
                  aria-hidden="true"
                />
                <span className="vc-status-text" aria-live="polite">
                  {connectionLabel[connectionStatus]}
                </span>
              </div>
            </div>
          </div>
          <button
            className="vc-speed-btn"
            onClick={() => setShowSpeedControl(!showSpeedControl)}
            aria-label="Response speed settings"
            title="Response speed"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
        </div>

        {/* Speed Control Dropdown */}
        {showSpeedControl && (
          <div className="vc-speed-control">
            <span className="vc-speed-label">Response speed:</span>
            <div className="vc-speed-options">
              {speedOptions.map((opt) => (
                <button
                  key={opt.value}
                  className={`vc-speed-option ${typingSpeed === opt.value ? 'vc-speed-option--active' : ''}`}
                  onClick={() => {
                    setTypingSpeed(opt.value);
                    setShowSpeedControl(false);
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div
          className="vc-messages-container"
          role="log"
          aria-label="Chat messages"
          aria-live="polite"
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* File Upload Panel */}
        {showFileUpload && (
          <FileUpload
            onUpload={handleFileUpload}
            onClose={() => setShowFileUpload(false)}
          />
        )}

        {/* Input Area */}
        <div className="vc-input-area">
          <button
            className="vc-attach-btn"
            onClick={() => setShowFileUpload(!showFileUpload)}
            aria-label="Upload insurance card"
            title="Upload insurance card"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <textarea
            ref={inputRef}
            className="vc-message-input"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              // Auto-grow
              const el = e.target;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            aria-label="Type your message"
            autoComplete="off"
            rows={1}
          />
          <button
            className="vc-send-btn"
            onClick={handleSend}
            disabled={!inputValue.trim()}
            aria-label="Send message"
            title="Send message"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
