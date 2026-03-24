import React from 'react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="vc-typing-bubble" aria-label="Coordinator is typing">
      <div className="vc-typing-indicator" role="status" aria-label="Typing">
        <span className="vc-typing-dot" />
        <span className="vc-typing-dot" />
        <span className="vc-typing-dot" />
      </div>
    </div>
  );
};
