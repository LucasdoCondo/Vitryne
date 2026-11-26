import type { Campaign } from '../types.js';
import type { Agent, AgentContext, AgentResult } from './agent-base.js';

export interface AnalyticsInput {
  campaign: Campaign;
}

export interface AnalyticsOutput {
  campaignId: string;
  status: Campaign['status'];
  recordedAt: string;
}

export class AnalyticsAgent implements Agent<AnalyticsInput, AnalyticsOutput> {
  readonly name = 'AnalyticsAgent';

  async run(input: AnalyticsInput, ctx: AgentContext): Promise<AgentResult<AnalyticsOutput>> {
    const start = Date.now();
    const output = { campaignId: input.campaign.id, status: input.campaign.status, recordedAt: new Date().toISOString() };
    if (ctx.dryRun) ctx.logger.info('[dry-run] AnalyticsAgent registrou apenas uma leitura local.', output);
    return { ok: true, output, stage: 'analytics', durationMs: Date.now() - start };
  }
}
