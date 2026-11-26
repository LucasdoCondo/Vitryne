import { describe, expect, test } from 'vitest';
import { ComplianceAgent } from './compliance-agent.js';
import type { Marketplace } from '../types.js';

function makeCtx(overrides: Partial<{
  dryRun: boolean;
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
    signal: new AbortController().signal,
    logger: {
      info: () => {},
      warn: () => {},
      error: () => {},
    },
  };
}

const baseInput = {
  copy: '📢 Publicidade / conteúdo de afiliado.\n\n✨ Encontrei uma opção que vale conferir.\n\n🛍️ *Fone de Ouvido Bluetooth*\n\nDisponível na Shopee. Confira os detalhes, condições e disponibilidade antes que mude.\n\n👉 *Aproveite aqui:* https://shopee.com.br/produto/123\n\n#Achadinhos #Oferta',
  productName: 'Fone de Ouvido Bluetooth',
  marketplace: 'shopee' as Marketplace,
  affiliateUrl: 'https://shopee.com.br/produto/123',
};

describe('ComplianceAgent', () => {
  test('aprova copy limpa com divulgação de afiliado', async () => {
    const agent = new ComplianceAgent();
    const result = await agent.run(baseInput, makeCtx());

    expect(result.ok).toBe(true);
    expect(result.output?.approved).toBe(true);
    expect(result.output?.reasons.length).toBe(0);
  });

  test('reprova copy com preço inventado', async () => {
    const agent = new ComplianceAgent();
    const result = await agent.run(
      { ...baseInput, copy: `${baseInput.copy}\n\nPor apenas R$ 99,90!` },
      makeCtx()
    );
    expect(result.ok).toBe(true);
    expect(result.output?.approved).toBe(false);
    expect(result.output?.reasons.some((r) => r.includes('preço'))).toBe(true);
  });

  test('reprova copy com desconto inventado', async () => {
    const agent = new ComplianceAgent();
    const result = await agent.run(
      { ...baseInput, copy: `${baseInput.copy}\n\n50% de desconto hoje!` },
      makeCtx()
    );
    expect(result.output?.approved).toBe(false);
    expect(result.output?.reasons.some((r) => r.includes('desconto'))).toBe(true);
  });

  test('reprova copy com estoque inventado', async () => {
    const agent = new ComplianceAgent();
    const result = await agent.run(
      { ...baseInput, copy: `${baseInput.copy}\n\nÚltimas unidades em estoque!` },
      makeCtx()
    );
    expect(result.output?.approved).toBe(false);
    expect(result.output?.reasons.some((r) => r.includes('estoque'))).toBe(true);
  });

  test('reprova copy com prazo inventado', async () => {
    const agent = new ComplianceAgent();
    const result = await agent.run(
      { ...baseInput, copy: `${baseInput.copy}\n\nPor tempo limitado!` },
      makeCtx()
    );
    expect(result.output?.approved).toBe(false);
    expect(result.output?.reasons.some((r) => r.includes('prazo'))).toBe(true);
  });

  test('reprova copy com promessa falsa', async () => {
    const agent = new ComplianceAgent();
    const result = await agent.run(
      { ...baseInput, copy: `${baseInput.copy}\n\nO menor preço garantido!` },
      makeCtx()
    );
    expect(result.output?.approved).toBe(false);
    expect(result.output?.reasons.some((r) => r.includes('promessas'))).toBe(true);
  });

  test('reprova copy com link de afiliado sem divulgação', async () => {
    const agent = new ComplianceAgent();
    const result = await agent.run(
      { ...baseInput, copy: 'Confira este produto incrível: https://shopee.com.br/produto/123' },
      makeCtx()
    );
    expect(result.output?.approved).toBe(false);
    expect(result.output?.reasons.some((r) => r.includes('divulgação'))).toBe(true);
  });

  test('aprova quando divulgação não é obrigatória', async () => {
    const agent = new ComplianceAgent();
    const result = await agent.run(
      { ...baseInput, requireAffiliateDisclosure: false },
      makeCtx()
    );
    expect(result.output?.approved).toBe(true);
  });

  test('aprova copy com divulgação explícita', async () => {
    const agent = new ComplianceAgent();
    const result = await agent.run(
      {
        ...baseInput,
        copy: `📢 Publicidade / conteúdo de afiliado.\n\n${baseInput.copy}`,
      },
      makeCtx()
    );
    expect(result.output?.approved).toBe(true);
  });
});
