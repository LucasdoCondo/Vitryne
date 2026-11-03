import { Archive, ArrowUpRight, Bot, ChevronRight, CircleDollarSign, Gauge, History, Settings2, Sparkles } from 'lucide-react';
import type { HealthStatus, WorkspaceSection } from '../types';

interface SidebarProps {
  active: WorkspaceSection;
  onNavigate: (section: WorkspaceSection) => void;
  health: HealthStatus | null;
}

const navigation: Array<{ id: WorkspaceSection; label: string; icon: typeof Gauge; badge?: string }> = [
  { id: 'workspace', label: 'Conversor & Copy', icon: Sparkles },
  { id: 'automation', label: 'Automação', icon: Bot },
  { id: 'history', label: 'Histórico', icon: History },
  { id: 'settings', label: 'Configurações', icon: Settings2 },
];

export function Sidebar({ active, onNavigate, health }: SidebarProps) {
  const apiOnline = health?.online;
  return (
    <aside className="flex w-full flex-col border-b border-white/[.07] bg-[#0d0f14]/85 px-5 py-5 lg:min-h-screen lg:w-[260px] lg:border-b-0 lg:border-r lg:px-4">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-neon text-[#10170a] shadow-[0_0_28px_rgba(163,255,93,.27)]"><Archive className="h-4 w-4" /></div>
        <div>
          <p className="font-display text-lg font-bold tracking-tight text-white">vitryne</p>
          <p className="text-[9px] font-semibold uppercase tracking-[.18em] text-neon/70">affiliate cockpit</p>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {navigation.map((item) => {
          const Icon = item.icon;
          const selected = active === item.id;
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)} className={`group flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${selected ? 'bg-neon/[.09] text-neon' : 'text-zinc-500 hover:bg-white/[.04] hover:text-zinc-200'}`}>
              <Icon className="h-[18px] w-[18px]" />
              <span className="flex-1 font-medium">{item.label}</span>
              {selected && <ChevronRight className="h-4 w-4" />}
            </button>
          );
        })}
      </nav>

      <div className="mt-8 hidden lg:block" />
      <div className="mt-5 rounded-2xl border border-white/[.07] bg-white/[.025] p-3 lg:mt-auto">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[.14em] text-zinc-600">System status</span>
          <span className={`h-2 w-2 rounded-full ${apiOnline ? 'bg-neon shadow-[0_0_9px_#a3ff5d]' : 'bg-amber-300 animate-pulse'}`} />
        </div>
        <div className="space-y-2 text-xs text-zinc-500">
          <StatusRow label="Local API" active={Boolean(apiOnline)} />
          <StatusRow label="Gemini AI" active={Boolean(health?.services.gemini)} />
          <StatusRow label="Telegram" active={Boolean(health?.services.telegram)} />
        </div>
        <button onClick={() => onNavigate('settings')} className="mt-4 flex w-full items-center justify-between rounded-lg bg-white/[.04] px-2.5 py-2 text-[11px] text-zinc-400 transition hover:text-white">
          Conectar serviços <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mt-4 hidden px-2 text-[10px] text-zinc-700 lg:block">v0.1.0 · dados locais</p>
    </aside>
  );
}

function StatusRow({ label, active }: { label: string; active: boolean }) {
  return <div className="flex justify-between"><span>{label}</span><span className={active ? 'text-neon/80' : 'text-zinc-600'}>{active ? 'online' : 'setup'}</span></div>;
}
