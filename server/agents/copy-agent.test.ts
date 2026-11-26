import { describe, expect, test } from 'vitest';
import { CopyAgent } from './copy-agent.js';
import type { Marketplace, CopyTone } from '../types.js';

function makeCtx(overrides: Partial<{
  dryRun: boolean;
  signal: AbortSignal;
}> = {}) {
  return {
    settings: {
      shopeeTrackingId: '',
      mercadoLivreTag: '',
      amazonTag: '',
      anthropicApiKey: '',
      openAiApiKey: '',
      geminiApiKey: '',
      groqApiKey: '',
      telegramBotToken: '',
      telegramChatId: '',
      automationEnabled: false,
    },
    dryRun: overrides.dryRun ?? false,
    signal: overrides.signal ?? new AbortController().signal,
    logger: {
      info: () => {},
      warn: () => {},
      error: () => {},
    },
  };
}

const baseInput = {
  productName: 'Fone de Ouvido Bluetooth',
  affiliateUrl: 'https://shopee.com.br/produto/123',
  marketplace: 'shopee' as Marketplace,
  tone: 'informativo' as CopyTone,
  apiKey: '',
};

describe('CopyAgent', () => {
  test('usa fallback local quando não há apiKey', async () => {
    const agent = new CopyAgent();
    const result = await agent.run(baseInput, makeCtx());

    expect(result.ok).toBe(true);
    expect(result.output?.variations.length).toBeGreaterThan(0);
    expect(result.output?.variations[0].provider).toBe('local');
    expect(result.output?.variations[0].copy).toContain('Fone de Ouvido Bluetooth');
    expect(result.output?.variations[0].copy).toContain(baseInput.affiliateUrl);
  });

  test('gera múltiplas variações A/B', async () => {
    const agent = new CopyAgent();
    const result = await agent.run({ ...baseInput, variations: 3 }, makeCtx());

    expect(result.ok).toBe(true);
    expect(result.output?.variations.length).toBe(3);
    expect(result.output?.variations.map((v) => v.tone)).toEqual([
      'informativo',
      'informativo',
      'economia',
    ]);
  });

  test('usa 2 variações por padrão', async () => {
    const agent = new CopyAgent();
    const result = await agent.run(baseInput, makeCtx());
    expect(result.output?.variations.length).toBe(2);
  });

  test('rejeita entrada incompleta', async () => {
    const agent = new CopyAgent();
    const result = await agent.run(
      { ...baseInput, productName: '' },
      makeCtx()
    );
    expect(result.ok).toBe(false);
    expect(result.error).toContain('incompletos');
  });

  test('rejeita número de variações fora do intervalo', async () => {
    const agent = new CopyAgent();
    const result0 = await agent.run({ ...baseInput, variations: 0 }, makeCtx());
    expect(result0.ok).toBe(false);

    const result4 = await agent.run({ ...baseInput, variations: 4 }, makeCtx());
    expect(result4.ok).toBe(false);
  });

  test('respeita AbortSignal', async () => {
    const controller = new AbortController();
    controller.abort();
    const agent = new CopyAgent();
    const result = await agent.run(baseInput, makeCtx({ signal: controller.signal }));

    expect(result.ok).toBe(false);
    expect(result.error).toContain('cancelada');
  });
});
