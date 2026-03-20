import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ChatWidget } from './components/ChatWidget';
import './styles/widget.css';

export interface VeinClinicChatConfig {
  /** Backend API base URL */
  apiUrl: string;
  /** WebSocket URL for real-time messaging */
  wsUrl?: string;
  /** Clinic location identifier */
  locationId?: string;
  /** Channel identifier (web, sms, voice) */
  channel?: string;
  /** Initial greeting message override */
  greeting?: string;
  /** Position of the floating button */
  position?: 'bottom-right' | 'bottom-left';
  /** Primary theme color */
  primaryColor?: string;
  /** Z-index for the widget */
  zIndex?: number;
  /** Callback when a booking is completed */
  onBookingComplete?: (booking: { appointmentId: string; date: string }) => void;
  /** Callback when the widget opens/closes */
  onToggle?: (isOpen: boolean) => void;
}

const DEFAULT_CONFIG: Partial<VeinClinicChatConfig> = {
  channel: 'web',
  position: 'bottom-right',
  primaryColor: '#0D9488',
  zIndex: 99999,
};

let root: Root | null = null;
let container: HTMLElement | null = null;

/**
 * Initialize and mount the Vein Clinic chat widget.
 * Can be called from any website by including the built script.
 */
function init(userConfig: VeinClinicChatConfig): void {
  if (container) {
    console.warn('[VeinClinicChat] Widget is already initialized.');
    return;
  }

  const config = { ...DEFAULT_CONFIG, ...userConfig };

  container = document.createElement('div');
  container.id = 'vein-clinic-chat-root';
  container.setAttribute('role', 'complementary');
  container.setAttribute('aria-label', 'Patient chat assistant');
  document.body.appendChild(container);

  root = createRoot(container);
  root.render(
    <React.StrictMode>
      <ChatWidget config={config as VeinClinicChatConfig} />
    </React.StrictMode>
  );
}

/**
 * Destroy and unmount the chat widget.
 */
function destroy(): void {
  if (root) {
    root.unmount();
    root = null;
  }
  if (container) {
    container.remove();
    container = null;
  }
}

/**
 * Expose public API on the window object for non-module consumers.
 */
const VeinClinicChat = { init, destroy };

if (typeof window !== 'undefined') {
  (window as any).VeinClinicChat = VeinClinicChat;
}

export { init, destroy, ChatWidget };
export default VeinClinicChat;
