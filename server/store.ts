import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encryptSecret } from './secret-crypto.js';
import type { Campaign, HistoryItem, MetaPageAuthorization, MetaPageConnection, PublicMetaPageConnection, PublicSettings, Settings } from './types.js';

const rootDirectory = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const dataDirectory = join(rootDirectory, '.vitryne');
const settingsFile = join(dataDirectory, 'settings.json');
const historyFile = join(dataDirectory, 'history.json');
const metaConnectionsFile = join(dataDirectory, 'meta-connections.json');
const campaignsFile = join(dataDirectory, 'campaigns.json');

const emptySettings: Settings = {
  shopeeTrackingId: process.env.SHOPEE_TRACKING_ID ?? '',
  mercadoLivreTag: process.env.MERCADO_LIVRE_TAG ?? '',
  amazonTag: process.env.AMAZON_TAG ?? '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
  openAiApiKey: process.env.OPENAI_API_KEY ?? '',
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  groqApiKey: process.env.GROQ_API_KEY ?? '',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID ?? '',
  automationEnabled: process.env.AUTOMATION_ENABLED === 'true',
  telegramAutomationEnabled: false,
  metaAutomationEnabled: false,
  automationDailyLimit: 10,
  automationKillSwitch: false,
};

const settingStringKeys: Array<Exclude<keyof Settings, 'automationEnabled' | 'telegramAutomationEnabled' | 'metaAutomationEnabled' | 'automationDailyLimit' | 'automationKillSwitch'>> = [
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

const writeQueue: Map<string, Promise<void>> = new Map();

async function withFileLock<T>(filePath: string, task: () => Promise<T>): Promise<T> {
  const previous = writeQueue.get(filePath) ?? Promise.resolve();
  let release!: () => void;
  const lock = new Promise<void>((resolve) => {
    release = resolve;
  });
  writeQueue.set(filePath, lock);
  await previous;
  try {
    return await task();
  } finally {
    if (writeQueue.get(filePath) === lock) writeQueue.delete(filePath);
    release();
  }
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(filePath, 'utf8')) as T;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return fallback;
    throw error;
  }
}

async function saveJson(filePath: string, value: unknown): Promise<void> {
  await mkdir(dataDirectory, { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  await writeFile(tmpPath, JSON.stringify(value, null, 2), { encoding: 'utf8', mode: 0o600 });
  await rename(tmpPath, filePath);
}

export async function getSettings(): Promise<Settings> {
  const parsed = await readJson<unknown>(settingsFile, {});
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('O arquivo local de configurações tem formato inválido.');
  }
  const saved = parsed as Record<string, unknown>;
  const settings = { ...emptySettings };
  for (const key of settingStringKeys) {
    if (typeof saved[key] === 'string') Object.assign(settings, { [key]: saved[key] });
  }
  if (typeof saved.automationEnabled === 'boolean') settings.automationEnabled = saved.automationEnabled;
  if (typeof saved.telegramAutomationEnabled === 'boolean') settings.telegramAutomationEnabled = saved.telegramAutomationEnabled;
  if (typeof saved.metaAutomationEnabled === 'boolean') settings.metaAutomationEnabled = saved.metaAutomationEnabled;
  if (typeof saved.automationDailyLimit === 'number' && saved.automationDailyLimit >= 0) settings.automationDailyLimit = saved.automationDailyLimit;
  if (typeof saved.automationKillSwitch === 'boolean') settings.automationKillSwitch = saved.automationKillSwitch;
  return settings;
}

export function toPublicSettings(settings: Settings): PublicSettings {
  return {
    shopeeTrackingId: settings.shopeeTrackingId,
    mercadoLivreTag: settings.mercadoLivreTag,
    amazonTag: settings.amazonTag,
    hasAnthropicApiKey: Boolean(settings.anthropicApiKey),
    hasOpenAiApiKey: Boolean(settings.openAiApiKey),
    hasGeminiApiKey: Boolean(settings.geminiApiKey),
    hasGroqApiKey: Boolean(settings.groqApiKey),
    hasTelegramBotToken: Boolean(settings.telegramBotToken),
    telegramChatId: settings.telegramChatId,
    automationEnabled: settings.automationEnabled,
    telegramAutomationEnabled: settings.telegramAutomationEnabled ?? false,
    metaAutomationEnabled: settings.metaAutomationEnabled ?? false,
    automationDailyLimit: settings.automationDailyLimit ?? 10,
    automationKillSwitch: settings.automationKillSwitch ?? false,
  };
}

export async function updateSettings(input: Partial<Settings>): Promise<PublicSettings> {
  const current = await getSettings();
  const next: Settings = { ...current };

  for (const key of settingStringKeys) {
    if (key in input) {
      // String vazia limpa o valor salvo; ausente mantém o atual.
      next[key] = (input as Record<string, string>)[key];
    }
  }

  if ('automationEnabled' in input) next.automationEnabled = Boolean(input.automationEnabled);
  if ('telegramAutomationEnabled' in input) next.telegramAutomationEnabled = Boolean(input.telegramAutomationEnabled);
  if ('metaAutomationEnabled' in input) next.metaAutomationEnabled = Boolean(input.metaAutomationEnabled);
  if ('automationKillSwitch' in input) next.automationKillSwitch = Boolean(input.automationKillSwitch);
  if ('automationDailyLimit' in input && Number.isInteger(input.automationDailyLimit)) {
    next.automationDailyLimit = Math.max(0, Math.min(100, input.automationDailyLimit!));
  }

  await withFileLock(settingsFile, async () => {
    await saveJson(settingsFile, next);
  });
  return toPublicSettings(next);
}

export async function getHistory(): Promise<HistoryItem[]> {
  return readJson<HistoryItem[]>(historyFile, []);
}

export async function saveHistoryItem(item: HistoryItem): Promise<void> {
  const current = await getHistory();
  const position = current.findIndex((record) => record.id === item.id);
  if (position >= 0) {
    current[position] = item;
  } else {
    current.unshift(item);
  }
  await saveJson(historyFile, current.slice(0, 150));
}

export async function getCampaigns(): Promise<Campaign[]> {
  const parsed = await readJson<unknown>(campaignsFile, []);
  if (!Array.isArray(parsed)) {
    throw new Error('O arquivo local de campanhas tem formato inválido.');
  }
  const valid = parsed.every((value) => {
    if (value === null || typeof value !== 'object') return false;
    const campaign = value as Record<string, unknown>;
    const publishedIds = campaign.publishedChannelIds;
    const publicationAttempts = campaign.publicationAttempts;
    const validPublishedIds = publishedIds === undefined
      || (publishedIds !== null && typeof publishedIds === 'object' && !Array.isArray(publishedIds)
        && Object.entries(publishedIds).every(([channel, postId]) =>
          (channel === 'telegram' || channel === 'facebook' || channel === 'instagram')
          && typeof postId === 'string'
          && postId.length > 0));
    const validPublicationAttempts = publicationAttempts === undefined
      || (publicationAttempts !== null && typeof publicationAttempts === 'object' && !Array.isArray(publicationAttempts)
        && Object.entries(publicationAttempts).every(([channel, attemptedAt]) =>
          (channel === 'telegram' || channel === 'facebook' || channel === 'instagram')
          && typeof attemptedAt === 'string'));
    return typeof campaign.id === 'string'
      && ['queued', 'generating', 'ready', 'publishing', 'published', 'failed'].includes(String(campaign.status))
      && typeof campaign.dryRun === 'boolean'
      && Array.isArray(campaign.channels)
      && campaign.channels.every((channel) => channel === 'telegram' || channel === 'facebook' || channel === 'instagram')
      && validPublishedIds
      && validPublicationAttempts
      && (campaign.publishedAt === undefined || typeof campaign.publishedAt === 'string');
  });
  if (!valid) {
    throw new Error('O arquivo local de campanhas contém registros inválidos.');
  }
  return parsed as Campaign[];
}

export async function saveCampaign(campaign: Campaign): Promise<void> {
  await withFileLock(campaignsFile, async () => {
    const current = await getCampaigns();
    const position = current.findIndex((item) => item.id === campaign.id);
    if (position >= 0) current[position] = campaign;
    else current.unshift(campaign);
    await saveJson(campaignsFile, current.slice(0, 300));
  });
}

export type CampaignPublishClaim =
  | { ok: true; campaign: Campaign }
  | { ok: false; reason: 'not-found' | 'dry-run' | 'approval-required' | 'non-compliant' | 'unsupported-channel' | 'publishing' | 'published' | 'attempted' | 'daily-limit' };

export async function claimCampaignForPublishing(
  id: string,
  options: { automatic: boolean; dailyLimit?: number },
): Promise<CampaignPublishClaim> {
  return withFileLock(campaignsFile, async () => {
    const campaigns = await getCampaigns();
    const index = campaigns.findIndex((item) => item.id === id);
    if (index < 0) return { ok: false, reason: 'not-found' };

    const campaign = campaigns[index];
    if (campaign.dryRun) return { ok: false, reason: 'dry-run' };
    if (!campaign.complianceApproved) return { ok: false, reason: 'non-compliant' };
    if (!options.automatic && !campaign.approvedAt) return { ok: false, reason: 'approval-required' };
    if (campaign.channels.length === 0 || campaign.channels.some((channel) => channel !== 'telegram')) {
      return { ok: false, reason: 'unsupported-channel' };
    }
    if (campaign.status === 'publishing') return { ok: false, reason: 'publishing' };
    if (campaign.status === 'published') return { ok: false, reason: 'published' };
    if (campaign.channels.some((channel) =>
      campaign.publicationAttempts?.[channel] && !campaign.publishedChannelIds?.[channel])) {
      return { ok: false, reason: 'attempted' };
    }

    const publishedToday = new Date().toISOString().slice(0, 10);
    if (options.dailyLimit !== undefined) {
      const alreadyPublished = campaigns.reduce((total, item) => {
        const publishedCount = item.publishedAt?.startsWith(publishedToday)
          ? Object.keys(item.publishedChannelIds ?? {}).length
          : 0;
        const reservedCount = item.status === 'publishing'
          ? item.channels.filter((channel) => !item.publishedChannelIds?.[channel]).length
          : 0;
        return total + publishedCount + reservedCount;
      }, 0);
      const remainingChannels = campaign.channels.filter((channel) => !campaign.publishedChannelIds?.[channel]).length;
      if (alreadyPublished + remainingChannels > options.dailyLimit) {
        return { ok: false, reason: 'daily-limit' };
      }
    }

    const now = new Date().toISOString();
    const claimed: Campaign = {
      ...campaign,
      approvedAt: campaign.approvedAt ?? (options.automatic ? now : undefined),
      status: 'publishing',
      updatedAt: now,
      publishedChannelIds: campaign.publishedChannelIds ?? {},
      publicationAttempts: {
        ...campaign.publicationAttempts,
        ...Object.fromEntries(campaign.channels
          .filter((channel) => !campaign.publishedChannelIds?.[channel])
          .map((channel) => [channel, now])),
      },
    };
    campaigns[index] = claimed;
    await saveJson(campaignsFile, campaigns);
    return { ok: true, campaign: claimed };
  });
}

export async function updateCampaign(id: string, update: (campaign: Campaign) => Campaign): Promise<Campaign | null> {
  return withFileLock(campaignsFile, async () => {
    const campaigns = await getCampaigns();
    const index = campaigns.findIndex((item) => item.id === id);
    if (index < 0) return null;

    const updated = update(campaigns[index]);
    campaigns[index] = updated;
    await saveJson(campaignsFile, campaigns);
    return updated;
  });
}

export async function getMetaConnections(): Promise<MetaPageConnection[]> {
  try {
    const raw = await readFile(metaConnectionsFile, 'utf8');
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error('O arquivo de conexões Meta tem formato inválido.');
    }
    return parsed as MetaPageConnection[];
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export async function saveMetaConnections(connections: Array<MetaPageAuthorization | MetaPageConnection>): Promise<void> {
  const encrypted: MetaPageConnection[] = connections.map((connection) => {
    if ('pageAccessToken' in connection) {
      const { pageAccessToken, ...metadata } = connection;
      return { ...metadata, encryptedPageAccessToken: encryptSecret(pageAccessToken) };
    }
    return connection;
  });
  await saveJson(metaConnectionsFile, encrypted);
}

export async function getPublicMetaConnections(): Promise<PublicMetaPageConnection[]> {
  const connections = await getMetaConnections();
  return connections.map(({ pageId, pageName, instagramUsername, connectedAt, canPublishToFacebook, canPublishToInstagram }) => ({
    pageId,
    pageName,
    instagramUsername,
    connectedAt,
    canPublishToFacebook,
    canPublishToInstagram,
  }));
}
