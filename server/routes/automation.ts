import type { Application, Request, Response } from 'express';
import { CampaignOrchestrator } from '../agents/pipeline/orchestrator.js';
import { getCampaigns, getSettings } from '../store.js';
import type { CopyTone } from '../types.js';
import { asString, validTone } from './utils.js';

export function setupAutomationRoutes(app: Application): void {
  app.get('/api/automation/status', async (_request, response) => {
    const settings = await getSettings();
    const campaigns = await getCampaigns();
    const today = new Date().toISOString().slice(0, 10);
    response.json({
      enabled: settings.automationEnabled,
      killSwitch: settings.automationKillSwitch,
      telegramEnabled: settings.telegramAutomationEnabled,
      metaEnabled: settings.metaAutomationEnabled,
      dailyLimit: settings.automationDailyLimit,
      publishedToday: campaigns.reduce((total, item) => {
        if (!item.publishedAt?.startsWith(today)) return total;
        return total + Object.keys(item.publishedChannelIds ?? {}).length;
      }, 0),
    });
  });

  app.post('/api/automation/dry-run', async (request: Request, response: Response) => {
    const url = asString(request.body?.url);
    const productName = asString(request.body?.productName);
    const tone = request.body?.tone;
    const category: unknown = request.body?.category;
    const channelsValue: unknown[] = Array.isArray(request.body?.channels) ? request.body.channels : ['telegram'];

    if (
      !url || url.length > 2048 || !productName.trim() || productName.length > 120
      || !validTone(tone)
      || (category !== 'shopee_offer' && category !== 'brand_offer' && category !== 'product_offer')
      || channelsValue.length !== 1 || !channelsValue.every((channel) => channel === 'telegram')
    ) {
      response.status(400).json({ error: 'Dados incompletos para executar o dry-run.' });
      return;
    }

    const settings = await getSettings();
    try {
      const campaign = await new CampaignOrchestrator().run({
        url,
        productName: productName.trim(),
        tone: tone as CopyTone,
        category: category as 'shopee_offer' | 'brand_offer' | 'product_offer',
        channels: ['telegram'],
        dryRun: true,
        approved: false,
      }, { settings, dryRun: true, signal: AbortSignal.timeout(30_000), logger: { info: console.info, warn: console.warn, error: console.error } });
      response.json({ ok: true, campaign });
    } catch (error) {
      response.status(422).json({ error: error instanceof Error ? error.message : 'Falha no dry-run.' });
    }
  });
}
