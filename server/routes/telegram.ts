import type { Application, Request, Response } from 'express';
import { sendTelegramMessage, TelegramApiError } from '../telegram-service.js';
import { getSettings } from '../store.js';
import { asString } from './utils.js';

export function setupTelegramRoutes(app: Application): void {
  app.post('/api/telegram/send', async (request: Request, response: Response) => {
    const message = asString(request.body?.message);
    const settings = await getSettings();

    if (!settings.telegramBotToken || !settings.telegramChatId) {
      response.status(400).json({ error: 'Configure o bot e o chat do Telegram antes de disparar.' });
      return;
    }

    if (!message.trim()) {
      response.status(400).json({ error: 'Não há mensagem para enviar.' });
      return;
    }

    try {
      const result = await sendTelegramMessage({
        botToken: settings.telegramBotToken,
        chatId: settings.telegramChatId,
        text: message,
      });
      response.json({ ok: true, sent_at: result.sent_at });
    } catch (error) {
      if (error instanceof TelegramApiError) {
        response.status(400).json({ error: `Telegram: ${error.message}` });
        return;
      }

      console.error('Erro ao conectar com a API do Telegram:', error);
      response.status(502).json({ error: 'Não foi possível estabelecer conexão com o Telegram.' });
    }
  });
}
