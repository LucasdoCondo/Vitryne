import { Clock3, Copy, ExternalLink, FileText, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { HistoryItem } from '../types';
import { Button, Panel } from './ui';

interface HistoryPanelProps {
  items: HistoryItem[];
  onReuse: (item: HistoryItem) => void;
  onCopy: (text: string) => void;
}

export function HistoryPanel({ items, onReuse, onCopy }: HistoryPanelProps) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => items.filter((item) => `${item.productName ?? ''} ${item.affiliateUrl}`.toLowerCase().includes(query.toLowerCase())), [items, query]);
  return (
    <Panel className="overflow-hidden">
      <div className="flex flex-col justify-between gap-4 border-b border-white/[.07] p-5 sm:flex-row sm:items-center sm:p-6">
        <div><div className="mb-1 flex items-center gap-2 text-neon"><Clock3 className="h-4 w-4" /><span className="text-[11px] font-bold uppercase tracking-[.15em]">Arquivo local</span></div><h2 className="text-xl font-bold text-white">Histórico de campanhas</h2></div>
        <div className="relative"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtrar histórico" className="w-full rounded-lg border border-white/[.09] bg-black/[.17] py-2 pl-8 pr-3 text-xs text-white outline-none placeholder:text-zinc-700 focus:border-neon/30 sm:w-48" /></div>
      </div>
      {filtered.length === 0 ? <div className="grid min-h-52 place-items-center p-6 text-center"><div><FileText className="mx-auto mb-3 h-5 w-5 text-zinc-700" /><p className="text-sm text-zinc-500">Nenhuma campanha por aqui ainda.</p></div></div> : <div className="divide-y divide-white/[.055]">{filtered.map((item) => <HistoryRow key={item.id} item={item} onReuse={onReuse} onCopy={onCopy} />)}</div>}
    </Panel>
  );
}

function HistoryRow({ item, onReuse, onCopy }: { item: HistoryItem; onReuse: (item: HistoryItem) => void; onCopy: (text: string) => void }) {
  const label = item.marketplace === 'shopee' ? 'Shopee' : 'Mercado Livre';
  const time = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(item.createdAt));
  return <div className="flex flex-col gap-3 p-4 transition hover:bg-white/[.018] sm:flex-row sm:items-center sm:px-6"><div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[10px] font-black ${item.marketplace === 'shopee' ? 'bg-orange-400/10 text-orange-300' : 'bg-yellow-300/10 text-yellow-200'}`}>{item.marketplace === 'shopee' ? 'S' : 'ML'}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><p className="truncate text-sm font-medium text-zinc-300">{item.productName || 'Link de produto sem título'}</p><span className="text-[10px] text-zinc-600">{label} · {time}</span></div><p className="mt-1 truncate text-xs text-zinc-600">{item.affiliateUrl}</p></div><div className="flex gap-1"><button onClick={() => onReuse(item)} className="rounded-lg p-2 text-zinc-500 hover:bg-white/[.07] hover:text-neon" title="Abrir no estúdio"><ExternalLink className="h-4 w-4" /></button>{item.copy && <button onClick={() => onCopy(item.copy ?? '')} className="rounded-lg p-2 text-zinc-500 hover:bg-white/[.07] hover:text-white" title="Copiar copy"><Copy className="h-4 w-4" /></button>}</div></div>;
}
