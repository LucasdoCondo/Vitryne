import { describe, expect, test } from 'vitest';
import { convertAffiliateUrl, ValidationError, marketplaceName } from './link-service.js';
import type { Settings } from './types.js';

const baseSettings: Settings = {
  shopeeTrackingId: 'meu-tracking',
  mercadoLivreTag: 'minha-tag',
  amazonTag: '',
  anthropicApiKey: '',
  openAiApiKey: '',
  geminiApiKey: '',
  groqApiKey: '',
  telegramBotToken: '',
  telegramChatId: '',
  automationEnabled: false,
};

describe('convertAffiliateUrl', () => {
  test('adiciona uls_trackid em link da Shopee', () => {
    const result = convertAffiliateUrl('https://shopee.com.br/produto/123', baseSettings);
    expect(result.marketplace).toBe('shopee');
    expect(result.affiliateUrl).toContain('uls_trackid=meu-tracking');
  });

  test('adiciona matt_tool em link do Mercado Livre', () => {
    const result = convertAffiliateUrl('https://produto.mercadolivre.com.br/MLB-123', baseSettings);
    expect(result.marketplace).toBe('mercado_livre');
    expect(result.affiliateUrl).toContain('matt_tool=minha-tag');
  });

  test('rejeita URL inválida', () => {
    expect(() => convertAffiliateUrl('não é uma url', baseSettings)).toThrow(ValidationError);
  });

  test('rejeita protocolo não http(s)', () => {
    expect(() => convertAffiliateUrl('ftp://shopee.com.br/x', baseSettings)).toThrow(ValidationError);
  });

  test('rejeita marketplace não suportado', () => {
    expect(() => convertAffiliateUrl('https://example.com/produto', baseSettings)).toThrow(ValidationError);
  });

  test('não quebra quando não há tracking/tag configurado', () => {
    const result = convertAffiliateUrl('https://shopee.com.br/produto/123', {
      ...baseSettings,
      shopeeTrackingId: '',
      mercadoLivreTag: '',
    });
    expect(result.affiliateUrl).not.toContain('uls_trackid');
    expect(result.affiliateUrl).not.toContain('matt_tool');
  });
});

describe('marketplaceName', () => {
  test('retorna nomes amigáveis', () => {
    expect(marketplaceName('shopee')).toBe('Shopee');
    expect(marketplaceName('mercado_livre')).toBe('Mercado Livre');
    expect(marketplaceName('unknown')).toBe('Marketplace');
  });
});
