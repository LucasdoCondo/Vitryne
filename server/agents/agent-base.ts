import type { Settings } from '../types.js';

export interface AgentContext {
  settings: Settings;
  dryRun: boolean;
  signal: AbortSignal;
  logger: {
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
  };
}

export interface AgentResult<O> {
  ok: boolean;
  output?: O;
  error?: string;
  provider?: string;
  stage?: string;
  durationMs?: number;
}

export interface Agent<I, O> {
  readonly name: string;
  run(input: I, ctx: AgentContext): Promise<AgentResult<O>>;
}
