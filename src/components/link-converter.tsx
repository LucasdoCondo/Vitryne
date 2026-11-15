import { ClipboardPaste, Link2, RotateCcw, Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Button, FieldLabel, Panel } from './ui';

interface LinkConverterProps {
  value: string;
  onChange: (value: string) => void;
  onConvert: () => void;
  loading: boolean;
  autoPaste: boolean;
  onAutoPasteChange: (enabled: boolean) => void;
}

export function LinkConverter({ value, onChange, onConvert, loading, autoPaste, onAutoPasteChange }: LinkConverterProps) {
  // Guardamos o último link lido do clipboard para só preencher o campo quando ele for NOVO.
  // Antes, qualquer edição/limpeza do campo era sobrescrita de volta pelo clipboard.
  const lastClipboard = useRef('');
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!autoPaste) return;
    const syncClipboard = async () => {
      try {
        const text = (await navigator.clipboard.readText()).trim();
        if (/^https?:\/\//i.test(text) && text !== lastClipboard.current) {
          lastClipboard.current = text;
          onChangeRef.current(text);
        }
      } catch {
        // Clipboard permissions are optional; manual paste remains available.
      }
    };
    void syncClipboard();
    window.addEventListener('focus', syncClipboard);
    return () => window.removeEventListener('focus', syncClipboard);
  }, [autoPaste]);

  const paste = async () => {
    try {
      onChange(await navigator.clipboard.readText());
    } catch {
      // Browsers can deny clipboard access outside a secure context.
    }
  };

  return (
    <Panel className="relative overflow-hidden p-5 sm:p-6">
      <div className="absolute -right-12 -top-14 h-36 w-36 rounded-full bg-neon/[.055] blur-3xl" />
      <div className="relative">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-neon"><Link2 className="h-4 w-4" /><span className="text-[11px] font-bold uppercase tracking-[.16em]">Link engine</span></div>
            <h2 className="text-xl font-bold tracking-tight text-white">Converta qualquer achado</h2>
            <p className="mt-1 text-sm text-zinc-500">Cole o link e seu rastreio entra automaticamente.</p>
          </div>
          <div className="hidden rounded-lg border border-white/[.08] bg-white/[.035] p-2.5 text-violet sm:block"><Sparkles className="h-4 w-4" /></div>
        </div>

        <FieldLabel hint="Shopee ou Mercado Livre">URL do produto</FieldLabel>
        <div className="relative">
          <input value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') onConvert(); }} placeholder="https://shopee.com.br/..." className="w-full rounded-xl border border-white/[.1] bg-[#090b10] py-3.5 pl-4 pr-11 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-neon/45 focus:ring-4 focus:ring-neon/[.05]" />
          <button onClick={() => void paste()} title="Colar da área de transferência" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-zinc-500 transition hover:bg-white/[.06] hover:text-neon"><ClipboardPaste className="h-4 w-4" /></button>
        </div>

        <div className="mt-4 flex flex-col-reverse justify-between gap-3 sm:flex-row sm:items-center">
          <label className="flex cursor-pointer items-center gap-2.5 text-xs text-zinc-500">
            <input type="checkbox" checked={autoPaste} onChange={(event) => onAutoPasteChange(event.target.checked)} className="peer sr-only" />
            <span className="relative h-5 w-9 rounded-full bg-white/[.1] transition peer-checked:bg-neon/80 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-4" />
            Detectar link copiado automaticamente
          </label>
          <Button onClick={onConvert} loading={loading} disabled={!value.trim()} className="w-full sm:w-auto"><RotateCcw className="h-4 w-4" />Converter link</Button>
        </div>
      </div>
    </Panel>
  );
}
