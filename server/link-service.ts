import { randomUUID } from 'node:crypto';
import type { LinkConversion, Marketplace, Settings } from './types.js';

function identifyMarketplace(hostname: string): Marketplace {
  if (hostname.includes('shopee.')) return 'shopee';
  if (hostname.includes('mercadolivre.') || hostname.includes('mercadolibre.')) return 'mercado_livre';
  return 'unknown';
}

export function convertAffiliateUrl(rawUrl: string, settings: Settings): LinkConversion {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    throw new Error('Cole uma URL completa e válida do produto.');
  }

  const marketplace = identifyMarketplace(url.hostname.toLowerCase());
  if (marketplace === 'unknown') {
    throw new Error('Reconhecemos apenas links da Shopee e do Mercado Livre.');
  }

  if (marketplace === 'shopee' && settings.shopeeTrackingId) {
    url.searchParams.set('uls_trackid', settings.shopeeTrackingId);
  }

  if (marketplace === 'mercado_livre' && settings.mercadoLivreTag) {
    url.searchParams.set('matt_tool', settings.mercadoLivreTag);
  }

  return {
    id: randomUUID(),
    originalUrl: rawUrl.trim(),
    affiliateUrl: url.toString(),
    marketplace,
    createdAt: new Date().toISOString(),
  };
}

export function marketplaceName(marketplace: Marketplace): string {
  if (marketplace === 'shopee') return 'Shopee';
  if (marketplace === 'mercado_livre') return 'Mercado Livre';
  return 'Marketplace';
}
