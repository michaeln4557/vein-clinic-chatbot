const BASE_URL = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `Request failed: ${res.status}`);
  }

  return res.json();
}

// ── Playbooks ──────────────────────────────────────────────────────────
export const playbooks = {
  list: () => request<any[]>('/playbooks'),
  get: (id: string) => request<any>(`/playbooks/${id}`),
  update: (id: string, data: any) =>
    request<any>(`/playbooks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  publish: (id: string) =>
    request<any>(`/playbooks/${id}/publish`, { method: 'POST' }),
  rollback: (id: string, versionId: string) =>
    request<any>(`/playbooks/${id}/rollback`, {
      method: 'POST',
      body: JSON.stringify({ versionId }),
    }),
  versions: (id: string) => request<any[]>(`/playbooks/${id}/versions`),
};

// ── Sliders (Behavior Controls) ────────────────────────────────────────
export const sliders = {
  list: () => request<any[]>('/sliders'),
  get: (id: string) => request<any>(`/sliders/${id}`),
  update: (id: string, data: any) =>
    request<any>(`/sliders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  presets: () => request<any[]>('/sliders/presets'),
  applyPreset: (presetId: string, scope?: any) =>
    request<any>('/sliders/presets/apply', {
      method: 'POST',
      body: JSON.stringify({ presetId, scope }),
    }),
};

// ── Locations ──────────────────────────────────────────────────────────
export const locations = {
  list: () => request<any[]>('/locations'),
  get: (id: string) => request<any>(`/locations/${id}`),
  create: (data: any) =>
    request<any>('/locations', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request<any>(`/locations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<any>(`/locations/${id}`, { method: 'DELETE' }),
};

// ── SMS Templates ──────────────────────────────────────────────────────
export const smsTemplates = {
  list: () => request<any[]>('/sms-templates'),
  get: (id: string) => request<any>(`/sms-templates/${id}`),
  create: (data: any) =>
    request<any>('/sms-templates', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request<any>(`/sms-templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<any>(`/sms-templates/${id}`, { method: 'DELETE' }),
};

// ── Review Queue ───────────────────────────────────────────────────────
export const reviewQueue = {
  list: (params?: { status?: string; type?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<any[]>(`/review-queue${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => request<any>(`/review-queue/${id}`),
  apply: (id: string) =>
    request<any>(`/review-queue/${id}/apply`, { method: 'POST' }),
  dismiss: (id: string, reason?: string) =>
    request<any>(`/review-queue/${id}/dismiss`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};

// ── Test / QA ──────────────────────────────────────────────────────────
export const testQA = {
  conversations: () => request<any[]>('/test/conversations'),
  conversation: (id: string) => request<any>(`/test/conversations/${id}`),
  sendMessage: (conversationId: string, message: string, channel?: string) =>
    request<any>(`/test/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message, channel }),
    }),
  createConversation: (channel?: string) =>
    request<any>('/test/conversations', {
      method: 'POST',
      body: JSON.stringify({ channel }),
    }),
};

// ── Audit Log ──────────────────────────────────────────────────────────
export const auditLog = {
  list: (params?: {
    page?: number;
    limit?: number;
    actor?: string;
    entity?: string;
    action?: string;
    from?: string;
    to?: string;
  }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params || {}).filter(([_, v]) => v !== undefined),
      ) as any,
    ).toString();
    return request<{ items: any[]; total: number }>(`/audit-log${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => request<any>(`/audit-log/${id}`),
};

// ── CRM Mapping ────────────────────────────────────────────────────────
export const crmMapping = {
  list: () => request<any[]>('/crm/mappings'),
  get: (id: string) => request<any>(`/crm/mappings/${id}`),
  update: (id: string, data: any) =>
    request<any>(`/crm/mappings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  syncStatus: () => request<any>('/crm/sync-status'),
  previewPayload: (conversationId: string) =>
    request<any>(`/crm/preview/${conversationId}`),
};

// ── Analytics ──────────────────────────────────────────────────────────
export const analytics = {
  dashboard: (params?: { from?: string; to?: string; locationId?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<any>(`/analytics/dashboard${qs ? `?${qs}` : ''}`);
  },
  conversionFunnel: (params?: any) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<any>(`/analytics/funnel${qs ? `?${qs}` : ''}`);
  },
  recoveryRates: (params?: any) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<any>(`/analytics/recovery${qs ? `?${qs}` : ''}`);
  },
  dropOff: (params?: any) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<any>(`/analytics/drop-off${qs ? `?${qs}` : ''}`);
  },
  locationComparison: () => request<any>('/analytics/locations'),
  abTestResults: () => request<any[]>('/analytics/ab-tests'),
};

// ── Permissions ────────────────────────────────────────────────────────
export const permissions = {
  users: () => request<any[]>('/permissions/users'),
  updateRole: (userId: string, role: string) =>
    request<any>(`/permissions/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
  roles: () => request<any[]>('/permissions/roles'),
};

// ── Phrases ────────────────────────────────────────────────────────────
export const phrases = {
  list: (params?: { type?: string; category?: string; status?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<any[]>(`/phrases${qs ? `?${qs}` : ''}`);
  },
  create: (data: any) =>
    request<any>('/phrases', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request<any>(`/phrases/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deactivate: (id: string) =>
    request<any>(`/phrases/${id}/deactivate`, { method: 'POST' }),
};

// ── Feedback ───────────────────────────────────────────────────────────
export const feedback = {
  submit: (data: {
    messageId: string;
    type: string;
    comment?: string;
    suggestedRewrite?: string;
  }) =>
    request<any>('/feedback', { method: 'POST', body: JSON.stringify(data) }),
};
