import { describe, expect, test } from 'vitest';
import { generateCopy } from './copy-service.js';
import type { CopyTone, Marketplace } from './types.js';

const baseRequest: Parameters<typeof generateCopy>[0] = {
  productName: 'Fone de Ouvido Bluetooth',
  affiliateUrl: 'https://shopee.com.br/produto/123?uls_trackid=abc',
  marketplace: 'shopee' as Marketplace,
  tone: 'informativo' as CopyTone,
  apiKey: '',
};

describe('generateCopy', () => {
  test('usa fallback local quando não há apiKey', async () => {
    const result = await generateCopy(baseRequest);
    expect(result.provider).toBe('local');
  });

  test('o fallback local retorna copy não vazia com o link', async () => {
    const { copy } = await generateCopy(baseRequest);
    expect(copy).toContain('Fone de Ouvido Bluetooth');
    expect(copy).toContain(baseRequest.affiliateUrl);
  });

  test('suporta os três tons', async () => {
    for (const tone of ['agressivo', 'informativo', 'economia'] as CopyTone[]) {
      const { copy } = await generateCopy({ ...baseRequest, tone });
      expect(copy.length).toBeGreaterThan(0);
    }
  });
});
