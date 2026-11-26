// Sons gerados pela Web Audio API: sem arquivos de áudio e sem rede.
// O áudio só começa depois da primeira interação do usuário (regra dos navegadores).

export type SoundKind = 'success' | 'error' | 'info' | 'click';

const STORAGE_KEY = 'vitryne:sound-enabled';
const MASTER_VOLUME = 0.12; // volume baixo por padrão

let context: AudioContext | null = null;
let enabled = readEnabled();
const listeners = new Set<(value: boolean) => void>();

function readEnabled(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!context) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  return context;
}

/** Cria/retoma o AudioContext no primeiro gesto do usuário. */
export function installSoundUnlock(): () => void {
  const unlock = () => {
    const ctx = getContext();
    if (ctx && ctx.state === 'suspended') void ctx.resume();
  };
  const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart'];
  events.forEach((name) => window.addEventListener(name, unlock, { passive: true }));
  return () => events.forEach((name) => window.removeEventListener(name, unlock));
}

interface Tone {
  frequency: number;
  start: number; // segundos a partir de agora
  duration: number;
  type?: OscillatorType;
  gain?: number;
  slideTo?: number;
}

function playTones(tones: Tone[]): void {
  if (!enabled) return;
  const ctx = getContext();
  if (!ctx || ctx.state !== 'running') return;

  const now = ctx.currentTime;
  for (const tone of tones) {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const begin = now + tone.start;
    const end = begin + tone.duration;
    const peak = (tone.gain ?? 1) * MASTER_VOLUME;

    oscillator.type = tone.type ?? 'sine';
    oscillator.frequency.setValueAtTime(tone.frequency, begin);
    if (tone.slideTo) oscillator.frequency.exponentialRampToValueAtTime(tone.slideTo, end);

    // Envelope curto para evitar "estalos" no início e no fim.
    gain.gain.setValueAtTime(0.0001, begin);
    gain.gain.exponentialRampToValueAtTime(peak, begin + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(begin);
    oscillator.stop(end + 0.02);
  }
}

const patterns: Record<SoundKind, Tone[]> = {
  // Sucesso: duas notas ascendentes, brilhantes e curtas.
  success: [
    { frequency: 659, start: 0, duration: 0.11, type: 'sine' },
    { frequency: 880, start: 0.1, duration: 0.18, type: 'sine' },
    { frequency: 1319, start: 0.1, duration: 0.18, type: 'sine', gain: 0.35 },
  ],
  // Falha: dois tons graves descendentes, mais "ásperos".
  error: [
    { frequency: 247, start: 0, duration: 0.14, type: 'triangle', slideTo: 220 },
    { frequency: 175, start: 0.13, duration: 0.24, type: 'triangle', slideTo: 140 },
    { frequency: 123, start: 0.13, duration: 0.24, type: 'sawtooth', gain: 0.25 },
  ],
  // Informação: um toque suave e neutro.
  info: [{ frequency: 523, start: 0, duration: 0.13, type: 'sine', gain: 0.8 }],
  // Clique: tick quase imperceptível.
  click: [{ frequency: 1180, start: 0, duration: 0.035, type: 'square', gain: 0.18 }],
};

export function playSound(kind: SoundKind): void {
  try {
    playTones(patterns[kind]);
  } catch {
    // Som é um extra: nunca deve quebrar a interface.
  }
}

export function isSoundEnabled(): boolean {
  return enabled;
}

export function setSoundEnabled(value: boolean): void {
  enabled = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? 'on' : 'off');
  } catch {
    // armazenamento indisponível: mantém só em memória
  }
  listeners.forEach((listener) => listener(value));
  if (value) playSound('info');
}

export function subscribeSound(listener: (value: boolean) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
