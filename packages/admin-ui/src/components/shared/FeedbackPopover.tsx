import { useState } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  PenLine,
  AlertTriangle,
  X,
} from 'lucide-react';

type FeedbackType =
  | 'thumbs_up'
  | 'thumbs_down'
  | 'comment'
  | 'suggested_rewrite'
  | 'too_salesy'
  | 'off_brand'
  | 'inaccurate'
  | 'too_long';

interface FeedbackPopoverProps {
  messageId: string;
  onSubmit: (feedback: {
    messageId: string;
    type: FeedbackType;
    comment?: string;
    suggestedRewrite?: string;
  }) => void;
  onClose: () => void;
}

const quickActions: { type: FeedbackType; icon: React.ElementType; label: string }[] = [
  { type: 'thumbs_up', icon: ThumbsUp, label: 'Good response' },
  { type: 'thumbs_down', icon: ThumbsDown, label: 'Poor response' },
  { type: 'too_salesy', icon: AlertTriangle, label: 'Too salesy' },
  { type: 'off_brand', icon: AlertTriangle, label: 'Off brand' },
  { type: 'inaccurate', icon: AlertTriangle, label: 'Inaccurate' },
  { type: 'too_long', icon: AlertTriangle, label: 'Too long' },
];

export default function FeedbackPopover({ messageId, onSubmit, onClose }: FeedbackPopoverProps) {
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
  const [comment, setComment] = useState('');
  const [suggestedRewrite, setSuggestedRewrite] = useState('');
  const [showRewrite, setShowRewrite] = useState(false);

  const handleSubmit = () => {
    if (!selectedType) return;
    onSubmit({
      messageId,
      type: selectedType,
      comment: comment || undefined,
      suggestedRewrite: suggestedRewrite || undefined,
    });
    onClose();
  };

  return (
    <div className="w-80 bg-white rounded-xl shadow-xl border border-healthcare-line p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-healthcare-text">Provide Feedback</h4>
        <button onClick={onClose} className="text-healthcare-muted hover:text-healthcare-text">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick action buttons */}
      <div className="grid grid-cols-3 gap-2">
        {quickActions.map((action) => (
          <button
            key={action.type}
            onClick={() => setSelectedType(action.type)}
            className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-xs border transition-colors ${
              selectedType === action.type
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-healthcare-line text-healthcare-muted hover:bg-gray-50'
            }`}
          >
            <action.icon className="w-4 h-4" />
            {action.label}
          </button>
        ))}
      </div>

      {/* Comment */}
      <div>
        <label className="label">Comment (optional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add context..."
          rows={2}
          className="input resize-none"
        />
      </div>

      {/* Suggested rewrite toggle */}
      {!showRewrite ? (
        <button
          onClick={() => {
            setShowRewrite(true);
            setSelectedType('suggested_rewrite');
          }}
          className="btn-ghost text-xs w-full justify-center"
        >
          <PenLine className="w-3.5 h-3.5" />
          Suggest a rewrite
        </button>
      ) : (
        <div>
          <label className="label">Suggested Rewrite</label>
          <textarea
            value={suggestedRewrite}
            onChange={(e) => setSuggestedRewrite(e.target.value)}
            placeholder="How should the bot have responded?"
            rows={3}
            className="input resize-none"
          />
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onClose} className="btn-secondary text-xs">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!selectedType}
          className="btn-primary text-xs"
        >
          Submit Feedback
        </button>
      </div>
    </div>
  );
}
