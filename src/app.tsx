import { BarChart3, Bell, ChevronDown, CircleDollarSign, Link2, Send, UserRound, Volume2, VolumeX, Zap } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { CopyStudio } from './components/copy-studio';
import { CampaignsPanel } from './components/campaigns-panel';
import { HistoryPanel } from './components/history-panel';
import { LinkConverter } from './components/link-converter';
import { OverviewDashboard } from './components/overview-dashboard';
import { SettingsPanel } from './components/settings-panel';
import { Sidebar } from './components/sidebar';
import { Button, Panel, Toasts } from './components/ui';
import { api } from './lib/api';
import { installSoundUnlock, isSoundEnabled, playSound, setSoundEnabled, subscribeSound } from './lib/sound';
import type { CopyTone, HealthStatus, HistoryItem, LinkConversion, PublicSettings, SettingsForm, ToastMessage, WorkspaceSection } from './types';

const blankForm: SettingsForm = {
  shopeeTrackingId: '',
  mercadoLivreTag: '',
  anthropicApiKey: '',
  openAiApiKey: '',
  geminiApiKey: '',
  groqApiKey: '',
  telegramBotToken: '',
  telegramChatId: '',
  amazonTag: '',
  automationEnabled: false,
  telegramAutomationEnabled: false,
  metaAutomationEnabled: false,
  automationDailyLimit: 10,
  automationKillSwitch: false,
};

export default function App() {
  const [active, setActive] = useState<WorkspaceSection>('overview');
  const [profileOpen, setProfileOpen] = useState(false);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [settingsForm, setSettingsForm] = useState<SettingsForm>(blankForm);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [url, setUrl] = useState('');
  const [conversion, setConversion] = useState<LinkConversion | null>(null);
  const [productName, setProductName] = useState('');
  const [tone, setTone] = useState<CopyTone>('economia');
  const [copy, setCopy] = useState('');
  const [autoPaste, setAutoPaste] = useState(true);
  const [converting, setConverting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [flash, setFlash] = useState<{ id: number; type: 'success' | 'error' } | null>(null);
  const [soundOn, setSoundOn] = useState(isSoundEnabled);

  useEffect(() => installSoundUnlock(), []);
  useEffect(() => subscribeSound(setSoundOn), []);

  const toast = useCallback((title: string, type: ToastMessage['type'] = 'success', description?: string) => {
    const id = Date.now() + Math.random();
    setToasts((items) => [...items, { id, title, type, description }]);
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 4200);
    playSound(type);
    if (type !== 'info') {
      setFlash({ id, type });
      window.setTimeout(() => setFlash((current) => (current?.id === id ? null : current)), 800);
    }
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const [nextHealth, nextSettings, nextHistory] = await Promise.all([api.health(), api.settings(), api.history()]);
      setHealth(nextHealth);
      setSettings(nextSettings);
      setSettingsForm((current) => ({ ...current, shopeeTrackingId: nextSettings.shopeeTrackingId, mercadoLivreTag: nextSettings.mercadoLivreTag, telegramChatId: nextSettings.telegramChatId, amazonTag: nextSettings.amazonTag, automationEnabled: nextSettings.automationEnabled, telegramAutomationEnabled: nextSettings.telegramAutomationEnabled, metaAutomationEnabled: nextSettings.metaAutomationEnabled, automationDailyLimit: nextSettings.automationDailyLimit, automationKillSwitch: nextSettings.automationKillSwitch }));
      setHistory(nextHistory);
    } catch {
      setHealth(null);
    }
  }, []);

  useEffect(() => { void refreshData(); }, [refreshData]);

  const convert = async () => {
    setConverting(true);
    try {
      const next = await api.convert(url);
      setConversion(next);
      setCopy('');
      setProductName('');
      setHistory((current) => [next, ...current.filter((item) => item.id !== next.id)]);
      toast('Link de afiliado criado', 'success', 'Seu rastreio foi aplicado ao produto.');
    } catch (error) {
      toast('Não foi possível converter', 'error', getErrorMessage(error));
    } finally { setConverting(false); }
  };

  const generateCopy = async () => {
    if (!conversion) return;
    setGenerating(true);
    try {
      const result = await api.generateCopy({ id: conversion.id, affiliateUrl: conversion.affiliateUrl, marketplace: conversion.marketplace, productName, tone });
      setCopy(result.copy);
      setHistory((current) => current.map((item) => item.id === conversion.id ? { ...item, productName, copy: result.copy, tone } : item));
      toast(result.provider === 'gemini' ? 'Copy criada com Gemini' : 'Copy de demonstração criada', 'success', result.provider === 'local' ? 'Configure o Gemini para variações com IA.' : 'Pronta para seu canal.');
    } catch (error) {
      toast('A IA não conseguiu responder', 'error', getErrorMessage(error));
    } finally { setGenerating(false); }
  };

  const copyText = async (text: string = copy) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast('Mensagem copiada', 'success', 'Já está pronta para colar no seu canal.');
      window.setTimeout(() => setCopied(false), 1800);
    } catch { toast('Não foi possível acessar a área de transferência', 'error'); }
  };

  const send = async () => {
    if (!copy) return;
    setSending(true);
    try { await api.sendTelegram(copy); toast('Mensagem enviada ao Telegram', 'success', 'Seu disparo foi confirmado pelo bot.'); }
    catch (error) { toast('Falha no disparo', 'error', getErrorMessage(error)); }
    finally { setSending(false); }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const payload: Partial<SettingsForm> = { ...settingsForm };
      if (settings?.hasAnthropicApiKey && !payload.anthropicApiKey) delete payload.anthropicApiKey;
      if (settings?.hasOpenAiApiKey && !payload.openAiApiKey) delete payload.openAiApiKey;
      if (settings?.hasGeminiApiKey && !payload.geminiApiKey) delete payload.geminiApiKey;
      if (settings?.hasGroqApiKey && !payload.groqApiKey) delete payload.groqApiKey;
      if (settings?.hasTelegramBotToken && !payload.telegramBotToken) delete payload.telegramBotToken;
      const next = await api.saveSettings(payload);
      setSettings(next);
      setSettingsForm({ ...blankForm, shopeeTrackingId: next.shopeeTrackingId, mercadoLivreTag: next.mercadoLivreTag, telegramChatId: next.telegramChatId, amazonTag: next.amazonTag, automationEnabled: next.automationEnabled, telegramAutomationEnabled: next.telegramAutomationEnabled, metaAutomationEnabled: next.metaAutomationEnabled, automationDailyLimit: next.automationDailyLimit, automationKillSwitch: next.automationKillSwitch });
      const nextHealth = await api.health();
      setHealth(nextHealth);
      toast('Conexões salvas localmente', 'success', 'O Vitryne já pode usar suas novas credenciais.');
    } catch (error) { toast('Não foi possível salvar', 'error', getErrorMessage(error)); }
    finally { setSaving(false); }
  };

  const reuse = (item: HistoryItem) => {
    setConversion(item);
    setUrl(item.originalUrl);
    setProductName(item.productName ?? '');
    setTone(item.tone ?? 'economia');
    setCopy(item.copy ?? '');
    setActive('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-canvas text-slate-100 selection:bg-cyan/25 selection:text-white lg:flex">
      <Sidebar active={active} onNavigate={setActive} health={health} />
      <main className="relative min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-cyan/[.1] bg-[#081329]/55 px-4 backdrop-blur-2xl sm:px-7">
          <div className="flex items-center gap-6">
            <div className="hidden items-center gap-2.5 sm:flex lg:hidden"><span className="grid h-8 w-8 place-items-center rounded-lg border border-cyan/25 bg-cyan/[.08] text-cyan"><Zap className="h-4 w-4" /></span><span className="font-semibold tracking-tight text-white">vitryne</span></div>
            <nav aria-label="Navegação principal" className="flex items-center gap-1">
              {([{ id: 'overview', label: 'Overview' }, { id: 'history', label: 'Reports' }, { id: 'settings', label: 'Settings' }] as const).map((item) => {
                const selected = active === item.id || (item.id === 'history' && active === 'history');
                return <button key={item.id} onClick={() => setActive(item.id)} className={`relative px-3 py-2 text-xs font-medium transition sm:px-4 sm:text-sm ${selected ? 'text-cyan' : 'text-slate-400 hover:text-white'}`}>{item.label}{selected && <span className="absolute inset-x-3 -bottom-[17px] h-[2px] rounded-full bg-cyan shadow-[0_0_10px_#00f0ff]" />}</button>;
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className={`hidden items-center gap-2 rounded-full border border-cyan/[.13] bg-cyan/[.04] px-3 py-1.5 text-[10px] font-semibold sm:inline-flex ${health?.online ? 'text-cyan' : 'text-amber-200'}`}><span className={`h-1.5 w-1.5 rounded-full ${health?.online ? 'bg-cyan shadow-[0_0_8px_#00f0ff]' : 'bg-amber-300'}`} />{health?.online ? 'LOCAL ONLINE' : 'API OFFLINE'}</span>
            <button onClick={() => setSoundEnabled(!soundOn)} className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-white/[.05] hover:text-cyan" aria-label={soundOn ? 'Desligar sons' : 'Ligar sons'} aria-pressed={soundOn} title={soundOn ? 'Sons ligados' : 'Sons desligados'}>{soundOn ? <Volume2 className="h-[17px] w-[17px]" /> : <VolumeX className="h-[17px] w-[17px]" />}</button>
            <button onClick={() => toast('Tudo em dia', 'info', 'Você não tem notificações novas.')} className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-white/[.05] hover:text-cyan" aria-label="Notificações"><Bell className="h-[17px] w-[17px]" /></button>
            <div className="relative">
              <button onClick={() => setProfileOpen((open) => !open)} className="flex items-center gap-2 rounded-xl border border-cyan/[.12] bg-white/[.025] p-1.5 pr-2.5 transition hover:border-cyan/25" aria-expanded={profileOpen} aria-label="Menu de perfil">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-cyan/30 to-blue/30 text-cyan"><UserRound className="h-4 w-4" /></span>
                <span className="hidden text-xs font-medium text-slate-200 sm:inline">Perfil</span><ChevronDown className="hidden h-3.5 w-3.5 text-slate-500 sm:block" />
              </button>
              {profileOpen && <div className="absolute right-0 top-12 w-48 rounded-xl border border-cyan/[.16] bg-[#0d1a33]/70 p-2 shadow-[0_14px_45px_rgba(0,0,0,.4)] backdrop-blur-2xl"><p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Ambiente local</p><button onClick={() => { setActive('settings'); setProfileOpen(false); }} className="w-full rounded-lg px-3 py-2 text-left text-xs text-slate-200 transition hover:bg-white/[.05]">Preferências da conta</button></div>}
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-[1680px] p-4 sm:p-7 xl:p-8">
          {active === 'overview' && <OverviewDashboard onCreateCampaign={() => setActive('workspace')} onNavigateSettings={() => setActive('settings')} settings={settings} onToast={toast} />}
          {active === 'workspace' && <Workspace url={url} setUrl={setUrl} autoPaste={autoPaste} setAutoPaste={setAutoPaste} converting={converting} convert={convert} conversion={conversion} productName={productName} setProductName={setProductName} tone={tone} setTone={setTone} copy={copy} generateCopy={generateCopy} generating={generating} copyText={copyText} send={send} sending={sending} copied={copied} aiEnabled={Boolean(settings?.hasGeminiApiKey)} history={history} reuse={reuse} />}
          {active === 'campaigns' && <CampaignsPanel onToast={toast} />}
          {active === 'history' && <HistoryPanel items={history} onReuse={reuse} onCopy={copyText} />}
          {active === 'settings' && <SettingsPanel form={settingsForm} publicSettings={settings} onChange={(field, value) => setSettingsForm((current) => ({ ...current, [field]: value }))} onSave={saveSettings} saving={saving} />}
          {active === 'automation' && <Automation copy={copy} telegramConfigured={Boolean(health?.services.telegram)} onNavigate={setActive} onSend={send} sending={sending} />}
        </div>
      </main>
      <Toasts toasts={toasts} />
      {flash && <div key={flash.id} aria-hidden="true" className={`pointer-events-none fixed inset-0 z-40 ${flash.type === 'error' ? 'fx-flash-error' : 'fx-flash-success'}`} />}
    </div>
  );
}

function Workspace(props: { url: string; setUrl: (url: string) => void; autoPaste: boolean; setAutoPaste: (value: boolean) => void; converting: boolean; convert: () => void; conversion: LinkConversion | null; productName: string; setProductName: (name: string) => void; tone: CopyTone; setTone: (tone: CopyTone) => void; copy: string; generateCopy: () => void; generating: boolean; copyText: () => void; send: () => void; sending: boolean; copied: boolean; aiEnabled: boolean; history: HistoryItem[]; reuse: (item: HistoryItem) => void }) {
  return <><section className="mb-7 flex flex-col justify-between gap-5 xl:flex-row xl:items-end"><div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-neon/15 bg-neon/[.05] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.14em] text-neon"><Zap className="h-3 w-3" /> Fluxo instantâneo</div><h1 className="max-w-xl text-3xl font-bold tracking-tight text-white sm:text-4xl">Transforme achados em <span className="text-neon">vendas.</span></h1><p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-500">Seu atalho para converter links, escrever mensagens e disparar campanhas — sem sair daqui.</p></div><div className="flex gap-2"><Metric icon={Link2} value={props.history.length} label="links criados" /><Metric icon={CircleDollarSign} value={props.history.filter((item) => item.copy).length} label="copies salvas" /></div></section><div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(380px,.88fr)]"><LinkConverter value={props.url} onChange={props.setUrl} onConvert={props.convert} loading={props.converting} autoPaste={props.autoPaste} onAutoPasteChange={props.setAutoPaste} /><CopyStudio conversion={props.conversion} productName={props.productName} onProductNameChange={props.setProductName} tone={props.tone} onToneChange={props.setTone} copy={props.copy} onGenerate={props.generateCopy} generating={props.generating} onCopy={props.copyText} onSend={props.send} sending={props.sending} copied={props.copied} aiEnabled={props.aiEnabled} /></div><div className="mt-5"><HistoryPanel items={props.history.slice(0, 4)} onReuse={props.reuse} onCopy={props.copyText} /></div></>;
}

function Metric({ icon: Icon, value, label }: { icon: typeof BarChart3; value: number; label: string }) { return <div className="flex items-center gap-2 rounded-xl border border-white/[.07] bg-white/[.025] px-3 py-2.5"><Icon className="h-4 w-4 text-zinc-600" /><div><p className="text-sm font-bold text-white">{value}</p><p className="text-[9px] font-semibold uppercase tracking-[.1em] text-zinc-600">{label}</p></div></div>; }

function Automation({ copy, telegramConfigured, onNavigate, onSend, sending }: { copy: string; telegramConfigured: boolean; onNavigate: (section: WorkspaceSection) => void; onSend: () => void; sending: boolean }) {
  return <div className="mx-auto max-w-3xl"><div className="mb-7"><p className="mb-2 text-[11px] font-bold uppercase tracking-[.18em] text-violet">Disparo direto</p><h1 className="text-3xl font-bold tracking-tight text-white">Automação de canais</h1><p className="mt-2 text-sm text-zinc-500">Envie a copy aprovada do estúdio diretamente para o Telegram.</p></div><Panel className="overflow-hidden p-5 sm:p-7"><div className="flex flex-col gap-6 sm:flex-row sm:items-start"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#249bd7]/12 text-[#41b7f2]"><Send className="h-5 w-5" /></div><div className="flex-1"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-white">Telegram Bot</h2><p className="mt-1 text-sm text-zinc-500">Canal configurado para mensagens Markdown.</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${telegramConfigured ? 'bg-neon/[.09] text-neon' : 'bg-white/[.06] text-zinc-600'}`}>{telegramConfigured ? 'Conectado' : 'Aguardando setup'}</span></div><div className="mt-6 flex flex-col gap-3 sm:flex-row"><Button onClick={onSend} loading={sending} disabled={!copy || !telegramConfigured}><Send className="h-4 w-4" />Disparar copy atual</Button><Button variant="secondary" onClick={() => onNavigate('settings')}>Configurar bot</Button></div>{!copy && <p className="mt-4 text-xs text-amber-200/70">Crie uma copy no Conversor & Copywriter antes de enviar.</p>}</div></div></Panel></div>;
}

function getErrorMessage(error: unknown): string { return error instanceof Error ? error.message : 'Tente novamente em alguns instantes.'; }
