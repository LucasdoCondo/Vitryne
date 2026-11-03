import { GoogleGenAI } from '@google/genai';
import type { CopyTone, Marketplace } from './types.js';
import { marketplaceName } from './link-service.js';

interface CopyRequest {
  productName: string;
  affiliateUrl: string;
  marketplace: Marketplace;
  tone: CopyTone;
  apiKey: string;
}

const toneGuides: Record<CopyTone, string> = {
  agressivo: 'direto, energético, com urgência e escassez sem promessas falsas',
  informativo: 'claro, confiável e focado nos benefícios práticos',
  economia: 'persuasivo, destacando custo-benefício e oportunidade de economizar',
};

function localCopy({ productName, affiliateUrl, marketplace, tone }: CopyRequest): string {
  const name = productName || 'Achado imperdível';
  const intro = tone === 'agressivo' ? '⚡ CORRE: essa oportunidade merece sua atenção!' : tone === 'economia' ? '💸 Economia inteligente para quem gosta de comprar bem.' : '✨ Encontrei uma opção que vale conferir.';
  return `${intro}\n\n🛍️ *${name}*\n\nDisponível no ${marketplaceName(marketplace)}. Confira os detalhes, condições e disponibilidade antes que mude.\n\n👉 *Aproveite aqui:* ${affiliateUrl}\n\n#Achadinhos #Oferta`;
}

export async function generateCopy(request: CopyRequest): Promise<{ copy: string; provider: 'gemini' | 'local' }> {
  if (!request.apiKey) {
    return { copy: localCopy(request), provider: 'local' };
  }

  const ai = new GoogleGenAI({ apiKey: request.apiKey });
  const prompt = `Você é um copywriter de afiliados no Brasil. Crie uma mensagem curta, pronta para Telegram e WhatsApp, em português do Brasil.\n\nProduto: ${request.productName || 'Produto em oferta'}\nMarketplace: ${marketplaceName(request.marketplace)}\nTom: ${toneGuides[request.tone]}\nLink de afiliado (mantenha exatamente como enviado): ${request.affiliateUrl}\n\nRegras: use até 3 emojis estratégicos, título chamativo, CTA forte, linguagem natural. Não invente preço, desconto, estoque ou prazo. Não escreva explicações; devolva somente a mensagem final em Markdown.`;
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });
  const copy = response.text?.trim();
  if (!copy) throw new Error('O Gemini não retornou uma copy. Tente novamente.');
  return { copy, provider: 'gemini' };
}
