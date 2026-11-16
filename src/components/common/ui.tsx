import { animate, motion, useInView, useMotionValue, useReducedMotion } from 'framer-motion';
import {
  AlertOctagon,
  CloudRain,
  Flame,
  HeartPulse,
  HandHelping,
  ShieldAlert,
  Thermometer,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { categoryInfo, priorityInfo, statusInfo } from '../../data/catalog';
import { fmtNum } from '../../lib/format';
import type { Category, OccurrenceStatus, Priority } from '../../lib/types';

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return now;
}

export const categoryIcon: Record<Category, LucideIcon> = {
  fumaca: Flame,
  rio: Waves,
  chuva: CloudRain,
  temperatura: Thermometer,
  denuncia_territorial: AlertOctagon,
  ameaca: ShieldAlert,
  saude: HeartPulse,
  apoio: HandHelping,
};

export function CategoryIcon({ category, className = 'h-4 w-4' }: { category: Category; className?: string }) {
  const Icon = categoryIcon[category];
  return <Icon className={className} aria-hidden="true" />;
}

export function PriorityBadge({ priority, size = 'sm' }: { priority: Priority; size?: 'sm' | 'md' }) {
  const p = priorityInfo[priority];
  return (
    <span
      className={`chip ${size === 'md' ? 'px-3 py-1.5 text-sm' : ''}`}
      style={{ background: p.soft, color: priority === 'media' ? '#7A5B00' : p.color, boxShadow: `inset 0 0 0 1px ${p.color}40` }}
    >
      <span className="relative flex h-2 w-2">
        {priority === 'critica' && <span className="absolute inset-0 animate-ping rounded-full" style={{ background: p.color }} />}
        <span className="relative h-2 w-2 rounded-full" style={{ background: p.color }} />
      </span>
      Prioridade {p.label.toLowerCase()}
    </span>
  );
}

const statusStyle: Record<OccurrenceStatus, string> = {
  validacao: 'bg-amber-50 text-amber-800 ring-amber-300/60',
  registrada: 'bg-sky-50 text-sky-800 ring-sky-300/60',
  encaminhada: 'bg-indigo-50 text-indigo-800 ring-indigo-300/60',
  confirmada: 'bg-violet-50 text-violet-800 ring-violet-300/60',
  em_atendimento: 'bg-orange-50 text-orange-800 ring-orange-300/60',
  respondida: 'bg-floresta-50 text-floresta-700 ring-floresta-300/60',
  encerrada: 'bg-palha-200 text-jenipapo-600 ring-palha-400/60',
};

export function StatusBadge({ status }: { status: OccurrenceStatus }) {
  return <span className={`chip ring-1 ring-inset ${statusStyle[status]}`}>{statusInfo[status].label}</span>;
}

export function CategoryLabel({ category, className = '' }: { category: Category; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <CategoryIcon category={category} />
      {categoryInfo[category].label}
    </span>
  );
}

export function CountUp({ value, decimals = 0, duration = 1.4, suffix = '' }: { value: number; decimals?: number; duration?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const reduce = useReducedMotion();
  const first = useRef(true);
  useEffect(() => {
    if (!inView) return;
    const from = first.current ? 0 : mv.get();
    first.current = false;
    if (reduce) {
      mv.set(value);
      if (ref.current) ref.current.textContent = fmtNum(value, decimals) + suffix;
      return;
    }
    const c = animate(from, value, {
      duration: from === 0 ? duration : 0.6,
      ease: 'easeOut',
      onUpdate: (v) => {
        mv.set(v);
        if (ref.current) ref.current.textContent = fmtNum(v, decimals) + suffix;
      },
    });
    return () => c.stop();
  }, [value, inView, decimals, duration, suffix, mv, reduce]);
  return <span ref={ref}>{fmtNum(0, decimals) + suffix}</span>;
}

export function LiveDot({ color = '#3F9465', size = 10 }: { color?: string; size?: number }) {
  return (
    <span className="relative inline-flex" style={{ width: size, height: size }} aria-hidden="true">
      <span className="absolute inset-0 animate-ping2 rounded-full" style={{ background: color }} />
      <span className="relative rounded-full" style={{ width: size, height: size, background: color }} />
    </span>
  );
}

export function SectionTitle({ eyebrow, title, children, dark = false }: { eyebrow?: string; title: ReactNode; children?: ReactNode; dark?: boolean }) {
  return (
    <div className="max-w-3xl">
      {eyebrow && <p className={`eyebrow ${dark ? 'text-urucum-300' : 'text-urucum-600'}`}>{eyebrow}</p>}
      <h2 className={`mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl ${dark ? 'text-palha-100' : 'text-jenipapo-900'}`}>{title}</h2>
      {children && <p className={`mt-3 text-base leading-relaxed ${dark ? 'text-palha-300/80' : 'text-jenipapo-600'}`}>{children}</p>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, children, right }: { eyebrow: string; title: ReactNode; children?: ReactNode; right?: ReactNode }) {
  return (
    <div className="relative overflow-hidden border-b border-palha-300/60 bg-palha-50">
      <div className="bg-roots absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="container-r relative flex flex-col gap-4 py-8 sm:py-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow text-urucum-600">{eyebrow}</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-jenipapo-900 sm:text-4xl">{title}</h1>
          {children && <p className="mt-2 max-w-2xl text-jenipapo-600">{children}</p>}
        </div>
        {right}
      </div>
    </div>
  );
}

export function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
