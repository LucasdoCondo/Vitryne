import type { Application, Request, Response } from 'express';
import { CampaignOrchestrator } from '../agents/pipeline/orchestrator.js';
import { CampaignPublicationError, publishCampaign } from '../campaign-publisher.js';
import { getCampaigns, getSettings, saveCampaign } from '../store.js';
import type { OfferCategory, PublicationChannel } from '../types.js';
import { asString, validTone } from './utils.js';

function isOfferCategory(value: unknown): value is OfferCategory {
  return value === 'shopee_offer' || value === 'brand_offer' || value === 'product_offer';
}

function isSupportedChannel(value: unknown): value is PublicationChannel {
  return value === 'telegram';
}

export function setupCampaignRoutes(app: Application): void {
  app.get('/api/campaigns', async (_request, response) => {
    response.json(await getCampaigns());
  });

  app.post('/api/campaigns', async (request: Request, response: Response) => {
    const url = asString(request.body?.url);
    const productName = asString(request.body?.productName);
    const tone = request.body?.tone;
    const category: unknown = request.body?.category;
    const dryRunValue: unknown = request.body?.dryRun;
    const dryRun = dryRunValue === undefined ? true : dryRunValue;
    const channelsValue: unknown[] = Array.isArray(request.body?.channels) ? request.body.channels : ['telegram'];

    if (
      !url || url.length > 2048 || !productName.trim() || productName.length > 120
      || !validTone(tone) || !isOfferCategory(category)
      || typeof dryRun !== 'boolean'
      || channelsValue.length !== 1 || !channelsValue.every(isSupportedChannel)
    ) {
      response.status(400).json({ error: 'Dados incompletos ou inválidos para criar a campanha.' });
      return;
    }

    const settings = await getSettings();
    try {
      const campaign = await new CampaignOrchestrator().run({
        url,
        productName: productName.trim(),
        tone,
        category,
        channels: channelsValue.filter(isSupportedChannel),
        dryRun,
        approved: false,
      }, {
        settings,
        dryRun,
        signal: AbortSignal.timeout(30_000),
        logger: { info: console.info, warn: console.warn, error: console.error },
      });
      response.status(201).json(campaign);
    } catch (error) {
      response.status(422).json({ error: error instanceof Error ? error.message : 'Não foi possível criar a campanha.' });
    }
  });

  app.post('/api/campaigns/:id/approve', async (request: Request, response: Response) => {
    const id = request.params.id;
    if (typeof id !== 'string') {
      response.status(400).json({ error: 'Identificador de campanha inválido.' });
      return;
    }
    const campaign = (await getCampaigns()).find((item) => item.id === id);
    if (!campaign) {
      response.status(404).json({ error: 'Campanha não encontrada.' });
      return;
    }
    if (
      campaign.dryRun || !campaign.complianceApproved
      || !['ready', 'queued', 'failed'].includes(campaign.status)
    ) {
      response.status(400).json({ error: 'Esta campanha não está pronta para aprovação.' });
      return;
    }
    campaign.approvedAt = new Date().toISOString();
    campaign.updatedAt = campaign.approvedAt;
    if (campaign.status === 'ready') campaign.status = 'queued';
    await saveCampaign(campaign);
    response.json(campaign);
  });

  app.post('/api/campaigns/:id/publish', async (request: Request, response: Response) => {
    const id = request.params.id;
    if (typeof id !== 'string') {
      response.status(400).json({ error: 'Identificador de campanha inválido.' });
      return;
    }
    const settings = await getSettings();
    try {
      response.json(await publishCampaign(id, settings, { automatic: false }));
    } catch (error) {
      if (error instanceof CampaignPublicationError) {
        response.status(error.statusCode).json({ error: error.message });
        return;
      }
      throw error;
    }
  });
}
