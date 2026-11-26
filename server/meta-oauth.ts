import type { MetaPageAuthorization } from './types.js';

interface MetaOAuthConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
  graphVersion: string;
}

interface OAuthTokenResponse {
  access_token?: string;
  error?: { message?: string };
}

interface MetaPagesResponse {
  data?: Array<{
    id?: string;
    name?: string;
    access_token?: string;
    instagram_business_account?: { id?: string; username?: string };
  }>;
  error?: { message?: string };
}

const requestedScopes = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts',
  'instagram_basic',
  'instagram_content_publish',
];

export function getMetaOAuthConfig(): MetaOAuthConfig {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const graphVersion = process.env.META_GRAPH_API_VERSION;
  const redirectUri = process.env.META_REDIRECT_URI ?? 'http://localhost:8787/api/oauth/meta/callback';

  if (!appId || !appSecret || !graphVersion) {
    throw new Error('Configure META_APP_ID, META_APP_SECRET e META_GRAPH_API_VERSION no arquivo .env.');
  }
  if (!/^v\d+\.\d+$/.test(graphVersion)) {
    throw new Error('META_GRAPH_API_VERSION deve usar o formato vNN.N.');
  }

  const redirect = new URL(redirectUri);
  if (redirect.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(redirect.hostname) || redirect.pathname !== '/api/oauth/meta/callback') {
    throw new Error('META_REDIRECT_URI deve ser um callback HTTP local em /api/oauth/meta/callback.');
  }

  return { appId, appSecret, redirectUri: redirect.href, graphVersion };
}

export function createMetaAuthorizationUrl(state: string): string {
  const config = getMetaOAuthConfig();
  const url = new URL(`https://www.facebook.com/${config.graphVersion}/dialog/oauth`);
  url.searchParams.set('client_id', config.appId);
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', requestedScopes.join(','));
  url.searchParams.set('state', state);
  return url.href;
}

export async function exchangeMetaCode(code: string): Promise<MetaPageAuthorization[]> {
  const config = getMetaOAuthConfig();
  const shortLivedToken = await requestMetaToken(new URLSearchParams({
    client_id: config.appId,
    client_secret: config.appSecret,
    redirect_uri: config.redirectUri,
    code,
  }), config.graphVersion);

  const longLivedToken = await requestMetaToken(new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: config.appId,
    client_secret: config.appSecret,
    fb_exchange_token: shortLivedToken,
  }), config.graphVersion);

  const pagesUrl = new URL(`https://graph.facebook.com/${config.graphVersion}/me/accounts`);
  pagesUrl.searchParams.set('fields', 'id,name,access_token,instagram_business_account{id,username}');
  pagesUrl.searchParams.set('access_token', longLivedToken);

  const response = await fetch(pagesUrl);
  const body = await response.json() as MetaPagesResponse;
  if (!response.ok || body.error) {
    throw new Error(body.error?.message ?? 'A Meta não retornou as Páginas autorizadas.');
  }

  const pages = (body.data ?? []).filter((page) => page.id && page.name && page.access_token);
  if (pages.length === 0) {
    throw new Error('Nenhuma Página foi autorizada. Verifique o acesso às Páginas e tente novamente.');
  }

  const grantedScopes = await getGrantedPermissions(longLivedToken, config.graphVersion);
  const granted = new Set(grantedScopes);

  return pages.map((page) => ({
    pageId: page.id!,
    pageName: page.name!,
    pageAccessToken: page.access_token!,
    instagramBusinessId: page.instagram_business_account?.id,
    instagramUsername: page.instagram_business_account?.username,
    grantedScopes,
    connectedAt: new Date().toISOString(),
    canPublishToFacebook: granted.has('pages_manage_posts'),
    canPublishToInstagram: granted.has('instagram_content_publish') && Boolean(page.instagram_business_account?.id),
  }));
}

async function requestMetaToken(params: URLSearchParams, graphVersion: string): Promise<string> {
  const url = new URL(`https://graph.facebook.com/${graphVersion}/oauth/access_token`);
  url.search = params.toString();
  const response = await fetch(url);
  const body = await response.json() as OAuthTokenResponse;
  if (!response.ok || body.error || !body.access_token) {
    throw new Error(body.error?.message ?? 'A Meta não aceitou a troca do código OAuth.');
  }
  return body.access_token;
}

async function getGrantedPermissions(accessToken: string, graphVersion: string): Promise<string[]> {
  const url = new URL(`https://graph.facebook.com/${graphVersion}/me/permissions`);
  url.searchParams.set('access_token', accessToken);
  const response = await fetch(url);
  const body = await response.json() as { data?: Array<{ permission?: string; status?: string }>; error?: { message?: string } };
  if (!response.ok || body.error) {
    throw new Error(body.error?.message ?? 'Não foi possível verificar as permissões concedidas à Meta.');
  }
  return (body.data ?? [])
    .filter((permission) => permission.permission && permission.status === 'granted')
    .map((permission) => permission.permission!);
}
