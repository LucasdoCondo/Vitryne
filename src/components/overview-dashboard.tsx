import { ArrowUpRight, CheckCircle2, CircleDollarSign, ExternalLink, Link2, Plus, Settings2, Share2, ShoppingBag, Sparkles, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PublicSettings, SocialConnections, ToastMessage } from '../types';
import { BrandEmblem, type Brand } from './brand-emblem';
import { Button, Panel } from './ui';
import { api } from '../lib/api';

interface OverviewDashboardProps {
  onCreateCampaign: () => void;
  onNavigateSettings: () => void;
  settings: PublicSettings | null;
  onToast: (title: string, type: ToastMessage['type'], description?: string) => void;
}

interface Portal {
  id: string;
  name: string;
  subtitle: string;
  badge: Brand;
  color: string;
  url: string;
}

const affiliatePortals: Portal[] = [
  { id: 'amazon', name: 'Amazon Associados', subtitle: 'Portal de afiliados', badge: 'amazon', color: 'border-amber-300/25 bg-amber-300/10 text-amber-200', url: 'https://associados.amazon.com.br/' },
  { id: 'shopee', name: 'Shopee Afiliados', subtitle: 'Portal de afiliados', badge: 'shopee', color: 'border-orange-400/25 bg-orange-400/10 text-orange-300', url: 'https://affiliate.shopee.com.br/' },
  { id: 'mercado_livre', name: 'Mercado Livre', subtitle: 'Portal de afiliados', badge: 'mercado_livre', color: 'border-yellow-300/25 bg-yellow-300/10 text-yellow-200', url: 'https://www.mercadolivre.com.br/afiliados' },
  { id: 'shein', name: 'SHEIN', subtitle: 'Site oficial', badge: 'shein', color: 'border-violet/25 bg-violet/10 text-violet', url: 'https://br.shein.com/' },
];

const socialPortals: Portal[] = [
  { id: 'instagram', name: 'Instagram', subtitle: 'Acesse seu perfil', badge: 'instagram', color: 'border-pink-400/25 bg-pink-400/10 text-pink-300', url: 'https://www.instagram.com/' },
  { id: 'facebook', name: 'Facebook', subtitle: 'Meta Business Suite', badge: 'facebook', color: 'border-blue/25 bg-blue/10 text-blue', url: 'https://business.facebook.com/' },
  { id: 'x', name: 'X', subtitle: 'Acesse seu perfil', badge: 'x', color: 'border-slate-400/25 bg-slate-400/10 text-slate-200', url: 'https://x.com/' },
  { id: 'tiktok', name: 'TikTok', subtitle: 'Acesse seu perfil', badge: 'tiktok', color: 'border-cyan/25 bg-cyan/10 text-cyan', url: 'https://www.tiktok.com/' },
  { id: 'telegram', name: 'Telegram', subtitle: 'Web Telegram', badge: 'telegram', color: 'border-sky-400/25 bg-sky-400/10 text-sky-300', url: 'https://web.telegram.org/' },
  { id: 'discord', name: 'Discord', subtitle: 'Acesse seus servidores', badge: 'discord', color: 'border-indigo-400/25 bg-indigo-400/10 text-indigo-300', url: 'https://discord.com/app' },
];

export function OverviewDashboard({ onCreateCampaign, onNavigateSettings, settings, onToast }: OverviewDashboardProps) {
  const [socialConnections, setSocialConnections] = useState<SocialConnections | null>(null);
  const oauthPopup = useRef<Window | null>(null);

  const refreshSocialConnections = useCallback(async () => {
    try {
      setSocialConnections(await api.socialConnections());
    } catch (error) {
      onToast('Não foi possível verificar conexões sociais', 'error', error instanceof Error ? error.message : undefined);
    }
  }, [onToast]);

  useEffect(() => {
    void refreshSocialConnections();
  }, [refreshSocialConnections]);

  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent<unknown>) => {
      if (!['http://localhost:5173', 'http://127.0.0.1:5173'].includes(event.origin)) return;
      if (!oauthPopup.current || event.source !== oauthPopup.current) return;
      if (!event.data || typeof event.data !== 'object' || !('type' in event.data) || event.data.type !== 'VITRYNE_OAUTH_SUCCESS') return;
      if (!('provider' in event.data) || event.data.provider !== 'meta') return;
      const success = 'success' in event.data && event.data.success === true;
      oauthPopup.current = null;
      onToast(success ? 'Meta conectada' : 'Conexão Meta não concluída', success ? 'success' : 'error', success ? 'As Páginas autorizadas foram sincronizadas.' : 'Confira as configurações e permissões do aplicativo Meta.');
      void refreshSocialConnections();
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [onToast, refreshSocialConnections]);

  const configuredCount = [
    settings?.amazonTag,
    settings?.shopeeTrackingId,
    settings?.mercadoLivreTag,
  ].filter(Boolean).length;

  const openPortal = (portal: Portal) => {
    window.open(portal.url, '_blank', 'noopener,noreferrer');
    onToast(`Portal ${portal.name}`, 'info', 'O site oficial foi aberto em outra aba. O login permanece no navegador.');
  };

  const connectMeta = (portal: Portal) => {
    if (!socialConnections?.metaConfigured) {
      onNavigateSettings();
      onToast('OAuth da Meta pendente', 'info', 'Configure META_APP_ID, META_APP_SECRET, META_GRAPH_API_VERSION e VITRYNE_ENCRYPTION_KEY no arquivo .env.');
      return;
    }
    oauthPopup.current = window.open('/api/oauth/meta/start', 'vitryne_meta_oauth', 'popup,width=640,height=760');
    if (!oauthPopup.current) {
      onToast('Popup bloqueado', 'error', 'Permita pop-ups para o Vitryne e tente novamente.');
      return;
    }
    onToast(`Conectando ${portal.name}`, 'info', 'Autorize o acesso na janela oficial da Meta. O Vitryne não recebe sua senha.');
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Panel className="relative flex flex-col justify-between overflow-hidden p-6 sm:p-7">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan/[.09] blur-3xl" />
          <div className="relative">
            <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-cyan">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_10px_#00f0ff]" />
              Central de conexões Vitryne
            </div>
            <h1 className="max-w-2xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Seus portais e canais, prontos para acessar.
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
              Abra os sites oficiais, entre pelo navegador e use o Vitryne para preparar seus links e conteúdos.
            </p>
          </div>

          <div className="relative mt-6 flex flex-wrap items-center gap-3">
            <Button onClick={onCreateCampaign} className="shadow-[0_0_22px_rgba(0,240,255,.16)]">
              <Plus className="h-4 w-4" />
              Criar postagem
            </Button>
            <Button variant="secondary" onClick={onNavigateSettings}>
              <Settings2 className="h-4 w-4" />
              Configurar Vitryne
            </Button>
          </div>
        </Panel>

        <Panel className="relative overflow-hidden p-5 sm:p-6">
          <div className="absolute -bottom-12 -right-12 h-36 w-36 rounded-full bg-blue/[.12] blur-3xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">
                <CircleDollarSign className="h-3.5 w-3.5 text-cyan" />
                Comissões
              </div>
              <div className="mt-2 flex flex-wrap items-baseline gap-2.5">
                <span className="text-2xl font-bold tracking-tight text-white">R$ 0,00</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-cyan/10 px-2 py-0.5 text-[10px] font-semibold text-cyan">
                  <TrendingUp className="h-3 w-3" />
                  Aguardando integração
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                Ganhos ainda não são importados dos programas de afiliados.
              </p>
            </div>
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-cyan/20 bg-cyan/[.07] text-cyan">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>

          <div className="relative mt-4">
            <svg className="h-16 w-full overflow-visible" viewBox="0 0 240 56" preserveAspectRatio="none" role="img" aria-label="Gráfico ilustrativo; sem dados reais de comissões">
              <defs>
                <linearGradient id="mini-earnings-grad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="48" x2="240" y2="48" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
              <polygon points="0,56 0,45 40,45 80,44 120,45 160,44 200,45 240,44 240,56" fill="url(#mini-earnings-grad)" />
              <polyline points="0,45 40,45 80,44 120,45 160,44 200,45 240,44" fill="none" stroke="#00f0ff" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" opacity=".8" />
            </svg>
            <div className="mt-1 flex justify-between text-[10px] text-slate-500">
              <span>Início</span><span>Esta semana</span><span>Hoje</span>
            </div>
          </div>
        </Panel>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-cyan" />
            <h2 className="text-sm font-semibold uppercase tracking-[.12em] text-white">Programas de afiliados</h2>
          </div>
          <span className="text-xs text-slate-500">{configuredCount}/3 identificadores de rastreio configurados</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {affiliatePortals.map((portal) => {
            const trackingConfigured = portal.id === 'amazon'
              ? Boolean(settings?.amazonTag)
              : portal.id === 'shopee'
                ? Boolean(settings?.shopeeTrackingId)
                : portal.id === 'mercado_livre'
                  ? Boolean(settings?.mercadoLivreTag)
                  : false;
            return (
              <ConnectionCard
                key={portal.id}
                portal={portal}
                status={trackingConfigured ? 'Rastreio configurado' : 'Login no navegador'}
                configured={trackingConfigured}
                onOpen={() => openPortal(portal)}
                actionLabel="Abrir"
              />
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-violet" />
            <h2 className="text-sm font-semibold uppercase tracking-[.12em] text-white">Redes sociais e canais</h2>
          </div>
          <span className="text-xs text-slate-500">Acesso manual aos sites oficiais</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {socialPortals.map((portal) => {
            const metaPages = socialConnections?.pages ?? [];
            const metaConnected = portal.id === 'instagram'
              ? metaPages.some((page) => page.instagramUsername)
              : portal.id === 'facebook' && metaPages.length > 0;
            const configured = portal.id === 'telegram'
              ? Boolean(settings?.hasTelegramBotToken && settings.telegramChatId)
              : portal.id === 'instagram' || portal.id === 'facebook'
                ? Boolean(metaConnected)
                : false;
            const status = portal.id === 'instagram' || portal.id === 'facebook'
              ? metaConnected
                ? portal.id === 'instagram'
                  ? `Conectado: ${metaPages.filter((page) => page.instagramUsername).map((page) => `@${page.instagramUsername}`).join(', ')}`
                  : `${metaPages.length} Página(s) conectada(s)`
                : socialConnections?.metaConfigured
                  ? 'OAuth pronto para conectar'
                  : 'Configure OAuth da Meta'
              : configured ? 'Canal configurado' : 'Login no navegador';
            return (
              <ConnectionCard
                key={portal.id}
                portal={portal}
                status={status}
                configured={configured}
                onOpen={() => portal.id === 'instagram' || portal.id === 'facebook' ? connectMeta(portal) : openPortal(portal)}
                actionLabel={portal.id === 'instagram' || portal.id === 'facebook' ? (metaConnected ? 'Reconectar' : 'Conectar') : 'Abrir'}
              />
            );
          })}
        </div>
      </section>

      <div className="flex items-start gap-2 rounded-xl border border-cyan/[.12] bg-cyan/[.035] p-4 text-[11px] leading-relaxed text-slate-400">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan" />
        <p>Instagram e Facebook usam OAuth oficial da Meta; os tokens de Página são criptografados localmente e nenhuma senha ou cookie é lido. A publicação automática e a importação de comissões ainda não estão implementadas. Os demais portais abrem os sites oficiais no navegador.</p>
      </div>
    </div>
  );
}

function ConnectionCard({ portal, status, configured, onOpen, actionLabel = 'Abrir' }: { portal: Portal; status: string; configured: boolean; onOpen: () => void; actionLabel?: string }) {
  return (
    <Panel className="kpi-card flex flex-col justify-between p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${portal.color}`}>
              <BrandEmblem brand={portal.badge} className="h-6 w-6" />
            </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-white">{portal.name}</h3>
            <p className="mt-0.5 truncate text-[11px] text-slate-400">{portal.subtitle}</p>
          </div>
        </div>
        {configured
          ? <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan" aria-label={status} />
          : <ExternalLink className="h-4 w-4 shrink-0 text-slate-600" aria-hidden="true" />}
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className={`text-[9px] font-medium ${configured ? 'text-cyan' : 'text-slate-500'}`}>{status}</span>
        <Button variant="secondary" onClick={onOpen} className="px-2.5 py-2 text-[10px]">
          <Link2 className="h-3 w-3" />{actionLabel}
        </Button>
      </div>
    </Panel>
  );
}
