import type { Campaign } from '../types.js';
import type { Agent, AgentContext, AgentResult } from './agent-base.js';

export interface SchedulerInput {
  campaign: Campaign;
  automatic: boolean;
}

export interface SchedulerOutput {
  approved: boolean;
  scheduled: boolean;
  scheduledAt?: string;
}

export class SchedulerAgent implements Agent<SchedulerInput, SchedulerOutput> {
  readonly name = 'SchedulerAgent';

  async run(input: SchedulerInput, ctx: AgentContext): Promise<AgentResult<SchedulerOutput>> {
    const start = Date.now();
    if (!input.campaign.complianceApproved) {
      return { ok: false, error: 'A campanha não passou na conformidade.', stage: 'scheduler', durationMs: Date.now() - start };
    }

    if (ctx.dryRun) {
      return { ok: true, output: { approved: false, scheduled: false }, stage: 'scheduler', durationMs: Date.now() - start };
    }

    if (input.automatic) {
      const scheduledAt = new Date().toISOString();
      return { ok: true, output: { approved: true, scheduled: true, scheduledAt }, stage: 'scheduler', durationMs: Date.now() - start };
    }

    return { ok: true, output: { approved: false, scheduled: false }, stage: 'scheduler', durationMs: Date.now() - start };
  }
}
