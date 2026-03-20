/**
 * Insurance intake and card upload types.
 *
 * Handles the collection and processing of patient insurance
 * information including card image uploads and OCR extraction.
 */

/** Status of insurance information collection. */
export enum InsuranceIntakeStatus {
  /** No insurance info collected yet. */
  NotStarted = 'not_started',
  /** Provider name collected but card not uploaded. */
  ProviderOnly = 'provider_only',
  /** Card front uploaded, back still needed. */
  FrontUploaded = 'front_uploaded',
  /** Both card sides uploaded, awaiting processing. */
  BothUploaded = 'both_uploaded',
  /** OCR processing in progress. */
  Processing = 'processing',
  /** Insurance info extracted and awaiting verification. */
  PendingVerification = 'pending_verification',
  /** Insurance info verified by patient or operator. */
  Verified = 'verified',
  /** Verification failed or info is invalid. */
  Failed = 'failed',
}

/** Status of a single card image upload. */
export enum CardUploadStatus {
  /** Waiting for patient to upload. */
  Pending = 'pending',
  /** Upload in progress. */
  Uploading = 'uploading',
  /** Upload completed successfully. */
  Uploaded = 'uploaded',
  /** OCR processing completed. */
  Processed = 'processed',
  /** Upload or processing failed. */
  Failed = 'failed',
}

/**
 * Insurance card image upload record.
 */
export interface InsuranceCardUpload {
  /** Unique upload identifier. */
  id: string;

  /** ID of the associated lead. */
  lead_id: string;

  /** Which side of the card this upload represents. */
  side: 'front' | 'back';

  /** Current upload/processing status. */
  status: CardUploadStatus;

  /** Storage URL or key for the uploaded image. */
  storage_url: string | null;

  /** MIME type of the uploaded file. */
  mime_type: string | null;

  /** File size in bytes. */
  file_size: number | null;

  /** OCR-extracted text from the card image. */
  ocr_text: string | null;

  /** Structured data extracted via OCR. */
  ocr_extracted_fields: Record<string, string> | null;

  /** OCR confidence score (0.0 - 1.0). */
  ocr_confidence: number | null;

  /** Error message if upload or processing failed. */
  error_message: string | null;

  /** ISO 8601 timestamp of upload. */
  uploaded_at: string;

  /** ISO 8601 timestamp of processing completion. */
  processed_at: string | null;
}

/**
 * Complete insurance intake record for a patient.
 */
export interface InsuranceIntake {
  /** Unique intake identifier. */
  id: string;

  /** ID of the associated lead. */
  lead_id: string;

  /** ID of the conversation where insurance was collected. */
  conversation_id: string;

  /** Current intake status. */
  status: InsuranceIntakeStatus;

  /** Insurance provider / payer name. */
  provider_name: string | null;

  /** Member ID from the insurance card. */
  member_id: string | null;

  /** Group number from the insurance card. */
  group_number: string | null;

  /** Plan type (e.g., PPO, HMO, EPO). */
  plan_type: string | null;

  /** Front card upload record. */
  card_front: InsuranceCardUpload | null;

  /** Back card upload record. */
  card_back: InsuranceCardUpload | null;

  /** Whether the patient's plan is known to cover vein treatments. */
  coverage_confirmed: boolean | null;

  /** Notes about coverage or eligibility. */
  coverage_notes: string | null;

  /** State-specific insurance notes from the location. */
  state_notes: string | null;

  /** ISO 8601 timestamp of creation. */
  created_at: string;

  /** ISO 8601 timestamp of last update. */
  updated_at: string;
}
