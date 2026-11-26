import type { Application, Request, Response } from 'express';
import { randomBytes } from 'node:crypto';
import {
  createMetaAuthorizationUrl,
  exchangeMetaCode,
  getMetaOAuthConfig,
} from '../meta-oauth.js';
import { getMetaConnections, saveMetaConnections } from '../store.js';
import { asString } from './utils.js';

const oauthStates = new Map<string, { provider: 'meta'; expiresAt: number }>();

function oauthPopupResponse(response: Response, success: boolean, provider: 'meta'): void {
  const nonce = randomBytes(18).toString('base64');
  const message = success
    ? 'Conta Meta conectada. Esta janela será fechada.'
    : 'Não foi possível conectar a conta Meta. Confira a configuração e tente novamente.';
  response
    .setHeader('Cache-Control', 'no-store')
    .setHeader(
      'Content-Security-Policy',
      `default-src 'none'; script-src 'nonce-${nonce}'; base-uri 'none'; frame-ancestors 'none'`
    )
    .type('html')
    .send(`<!doctype html><html lang=\"pt-BR\"><meta charset=\"utf-8\"><title>Vitryne</title><body><p>${message}</p><script nonce=\"${nonce}\">if(window.opener){for(const origin of ['http://localhost:5173','http://127.0.0.1:5173'])window.opener.postMessage({type:'VITRYNE_OAUTH_SUCCESS',provider:'${provider}',success:${success}},origin)}window.close()</script></body></html>`);
}

function validateMetaSetup(): void {
  getMetaOAuthConfig();
}

export function setupOAuthRoutes(app: Application): void {
  app.get('/api/oauth/:provider/start', (request: Request, response: Response) => {
    const provider = asString(request.params.provider);
    if (provider !== 'meta') {
      response.status(404).type('text').send('Este provedor OAuth ainda não está disponível.');
      return;
    }

    try {
      validateMetaSetup();
      const now = Date.now();
      for (const [state, entry] of oauthStates) {
        if (entry.expiresAt <= now) oauthStates.delete(state);
      }

      const state = randomBytes(32).toString('hex');
      oauthStates.set(state, { provider, expiresAt: now + 10 * 60 * 1000 });
      response.redirect(302, createMetaAuthorizationUrl(state));
    } catch (error) {
      response
        .status(503)
        .type('text')
        .send(error instanceof Error ? error.message : 'A integração Meta ainda não está configurada.');
    }
  });

  app.get('/api/oauth/:provider/callback', async (request: Request, response: Response) => {
    const provider = asString(request.params.provider);
    if (provider !== 'meta') {
      response.status(404).type('text').send('Este provedor OAuth ainda não está disponível.');
      return;
    }

    const state = asString(request.query.state);
    const stateEntry = oauthStates.get(state);
    oauthStates.delete(state);
    if (!state || !stateEntry || stateEntry.provider !== provider || stateEntry.expiresAt <= Date.now()) {
      oauthPopupResponse(response.status(400), false, provider);
      return;
    }

    if (request.query.error || !request.query.code || typeof request.query.code !== 'string') {
      oauthPopupResponse(response.status(400), false, provider);
      return;
    }

    try {
      validateMetaSetup();
      const authorizedPages = await exchangeMetaCode(request.query.code);
      const newIds = new Set(authorizedPages.map((page) => page.pageId));
      const existing = (await getMetaConnections()).filter((page) => !newIds.has(page.pageId));
      await saveMetaConnections([...existing, ...authorizedPages]);
      oauthPopupResponse(response, true, provider);
    } catch (error) {
      console.error('Falha no callback OAuth da Meta:', error instanceof Error ? error.message : 'Erro inesperado.');
      oauthPopupResponse(response.status(502), false, provider);
    }
  });
}
