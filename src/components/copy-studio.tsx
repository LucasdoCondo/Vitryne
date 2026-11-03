import { Check, Clipboard, ExternalLink, MessageCircle, RefreshCw, Send, WandSparkles } from 'lucide-react';
import type { CopyTone, LinkConversion } from '../types';
import { Button, FieldLabel, Panel } from './ui';

interface CopyStudioProps {
  conversion: LinkConversion | null;
  productName: string;
  onProductNameChange: (value: string) => void;
  tone: CopyTone;
  onToneChange: (tone: CopyTone) => void;
  copy: string;
  onGenerate: () => void;
  generating: boolean;
  onCopy: () => void;
  onSend: () => void;
  sending: boolean;
  copied: boolean;
  aiEnabled: boolean;
}

const tones: Array<{ id: CopyTone; label: string }> = [
  { id: 'agressivo', label: 'Agressivo' },
  { id: 'informativo', label: 'Informativo' },
  { id: 'economia', label: 'Economia' },
];

export function CopyStudio({ conversion, productName, onProductNameChange, tone, onToneChange, copy, onGenerate, generating, onCopy, onSend, sending, copied, aiEnabled }: CopyStudioProps) {
  const marketLabel = conversion?.marketplace === 'shopee' ? 'Shopee' : conversion?.marketplace === 'mercado_livre' ? 'Mercado Livre' : '';
  return (
    <Panel className="relative overflow-hidden p-5 sm:p-6">
      <div className="absolute -bottom-20 -right-10 h-40 w-40 rounded-full bg-violet/[.08] blur-3xl" />
      <div className="relative">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2 text-violet"><WandSparkles className="h-4 w-4" /><span className="text-[11px] font-bold uppercase tracking-[.16em]">Copy studio</span></div>
            <h2 className="text-xl font-bold tracking-tight text-white">Mensagem que converte</h2>
            <p className="mt-1 text-sm text-zinc-500">Pronta para publicar, em segundos.</p>
          </div>
          {conversion && <span className="rounded-full border border-neon/20 bg-neon/[.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-neon">{marketLabel}</span>}
        </div>

        {!conversion ? (
          <div className="grid min-h-[275px] place-items-center rounded-xl border border-dashed border-white/[.1] bg-black/[.12] px-6 text-center">
            <div><div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-white/[.035] text-zinc-600"><WandSparkles className="h-5 w-5" /></div><p className="text-sm font-medium text-zinc-400">Seu estúdio está esperando um link.</p><p className="mt-1 text-xs text-zinc-600">Converta um produto para começar a criar.</p></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <FieldLabel hint="opcional">Nome do produto</FieldLabel>
              <input value={productName} onChange={(event) => onProductNameChange(event.target.value)} placeholder="Ex.: Fone Bluetooth premium" className="w-full rounded-xl border border-white/[.1] bg-[#090b10] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-violet/60 focus:ring-4 focus:ring-violet/[.05]" />
            </div>
            <div>
              <FieldLabel>Estilo da mensagem</FieldLabel>
              <div className="grid grid-cols-3 gap-2">
                {tones.map((option) => <button key={option.id} onClick={() => onToneChange(option.id)} className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${tone === option.id ? 'border-violet/45 bg-violet/[.13] text-violet' : 'border-white/[.08] bg-white/[.025] text-zinc-500 hover:text-zinc-300'}`}>{option.label}</button>)}
              </div>
            </div>
            <Button onClick={onGenerate} loading={generating} className="w-full"><WandSparkles className="h-4 w-4" />{copy ? 'Gerar nova variação' : 'Criar copy com IA'}</Button>
            {!aiEnabled && <p className="-mt-1 text-center text-[11px] text-amber-200/70">Modo demonstração ativo. Conecte o Gemini para gerar com IA.</p>}
            {copy && (
              <div className="animate-enter overflow-hidden rounded-xl border border-white/[.09] bg-[#090b10]">
                <div className="flex items-center justify-between border-b border-white/[.07] px-3.5 py-2.5"><span className="text-[10px] font-bold uppercase tracking-[.14em] text-zinc-600">Prévia Markdown</span><a href={conversion.affiliateUrl} target="_blank" rel="noreferrer" className="text-zinc-500 transition hover:text-neon"><ExternalLink className="h-3.5 w-3.5" /></a></div>
                <pre className="max-h-[180px] overflow-auto whitespace-pre-wrap px-4 py-3.5 font-sans text-sm leading-relaxed text-zinc-300">{copy}</pre>
                <div className="grid grid-cols-2 gap-2 border-t border-white/[.07] p-2.5">
                  <Button variant="secondary" onClick={onCopy} className="px-2 text-xs">{copied ? <Check className="h-4 w-4 text-neon" /> : <Clipboard className="h-4 w-4" />}{copied ? 'Copiado' : 'Copiar'}</Button>
                  <Button variant="secondary" onClick={onSend} loading={sending} className="px-2 text-xs"><Send className="h-4 w-4" />Disparar</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}
