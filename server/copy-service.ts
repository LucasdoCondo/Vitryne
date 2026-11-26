import type { CopyTone, Marketplace } from './types.js';
import { GeminiLlmProvider, LocalLlmProvider, LlmManager } from './providers/llm/index.js';

interface CopyRequest {
  productName: string;
  affiliateUrl: string;
  marketplace: Marketplace;
  tone: CopyTone;
  apiKey: string;
}

export async function generateCopy(request: CopyRequest): Promise<{ copy: string; provider: 'gemini' | 'local' }> {
  const gemini = new GeminiLlmProvider(request.apiKey);
  const manager = new LlmManager([gemini, new LocalLlmProvider()]);

  const result = await manager.generateCopy({
    productName: request.productName,
    affiliateUrl: request.affiliateUrl,
    marketplace: request.marketplace,
    tone: request.tone,
  });

  return {
    copy: result.copy,
    provider: result.provider === 'gemini' ? 'gemini' : 'local',
  };
}

