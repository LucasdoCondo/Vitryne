import type { Campaign, CopyTone, HealthStatus, HistoryItem, LinkConversion, Marketplace, PublicSettings, SettingsForm, SocialConnections } from '../types';

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
  socialConnections: () => request<SocialConnections>('/api/connections'),
  saveSettings: (data: Partial<SettingsForm>) => request<PublicSettings>('/api/settings', { method: 'PUT', body: JSON.stringify(data) }),
  history: () => request<HistoryItem[]>('/api/history'),
  convert: (url: string) => request<LinkConversion>('/api/links/convert', { method: 'POST', body: JSON.stringify({ url }) }),
  generateCopy: (payload: { id: string; affiliateUrl: string; marketplace: Marketplace; productName: string; tone: CopyTone }) =>
    request<{ copy: string; provider: 'gemini' | 'local' }>('/api/copy/generate', { method: 'POST', body: JSON.stringify(payload) }),
  sendTelegram: (message: string) => request<{ ok: true }>('/api/telegram/send', { method: 'POST', body: JSON.stringify({ message }) }),
  campaigns: () => request<Campaign[]>('/api/campaigns'),
  createCampaign: (payload: { url: string; productName: string; tone: CopyTone; category: Campaign['category']; channels: Campaign['channels']; dryRun: boolean }) => request<Campaign>('/api/campaigns', { method: 'POST', body: JSON.stringify(payload) }),
  approveCampaign: (id: string) => request<Campaign>(`/api/campaigns/${id}/approve`, { method: 'POST', body: '{}' }),
  publishCampaign: (id: string) => request<Campaign>(`/api/campaigns/${id}/publish`, { method: 'POST', body: '{}' }),
  automationStatus: () => request<{ enabled: boolean; killSwitch: boolean; telegramEnabled: boolean; metaEnabled: boolean; dailyLimit: number; publishedToday: number }>('/api/automation/status'),
  automationDryRun: (payload: { url: string; productName: string; tone: CopyTone; category: Campaign['category']; channels: Campaign['channels'] }) => request<{ ok: true; campaign: Campaign }>('/api/automation/dry-run', { method: 'POST', body: JSON.stringify(payload) }),
};
