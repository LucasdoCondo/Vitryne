import { convertAffiliateUrl, ValidationError } from '../link-service.js';
import type { LinkConversion } from '../types.js';
import type { Agent, AgentContext, AgentResult } from './agent-base.js';

export interface LinkAgentInput {
  url: string;
}

export class LinkAgent implements Agent<LinkAgentInput, LinkConversion> {
  readonly name = 'LinkAgent';

  async run(input: LinkAgentInput, ctx: AgentContext): Promise<AgentResult<LinkConversion>> {
    const start = Date.now();
    try {
      const output = convertAffiliateUrl(input.url, ctx.settings);
      if (ctx.dryRun) ctx.logger.info('[dry-run] LinkAgent processou o link sem publicar.', { marketplace: output.marketplace });
      return { ok: true, output, stage: 'link', durationMs: Date.now() - start };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof ValidationError ? error.message : 'Não foi possível processar o link.',
        stage: 'link',
        durationMs: Date.now() - start,
      };
    }
  }
}
