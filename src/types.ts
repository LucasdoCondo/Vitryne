export type Marketplace = 'shopee' | 'mercado_livre' | 'shein' | 'amazon' | 'unknown';
export type CopyTone = 'agressivo' | 'informativo' | 'economia';
export type OfferCategory = 'shopee_offer' | 'brand_offer' | 'product_offer';
export type CampaignStatus = 'queued' | 'generating' | 'ready' | 'publishing' | 'published' | 'failed';
export type WorkspaceSection = 'overview' | 'workspace' | 'campaigns' | 'automation' | 'history' | 'settings';

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

export type PublicationChannel = 'telegram' | 'facebook' | 'instagram';

export interface Campaign {
  id: string;
  category: OfferCategory;
  productName: string;
  marketplace: Exclude<Marketplace, 'unknown'>;
  affiliateUrl: string;
  productImagePath?: string;
  promotionalImagePath?: string;
  videoPath?: string;
  copy?: string;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
  videoPostId?: string;
  imagePostId?: string;
  channels: PublicationChannel[];
  approvedAt?: string;
  scheduledAt?: string;
  publishedAt?: string;
  publishedChannelIds?: Partial<Record<PublicationChannel, string>>;
  publicationAttempts?: Partial<Record<PublicationChannel, string>>;
  complianceApproved?: boolean;
  complianceReasons?: string[];
  dryRun: boolean;
  error?: string;
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
  amazonTag: string;
  hasAnthropicApiKey: boolean;
  hasOpenAiApiKey: boolean;
  hasGeminiApiKey: boolean;
  hasGroqApiKey: boolean;
  hasTelegramBotToken: boolean;
  telegramChatId: string;
  automationEnabled: boolean;
  telegramAutomationEnabled: boolean;
  metaAutomationEnabled: boolean;
  automationDailyLimit: number;
  automationKillSwitch: boolean;
}

export interface PublicMetaPageConnection {
  pageId: string;
  pageName: string;
  instagramUsername?: string;
  connectedAt: string;
  canPublishToFacebook: boolean;
  canPublishToInstagram: boolean;
}

export interface SocialConnections {
  metaConfigured: boolean;
  pages: PublicMetaPageConnection[];
  facebookConnected: boolean;
  instagramConnected: boolean;
}

export interface SettingsForm {
  shopeeTrackingId: string;
  mercadoLivreTag: string;
  anthropicApiKey: string;
  openAiApiKey: string;
  geminiApiKey: string;
  groqApiKey: string;
  telegramBotToken: string;
  telegramChatId: string;
  amazonTag: string;
  automationEnabled: boolean;
  telegramAutomationEnabled: boolean;
  metaAutomationEnabled: boolean;
  automationDailyLimit: number;
  automationKillSwitch: boolean;
}

export interface ToastMessage {
  id: number;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info';
}
