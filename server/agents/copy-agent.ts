import type { CopyTone, Marketplace } from '../types.js';
import { GeminiLlmProvider, LocalLlmProvider, LlmManager } from '../providers/llm/index.js';
import type { Agent, AgentContext, AgentResult } from './agent-base.js';

export interface CopyAgentInput {
  productName: string;
  affiliateUrl: string;
  marketplace: Marketplace;
  tone: CopyTone;
  apiKey: string;
  variations?: number;
}

interface CopyAgentOutput {
  variations: Array<{ id: string; copy: string; provider: string; tone: CopyTone }>;
}

interface CopyVariationResult {
  result?: { id: string; copy: string; provider: string; tone: CopyTone };
  error?: string;
}

const DEFAULT_VARIATIONS = 2;

function isValidTone(value: unknown): value is CopyTone {
  return value === 'agressivo' || value === 'informativo' || value === 'economia';
}

function copyErrorResult(start: number, error: string): AgentResult<CopyAgentOutput> {
  return {
    ok: false,
    error,
    stage: 'copy',
    durationMs: Date.now() - start,
  };
}

function resolveToneVariant(index: number, tone: CopyTone): CopyTone {
  if (index === 0) return tone;
  if (index === 1) return 'informativo';
  return 'economia';
}

export class CopyAgent implements Agent<CopyAgentInput, CopyAgentOutput> {
  readonly name = 'CopyAgent';

  async run(input: CopyAgentInput, ctx: AgentContext): Promise<AgentResult<CopyAgentOutput>> {
    const start = Date.now();
    const { productName, affiliateUrl, marketplace, tone, apiKey, variations = DEFAULT_VARIATIONS } = input;

    const invalid = this.validateInput(productName, affiliateUrl, marketplace, tone, variations, start);
    if (invalid) return invalid;

    const manager = new LlmManager([
      new GeminiLlmProvider(apiKey),
      new LocalLlmProvider(),
    ]);

    const results: CopyAgentOutput['variations'] = [];
    const errors: string[] = [];

    for (let i = 0; i < variations; i++) {
      const iteration = await this.generateVariation(manager, i, tone, {
        productName,
        affiliateUrl,
        marketplace,
      }, ctx.signal);

      if (iteration.result) {
        results.push(iteration.result);
      } else if (iteration.error) {
        errors.push(iteration.error);
      }

      if (ctx.signal.aborted) {
        return copyErrorResult(start, 'Operação cancelada pelo usuário.');
      }
    }

    if (results.length === 0) {
      return copyErrorResult(start, `Não foi gerar nenhuma variação de copy. Erros: ${errors.join('; ')}`);
    }

    if (ctx.dryRun) {
      ctx.logger.info('[dry-run] CopyAgent gerou variações sem publicar.', {
        variations: results.length,
        providers: results.map((r) => r.provider),
      });
    }

    return {
      ok: true,
      output: { variations: results },
      provider: results.map((r) => r.provider).join(','),
      stage: 'copy',
      durationMs: Date.now() - start,
    };
  }

  private validateInput(
    productName: string,
    affiliateUrl: string,
    marketplace: Marketplace,
    tone: CopyTone,
    variations: number,
    start: number,
  ): AgentResult<CopyAgentOutput> | null {
    if (!productName || !affiliateUrl || !marketplace || !isValidTone(tone)) {
      return copyErrorResult(start, 'Dados incompletos para gerar a copy.');
    }

    if (variations < 1 || variations > 3) {
      return copyErrorResult(start, 'O número de variações deve ser entre 1 e 3.');
    }

    return null;
  }

  private async generateVariation(
    manager: LlmManager,
    index: number,
    tone: CopyTone,
    input: { productName: string; affiliateUrl: string; marketplace: Marketplace },
    signal: AbortSignal,
  ): Promise<CopyVariationResult> {
    const toneVariant = resolveToneVariant(index, tone);

    try {
      const result = await manager.generateCopy({
        ...input,
        tone: toneVariant,
        signal,
      });

      return {
        result: {
          id: crypto.randomUUID(),
          copy: result.copy,
          provider: result.provider,
          tone: toneVariant,
        },
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Erro desconhecido ao gerar copy.',
      };
    }
  }
}
