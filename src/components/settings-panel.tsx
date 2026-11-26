import { Bot, CheckCircle2, KeyRound, LockKeyhole, Save, Send, Store } from 'lucide-react';
import type { PublicSettings, SettingsForm } from '../types';
import { Button, FieldLabel, Panel } from './ui';

interface SettingsPanelProps {
  form: SettingsForm;
  publicSettings: PublicSettings | null;
  onChange: (field: keyof SettingsForm, value: string | boolean | number) => void;
  onSave: () => void;
  saving: boolean;
}

function Configured({ active }: { active: boolean }) {
  return active ? <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-neon"><CheckCircle2 className="h-3 w-3" />Configurado</span> : <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-600">Pendente</span>;
}

export function SettingsPanel({ form, publicSettings, onChange, onSave, saving }: SettingsPanelProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="mb-7"><p className="mb-2 text-[11px] font-bold uppercase tracking-[.18em] text-neon">Ambiente local</p><h1 className="text-3xl font-bold tracking-tight text-white">Conecte sua operação</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500">As credenciais permanecem somente nesta máquina, em uma pasta local ignorada pelo Git.</p></div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel className="p-5 sm:p-6"><Header icon={Store} title="Rastreio de afiliados" description="Os IDs entram em cada link convertido." />
          <div className="space-y-4"><InputField label="Shopee Tracking ID" value={form.shopeeTrackingId} onChange={(value) => onChange('shopeeTrackingId', value)} placeholder={publicSettings?.shopeeTrackingId ? 'ID configurado — preencha para substituir' : 'Ex.: 3f5a...' } /><InputField label="Mercado Livre tag" value={form.mercadoLivreTag} onChange={(value) => onChange('mercadoLivreTag', value)} placeholder={publicSettings?.mercadoLivreTag ? 'Tag configurada — preencha para substituir' : 'Ex.: MLT-...' } /></div>
        </Panel>
        <Panel className="p-5 sm:p-6"><Header icon={Bot} title="Inteligência Artificial" description="Configure as chaves dos provedores que deseja usar." status={<Configured active={Boolean(publicSettings?.hasAnthropicApiKey || publicSettings?.hasOpenAiApiKey || publicSettings?.hasGeminiApiKey || publicSettings?.hasGroqApiKey)} />} />
          <div className="space-y-4">
            <InputField label="Anthropic API Key" hint={publicSettings?.hasAnthropicApiKey ? 'Configurada' : undefined} type="password" value={form.anthropicApiKey} onChange={(value) => onChange('anthropicApiKey', value)} placeholder={publicSettings?.hasAnthropicApiKey ? 'Chave configurada — preencha para substituir' : 'ANTHROPIC_API_KEY'} />
            <InputField label="OpenAI API Key" hint={publicSettings?.hasOpenAiApiKey ? 'Configurada' : undefined} type="password" value={form.openAiApiKey} onChange={(value) => onChange('openAiApiKey', value)} placeholder={publicSettings?.hasOpenAiApiKey ? 'Chave configurada — preencha para substituir' : 'OPENAI_API_KEY'} />
            <InputField label="Gemini API Key" hint={publicSettings?.hasGeminiApiKey ? 'Configurada' : undefined} type="password" value={form.geminiApiKey} onChange={(value) => onChange('geminiApiKey', value)} placeholder={publicSettings?.hasGeminiApiKey ? 'Chave configurada — preencha para substituir' : 'GEMINI_API_KEY'} />
            <InputField label="Groq API Key" hint={publicSettings?.hasGroqApiKey ? 'Configurada' : undefined} type="password" value={form.groqApiKey} onChange={(value) => onChange('groqApiKey', value)} placeholder={publicSettings?.hasGroqApiKey ? 'Chave configurada — preencha para substituir' : 'GROQ_API_KEY'} />
          </div>
          <p className="mt-3 flex gap-2 text-[11px] leading-relaxed text-zinc-600"><KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0" />As chaves são guardadas na configuração local. A geração de copy atual ainda utiliza apenas Gemini; os outros provedores precisam ser integrados para gerar conteúdo.</p>
        </Panel>
        <Panel className="p-5 sm:p-6 lg:col-span-2"><Header icon={Send} title="Canal de disparo" description="Envie sua mensagem para um chat ou canal do Telegram." status={<Configured active={Boolean(publicSettings?.hasTelegramBotToken && publicSettings.telegramChatId)} />} />
          <div className="grid gap-4 md:grid-cols-2"><InputField label="Token do bot" type="password" value={form.telegramBotToken} onChange={(value) => onChange('telegramBotToken', value)} placeholder={publicSettings?.hasTelegramBotToken ? 'Token configurado — preencha para substituir' : '123456:ABC...'} /><InputField label="Chat ID ou @canal" value={form.telegramChatId} onChange={(value) => onChange('telegramChatId', value)} placeholder={publicSettings?.telegramChatId || '-1001234567890'} /></div>
        </Panel>
        <Panel className="p-5 sm:p-6 lg:col-span-2"><Header icon={LockKeyhole} title="Automação e aprovação humana" description="Telegram publica imediatamente somente quando os opt-ins e limites estão ativos; caso contrário, exige aprovação manual." />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center justify-between rounded-xl border border-white/[.08] p-3 text-sm text-zinc-300"><span>Ativar automação</span><input type="checkbox" checked={form.automationEnabled} onChange={(event) => onChange('automationEnabled', event.target.checked)} /></label>
            <label className="flex items-center justify-between rounded-xl border border-white/[.08] p-3 text-sm text-zinc-300"><span>Kill switch</span><input type="checkbox" checked={form.automationKillSwitch} onChange={(event) => onChange('automationKillSwitch', event.target.checked)} /></label>
            <label className="flex items-center justify-between rounded-xl border border-white/[.08] p-3 text-sm text-zinc-300"><span>Automação Telegram</span><input type="checkbox" checked={form.telegramAutomationEnabled} onChange={(event) => onChange('telegramAutomationEnabled', event.target.checked)} /></label>
            <label className="flex items-center justify-between rounded-xl border border-white/[.08] p-3 text-sm text-zinc-300"><span>Opt-in Meta (publisher indisponível)</span><input type="checkbox" checked={form.metaAutomationEnabled} onChange={(event) => onChange('metaAutomationEnabled', event.target.checked)} /></label>
            <div><FieldLabel>Limite diário de publicações</FieldLabel><input type="number" min="0" max="100" value={form.automationDailyLimit} onChange={(event) => onChange('automationDailyLimit', Number(event.target.value))} className="w-full rounded-xl border border-white/[.1] bg-[#090b10] px-3.5 py-3 text-sm text-white" /></div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-zinc-500">Instagram e Facebook permanecem bloqueados. O opt-in Meta não habilita publicação; ela depende de um publisher oficial e de uma decisão explícita sobre mídia pública.</p>
        </Panel>
        <Panel className="p-5 sm:p-6 lg:col-span-2"><Header icon={LockKeyhole} title="Instagram e Facebook (OAuth da Meta)" description="A conexão é iniciada pelos cards do dashboard, usando a autorização oficial da Meta." />
          <p className="text-xs leading-relaxed text-zinc-400">Para habilitar, configure <code className="text-neon">META_APP_ID</code>, <code className="text-neon">META_APP_SECRET</code>, <code className="text-neon">META_GRAPH_API_VERSION</code> e <code className="text-neon">VITRYNE_ENCRYPTION_KEY</code> no arquivo <code className="text-neon">.env</code> e reinicie o Vitryne. O token de Página retornado pela Meta é criptografado em armazenamento local. O login e a senha não são recebidos nem salvos; a publicação ainda depende das permissões e da análise do aplicativo Meta.</p>
        </Panel>
      </div>
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-neon/[.16] bg-neon/[.045] p-4 sm:flex-row sm:items-center"><p className="flex max-w-xl gap-2 text-xs leading-relaxed text-zinc-400"><LockKeyhole className="h-4 w-4 shrink-0 text-neon" />O servidor local nunca expõe suas chaves de API à interface. Campos em branco mantêm a configuração atual.</p><Button onClick={onSave} loading={saving} className="w-full shrink-0 sm:w-auto"><Save className="h-4 w-4" />Salvar conexões</Button></div>
    </div>
  );
}

function Header({ icon: Icon, title, description, status }: { icon: typeof Store; title: string; description: string; status?: React.ReactNode }) {
  return <div className="mb-5 flex gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl border border-white/[.08] bg-white/[.03] text-violet"><Icon className="h-4 w-4" /></div><div className="flex-1"><div className="flex items-center justify-between gap-2"><h2 className="font-semibold text-white">{title}</h2>{status}</div><p className="mt-0.5 text-xs text-zinc-500">{description}</p></div></div>;
}

function InputField({ label, value, onChange, placeholder, type = 'text', hint }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: 'text' | 'password'; hint?: string }) {
  return <div><FieldLabel hint={hint}>{label}</FieldLabel><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-white/[.1] bg-[#090b10] px-3.5 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-neon/40 focus:ring-4 focus:ring-neon/[.04]" /></div>;
}
