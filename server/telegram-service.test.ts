import { describe, expect, test } from 'vitest';
import { isTelegramErrorResponse, normalizeTelegramErrorPayload } from './telegram-service.js';

describe('normalizeTelegramErrorPayload', () => {
  test('extrai code, description e error_message', () => {
    const payload = { error_code: 400, description: 'Bad Request', error_message: 'texto inválido' };
    expect(normalizeTelegramErrorPayload(payload)).toEqual({
      code: 400,
      description: 'Bad Request',
      error_message: 'texto inválido',
    });
  });

  test('usa code quando error_code está ausente', () => {
    const payload = { code: 401, description: 'Unauthorized' };
    expect(normalizeTelegramErrorPayload(payload)).toEqual({
      code: 401,
      description: 'Unauthorized',
      error_message: undefined,
    });
  });

  test('retorna objeto vazio para payloads que não são erro do Telegram', () => {
    expect(normalizeTelegramErrorPayload(null)).toEqual({});
    expect(normalizeTelegramErrorPayload({ ok: true })).toEqual({});
    expect(normalizeTelegramErrorPayload('texto')).toEqual({});
  });
});

describe('isTelegramErrorResponse', () => {
  test('identifica respostas com description ou error_message', () => {
    expect(isTelegramErrorResponse({ description: 'x' })).toBe(true);
    expect(isTelegramErrorResponse({ error_message: 'x' })).toBe(true);
    expect(isTelegramErrorResponse({ ok: true })).toBe(false);
    expect(isTelegramErrorResponse(null)).toBe(false);
  });
});
