/**
 * WebSocket Adapter for Web Chat
 *
 * Handles real-time web chat communication:
 * - WebSocket connection management
 * - Message routing to orchestration engine
 * - Typing indicators
 * - Connection state management
 * - File upload handling for insurance cards
 */

import { EventEmitter } from 'events';

export interface ChatConnection {
  id: string;
  conversationId: string;
  connectedAt: Date;
  lastActivity: Date;
  metadata: Record<string, unknown>;
}

export interface ChatMessage {
  conversationId: string;
  content: string;
  type: 'text' | 'file_upload' | 'typing_start' | 'typing_stop';
  metadata?: Record<string, unknown>;
}

export class WebSocketAdapter extends EventEmitter {
  private connections: Map<string, ChatConnection> = new Map();

  /**
   * Handle new WebSocket connection
   */
  handleConnection(connectionId: string, metadata: Record<string, unknown>): ChatConnection {
    const connection: ChatConnection = {
      id: connectionId,
      conversationId: `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      connectedAt: new Date(),
      lastActivity: new Date(),
      metadata,
    };

    this.connections.set(connectionId, connection);
    this.emit('connection', connection);

    return connection;
  }

  /**
   * Handle incoming message from web chat
   */
  async handleMessage(connectionId: string, message: ChatMessage): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`Unknown connection: ${connectionId}`);
    }

    connection.lastActivity = new Date();

    switch (message.type) {
      case 'text':
        this.emit('message', {
          connectionId,
          conversationId: connection.conversationId,
          content: message.content,
          timestamp: new Date(),
        });
        break;

      case 'file_upload':
        this.emit('file_upload', {
          connectionId,
          conversationId: connection.conversationId,
          metadata: message.metadata,
          timestamp: new Date(),
        });
        break;

      case 'typing_start':
      case 'typing_stop':
        this.emit('typing', {
          connectionId,
          conversationId: connection.conversationId,
          isTyping: message.type === 'typing_start',
        });
        break;
    }
  }

  /**
   * Send message to a specific connection
   */
  sendToConnection(connectionId: string, data: {
    type: 'message' | 'typing' | 'status';
    content?: string;
    metadata?: Record<string, unknown>;
  }): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // TODO: Send via actual WebSocket
    // ws.send(JSON.stringify(data));
    this.emit('outbound', { connectionId, data });
  }

  /**
   * Send bot typing indicator
   */
  sendTypingIndicator(connectionId: string, isTyping: boolean): void {
    this.sendToConnection(connectionId, {
      type: 'typing',
      metadata: { isTyping },
    });
  }

  /**
   * Send bot response
   */
  sendBotMessage(connectionId: string, content: string, metadata?: Record<string, unknown>): void {
    this.sendToConnection(connectionId, {
      type: 'message',
      content,
      metadata,
    });
  }

  /**
   * Deliver a sequence of message fragments with realistic delays.
   * Each fragment is preceded by a typing indicator and a timed pause
   * to simulate a real person composing and sending messages.
   *
   * Used by Patient Coordinator (Human Mode) to make the bot feel
   * indistinguishable from a human texting.
   */
  async sendFragmentedResponse(
    connectionId: string,
    fragments: Array<{ content: string; delay_ms: number; show_typing: boolean }>,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    for (const fragment of fragments) {
      // Show typing indicator during the delay
      if (fragment.show_typing && fragment.delay_ms > 0) {
        this.sendTypingIndicator(connectionId, true);
      }

      // Wait for the realistic delay
      if (fragment.delay_ms > 0) {
        await this.delay(fragment.delay_ms);
      }

      // Stop typing indicator
      if (fragment.show_typing) {
        this.sendTypingIndicator(connectionId, false);
      }

      // Send the fragment as an individual message
      this.sendBotMessage(connectionId, fragment.content, {
        ...metadata,
        is_fragment: true,
        fragment_index: fragments.indexOf(fragment),
        fragment_count: fragments.length,
      });
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Handle disconnection
   */
  handleDisconnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      this.emit('disconnection', connection);
      this.connections.delete(connectionId);
    }
  }

  /**
   * Get active connection count
   */
  getActiveConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Clean up stale connections
   */
  cleanupStaleConnections(maxIdleMs: number = 30 * 60 * 1000): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, connection] of this.connections) {
      if (now - connection.lastActivity.getTime() > maxIdleMs) {
        this.handleDisconnection(id);
        cleaned++;
      }
    }

    return cleaned;
  }
}

export default WebSocketAdapter;
