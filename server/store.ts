import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { HistoryItem, PublicSettings, Settings } from './types.js';

const rootDirectory = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const dataDirectory = join(rootDirectory, '.vitryne');
const settingsFile = join(dataDirectory, 'settings.json');
const historyFile = join(dataDirectory, 'history.json');

const emptySettings: Settings = {
  shopeeTrackingId: process.env.SHOPEE_TRACKING_ID ?? '',
  mercadoLivreTag: process.env.MERCADO_LIVRE_TAG ?? '',
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID ?? '',
};

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(filePath, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

async function saveJson(filePath: string, value: unknown): Promise<void> {
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(filePath, JSON.stringify(value, null, 2), { encoding: 'utf8', mode: 0o600 });
}

export async function getSettings(): Promise<Settings> {
  const saved = await readJson<Partial<Settings>>(settingsFile, {});
  return { ...emptySettings, ...saved };
}

export function toPublicSettings(settings: Settings): PublicSettings {
  return {
    shopeeTrackingId: settings.shopeeTrackingId,
    mercadoLivreTag: settings.mercadoLivreTag,
    hasGeminiApiKey: Boolean(settings.geminiApiKey),
    hasTelegramBotToken: Boolean(settings.telegramBotToken),
    telegramChatId: settings.telegramChatId,
  };
}

export async function updateSettings(input: Partial<Settings>): Promise<PublicSettings> {
  const current = await getSettings();
  const next: Settings = { ...current };

  for (const [key, value] of Object.entries(input) as Array<[keyof Settings, string | undefined]>) {
    if (typeof value === 'string' && value.trim().length > 0) {
      next[key] = value.trim();
    }
  }

  await saveJson(settingsFile, next);
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
