import type { Application } from 'express';
import { getMetaOAuthConfig } from '../meta-oauth.js';
import { getPublicMetaConnections } from '../store.js';
import type { PublicMetaPageConnection } from '../types.js';

function validateMetaSetup(): void {
  getMetaOAuthConfig();
}

export function setupConnectionsRoutes(app: Application): void {
  app.get('/api/connections', async (_request, response) => {
    let metaConfigured = false;
    try {
      validateMetaSetup();
      metaConfigured = true;
    } catch {
      metaConfigured = false;
    }
    const pages: PublicMetaPageConnection[] = await getPublicMetaConnections();
    response.json({
      metaConfigured,
      pages,
      facebookConnected: pages.length > 0,
      instagramConnected: pages.some((page) => Boolean(page.instagramUsername)),
    });
  });
}
