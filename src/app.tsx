import { BarChart3, Bot, CircleDollarSign, Command, Copy, Link2, Send, Zap } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { CopyStudio } from './components/copy-studio';
import { HistoryPanel } from './components/history-panel';
import { LinkConverter } from './components/link-converter';
import { SettingsPanel } from './components/settings-panel';
import { Sidebar } from './components/sidebar';
import { Button, Panel, Toasts } from './components/ui';
import { api } from './lib/api';
import type { CopyTone, HealthStatus, HistoryItem, LinkConversion, PublicSettings, SettingsForm, ToastMessage, WorkspaceSection } from './types';

const blankForm: SettingsForm = { shopeeTrackingId: '', mercadoLivreTag: '', geminiApiKey: '', telegramBotToken: '', telegramChatId: '' };

export default function App() {
  const [active, setActive] = useState<WorkspaceSection>('workspace');
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

  const toast = useCallback((title: string, type: ToastMessage['type'] = 'success', description?: string) => {
    const id = Date.now();
    setToasts((items) => [...items, { id, title, type, description }]);
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 4200);
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const [nextHealth, nextSettings, nextHistory] = await Promise.all([api.health(), api.settings(), api.history()]);
      setHealth(nextHealth);
      setSettings(nextSettings);
      setSettingsForm((current) => ({ ...current, shopeeTrackingId: nextSettings.shopeeTrackingId, mercadoLivreTag: nextSettings.mercadoLivreTag, telegramChatId: nextSettings.telegramChatId }));
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
      const next = await api.saveSettings(settingsForm);
      setSettings(next);
      setSettingsForm({ ...blankForm, shopeeTrackingId: next.shopeeTrackingId, mercadoLivreTag: next.mercadoLivreTag, telegramChatId: next.telegramChatId });
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
    <div className="min-h-screen bg-canvas text-zinc-100 selection:bg-neon/25 selection:text-white lg:flex">
      <div className="pointer-events-none fixed inset-0 cyber-grid opacity-40" />
      <Sidebar active={active} onNavigate={setActive} health={health} />
      <main className="relative min-w-0 flex-1">
        <header className="flex h-[74px] items-center justify-between border-b border-white/[.065] px-5 sm:px-8">
          <div className="flex items-center gap-3"><span className="hidden text-[11px] font-bold uppercase tracking-[.17em] text-zinc-600 sm:inline">Command center</span><span className="hidden h-1 w-1 rounded-full bg-zinc-700 sm:inline" /><span className="text-xs text-zinc-500">{active === 'workspace' ? 'Criar campanha' : active === 'history' ? 'Biblioteca de campanhas' : active === 'settings' ? 'Configuração segura' : 'Canal de disparo'}</span></div>
          <div className="flex items-center gap-2 rounded-full border border-white/[.075] bg-white/[.025] px-3 py-1.5"><span className={`h-1.5 w-1.5 rounded-full ${health?.online ? 'bg-neon shadow-[0_0_8px_#a3ff5d]' : 'bg-amber-300'}`} /><span className="text-[10px] font-semibold text-zinc-500">{health?.online ? 'LOCAL ONLINE' : 'API OFFLINE'}</span></div>
        </header>
        <div className="mx-auto max-w-[1450px] p-5 sm:p-8">
          {active === 'workspace' && <Workspace url={url} setUrl={setUrl} autoPaste={autoPaste} setAutoPaste={setAutoPaste} converting={converting} convert={convert} conversion={conversion} productName={productName} setProductName={setProductName} tone={tone} setTone={setTone} copy={copy} generateCopy={generateCopy} generating={generating} copyText={copyText} send={send} sending={sending} copied={copied} aiEnabled={Boolean(settings?.hasGeminiApiKey)} history={history} reuse={reuse} />}
          {active === 'history' && <HistoryPanel items={history} onReuse={reuse} onCopy={copyText} />}
          {active === 'settings' && <SettingsPanel form={settingsForm} publicSettings={settings} onChange={(field, value) => setSettingsForm((current) => ({ ...current, [field]: value }))} onSave={saveSettings} saving={saving} />}
          {active === 'automation' && <Automation copy={copy} telegramConfigured={Boolean(health?.services.telegram)} onNavigate={setActive} onSend={send} sending={sending} />}
        </div>
      </main>
      <Toasts toasts={toasts} />
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
