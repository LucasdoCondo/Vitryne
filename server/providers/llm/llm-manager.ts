
import type { CopyRequest, CopyResult, LlmProvider } from './llm-provider.js';

export class LlmManager {
  private readonly providers: LlmProvider[];

  constructor(providers: LlmProvider[]) {
    this.providers = providers;
  }

  async generateCopy(request: CopyRequest): Promise<CopyResult> {
    for (const provider of this.providers) {
      if (!provider.isConfigured()) {
        continue;
      }
      try {
        return await provider.generateCopy(request);
      } catch {
        if (request.signal?.aborted) {
          throw new Error('Operação cancelada pelo usuário.');
        }
      }
    }

    // Fallback último recurso: provedor local (sempre configurado).
    const local = this.providers.find((p) => p.name === 'local');
    if (local) {
      return await local.generateCopy(request);
    }

    throw new Error('Não foi possível gerar a copy com os provedores disponíveis.');
  }
}
