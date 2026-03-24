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

/**
 * Render simple markdown: **bold** and [text](url) links.
 * Also handles bare https:// URLs by auto-linking them.
 * Returns React elements for safe rendering.
 */
function renderFormattedText(text: string, isPatient: boolean): React.ReactNode[] {
  // Split into lines preserving newlines
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    if (lineIdx > 0) result.push(<br key={`br-${lineIdx}`} />);

    // Process inline formatting: **bold**, [text](url), and bare URLs
    // Pattern: **bold** | [text](url) | bare https://...
    const pattern = /(\*\*(.+?)\*\*)|(\[([^\]]+)\]\(([^)]+)\))|(https?:\/\/[^\s,)]+)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let partIdx = 0;

    while ((match = pattern.exec(line)) !== null) {
      // Add text before this match
      if (match.index > lastIndex) {
        result.push(line.slice(lastIndex, match.index));
      }

      if (match[1]) {
        // **bold**
        result.push(
          <strong key={`b-${lineIdx}-${partIdx}`} style={{ fontWeight: 600 }}>
            {match[2]}
          </strong>
        );
      } else if (match[3]) {
        // [text](url)
        result.push(
          <a
            key={`a-${lineIdx}-${partIdx}`}
            href={match[5]}
            target="_blank"
            rel="noopener noreferrer"
            className="vc-link"
            style={{
              color: isPatient ? '#E0D4FF' : '#6D28D9',
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
            }}
          >
            {match[4]}
          </a>
        );
      } else if (match[6]) {
        // Bare URL - auto-link it
        const url = match[6];
        const label = url.includes('google.com/maps') ? 'View on Google Maps' : url;
        result.push(
          <a
            key={`u-${lineIdx}-${partIdx}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="vc-link"
            style={{
              color: isPatient ? '#E0D4FF' : '#6D28D9',
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
            }}
          >
            {label}
          </a>
        );
      }

      lastIndex = match.index + match[0].length;
      partIdx++;
    }

    // Add remaining text after last match
    if (lastIndex < line.length) {
      result.push(line.slice(lastIndex));
    }
  });

  return result;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isBot = message.role === 'bot';
  const isPatient = message.role === 'patient';
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
            <p className="vc-bubble-text">
              {isBot ? renderFormattedText(message.content, false) : message.content}
            </p>
          )}
        </div>
        <time className="vc-message-time" dateTime={message.timestamp.toISOString()}>
          {formatTime(message.timestamp)}
        </time>
      </div>
    </div>
  );
};
