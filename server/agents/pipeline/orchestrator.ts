import { randomUUID } from 'node:crypto';
import { CopyAgent } from '../copy-agent.js';
import { ComplianceAgent } from '../compliance-agent.js';
import { LinkAgent } from '../link-agent.js';
import { ProductInfoAgent } from '../product-info-agent.js';
import { ImageAgent } from '../image-agent.js';
import { VideoAgent } from '../video-agent.js';
import { SchedulerAgent } from '../scheduler-agent.js';
import { AnalyticsAgent } from '../analytics-agent.js';
import { getCampaigns, saveCampaign } from '../../store.js';
import { CampaignPublicationError, publishCampaign } from '../../campaign-publisher.js';
import type { AgentContext } from '../agent-base.js';
import type { Campaign, CopyTone, OfferCategory, PublicationChannel } from '../../types.js';

export interface PipelineRequest {
  url: string;
  productName: string;
  tone: CopyTone;
  category: OfferCategory;
  channels: PublicationChannel[];
  dryRun: boolean;
  approved?: boolean;
}

export class CampaignOrchestrator {
  async run(request: PipelineRequest, ctx: AgentContext): Promise<Campaign> {
    const pipelineContext: AgentContext = { ...ctx, dryRun: request.dryRun };

    const link = await new LinkAgent().run({ url: request.url }, pipelineContext);
    if (!link.ok || !link.output) throw new Error(link.error ?? 'Não foi possível processar o link.');

    const product = await new ProductInfoAgent().run({ productName: request.productName, marketplace: link.output.marketplace }, pipelineContext);
    if (!product.ok || !product.output) throw new Error(product.error ?? 'Não foi possível identificar o produto.');

    const copy = await new CopyAgent().run({
      productName: product.output.productName,
      affiliateUrl: link.output.affiliateUrl,
      marketplace: product.output.marketplace,
      tone: request.tone,
      apiKey: ctx.settings.geminiApiKey,
      variations: 1,
    }, pipelineContext);
    if (!copy.ok || !copy.output?.variations[0]) throw new Error(copy.error ?? 'Não foi possível gerar a copy.');

    const chosenCopy = copy.output.variations[0].copy;
    const disclosure = /publicidade|parceria|afiliado/i.test(chosenCopy) ? chosenCopy : `${chosenCopy}\n\nPublicidade: este link pode gerar comissão por parceria/afiliado.`;

    const compliance = await new ComplianceAgent().run({
      copy: disclosure,
      productName: product.output.productName,
      marketplace: product.output.marketplace,
      affiliateUrl: link.output.affiliateUrl,
      requireAffiliateDisclosure: true,
    }, pipelineContext);
    if (!compliance.ok || !compliance.output) throw new Error(compliance.error ?? 'Falha ao validar conformidade.');

    const image = await new ImageAgent().run({ productName: product.output.productName }, pipelineContext);
    const video = image.output?.promotionalImagePath
      ? await new VideoAgent().run({ promotionalImagePath: image.output.promotionalImagePath }, pipelineContext)
      : { ok: true, output: { videoPath: '' } };

    const now = new Date().toISOString();
    let campaign: Campaign = {
      id: randomUUID(),
      category: request.category,
      productName: product.output.productName,
      marketplace: product.output.marketplace,
      affiliateUrl: link.output.affiliateUrl,
      promotionalImagePath: image.output?.promotionalImagePath || undefined,
      videoPath: video.output?.videoPath || undefined,
      copy: disclosure,
      status: compliance.output.approved ? 'ready' : 'failed',
      createdAt: now,
      updatedAt: now,
      approvedAt: request.approved ? now : undefined,
      channels: request.channels,
      publishedChannelIds: {},
      complianceApproved: compliance.output.approved,
      complianceReasons: compliance.output.reasons,
      dryRun: request.dryRun,
      error: compliance.output.approved ? undefined : compliance.output.reasons.join(' '),
    };

    const today = now.slice(0, 10);
    const campaigns = await getCampaigns();
    const todayCount = campaigns.reduce((total, item) => {
      if (!item.publishedAt?.startsWith(today)) return total;
      return total + Object.keys(item.publishedChannelIds ?? {}).length;
    }, 0);
    const automaticAllowed = !(ctx.settings.automationKillSwitch ?? false)
      && !request.dryRun
      && ctx.settings.automationEnabled
      && todayCount + request.channels.length <= (ctx.settings.automationDailyLimit ?? 10)
      && request.channels.length > 0
      && request.channels.every((channel) => channel === 'telegram' && ctx.settings.telegramAutomationEnabled)
      && Boolean(ctx.settings.telegramBotToken && ctx.settings.telegramChatId);

    const scheduler = await new SchedulerAgent().run({ campaign, automatic: automaticAllowed }, pipelineContext);
    if (!scheduler.ok) throw new Error(scheduler.error ?? 'Falha ao agendar a campanha.');

    if (scheduler.output?.scheduledAt) {
      campaign.scheduledAt = scheduler.output.scheduledAt;
      campaign.status = 'queued';
      campaign.approvedAt = now;
    }

    await saveCampaign(campaign);
    if (scheduler.output?.scheduled) {
      try {
        campaign = await publishCampaign(campaign.id, ctx.settings, {
          automatic: true,
          dailyLimit: ctx.settings.automationDailyLimit ?? 10,
        });
      } catch (error) {
        if (!(error instanceof CampaignPublicationError) || !error.campaign) throw error;
        campaign = error.campaign;
      }
    }
    await new AnalyticsAgent().run({ campaign }, pipelineContext);
    return campaign;
  }
}
