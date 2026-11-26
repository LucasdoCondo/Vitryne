import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cva } from 'class-variance-authority';
import { CheckCircle2, CircleAlert, Info, LoaderCircle } from 'lucide-react';
import type { ToastMessage } from '../types';
import { cn } from '../lib/utils';
import { playSound } from '../lib/sound';

const buttonVariants = cva('inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-45', {
  variants: {
    variant: {
      primary: 'bg-cyan text-[#061326] hover:bg-[#79f7ff] shadow-[0_0_22px_rgba(0,240,255,.16)]',
      secondary: 'bg-cyan/[.045] text-slate-100 border border-cyan/[.16] hover:bg-cyan/[.09] hover:border-cyan/30',
      ghost: 'bg-transparent text-zinc-400 hover:text-white hover:bg-white/[.05]',
      danger: 'bg-rose-400/10 text-rose-300 border border-rose-400/20 hover:bg-rose-400/15',
    },
  },
  defaultVariants: { variant: 'primary' },
});

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}

export function Button({ children, className = '', loading = false, variant = 'primary', disabled, onClick, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant }), className)}
      disabled={disabled || loading}
      onClick={(event) => { playSound('click'); onClick?.(event); }}
      {...props}
    >
      {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`glass-panel rounded-2xl border shadow-glow ${className}`}>{children}</section>;
}

export function FieldLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <label className="text-xs font-semibold uppercase tracking-[.13em] text-zinc-500">{children}</label>
      {hint && <span className="text-[11px] text-zinc-600">{hint}</span>}
    </div>
  );
}

export function Toasts({ toasts }: { toasts: ToastMessage[] }) {
  const icon = { success: CheckCircle2, error: CircleAlert, info: Info };
  const colors = {
    success: 'animate-pop text-neon border-neon/25 shadow-[0_0_26px_rgba(0,240,255,.14)]',
    error: 'animate-shake text-rose-300 border-rose-400/30 shadow-[0_0_26px_rgba(251,113,133,.16)]',
    info: 'animate-enter text-violet border-violet/20',
  };
  return (
    <div aria-live="polite" className="pointer-events-none fixed right-5 top-5 z-50 flex w-[calc(100%-2.5rem)] max-w-sm flex-col gap-3">
      {toasts.map((toast) => {
        const Icon = icon[toast.type];
        return (
          <div key={toast.id} role={toast.type === 'error' ? 'alert' : 'status'} className={`flex gap-3 rounded-xl border bg-[#12151d]/60 p-4 shadow-2xl backdrop-blur-2xl ${colors[toast.type]}`}>
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-white">{toast.title}</p>
              {toast.description && <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">{toast.description}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
