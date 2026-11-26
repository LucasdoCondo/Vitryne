import type { Application } from 'express';
import { getSettings } from '../store.js';

export function setupHealthRoutes(app: Application): void {
  app.get('/api/health', async (_request, response) => {
    const settings = await getSettings();
    response.json({
      online: true,
      services: {
        local: true,
        gemini: Boolean(settings.geminiApiKey),
        telegram: Boolean(settings.telegramBotToken && settings.telegramChatId),
      },
    });
  });
}
