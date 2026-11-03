export type Marketplace = 'shopee' | 'mercado_livre' | 'unknown';
export type CopyTone = 'agressivo' | 'informativo' | 'economia';

export interface Settings {
  shopeeTrackingId: string;
  mercadoLivreTag: string;
  geminiApiKey: string;
  telegramBotToken: string;
  telegramChatId: string;
}

export interface PublicSettings {
  shopeeTrackingId: string;
  mercadoLivreTag: string;
  hasGeminiApiKey: boolean;
  hasTelegramBotToken: boolean;
  telegramChatId: string;
}

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
  productName?: string;
  copy?: string;
  tone?: CopyTone;
}
  productName?: string;
  copy?: string;
  tone?: CopyTone;


  authorizedAt: number;
}

export interface TelegramErrorResponse {
  description?: string;
  error_message?: string;
  code?: number;
}
  description?: string;
  error_message?: string;
  code?: number;
}


}
