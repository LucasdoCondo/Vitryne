import { marketplaceName } from '../../link-service.js';
import type { CopyRequest, CopyResult, LlmProvider } from './llm-provider.js';

export class LocalLlmProvider implements LlmProvider {
  readonly name = 'local';

  isConfigured(): boolean {
    return true;
  }

  async generateCopy(request: CopyRequest): Promise<CopyResult> {
    const { productName, affiliateUrl, marketplace, tone } = request;
    const name = productName || 'Achado imperdível';
    const intro =
      tone === 'agressivo'
        ? '⚡ CORRE: essa oportunidade merece sua atenção!'
        : tone === 'economia'
          ? '💸 Economia inteligente para quem gosta de comprar bem.'
          : '✨ Encontrei uma opção que vale conferir.';
    const copy = `${intro}\n\n🛍️ *${name}*\n\nDisponível no ${marketplaceName(marketplace)}. Confira os detalhes, condições e disponibilidade antes que mude.\n\n👉 *Aproveite aqui:* ${affiliateUrl}\n\n#Achadinhos #Oferta`;
    return { copy, provider: 'local' };
  }
}
