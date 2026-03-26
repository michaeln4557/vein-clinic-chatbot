export interface CreateSessionRequest {
  locationId?: string;
  channel: string;
  greeting?: string;
}

export interface CreateSessionResponse {
  sessionId: string;
  token: string;
}

export interface SendMessageResponse {
  messageId: string;
  reply?: string;
  intent?: string;
}

export interface FileUploadResponse {
  fileId: string;
  reply?: string;
  extractedData?: Record<string, string>;
}

export interface PollResponse {
  messages: Array<{
    id: string;
    content: string;
    timestamp: string;
    type: string;
  }>;
  isTyping: boolean;
}

class ChatApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(
        `API request failed: ${response.status} ${response.statusText} - ${errorBody}`
      );
    }

    return response.json();
  }

  async createSession(
    params: CreateSessionRequest
  ): Promise<CreateSessionResponse> {
    const result = await this.request<CreateSessionResponse>(
      '/api/v1/chat/sessions',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
    this.token = result.token;
    return result;
  }

  async sendMessage(
    sessionId: string,
    content: string
  ): Promise<SendMessageResponse> {
    return this.request<SendMessageResponse>(
      `/api/v1/chat/sessions/${sessionId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ content }),
      }
    );
  }

  async uploadFile(
    sessionId: string,
    file: File,
    label: 'front' | 'back'
  ): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('label', label);

    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(
      `${this.baseUrl}/api/v1/chat/sessions/${sessionId}/files`,
      {
        method: 'POST',
        headers,
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`File upload failed: ${response.status}`);
    }

    return response.json();
  }

  async pollMessages(
    sessionId: string,
    afterMessageId: string | null
  ): Promise<PollResponse> {
    const query = afterMessageId ? `?after=${afterMessageId}` : '';
    return this.request<PollResponse>(
      `/api/v1/chat/sessions/${sessionId}/messages${query}`,
      { method: 'GET' }
    );
  }

  async endSession(sessionId: string): Promise<void> {
    await this.request(`/api/v1/chat/sessions/${sessionId}/end`, {
      method: 'POST',
    });
  }

  async getPresets(): Promise<PresetResponse> {
    return this.request<PresetResponse>('/api/v1/chat/presets', { method: 'GET' });
  }
}

export interface PresetTiming {
  minTypingDelay: number;
  maxTypingDelay: number;
  interBubblePauseMin: number;
  interBubblePauseMax: number;
}

export interface PresetInfo {
  id: string;
  label: string;
  description: string;
  timing: PresetTiming;
  active: boolean;
}

export interface PresetResponse {
  presets: PresetInfo[];
  activePreset: string;
}

/**
 * Factory function to create an API client instance.
 */
export function chatApi(baseUrl: string): ChatApiClient {
  return new ChatApiClient(baseUrl);
}
