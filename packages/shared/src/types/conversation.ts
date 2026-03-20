/**
 * Conversation and Message types for multi-channel chat sessions.
 *
 * A Conversation represents a single interaction thread between a patient
 * and the bot (possibly escalated to a human agent). Messages are the
 * individual utterances within that thread.
 */

/** Communication channel through which the conversation occurs. */
export enum Channel {
  /** SMS / text message. */
  SMS = 'sms',
  /** Web-based live chat widget. */
  WebChat = 'web_chat',
}

/** Who sent a particular message. */
export enum ParticipantRole {
  /** The patient / end-user. */
  Patient = 'patient',
  /** The AI chatbot. */
  Bot = 'bot',
  /** A human clinic agent who took over the conversation. */
  Agent = 'agent',
}

/** Current state of a conversation. */
export enum ConversationStatus {
  /** Conversation is actively being handled. */
  Active = 'active',
  /** Conversation is paused, waiting for patient response. */
  Waiting = 'waiting',
  /** Conversation has been escalated to a human agent. */
  Escalated = 'escalated',
  /** Conversation is closed / resolved. */
  Closed = 'closed',
}

/** Metadata attached to a message for traceability and analytics. */
export interface MessageMetadata {
  /** ID of the playbook that generated this message (bot messages only). */
  playbook_id?: string;

  /** Version of the playbook used. */
  playbook_version?: number;

  /** Detected intent from the patient's message. */
  detected_intent?: string;

  /** Confidence score for the detected intent (0-1). */
  intent_confidence?: number;

  /** IDs of extraction fields updated by this message. */
  extraction_field_ids?: string[];

  /** Whether this message triggered an escalation. */
  triggered_escalation?: boolean;

  /** Slider settings active when this message was generated. */
  slider_snapshot?: Record<string, number>;

  /** Latency in milliseconds for bot response generation. */
  response_latency_ms?: number;

  /** Whether the message was reviewed/edited by an operator. */
  operator_reviewed?: boolean;

  /** ID of the operator who reviewed the message, if any. */
  reviewed_by?: string;

  /** Whether the message contains PHI (Protected Health Information). */
  contains_phi?: boolean;
}

/** A single message within a conversation. */
export interface Message {
  /** Unique message identifier. */
  id: string;

  /** ID of the parent conversation. */
  conversation_id: string;

  /** Who sent this message. */
  role: ParticipantRole;

  /** The text content of the message. */
  content: string;

  /** Communication channel. */
  channel: Channel;

  /** ISO 8601 timestamp of when the message was sent. */
  timestamp: string;

  /** Additional metadata for traceability. */
  metadata: MessageMetadata;

  /** IDs of any media attachments (e.g., insurance card photos). */
  attachment_ids?: string[];

  /** Whether this message has been redacted for compliance. */
  redacted?: boolean;
}

/** A full conversation thread between a patient and the system. */
export interface Conversation {
  /** Unique conversation identifier. */
  id: string;

  /** Communication channel for this conversation. */
  channel: Channel;

  /** Current status of the conversation. */
  status: ConversationStatus;

  /** ID of the associated lead, if one has been created. */
  lead_id: string | null;

  /** ID of the associated patient, if one has been created. */
  patient_id: string | null;

  /** The ordered list of messages in this conversation. */
  messages: Message[];

  /** ID of the human agent handling this conversation, if escalated. */
  assigned_agent_id: string | null;

  /** ISO 8601 timestamp of conversation start. */
  started_at: string;

  /** ISO 8601 timestamp of last activity. */
  last_activity_at: string;

  /** ISO 8601 timestamp of conversation close, if closed. */
  closed_at: string | null;

  /** Tags applied to the conversation for categorization. */
  tags: string[];

  /** The phone number or session ID identifying the patient. */
  patient_identifier: string;

  /** Summary generated after conversation close. */
  summary: string | null;
}
