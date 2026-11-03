import type { BotSession, TelegramErrorResponse } from './types.js';

export interface SendTelegramMessageRequest {
  botToken: string;
  chatId: string;
  text: string;
}

export interface SendTelegramMessageResult {
  sent_at: string;
}

export function isTelegramErrorResponse(payload: unknown): payload is TelegramErrorResponse {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  const candidate = payload as Record<string, unknown>;
  return typeof candidate.description === 'string' || typeof candidate.error_message === 'string';
}

export function normalizeTelegramErrorPayload(payload: unknown): { code?: number; description?: string; error_message?: string } {
  if (!isTelegramErrorResponse(payload)) {
    return {};
  }

  const candidate = payload as Record<string, unknown>;
  return {
    code: typeof candidate.code === 'number' ? candidate.code : undefined,
    description: typeof candidate.description === 'string' ? candidate.description : undefined,
    error_message: typeof candidate.error_message === 'string' ? candidate.error_message : undefined,
  };
}

export class TelegramApiError extends Error {
  public readonly code?: number;
  public readonly description?: string;
  public readonly error_message?: string;

  constructor(payload: { code?: number; description?: string; error_message?: string }, originalError?: unknown) {
    const { code, description, error_message } = payload;
    const message = description ?? error_message ?? 'O Telegram recusou o envio.';
    super(message, { cause: originalError });
    this.name = 'TelegramApiError';
    this.code = code;
    this.description = description;
    this.error_message = error_message;
  }
}

let sessionCache: BotSession | null = null;

async function getSession(botToken: string): Promise<BotSession> {
  if (sessionCache?.botToken === botToken) {
    return sessionCache;
  }

  sessionCache = {
    botToken,
    authorizedAt: Date.now(),
  };

  return sessionCache;
}

export async function sendTelegramMessage(request: SendTelegramMessageRequest): Promise<SendTelegramMessageResult> {
  const { botToken, chatId, text } = request;
  const session = await getSession(botToken);

  const response = await fetch(`https://api.telegram.org/bot${session.botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  });

  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    const errorPayload = normalizeTelegramErrorPayload(payload);
    throw new TelegramApiError(errorPayload, new Error(`Telegram returned ${response.status}`));
  }

  if (response.status === 200 && (payload === null || typeof payload !== 'object' || (payload as Record<string, unknown>).ok !== true)) {
    throw new TelegramApiError({ description: 'Resposta inesperada do Telegram.' });
  }

  return { sent_at: new Date().toISOString() };
}
