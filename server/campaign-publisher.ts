import { PublisherAgent } from './agents/publisher-agent.js';
import { claimCampaignForPublishing, getCampaigns, updateCampaign } from './store.js';
import type { Campaign, Settings } from './types.js';

export class CampaignPublicationError extends Error {
  constructor(
    message: string,
    readonly statusCode: 400 | 404 | 409 | 422,
    readonly campaign?: Campaign,
  ) {
    super(message);
    this.name = 'CampaignPublicationError';
  }
}

function claimErrorMessage(reason: string): { message: string; status: 400 | 404 | 409 } {
  switch (reason) {
    case 'not-found': return { message: 'Campanha não encontrada.', status: 404 };
    case 'dry-run': return { message: 'Campanha criada como dry-run não pode ser publicada.', status: 400 };
    case 'approval-required': return { message: 'A aprovação humana é obrigatória antes da publicação.', status: 400 };
    case 'non-compliant': return { message: 'A campanha não passou na validação de conformidade.', status: 400 };
    case 'unsupported-channel': return { message: 'Somente campanhas do Telegram podem ser publicadas neste momento.', status: 400 };
    case 'publishing': return { message: 'A campanha já está em processo de publicação.', status: 409 };
    case 'published': return { message: 'Esta campanha já foi publicada.', status: 409 };
    case 'attempted': return { message: 'Já houve uma tentativa de envio sem confirmação. Confira o canal do Telegram antes de criar outra campanha.', status: 409 };
    case 'daily-limit': return { message: 'O limite diário de publicações automáticas foi atingido.', status: 409 };
    default: return { message: 'Não foi possível iniciar a publicação.', status: 409 };
  }
}

export async function publishCampaign(
  id: string,
  settings: Settings,
  options: { automatic: boolean; dailyLimit?: number },
): Promise<Campaign> {
  const existing = (await getCampaigns()).find((item) => item.id === id);
  if (!existing) {
    throw new CampaignPublicationError('Campanha não encontrada.', 404);
  }
  if (existing.dryRun) {
    throw new CampaignPublicationError('Campanha criada como dry-run não pode ser publicada.', 400);
  }
  if (!existing.complianceApproved) {
    throw new CampaignPublicationError('A campanha não passou na validação de conformidade.', 400);
  }
  if (!options.automatic && !existing.approvedAt) {
    throw new CampaignPublicationError('A aprovação humana é obrigatória antes da publicação.', 400);
  }
  if (existing.channels.length === 0 || existing.channels.some((channel) => channel !== 'telegram')) {
    throw new CampaignPublicationError('Somente campanhas do Telegram podem ser publicadas neste momento.', 400);
  }
  if (!settings.telegramBotToken || !settings.telegramChatId) {
    throw new CampaignPublicationError('Configure o bot e o chat do Telegram antes de publicar.', 400);
  }
  if (!existing.copy?.trim()) {
    throw new CampaignPublicationError('A campanha não possui uma copy válida para publicar.', 400);
  }

  const claim = await claimCampaignForPublishing(id, options);
  if (!claim.ok) {
    const failure = claimErrorMessage(claim.reason);
    throw new CampaignPublicationError(failure.message, failure.status);
  }

  let campaign = claim.campaign;
  for (const channel of campaign.channels) {
    if (campaign.publishedChannelIds?.[channel]) continue;

    const result = await new PublisherAgent().run(
      { campaign, channel },
      {
        settings,
        dryRun: false,
        signal: AbortSignal.timeout(30_000),
        logger: { info: console.info, warn: console.warn, error: console.error },
      },
    );

    const postId = result.output?.postId;
    if (!result.ok || !postId) {
      const failedCampaign = await updateCampaign(id, (current) => ({
        ...current,
        status: 'failed',
        error: `${result.error ?? 'Falha ao publicar a campanha.'} Confira o Telegram; esta campanha não poderá ser reenviada.`,
        updatedAt: new Date().toISOString(),
      }));
      throw new CampaignPublicationError(
        result.error ?? 'Falha ao publicar a campanha.',
        422,
        failedCampaign ?? undefined,
      );
    }

    const publishedAt = new Date().toISOString();
    const updated = await updateCampaign(id, (current) => ({
      ...current,
      publishedAt: current.publishedAt ?? publishedAt,
      publishedChannelIds: {
        ...current.publishedChannelIds,
        [channel]: postId,
      },
      updatedAt: publishedAt,
    }));
    if (!updated) {
      throw new CampaignPublicationError('A campanha não foi encontrada após a publicação.', 404);
    }
    campaign = updated;
  }

  const completed = await updateCampaign(id, (current) => ({
    ...current,
    status: 'published',
    publishedAt: current.publishedAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    error: undefined,
  }));
  if (!completed) {
    throw new CampaignPublicationError('A campanha não foi encontrada após a publicação.', 404);
  }
  return completed;
}
