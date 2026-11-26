import type { Application, Request, Response } from 'express';
import { getSettings, toPublicSettings, updateSettings } from '../store.js';
import type { Settings } from '../types.js';
import { asString } from './utils.js';

export function setupSettingsRoutes(app: Application): void {
  const stringKeys: Array<keyof Settings> = [
    'shopeeTrackingId',
    'mercadoLivreTag',
    'amazonTag',
    'anthropicApiKey',
    'openAiApiKey',
    'geminiApiKey',
    'groqApiKey',
    'telegramBotToken',
    'telegramChatId',
  ];

  app.get('/api/settings', async (_request, response) => {
    response.json(toPublicSettings(await getSettings()));
  });

  app.put('/api/settings', async (request: Request, response: Response) => {
    const body: unknown = request.body;
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      response.status(400).json({ error: 'O corpo da configuração deve ser um objeto válido.' });
      return;
    }

    const values = body as Record<string, unknown>;
    const input: Record<string, string | boolean | number> = {};
    for (const key of stringKeys) {
      if (key in values) {
        if (typeof values[key] !== 'string') {
          response.status(400).json({ error: `O campo ${key} deve ser um texto válido.` });
          return;
        }
        input[key] = asString(values[key]);
      }
    }
    const booleanKeys = ['automationEnabled', 'telegramAutomationEnabled', 'metaAutomationEnabled', 'automationKillSwitch'] as const;
    for (const key of booleanKeys) {
      if (key in values) {
        if (typeof values[key] !== 'boolean') {
          response.status(400).json({ error: `O campo ${key} deve ser verdadeiro ou falso.` });
          return;
        }
        input[key] = values[key];
      }
    }
    if ('automationDailyLimit' in values) {
      const limit = values.automationDailyLimit;
      if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 0 || limit > 100) {
        response.status(400).json({ error: 'O limite diário deve ser um número inteiro entre 0 e 100.' });
        return;
      }
      input.automationDailyLimit = limit;
    }
    response.json(await updateSettings(input as Partial<Settings>));
  });
}
