import { describe, expect, test } from 'vitest';
import type { CopyResult } from './llm-provider.js';
import { LocalLlmProvider } from './local.js';
import { LlmManager } from './llm-manager.js';

class FailingProvider {
  readonly name = 'failing';
  isConfigured() {
    return true;
  }
  async generateCopy(): Promise<CopyResult> {
    throw new Error('erro do provedor');
  }
}

describe('LlmManager', () => {
  test('retorna o primeiro provedor configurado que funcionar', async () => {
    const local = new LocalLlmProvider();
    const manager = new LlmManager([new FailingProvider(), local]);
    const result = await manager.generateCopy({
      productName: 'Produto X',
      affiliateUrl: 'https://shopee.com.br/p/123',
      marketplace: 'shopee',
      tone: 'informativo',
    });
    expect(result.provider).toBe('local');
    expect(result.copy).toContain('Produto X');
  });

  test('lança erro quando nenhum provedor está configurado e não há local', async () => {
    const manager = new LlmManager([new FailingProvider()]);
    await expect(
      manager.generateCopy({
        productName: 'Produto X',
        affiliateUrl: 'https://shopee.com.br/p/123',
        marketplace: 'shopee',
        tone: 'informativo',
      })
    ).rejects.toThrow(/Não foi possível gerar a copy/);
  });
});
