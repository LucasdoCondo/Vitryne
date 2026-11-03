export type Marketplace = 'shopee' | 'mercado_livre' | 'unknown';
export type CopyTone = 'agressivo' | 'informativo' | 'economia';
export type WorkspaceSection = 'workspace' | 'automation' | 'history' | 'settings';

export interface LinkConversion {
  id: string;
  originalUrl: string;
  affiliateUrl: string;
  marketplace: Marketplace;
  createdAt: string;
}

export interface HistoryItem extends LinkConversion {
  productName?: string;
  copy?: string;
  tone?: CopyTone;
}

export interface HealthStatus {
  online: boolean;
  services: {
    local: boolean;
    gemini: boolean;
    telegram: boolean;
  };
}

export interface PublicSettings {
  shopeeTrackingId: string;
  mercadoLivreTag: string;
  hasGeminiApiKey: boolean;
  hasTelegramBotToken: boolean;
  telegramChatId: string;
}

export interface SettingsForm {
  shopeeTrackingId: string;
  mercadoLivreTag: string;
  geminiApiKey: string;
  telegramBotToken: string;
  telegramChatId: string;
}

export interface ToastMessage {
  id: number;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info';
}
