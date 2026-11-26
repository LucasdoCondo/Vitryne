import type { Application, Request, Response } from 'express';
import { generateCopy } from '../copy-service.js';
import { getHistory, getSettings, saveHistoryItem } from '../store.js';
import type { HistoryItem, Marketplace } from '../types.js';
import { asString, validTone } from './utils.js';

export function setupCopyRoutes(app: Application): void {
  app.post('/api/copy/generate', async (request: Request, response: Response) => {
    const id = asString(request.body?.id);
    const affiliateUrl = asString(request.body?.affiliateUrl);
    const marketplace = request.body?.marketplace as Marketplace;
    const tone = request.body?.tone;
    if (!id || !affiliateUrl || (marketplace !== 'shopee' && marketplace !== 'mercado_livre') || !validTone(tone)) {
      response.status(400).json({ error: 'Dados incompletos para gerar a copy.' });
      return;
    }
    const settings = await getSettings();
    let result: Awaited<ReturnType<typeof generateCopy>>;
    try {
      result = await generateCopy({
        productName: asString(request.body?.productName),
        affiliateUrl,
        marketplace,
        tone,
        apiKey: settings.geminiApiKey,
      });
    } catch (error) {
      console.error('Erro ao gerar copy com o Gemini:', error);
      response.status(502).json({
        error:
          error instanceof Error && error.message
            ? `Falha ao gerar a copy: ${error.message}`
            : 'Falha ao gerar a copy com o Gemini.',
      });
      return;
    }
    const existing = (await getHistory()).find((entry) => entry.id === id);
    const item: HistoryItem = {
      ...(existing ?? {
        id,
        originalUrl: affiliateUrl,
        affiliateUrl,
        marketplace,
        createdAt: new Date().toISOString(),
      }),
      productName: asString(request.body?.productName),
      copy: result.copy,
      tone,
    };
    await saveHistoryItem(item);
    response.json(result);
  });
}
