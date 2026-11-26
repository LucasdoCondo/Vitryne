import type { Marketplace } from '../types.js';
import type { Agent, AgentContext, AgentResult } from './agent-base.js';

export interface ComplianceAgentInput {
  copy: string;
  productName?: string;
  marketplace?: Marketplace;
  affiliateUrl?: string;
  requireAffiliateDisclosure?: boolean;
}

interface ComplianceAgentOutput {
  approved: boolean;
  reasons: string[];
  checks: Array<{ name: string; passed: boolean; detail?: string }>;
}

const PRICE_PATTERN = /(R?\$\s?\d{1,3}([.,]\d{3})*([.,]\d{2})?|(?<!\w)\d{1,3}([.,]\d{3})*([.,]\d{2})\s?(reais|rs|USD|dólares|dolar))/i;
const DISCOUNT_PATTERN = /(\d{1,3}\s?%|desconto de|de\s?R?\$|por apenas|por só)/i;
const STOCK_PATTERN = /(estoque (quase )?esgotado|últimas (unidades|peças)|restam\s?\d+|somente\s?\d+ Disponível|apenas\s?\d+)/i;
const DEADLINE_PATTERN = /(por tempo limitado|apenas hoje|só hoje|corra que|não perca|última chance|válido até|até (segunda|terça|quarta|quinta|sexta|sábado|domingo)|hoje só)/i;
const FALSE_PROMISE_PATTERN = /(menor preço|preço mais baixo|garantido|100% (satisfação|seguro)|nunca mais|o melhor do mundo|exclusivo para você)/i;
const AFFILIATE_DISCLOSURE_PATTERN = /(publicidade|anúncio|parceria|afiliado|#pub|#ad|#publicidade|conteúdo patrocinado)/i;

export class ComplianceAgent implements Agent<ComplianceAgentInput, ComplianceAgentOutput> {
  readonly name = 'ComplianceAgent';

  async run(input: ComplianceAgentInput, ctx: AgentContext): Promise<AgentResult<ComplianceAgentOutput>> {
    const start = Date.now();
    const { copy, affiliateUrl, requireAffiliateDisclosure = true } = input;

    const checks: ComplianceAgentOutput['checks'] = [];
    const reasons: string[] = [];

    // 1. Preço não confirmado (nunca inventar)
    const hasPrice = PRICE_PATTERN.test(copy);
    checks.push({
      name: 'preço não inventado',
      passed: !hasPrice,
      detail: hasPrice ? 'Copy menciona preço específico, que não pode ser confirmado.' : undefined,
    });
    if (hasPrice) reasons.push('Copy menciona preço específico sem confirmação oficial.');

    // 2. Desconto não confirmado
    const hasDiscount = DISCOUNT_PATTERN.test(copy);
    checks.push({
      name: 'desconto não inventado',
      passed: !hasDiscount,
      detail: hasDiscount ? 'Copy menciona desconto percentual ou valor sem confirmação oficial.' : undefined,
    });
    if (hasDiscount) reasons.push('Copy menciona desconto sem confirmação oficial.');

    // 3. Estoque não confirmado
    const hasStock = STOCK_PATTERN.test(copy);
    checks.push({
      name: 'estoque não inventado',
      passed: !hasStock,
      detail: hasStock ? 'Copy menciona disponibilidade de estoque sem confirmação oficial.' : undefined,
    });
    if (hasStock) reasons.push('Copy menciona estoque sem confirmação oficial.');

    // 4. Prazo não confirmado
    const hasDeadline = DEADLINE_PATTERN.test(copy);
    checks.push({
      name: 'prazo não inventado',
      passed: !hasDeadline,
      detail: hasDeadline ? 'Copy menciona prazo ou urgência sem confirmação oficial.' : undefined,
    });
    if (hasDeadline) reasons.push('Copy menciona prazo/urgência sem confirmação oficial.');

    // 5. Promessas falsas
    const hasFalsePromise = FALSE_PROMISE_PATTERN.test(copy);
    checks.push({
      name: 'sem promessas falsas',
      passed: !hasFalsePromise,
      detail: hasFalsePromise ? 'Copy contém promessas falsas ou superlativas não verificáveis.' : undefined,
    });
    if (hasFalsePromise) reasons.push('Copy contém promessas falsas ou não verificáveis.');

    // 6. Divulgação de afiliado
    const hasDisclosure = AFFILIATE_DISCLOSURE_PATTERN.test(copy);
    const disclosureRequired = requireAffiliateDisclosure && Boolean(affiliateUrl);
    checks.push({
      name: 'divulgação de afiliado',
      passed: !disclosureRequired || hasDisclosure,
      detail: disclosureRequired && !hasDisclosure
        ? 'Copy com link de afiliado não possui divulgação clara de publicidade.'
        : undefined,
    });
    if (disclosureRequired && !hasDisclosure) {
      reasons.push('Copy com link de afiliado não possui divulgação clara de publicidade/afiliado.');
    }

    const approved = reasons.length === 0;

    if (ctx.dryRun) {
      ctx.logger.info('[dry-run] ComplianceAgent avaliou copy.', {
        approved,
        checks: checks.map((c) => ({ name: c.name, passed: c.passed })),
      });
    }

    return {
      ok: true,
      output: { approved, reasons, checks },
      stage: 'compliance',
      durationMs: Date.now() - start,
    };
  }
}
