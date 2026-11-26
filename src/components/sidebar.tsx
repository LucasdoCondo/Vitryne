import { Archive, Bot, ChevronLeft, ChevronRight, History, LayoutDashboard, Link2, Megaphone, Settings2 } from 'lucide-react';
import { useState } from 'react';
import type { HealthStatus, WorkspaceSection } from '../types';

interface SidebarProps {
  active: WorkspaceSection;
  onNavigate: (section: WorkspaceSection) => void;
  health: HealthStatus | null;
}

const navigation: Array<{ id: WorkspaceSection; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'workspace', label: 'Conversor & Copy', icon: Link2 },
  { id: 'campaigns', label: 'Campanhas', icon: Megaphone },
  { id: 'automation', label: 'Automação', icon: Bot },
  { id: 'history', label: 'Histórico', icon: History },
  { id: 'settings', label: 'Configurações', icon: Settings2 },
];

export function Sidebar({ active, onNavigate, health }: SidebarProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside className={`relative z-10 flex w-full flex-col border-b border-cyan/[.1] bg-[#081329]/55 px-3 py-3 backdrop-blur-2xl transition-[width] duration-300 lg:min-h-screen lg:border-b-0 lg:border-r lg:px-3 lg:py-5 ${expanded ? 'lg:w-[218px]' : 'lg:w-[76px]'}`}>
      <div className={`mb-4 flex items-center ${expanded ? 'gap-3 px-2' : 'justify-center'} lg:mb-8`}>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cyan/25 bg-cyan/[.09] text-cyan shadow-[0_0_20px_rgba(0,240,255,.13)]"><Archive className="h-4 w-4" /></div>
        <div className={`${expanded ? 'block' : 'hidden'} min-w-0`}>
          <p className="font-display text-lg font-bold tracking-tight text-white">vitryne</p>
          <p className="text-[9px] font-semibold uppercase tracking-[.18em] text-cyan/70">affiliate studio</p>
        </div>
      </div>

      <nav className="flex items-center justify-center gap-1 overflow-x-auto lg:flex-col lg:items-stretch lg:overflow-visible">
        {navigation.map((item) => {
          const Icon = item.icon;
          const selected = active === item.id;
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)} title={expanded ? undefined : item.label} aria-label={item.label} aria-current={selected ? 'page' : undefined} className={`group flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${expanded ? '' : 'lg:justify-center lg:px-0'} ${selected ? 'bg-cyan/[.1] text-cyan shadow-[inset_0_0_0_1px_rgba(0,240,255,.12)]' : 'text-slate-400 hover:bg-white/[.045] hover:text-white'}`}>
              <Icon className={`h-[18px] w-[18px] shrink-0 ${selected ? 'drop-shadow-[0_0_7px_rgba(0,240,255,.7)]' : ''}`} />
              <span className={`${expanded ? 'inline' : 'hidden'} flex-1 whitespace-nowrap font-medium`}>{item.label}</span>
              {selected && expanded && <span className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_8px_#00f0ff]" />}
            </button>
          );
        })}
      </nav>

      <div className="hidden flex-1 lg:block" />
      <div className={`hidden rounded-2xl border border-cyan/[.1] bg-white/[.025] p-3 lg:block ${expanded ? '' : 'text-center'}`}>
        <div className={`mb-3 flex items-center ${expanded ? 'justify-between' : 'justify-center'}`}>
          {expanded && <span className="text-[9px] font-bold uppercase tracking-[.14em] text-slate-500">API local</span>}
          <span className={`h-2 w-2 rounded-full ${health?.online ? 'bg-cyan shadow-[0_0_9px_#00f0ff]' : 'bg-amber-300 animate-pulse'}`} />
        </div>
        {expanded && <div className="space-y-2 text-[10px] text-slate-400"><StatusRow label="Gemini AI" active={Boolean(health?.services.gemini)} /><StatusRow label="Telegram" active={Boolean(health?.services.telegram)} /></div>}
      </div>
      <button onClick={() => setExpanded((value) => !value)} className="mt-4 hidden h-9 items-center justify-center rounded-xl border border-cyan/[.1] text-slate-500 transition hover:border-cyan/25 hover:text-cyan lg:flex" aria-label={expanded ? 'Recolher menu lateral' : 'Expandir menu lateral'} title={expanded ? 'Recolher menu' : 'Expandir menu'}>
        {expanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
    </aside>
  );
}

function StatusRow({ label, active }: { label: string; active: boolean }) {
  return <div className="flex justify-between"><span>{label}</span><span className={active ? 'text-cyan' : 'text-slate-600'}>{active ? 'online' : 'setup'}</span></div>;
}
