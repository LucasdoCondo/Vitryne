import type { Marketplace } from '../types.js';
import type { Agent, AgentContext, AgentResult } from './agent-base.js';

export interface ProductInfoInput {
  productName: string;
  marketplace: Marketplace;
}

export interface ProductInfoOutput {
  productName: string;
  marketplace: Exclude<Marketplace, 'unknown'>;
  verifiedFacts: Record<string, never>;
}

export class ProductInfoAgent implements Agent<ProductInfoInput, ProductInfoOutput> {
  readonly name = 'ProductInfoAgent';

  async run(input: ProductInfoInput, ctx: AgentContext): Promise<AgentResult<ProductInfoOutput>> {
    const start = Date.now();
    if (!input.productName.trim() || input.marketplace === 'unknown') {
      return { ok: false, error: 'Informe o nome do produto e use um marketplace reconhecido.', stage: 'product-info', durationMs: Date.now() - start };
    }

    if (ctx.dryRun) ctx.logger.info('[dry-run] ProductInfoAgent confirmou apenas dados fornecidos pelo usuário.');
    return {
      ok: true,
      output: {
        productName: input.productName.trim().slice(0, 120),
        marketplace: input.marketplace,
        verifiedFacts: {},
      },
      stage: 'product-info',
      durationMs: Date.now() - start,
    };
  }
}
