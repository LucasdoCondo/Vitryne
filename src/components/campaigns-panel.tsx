import { CheckCircle2, FlaskConical, Megaphone, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Campaign, CopyTone, ToastMessage } from '../types';
import { Button, Panel } from './ui';

interface CampaignsPanelProps {
  onToast: (title: string, type?: ToastMessage['type'], description?: string) => void;
}

export function CampaignsPanel({ onToast }: CampaignsPanelProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [url, setUrl] = useState('');
  const [productName, setProductName] = useState('');
  const [tone, setTone] = useState<CopyTone>('economia');
  const [dryRun, setDryRun] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = async () => setCampaigns(await api.campaigns());
  useEffect(() => { void refresh().catch(() => onToast('Não foi possível carregar campanhas', 'error')); }, []);

  const create = async () => {
    setBusy(true);
    try {
      const campaign = await api.createCampaign({ url, productName, tone, category: 'product_offer', channels: ['telegram'], dryRun });
      setCampaigns((current) => [campaign, ...current]);
      if (campaign.status === 'published') {
        onToast('Campanha publicada automaticamente', 'success', 'A automação do Telegram passou por todos os gates configurados.');
      } else if (campaign.status === 'failed') {
        onToast('Campanha criada, mas a publicação falhou', 'error', campaign.error);
      } else {
        onToast(dryRun ? 'Dry-run concluído' : 'Campanha criada', 'success', dryRun ? 'Nenhum canal foi publicado.' : 'Aguardando aprovação humana.');
      }
    } catch (error) {
      onToast('Falha ao criar campanha', 'error', error instanceof Error ? error.message : undefined);
    } finally { setBusy(false); }
  };

  const approve = async (id: string) => {
    try {
      const campaign = await api.approveCampaign(id);
      setCampaigns((current) => current.map((item) => item.id === id ? campaign : item));
      onToast('Campanha aprovada', 'success', 'Confirme a publicação para enviar ao Telegram.');
    } catch (error) { onToast('Falha na aprovação', 'error', error instanceof Error ? error.message : undefined); }
  };

  const publish = async (id: string) => {
    try {
      const campaign = await api.publishCampaign(id);
      setCampaigns((current) => current.map((item) => item.id === id ? campaign : item));
      onToast('Campanha publicada', 'success');
    } catch (error) { onToast('Falha na publicação', 'error', error instanceof Error ? error.message : undefined); }
  };

  return <div className="mx-auto max-w-5xl space-y-5"><div className="mb-7"><p className="mb-2 text-[11px] font-bold uppercase tracking-[.18em] text-violet">Fila local</p><h1 className="text-3xl font-bold tracking-tight text-white">Campanhas</h1><p className="mt-2 text-sm text-zinc-500">Crie, valide e aprove campanhas antes de publicar.</p></div>
    <Panel className="p-5 sm:p-7"><div className="grid gap-4 md:grid-cols-2"><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="URL do produto" className="rounded-xl border border-white/[.1] bg-[#090b10] px-3.5 py-3 text-sm text-white" /><input value={productName} onChange={(event) => setProductName(event.target.value)} placeholder="Nome do produto informado por você" className="rounded-xl border border-white/[.1] bg-[#090b10] px-3.5 py-3 text-sm text-white" /><select value={tone} onChange={(event) => setTone(event.target.value as CopyTone)} className="rounded-xl border border-white/[.1] bg-[#090b10] px-3.5 py-3 text-sm text-white"><option value="economia">Economia</option><option value="informativo">Informativo</option><option value="agressivo">Agressivo</option></select><label className="flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" checked={dryRun} onChange={(event) => setDryRun(event.target.checked)} />Executar somente dry-run</label></div><p className={`mt-3 text-xs ${dryRun ? 'text-zinc-500' : 'text-amber-200'}`}>{dryRun ? 'Dry-run está ativo: nenhuma publicação será feita.' : 'Atenção: com a automação Telegram habilitada e todos os gates liberados, esta campanha poderá ser publicada imediatamente.'}</p><Button onClick={create} loading={busy} className="mt-5"><FlaskConical className="h-4 w-4" />Criar campanha</Button></Panel>
    <div className="space-y-3">{campaigns.map((campaign) => <Panel key={campaign.id} className="p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><Megaphone className="h-4 w-4 text-violet" /><h2 className="font-semibold text-white">{campaign.productName}</h2></div><p className="mt-1 text-xs text-zinc-500">{campaign.status} · {campaign.marketplace} · {campaign.channels.join(', ')}</p>{campaign.error ? <p className="mt-2 text-xs text-rose-300">{campaign.error}</p> : null}{campaign.complianceReasons?.length ? <p className="mt-2 text-xs text-amber-200/70">{campaign.complianceReasons.join(' ')}</p> : null}</div><div className="flex gap-2">{campaign.status !== 'published' && campaign.dryRun && <span className="rounded-lg border border-white/[.08] px-3 py-2 text-xs text-zinc-500">Dry-run concluído</span>} {!campaign.approvedAt && !campaign.dryRun && campaign.complianceApproved && campaign.status !== 'publishing' && <Button variant="secondary" onClick={() => approve(campaign.id)}><CheckCircle2 className="h-4 w-4" />Aprovar</Button>} {campaign.approvedAt && !campaign.dryRun && campaign.status !== 'published' && campaign.status !== 'publishing' && !campaign.channels.some((channel) => campaign.publicationAttempts?.[channel] && !campaign.publishedChannelIds?.[channel]) && <Button onClick={() => publish(campaign.id)}><Send className="h-4 w-4" />Publicar</Button>}</div></div></Panel>)}</div>
  </div>;
}
