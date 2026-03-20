import React, { useState, useRef, useCallback } from 'react';

interface FileUploadProps {
  onUpload: (file: File, label: 'front' | 'back') => void;
  onClose: () => void;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

interface CardSlot {
  label: 'front' | 'back';
  title: string;
  file: File | null;
  preview: string | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUpload, onClose }) => {
  const [cards, setCards] = useState<CardSlot[]>([
    { label: 'front', title: 'Insurance Card - Front', file: null, preview: null },
    { label: 'back', title: 'Insurance Card - Back', file: null, preview: null },
  ]);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([null, null]);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Please upload a JPG, PNG, WebP, or PDF file.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be under 10 MB.';
    }
    return null;
  };

  const handleFile = useCallback(
    (file: File, index: number) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);

      const preview = file.type.startsWith('image/')
        ? URL.createObjectURL(file)
        : null;

      setCards((prev) =>
        prev.map((card, i) =>
          i === index ? { ...card, file, preview } : card
        )
      );
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      setDragOverIndex(null);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file, index);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file, index);
  };

  const handleSubmit = () => {
    cards.forEach((card) => {
      if (card.file) {
        onUpload(card.file, card.label);
      }
    });
    onClose();
  };

  const hasAnyFile = cards.some((c) => c.file !== null);

  return (
    <div className="vc-file-upload" role="region" aria-label="Upload insurance card images">
      <div className="vc-file-upload-header">
        <h3 className="vc-file-upload-title">Upload Insurance Card</h3>
        <button
          className="vc-file-upload-close"
          onClick={onClose}
          aria-label="Close upload panel"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="vc-card-slots">
        {cards.map((card, index) => (
          <div
            key={card.label}
            className={`vc-card-slot ${dragOverIndex === index ? 'vc-card-slot--dragover' : ''} ${card.file ? 'vc-card-slot--filled' : ''}`}
            onDrop={(e) => handleDrop(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRefs.current[index]?.click()}
            role="button"
            tabIndex={0}
            aria-label={`${card.title}. ${card.file ? 'File selected: ' + card.file.name : 'Click or drag to upload'}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRefs.current[index]?.click();
              }
            }}
          >
            <input
              ref={(el) => {
                fileInputRefs.current[index] = el;
              }}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              className="vc-file-input-hidden"
              onChange={(e) => handleInputChange(e, index)}
              aria-hidden="true"
              tabIndex={-1}
            />

            {card.preview ? (
              <img
                src={card.preview}
                alt={`${card.title} preview`}
                className="vc-card-preview"
              />
            ) : (
              <div className="vc-card-placeholder">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="vc-upload-icon"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                <span className="vc-card-label">{card.title}</span>
                <span className="vc-card-hint">Click or drag image here</span>
              </div>
            )}

            {card.file && (
              <div className="vc-card-filename">{card.file.name}</div>
            )}
          </div>
        ))}
      </div>

      {error && (
        <p className="vc-file-error" role="alert">
          {error}
        </p>
      )}

      <div className="vc-file-upload-actions">
        <button
          className="vc-btn vc-btn--secondary"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="vc-btn vc-btn--primary"
          onClick={handleSubmit}
          disabled={!hasAnyFile}
        >
          Upload
        </button>
      </div>
    </div>
  );
};
