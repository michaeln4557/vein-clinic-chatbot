import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { VeinClinicChatConfig } from '../index';
import { MessageBubble, Message } from './MessageBubble';
import { FileUpload } from './FileUpload';
import { TypingIndicator } from './TypingIndicator';
import { useChat, ConnectionStatus } from '../hooks/useChat';

interface ChatWidgetProps {
  config: VeinClinicChatConfig;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ config }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isTyping,
    connectionStatus,
    sendMessage,
    sendFile,
    sessionId,
  } = useChat(config);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    config.onToggle?.(nextState);
  };

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;
    sendMessage(text);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (file: File, label: 'front' | 'back') => {
    sendFile(file, label);
  };

  const positionClass =
    config.position === 'bottom-left' ? 'vc-position-left' : 'vc-position-right';

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
    <div
      className={`vc-chat-widget ${positionClass}`}
      style={{ zIndex: config.zIndex }}
    >
      {/* Chat Window */}
      {isOpen && (
        <div
          className="vc-chat-window"
          role="dialog"
          aria-label="Chat with our patient coordinator"
          aria-modal="false"
        >
          {/* Header */}
          <div className="vc-chat-header">
            <div className="vc-header-info">
              <div className="vc-avatar" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <h2 className="vc-header-title">Patient Coordinator</h2>
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
              className="vc-close-btn"
              onClick={handleToggle}
              aria-label="Close chat"
              title="Close chat"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

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
            <input
              ref={inputRef}
              className="vc-message-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              aria-label="Type your message"
              autoComplete="off"
            />
            <button
              className="vc-send-btn"
              onClick={handleSend}
              disabled={!inputValue.trim()}
              aria-label="Send message"
              title="Send message"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        className="vc-fab"
        onClick={handleToggle}
        aria-label={isOpen ? 'Close chat' : 'Open chat with patient coordinator'}
        aria-expanded={isOpen}
        style={{ backgroundColor: config.primaryColor }}
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        )}
      </button>
    </div>
  );
};
