import React from 'react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="vc-message vc-message--bot" aria-label="Coordinator is typing">
      <div className="vc-message-avatar" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
      <div className="vc-message-content">
        <div className="vc-bubble vc-bubble--bot vc-typing-bubble">
          <div className="vc-typing-indicator" role="status" aria-label="Typing">
            <span className="vc-typing-dot" />
            <span className="vc-typing-dot" />
            <span className="vc-typing-dot" />
          </div>
        </div>
      </div>
    </div>
  );
};
