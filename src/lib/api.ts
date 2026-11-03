import type { CopyTone, HealthStatus, HistoryItem, LinkConversion, Marketplace, PublicSettings, SettingsForm } from '../types';

interface ApiErrorBody {
  error?: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as ApiErrorBody;
    throw new Error(body.error ?? 'Não foi possível concluir a operação.');
  }
  return response.json() as Promise<T>;
}

export const api = {
  health: () => request<HealthStatus>('/api/health'),
  settings: () => request<PublicSettings>('/api/settings'),
  saveSettings: (data: SettingsForm) => request<PublicSettings>('/api/settings', { method: 'PUT', body: JSON.stringify(data) }),
  history: () => request<HistoryItem[]>('/api/history'),
  convert: (url: string) => request<LinkConversion>('/api/links/convert', { method: 'POST', body: JSON.stringify({ url }) }),
  generateCopy: (payload: { id: string; affiliateUrl: string; marketplace: Marketplace; productName: string; tone: CopyTone }) =>
    request<{ copy: string; provider: 'gemini' | 'local' }>('/api/copy/generate', { method: 'POST', body: JSON.stringify(payload) }),
  sendTelegram: (message: string) => request<{ ok: true }>('/api/telegram/send', { method: 'POST', body: JSON.stringify({ message }) }),
};
