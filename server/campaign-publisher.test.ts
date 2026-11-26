import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { Campaign, Settings } from './types.js';

const mocks = vi.hoisted(() => ({
  claim: vi.fn(),
  getCampaigns: vi.fn(),
  update: vi.fn(),
}));

vi.mock('./store.js', () => ({
  claimCampaignForPublishing: mocks.claim,
  getCampaigns: mocks.getCampaigns,
  updateCampaign: mocks.update,
}));

import { publishCampaign } from './campaign-publisher.js';

const campaign: Campaign = {
  id: 'campaign-1',
  category: 'product_offer',
  productName: 'Produto teste',
  marketplace: 'shopee',
  affiliateUrl: 'https://shopee.com.br/product',
  copy: 'Conheça este produto. Publicidade: link de afiliado.',
  status: 'publishing',
  createdAt: '2026-11-26T12:00:00.000Z',
  updatedAt: '2026-11-26T12:00:00.000Z',
  approvedAt: '2026-11-26T12:00:00.000Z',
  channels: ['telegram'],
  publishedChannelIds: {},
  complianceApproved: true,
  dryRun: false,
};

const settings: Settings = {
  shopeeTrackingId: '',
  mercadoLivreTag: '',
  amazonTag: '',
  anthropicApiKey: '',
  openAiApiKey: '',
  geminiApiKey: '',
  groqApiKey: '',
  telegramBotToken: 'test-token',
  telegramChatId: 'test-chat',
  automationEnabled: false,
};

describe('publishCampaign', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCampaigns.mockResolvedValue([campaign]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('persists the Telegram message ID and marks the campaign as published', async () => {
    const published: Campaign = {
      ...campaign,
      publishedAt: '2026-11-26T12:01:00.000Z',
      publishedChannelIds: { telegram: '987' },
    };
    const complete: Campaign = { ...published, status: 'published' };
    mocks.claim.mockResolvedValue({ ok: true, campaign });
    mocks.update.mockResolvedValueOnce(published).mockResolvedValueOnce(complete);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      ok: true,
      result: { message_id: 987 },
    }), { status: 200, headers: { 'content-type': 'application/json' } })));

    await expect(publishCampaign(campaign.id, settings, { automatic: false })).resolves.toEqual(complete);
    expect(mocks.claim).toHaveBeenCalledWith(campaign.id, { automatic: false });
    expect(mocks.update).toHaveBeenCalledTimes(2);
  });

  test('does not send again when the campaign is already published', async () => {
    mocks.claim.mockResolvedValue({ ok: false, reason: 'published' });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(publishCampaign(campaign.id, settings, { automatic: false }))
      .rejects.toMatchObject({ statusCode: 409, message: 'Esta campanha já foi publicada.' });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  test('does not repeat a channel with an unconfirmed previous attempt', async () => {
    mocks.claim.mockResolvedValue({ ok: false, reason: 'attempted' });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(publishCampaign(campaign.id, settings, { automatic: false }))
      .rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining('Confira o canal do Telegram') });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('reports a dry-run campaign without attempting publication', async () => {
    mocks.claim.mockResolvedValue({ ok: false, reason: 'dry-run' });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(publishCampaign(campaign.id, settings, { automatic: false }))
      .rejects.toMatchObject({ statusCode: 400, message: 'Campanha criada como dry-run não pode ser publicada.' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
