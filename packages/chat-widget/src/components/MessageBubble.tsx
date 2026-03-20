import React from 'react';

export interface Message {
  id: string;
  role: 'bot' | 'patient';
  content: string;
  timestamp: Date;
  type?: 'text' | 'file' | 'system';
  fileUrl?: string;
  fileName?: string;
}

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isBot = message.role === 'bot';
  const isSystem = message.type === 'system';
  const isFile = message.type === 'file';

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isSystem) {
    return (
      <div className="vc-message vc-message--system" role="status">
        <span className="vc-message-system-text">{message.content}</span>
      </div>
    );
  }

  return (
    <div
      className={`vc-message ${isBot ? 'vc-message--bot' : 'vc-message--patient'}`}
      aria-label={`${isBot ? 'Coordinator' : 'You'} said: ${message.content}`}
    >
      {isBot && (
        <div className="vc-message-avatar" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
      )}
      <div className="vc-message-content">
        <div className={`vc-bubble ${isBot ? 'vc-bubble--bot' : 'vc-bubble--patient'}`}>
          {isFile ? (
            <div className="vc-file-message">
              <svg
                className="vc-file-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="vc-file-name">{message.fileName || 'Uploaded file'}</span>
            </div>
          ) : (
            <p className="vc-bubble-text">{message.content}</p>
          )}
        </div>
        <time className="vc-message-time" dateTime={message.timestamp.toISOString()}>
          {formatTime(message.timestamp)}
        </time>
      </div>
    </div>
  );
};
