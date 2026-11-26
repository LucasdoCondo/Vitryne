import type { CopyTone, Marketplace } from '../../types.js';

export interface CopyRequest {
  productName: string;
  affiliateUrl: string;
  marketplace: Marketplace;
  tone: CopyTone;
  signal?: AbortSignal;
}

export interface CopyResult {
  copy: string;
  provider: string;
}

export interface LlmProvider {
  readonly name: string;
  isConfigured(): boolean;
  generateCopy(request: CopyRequest): Promise<CopyResult>;
}
