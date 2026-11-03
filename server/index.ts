import 'dotenv/config';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { generateCopy } from './copy-service.js';
import { convertAffiliateUrl } from './link-service.js';
import { getHistory, getSettings, saveHistoryItem, toPublicSettings, updateSettings } from './store.js';
import { sendTelegramMessage } from './telegram-service.js';
import type { CopyTone, HistoryItem, Marketplace, Settings } from './types.js';

const app = express();
const port = Number(process.env.VITRYNE_PORT ?? 8787);

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json({ limit: '64kb' }));

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function validTone(value: unknown): value is CopyTone {
  return value === 'agressivo' || value === 'informativo' || value === 'economia';
}

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

app.get('/api/settings', async (_request, response) => {
  response.json(toPublicSettings(await getSettings()));
});

app.put('/api/settings', async (request, response) => {
  const allowed: Array<keyof Settings> = ['shopeeTrackingId', 'mercadoLivreTag', 'geminiApiKey', 'telegramBotToken', 'telegramChatId'];
  const input = Object.fromEntries(allowed.map((key) => [key, asString(request.body?.[key])])) as Partial<Settings>;
  response.json(await updateSettings(input));
});

app.get('/api/history', async (_request, response) => {
  response.json(await getHistory());
});

app.post('/api/links/convert', async (request, response) => {
  const conversion = convertAffiliateUrl(asString(request.body?.url), await getSettings());
  await saveHistoryItem(conversion);
  response.status(201).json(conversion);
});

app.post('/api/copy/generate', async (request, response) => {
  const id = asString(request.body?.id);
  const affiliateUrl = asString(request.body?.affiliateUrl);
  const marketplace = request.body?.marketplace as Marketplace;
  const tone = request.body?.tone;
  if (!id || !affiliateUrl || (marketplace !== 'shopee' && marketplace !== 'mercado_livre') || !validTone(tone)) {
    response.status(400).json({ error: 'Dados incompletos para gerar a copy.' });
    return;
  }
  const settings = await getSettings();
  const result = await generateCopy({
    productName: asString(request.body?.productName),
    affiliateUrl,
    marketplace,
    tone,
    apiKey: settings.geminiApiKey,
  });
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

app.post('/api/telegram/send', async (request, response) => {
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
    if (error instanceof Error && error.message.includes('Telegram API')) {
      const payload = error.toString();
      response.status(400).json({ error: payload });
      return;
    }

    console.error('Erro ao conectar com a API do Telegram:', error);
    response.status(502).json({ error: 'Não foi possível estabelecer conexão com o Telegram.' });
  }
});

app.use((error: Error, _request: Request, response: Response, _next: NextFunction) => {
  console.error(error);
  response.status(500).json({ error: error.message || 'Ocorreu um erro inesperado.' });
});

app.listen(port, () => {
  console.log(`Vitryne API ativa em http://localhost:${port}`);
});
