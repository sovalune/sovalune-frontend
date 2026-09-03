const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090';

export interface Project {
  id: string;
  name: string;
  settings: Record<string, unknown>;
  created_at: string;
}

export interface Session {
  id: string;
  project_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  session_id: string;
  role: string;
  content: string;
  tool_call: Record<string, unknown> | null;
  request_id: string;
  created_at: string;
}

export interface MemoryEntry {
  id: string;
  project_id: string;
  tier: string;
  content: string;
  metadata: Record<string, unknown>;
  confidence_score: number;
  decay_score: number;
  archived: boolean;
  source_entry_ids: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface LearningCycle {
  id: string;
  project_id: string;
  status: string;
  origin_task_id: string;
  failure_reason: string | null;
  retry_count: number;
  confidence_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface Evidence {
  id: string;
  cycle_id: string;
  source_type: string;
  source_url: string | null;
  excerpt: string;
  trust_tier: number;
  created_at: string;
}

export interface TestResult {
  id: string;
  cycle_id: string;
  stage: string;
  passed: boolean;
  detail: Record<string, unknown>;
  created_at: string;
}

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// Projects API
export const projectsApi = {
  list: () => fetchAPI<{ data: Project[] }>('/api/v1/projects'),
  get: (id: string) => fetchAPI<Project>(`/api/v1/projects/${id}`),
  create: (data: { name: string; settings?: Record<string, unknown> }) =>
    fetchAPI<Project>('/api/v1/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Sessions API
export const sessionsApi = {
  list: (projectId?: string) => {
    const params = projectId ? `?project_id=${projectId}` : '';
    return fetchAPI<{ data: Session[] }>(`/api/v1/sessions${params}`);
  },
  get: (id: string) => fetchAPI<Session>(`/api/v1/sessions/${id}`),
  create: (data: { project_id: string }) =>
    fetchAPI<Session>('/api/v1/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMessages: (id: string) =>
    fetchAPI<{ data: Message[] }>(`/api/v1/sessions/${id}/messages`),
  addMessage: (sessionId: string, data: { role: string; content: string; request_id: string }) =>
    fetchAPI<Message>(`/api/v1/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Memory API
export const memoryApi = {
  list: (projectId?: string, tier?: string) => {
    const params = new URLSearchParams();
    if (projectId) params.set('project_id', projectId);
    if (tier) params.set('tier', tier);
    const query = params.toString();
    return fetchAPI<{ data: MemoryEntry[] }>(`/api/v1/memory${query ? `?${query}` : ''}`);
  },
  get: (id: string) => fetchAPI<MemoryEntry>(`/api/v1/memory/${id}`),
  update: (id: string, data: Partial<MemoryEntry>) =>
    fetchAPI<MemoryEntry>(`/api/v1/memory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchAPI<void>(`/api/v1/memory/${id}`, {
      method: 'DELETE',
    }),
  search: (projectId: string, query: string, limit?: number) => {
    const params = new URLSearchParams({ project_id: projectId, query });
    if (limit) params.set('limit', limit.toString());
    return fetchAPI<{ data: MemoryEntry[] }>(`/api/v1/memory/search?${params}`);
  },
};

// Learning Cycles API
export const learningCyclesApi = {
  list: (projectId?: string) => {
    const params = projectId ? `?project_id=${projectId}` : '';
    return fetchAPI<{ data: LearningCycle[] }>(`/api/v1/learning-cycles${params}`);
  },
  get: (id: string) => fetchAPI<LearningCycle>(`/api/v1/learning-cycles/${id}`),
  getEvidence: (id: string) =>
    fetchAPI<{ data: Evidence[] }>(`/api/v1/learning-cycles/${id}/evidence`),
  getTestResults: (id: string) =>
    fetchAPI<{ data: TestResult[] }>(`/api/v1/learning-cycles/${id}/test-results`),
};

// WebSocket connection
export function createWebSocketConnection(sessionId: string) {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8091';
  const ws = new WebSocket(`${wsUrl}/ws/chat`);
  
  ws.onopen = () => {
    console.log('WebSocket connected');
    ws.send(JSON.stringify({ type: 'join_session', session_id: sessionId }));
  };

  return ws;
}
