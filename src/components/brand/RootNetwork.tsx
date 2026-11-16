// Visual do hero: raízes que se ramificam e formam uma rede; mensagens sobem pelas raízes até o sinal.
import { motion, useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';
import { mulberry32 } from '../../lib/rng';

interface Seg {
  d: string;
  depth: number;
  w: number;
}
interface Pt {
  x: number;
  y: number;
}

const W = 1200;
const H = 640;
const ROOT: Pt = { x: 600, y: 96 };

function generate(seed: number) {
  const r = mulberry32(seed);
  const segs: Seg[] = [];
  const tips: Pt[][] = []; // cadeia de pontos raiz → ponta
  const MAX = 5;

  const grow = (p: Pt, angle: number, len: number, depth: number, chain: Pt[]) => {
    const end = { x: p.x + Math.cos(angle) * len, y: p.y + Math.sin(angle) * len };
    const bend = (r() - 0.5) * len * 0.5;
    const cx = (p.x + end.x) / 2 + Math.cos(angle + Math.PI / 2) * bend;
    const cy = (p.y + end.y) / 2 + Math.sin(angle + Math.PI / 2) * bend;
    segs.push({ d: `M${p.x.toFixed(1)} ${p.y.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`, depth, w: Math.max(0.8, 3.6 - depth * 0.6) });
    const nextChain = [...chain, { x: cx, y: cy }, end];
    if (depth >= MAX || end.y > H - 30) {
      tips.push(nextChain);
      return;
    }
    const n = r() < 0.25 && depth < 3 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const spread = n === 3 ? (i - 1) * 0.55 : (i === 0 ? -1 : 1) * (0.32 + r() * 0.28);
      let a = angle + spread + (r() - 0.5) * 0.2;
      a = Math.max(0.12 * Math.PI, Math.min(0.88 * Math.PI, a)); // sempre para baixo
      grow(end, a, len * (0.74 + r() * 0.12), depth + 1, nextChain);
    }
  };

  const trunkEnd = { x: ROOT.x, y: ROOT.y + 46 };
  segs.push({ d: `M${ROOT.x} ${ROOT.y}L${trunkEnd.x} ${trunkEnd.y}`, depth: 0, w: 4 });
  [0.5 * Math.PI - 1.05, 0.5 * Math.PI - 0.4, 0.5 * Math.PI + 0.4, 0.5 * Math.PI + 1.05].forEach((a) =>
    grow(trunkEnd, a, 150 + r() * 30, 1, [ROOT, trunkEnd]),
  );

  const ends = tips.map((c) => c[c.length - 1]);
  const mesh: [Pt, Pt][] = [];
  for (let i = 0; i < ends.length; i++)
    for (let j = i + 1; j < ends.length; j++) {
      const d = Math.hypot(ends[i].x - ends[j].x, ends[i].y - ends[j].y);
      if (d > 30 && d < 92) mesh.push([ends[i], ends[j]]);
    }

  // caminhos das mensagens: da ponta até a superfície
  const routes = tips
    .filter((_, i) => i % 5 === 2)
    .slice(0, 9)
    .map((chain) => {
      const pts = [...chain].reverse();
      let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
      for (let i = 1; i + 1 < pts.length; i += 2) d += `Q${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)} ${pts[i + 1].x.toFixed(1)} ${pts[i + 1].y.toFixed(1)}`;
      d += `L${ROOT.x} ${ROOT.y}`;
      return d;
    });
  return { segs, ends, mesh, routes };
}

export function RootNetwork({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion();
  const { segs, ends, mesh, routes } = useMemo(() => generate(7), []);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label="Ilustração: raízes ramificadas formando uma rede; mensagens sobem pelas raízes até o ponto de sinal">
      <defs>
        <radialGradient id="rn-glow" cx="50%" cy="15%" r="60%">
          <stop offset="0%" stopColor="#D46C41" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#D46C41" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rn-root" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EDE3CF" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#8FA7B3" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="rn-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.6" stopColor="white" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask id="rn-mask">
          <rect width={W} height={H} fill="url(#rn-fade)" />
        </mask>
      </defs>
      <rect width={W} height={H} fill="url(#rn-glow)" />
      {/* superfície */}
      <path d={`M0 ${ROOT.y + 2} Q ${W / 2} ${ROOT.y - 10} ${W} ${ROOT.y + 2}`} stroke="#EDE3CF" strokeOpacity="0.14" strokeWidth="1" fill="none" />
      {/* ondas de rádio saindo da superfície */}
      {[0, 1, 2].map((i) => (
        <motion.path
          key={i}
          d={`M${ROOT.x - 26 - i * 22} ${ROOT.y - 18 - i * 14} a ${34 + i * 30} ${34 + i * 30} 0 0 1 ${52 + i * 44} 0`}
          stroke="#D46C41"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={reduce ? { opacity: 0.6 } : { opacity: [0, 0.9, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.4, ease: 'easeOut' }}
        />
      ))}
      <g mask="url(#rn-mask)">
        {mesh.map(([a, b], i) => (
          <motion.line
            key={`m${i}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="#6FB38A"
            strokeOpacity="0.4"
            strokeWidth="1"
            strokeDasharray="2 5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 + (i % 20) * 0.05, duration: 0.8 }}
          />
        ))}
        {segs.map((s, i) => (
          <motion.path
            key={i}
            d={s.d}
            stroke="url(#rn-root)"
            strokeWidth={s.w}
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: reduce ? 1 : 0, opacity: 0.2 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: s.depth * 0.32, duration: 0.7, ease: 'easeOut' }}
          />
        ))}
        {ends.map((p, i) => (
          <motion.g key={`e${i}`} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.7 + (i % 12) * 0.06 }} style={{ transformOrigin: `${p.x}px ${p.y}px` }}>
            {i % 4 === 0 && !reduce && (
              <circle cx={p.x} cy={p.y} r="4" fill="none" stroke="#6FB38A" strokeOpacity="0.7">
                <animate attributeName="r" values="4;14" dur="2.6s" begin={`${(i % 7) * 0.35}s`} repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.7;0" dur="2.6s" begin={`${(i % 7) * 0.35}s`} repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={p.x} cy={p.y} r={i % 4 === 0 ? 4 : 2.6} fill={i % 4 === 0 ? '#6FB38A' : '#EDE3CF'} fillOpacity={i % 4 === 0 ? 1 : 0.7} />
          </motion.g>
        ))}
        {!reduce &&
          routes.map((d, i) => (
            <circle key={`p${i}`} r="3.6" fill={i % 3 === 0 ? '#E8742A' : '#EDE3CF'} opacity="0">
              <animateMotion dur={`${3.4 + (i % 4) * 0.7}s`} begin={`${2.4 + i * 0.9}s`} repeatCount="indefinite" path={d} />
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.85;1" dur={`${3.4 + (i % 4) * 0.7}s`} begin={`${2.4 + i * 0.9}s`} repeatCount="indefinite" />
            </circle>
          ))}
      </g>
      <circle cx={ROOT.x} cy={ROOT.y} r="7" fill="#D46C41" />
      <circle cx={ROOT.x} cy={ROOT.y} r="13" fill="none" stroke="#D46C41" strokeOpacity="0.4" />
    </svg>
  );
}
