import { sendTelegramMessage, TelegramApiError } from '../telegram-service.js';
import type { Campaign, PublicationChannel } from '../types.js';
import type { Agent, AgentContext, AgentResult } from './agent-base.js';

export interface PublisherInput {
  campaign: Campaign;
  channel: PublicationChannel;
}

export interface PublisherOutput {
  channel: PublicationChannel;
  postId: string;
}

export class PublisherAgent implements Agent<PublisherInput, PublisherOutput> {
  readonly name = 'PublisherAgent';

  async run(input: PublisherInput, ctx: AgentContext): Promise<AgentResult<PublisherOutput>> {
    const start = Date.now();
    if (ctx.dryRun) {
      return { ok: true, output: { channel: input.channel, postId: 'dry-run' }, stage: 'publisher', durationMs: Date.now() - start };
    }

    if (input.campaign.publishedChannelIds?.[input.channel]) {
      return { ok: true, output: { channel: input.channel, postId: input.campaign.publishedChannelIds[input.channel]! }, stage: 'publisher', durationMs: Date.now() - start };
    }

    if (input.channel !== 'telegram') {
      return { ok: false, error: 'Publicação no Instagram/Facebook ainda não está habilitada. Use somente a confirmação explícita da Meta.', stage: 'publisher', durationMs: Date.now() - start };
    }

    if (!ctx.settings.telegramBotToken || !ctx.settings.telegramChatId) {
      return { ok: false, error: 'Configure o bot e o chat do Telegram antes de publicar.', stage: 'publisher', durationMs: Date.now() - start };
    }
    if (!input.campaign.copy?.trim()) {
      return { ok: false, error: 'A campanha não possui uma copy válida para publicar.', stage: 'publisher', durationMs: Date.now() - start };
    }

    try {
      const result = await sendTelegramMessage({ botToken: ctx.settings.telegramBotToken, chatId: ctx.settings.telegramChatId, text: input.campaign.copy });
      return { ok: true, output: { channel: 'telegram', postId: result.messageId }, stage: 'publisher', durationMs: Date.now() - start };
    } catch (error) {
      const message = error instanceof TelegramApiError
        ? 'O Telegram recusou a publicação. Revise as configurações do bot e o conteúdo da campanha.'
        : 'Não foi possível publicar no Telegram.';
      return { ok: false, error: message, stage: 'publisher', durationMs: Date.now() - start };
    }
  }
}
