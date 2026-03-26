import { useState, useEffect, useRef, useCallback } from 'react';

interface PreviewChatProps {
  patientMessage: string;
  botMessages: string[];
  typingDelayMs: number;
  interBubblePauseMs: number;
  isPlaying: boolean;
  onComplete: () => void;
}

export default function PreviewChat({
  patientMessage,
  botMessages,
  typingDelayMs,
  interBubblePauseMs,
  isPlaying,
  onComplete,
}: PreviewChatProps) {
  const [visibleBotCount, setVisibleBotCount] = useState(0);
  const [showTyping, setShowTyping] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      clearTimeouts();
      // Show all messages immediately when not playing
      setVisibleBotCount(botMessages.length);
      setShowTyping(false);
      return;
    }

    // Reset for new animation
    setVisibleBotCount(0);
    setShowTyping(false);
    clearTimeouts();

    let step = 0;
    const total = botMessages.length;

    const scheduleNext = () => {
      if (step >= total) {
        setShowTyping(false);
        onComplete();
        return;
      }

      // Show typing indicator
      setShowTyping(true);

      const delay = step === 0 ? typingDelayMs : interBubblePauseMs;

      const t = setTimeout(() => {
        // Reveal the next bot message
        setShowTyping(false);
        setVisibleBotCount(step + 1);
        step++;

        // Small gap before next typing indicator appears
        const gap = setTimeout(() => scheduleNext(), 150);
        timeoutsRef.current.push(gap);
      }, delay);

      timeoutsRef.current.push(t);
    };

    // Start after a brief pause for the patient message to settle
    const start = setTimeout(() => scheduleNext(), 400);
    timeoutsRef.current.push(start);

    return clearTimeouts;
  }, [isPlaying, botMessages, typingDelayMs, interBubblePauseMs, onComplete, clearTimeouts]);

  return (
    <div className="space-y-2.5 py-2">
      {/* Patient message */}
      <div className="flex justify-end">
        <div className="max-w-[80%] px-3.5 py-2 rounded-2xl rounded-br-sm bg-gray-100 text-sm text-healthcare-text">
          {patientMessage}
        </div>
      </div>

      {/* Bot messages */}
      {botMessages.slice(0, visibleBotCount).map((msg, i) => (
        <div key={i} className="flex justify-start">
          <div className="max-w-[80%] px-3.5 py-2 rounded-2xl rounded-bl-sm bg-brand-50 text-sm text-healthcare-text">
            {msg}
          </div>
        </div>
      ))}

      {/* Typing indicator */}
      {showTyping && (
        <div className="flex justify-start">
          <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm bg-brand-50 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      )}
    </div>
  );
}
