import type { Application, Request, Response } from 'express';
import { convertAffiliateUrl, ValidationError } from '../link-service.js';
import { getHistory, getSettings, saveHistoryItem } from '../store.js';
import { asString } from './utils.js';

export function setupLinksRoutes(app: Application): void {
  app.get('/api/history', async (_request, response) => {
    response.json(await getHistory());
  });

  app.post('/api/links/convert', async (request: Request, response: Response) => {
    try {
      const conversion = convertAffiliateUrl(asString(request.body?.url), await getSettings());
      await saveHistoryItem(conversion);
      response.status(201).json(conversion);
    } catch (error) {
      if (error instanceof ValidationError) {
        response.status(400).json({ error: error.message });
        return;
      }
      throw error;
    }
  });
}
