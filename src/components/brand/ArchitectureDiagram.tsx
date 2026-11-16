// Diagrama animado dos 7 passos da arquitetura RAÍZES
import { AnimatePresence, motion } from 'framer-motion';
import { Pause, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { architectureSteps } from '../../data/content';

const N = {
  c1: { x: 70, y: 90 },
  c2: { x: 90, y: 230 },
  c3: { x: 200, y: 160 },
  r1: { x: 330, y: 80 },
  r2: { x: 340, y: 240 },
  r3: { x: 460, y: 160 },
  g1: { x: 600, y: 110 },
  g2: { x: 600, y: 250 },
  p: { x: 780, y: 160 },
  i: { x: 930, y: 160 },
};
type K = keyof typeof N;
const L = (a: K, b: K) => `M${N[a].x} ${N[a].y}L${N[b].x} ${N[b].y}`;
const path = (...ks: K[]) => ks.map((k, i) => `${i ? 'L' : 'M'}${N[k].x} ${N[k].y}`).join('');

const MESH: [K, K][] = [
  ['c1', 'c3'], ['c2', 'c3'], ['c1', 'r1'], ['c3', 'r1'], ['c3', 'r2'], ['c2', 'r2'], ['r1', 'r3'], ['r2', 'r3'], ['r1', 'g1'], ['r3', 'g1'], ['r3', 'g2'], ['r2', 'g2'],
];

// segmentos destacados e pacotes por passo
const STEP_FX: { lit: [K, K][]; packets: { d: string; color: string }[]; glow: K[] }[] = [
  { lit: [], packets: [], glow: ['c1', 'c2', 'c3'] },
  { lit: [['c1', 'c3'], ['c2', 'c3']], packets: [{ d: path('c1', 'c3'), color: '#E8742A' }, { d: path('c2', 'c3'), color: '#E8742A' }], glow: ['c3'] },
  { lit: [['c3', 'r1'], ['r1', 'r3'], ['c3', 'r2'], ['r2', 'r3']], packets: [{ d: path('c3', 'r1', 'r3'), color: '#E8742A' }, { d: path('c3', 'r2', 'r3'), color: '#E08C64' }], glow: ['r1', 'r2', 'r3'] },
  { lit: [['r3', 'g1']], packets: [{ d: path('r3', 'g1'), color: '#E8742A' }], glow: ['g1'] },
  { lit: [['g1', 'p']], packets: [{ d: path('g1', 'p'), color: '#E8742A' }], glow: ['p'] },
  { lit: [['p', 'i']], packets: [{ d: path('p', 'i'), color: '#E8742A' }], glow: ['i'] },
  {
    lit: [['i', 'p'], ['p', 'g1'], ['g1', 'r3'], ['r3', 'r1'], ['r1', 'c1']],
    packets: [{ d: path('i', 'p', 'g1', 'r3', 'r1', 'c1'), color: '#6FB38A' }],
    glow: ['c1'],
  },
];

export function ArchitectureDiagram() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(() => setStep((s) => (s + 1) % 7), step === 6 ? 3600 : 2600);
    return () => window.clearTimeout(t);
  }, [step, playing]);
  const fx = STEP_FX[step];
  const isLit = (a: K, b: K) => fx.lit.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-jenipapo-900 p-3 shadow-card sm:p-6">
        <div className="bg-roots-dark absolute inset-0" aria-hidden="true" />
        <svg viewBox="0 0 1000 320" className="relative w-full" role="img" aria-label={`Diagrama da arquitetura, passo ${step + 1}: ${architectureSteps[step].text}`}>
          {/* zonas */}
          <rect x="20" y="20" width="500" height="280" rx="24" fill="#3F9465" fillOpacity="0.06" stroke="#6FB38A" strokeOpacity="0.25" strokeDasharray="4 6" />
          <text x="40" y="46" fill="#A6D1B5" fontSize="12" fontFamily="JetBrains Mono" letterSpacing="2">REDE LOCAL LORA · SEM INTERNET</text>
          <rect x="540" y="20" width="440" height="280" rx="24" fill="#C2512E" fillOpacity="0.05" stroke="#D46C41" strokeOpacity="0.25" strokeDasharray="4 6" />
          <text x="560" y="46" fill="#ECB396" fontSize="12" fontFamily="JetBrains Mono" letterSpacing="2">INTERNET · INSTITUIÇÕES</text>

          {MESH.map(([a, b]) => (
            <path key={`${a}${b}`} d={L(a, b)} stroke={isLit(a, b) ? (step === 6 ? '#6FB38A' : '#E8742A') : '#8FA7B3'} strokeOpacity={isLit(a, b) ? 0.95 : 0.3} strokeWidth={isLit(a, b) ? 2.5 : 1.2} strokeDasharray={isLit(a, b) ? '0' : '3 6'} style={{ transition: 'all .4s' }} />
          ))}
          {(['g1', 'g2'] as K[]).map((g) => (
            <path key={g} d={L(g, 'p')} stroke={isLit(g, 'p') ? (step === 6 ? '#6FB38A' : '#E8742A') : '#ECB396'} strokeOpacity={isLit(g, 'p') ? 0.95 : g === 'g2' ? 0.25 : 0.4} strokeWidth={isLit(g, 'p') ? 2.5 : 1.4} strokeDasharray={g === 'g2' ? '6 6' : '0'} style={{ transition: 'all .4s' }} />
          ))}
          <path d={L('p', 'i')} stroke={isLit('p', 'i') ? (step === 6 ? '#6FB38A' : '#E8742A') : '#ECB396'} strokeOpacity={isLit('p', 'i') ? 0.95 : 0.4} strokeWidth={isLit('p', 'i') ? 2.5 : 1.4} style={{ transition: 'all .4s' }} />

          {/* nós */}
          {(['c1', 'c2', 'c3'] as K[]).map((k) => (
            <g key={k}>
              {fx.glow.includes(k) && <circle cx={N[k].x} cy={N[k].y} r="12" fill="none" stroke="#6FB38A"><animate attributeName="r" values="12;28" dur="1.4s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.8;0" dur="1.4s" repeatCount="indefinite" /></circle>}
              <circle cx={N[k].x} cy={N[k].y} r="12" fill="#EDE3CF" stroke="#3F9465" strokeWidth="4" />
              <circle cx={N[k].x} cy={N[k].y} r="3.5" fill="#0C1922" />
            </g>
          ))}
          {(['r1', 'r2', 'r3'] as K[]).map((k) => (
            <g key={k}>
              {fx.glow.includes(k) && <circle cx={N[k].x} cy={N[k].y} r="10" fill="none" stroke="#6FB38A"><animate attributeName="r" values="10;24" dur="1.4s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.8;0" dur="1.4s" repeatCount="indefinite" /></circle>}
              <path d={`M${N[k].x} ${N[k].y - 11}l11 11-11 11-11-11z`} fill="#12242F" stroke="#3F9465" strokeWidth="3" />
            </g>
          ))}
          {(['g1', 'g2'] as K[]).map((k) => (
            <g key={k} opacity={k === 'g2' ? 0.7 : 1}>
              {fx.glow.includes(k) && <rect x={N[k].x - 22} y={N[k].y - 22} width="44" height="44" rx="12" fill="none" stroke="#D46C41"><animate attributeName="opacity" values="1;0" dur="1.2s" repeatCount="indefinite" /></rect>}
              <rect x={N[k].x - 17} y={N[k].y - 17} width="34" height="34" rx="9" fill="#C2512E" stroke="#FCF9F3" strokeWidth="2" />
              <path d={`M${N[k].x - 5} ${N[k].y - 3}a7 7 0 0 1 10 0M${N[k].x - 8} ${N[k].y - 6}a11 11 0 0 1 16 0M${N[k].x} ${N[k].y}v8`} stroke="#FCF9F3" strokeWidth="2" fill="none" strokeLinecap="round" />
            </g>
          ))}
          <g>
            {fx.glow.includes('p') && <rect x={N.p.x - 58} y={N.p.y - 34} width="116" height="68" rx="16" fill="none" stroke="#D46C41"><animate attributeName="opacity" values="1;0" dur="1.2s" repeatCount="indefinite" /></rect>}
            <rect x={N.p.x - 52} y={N.p.y - 28} width="104" height="56" rx="14" fill="#EDE3CF" />
            <text x={N.p.x} y={N.p.y + 5} textAnchor="middle" fill="#0C1922" fontSize="14" fontWeight="700" fontFamily="Public Sans">Plataforma</text>
          </g>
          <g>
            {fx.glow.includes('i') && <circle cx={N.i.x} cy={N.i.y} r="30" fill="none" stroke="#D46C41"><animate attributeName="r" values="28;40" dur="1.4s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.9;0" dur="1.4s" repeatCount="indefinite" /></circle>}
            <circle cx={N.i.x} cy={N.i.y} r="28" fill="#12242F" stroke="#ECB396" strokeWidth="2" />
            <path d={`M${N.i.x - 13} ${N.i.y + 10}h26M${N.i.x - 11} ${N.i.y - 4}v12M${N.i.x - 4} ${N.i.y - 4}v12M${N.i.x + 4} ${N.i.y - 4}v12M${N.i.x + 11} ${N.i.y - 4}v12M${N.i.x - 14} ${N.i.y - 6}l14-9 14 9z`} stroke="#ECB396" strokeWidth="2" fill="none" strokeLinejoin="round" />
          </g>

          {/* rótulos */}
          {[
            { k: 'c2' as K, t: 'Comunidades', dy: 38 },
            { k: 'r2' as K, t: 'Retransmissão', dy: 34 },
            { k: 'g2' as K, t: 'Gateway reserva', dy: 38 },
            { k: 'g1' as K, t: 'Gateway', dy: -28 },
            { k: 'i' as K, t: 'Instituição', dy: 48 },
          ].map((l) => (
            <text key={l.t} x={N[l.k].x} y={N[l.k].y + l.dy} textAnchor="middle" fill="#CFD9DE" fontSize="12" fontFamily="Public Sans" fontWeight="600">
              {l.t}
            </text>
          ))}

          {/* pacotes */}
          <AnimatePresence>
            {fx.packets.map((p, i) => (
              <g key={`${step}-${i}`}>
                <circle r="7" fill={p.color} stroke="#fff" strokeWidth="2">
                  <animateMotion dur={step === 6 ? '2.8s' : '1.6s'} repeatCount="indefinite" path={p.d} />
                </circle>
              </g>
            ))}
          </AnimatePresence>
        </svg>
        <div className="relative mt-2 flex items-center justify-between">
          <div className="flex gap-1.5">
            {architectureSteps.map((_, i) => (
              <button key={i} onClick={() => { setStep(i); setPlaying(false); }} className={`h-2 rounded-full transition-all ${i === step ? 'w-8 bg-urucum-400' : 'w-2 bg-white/20 hover:bg-white/40'}`} aria-label={`Ir para o passo ${i + 1}`} />
            ))}
          </div>
          <button onClick={() => setPlaying((p) => !p)} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-palha-100 hover:bg-white/15">
            {playing ? <Pause className="h-3 w-3" aria-hidden="true" /> : <Play className="h-3 w-3" aria-hidden="true" />}
            {playing ? 'Pausar' : 'Reproduzir'}
          </button>
        </div>
      </div>

      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
        {architectureSteps.map((s, i) => (
          <li key={s.title}>
            <button
              onClick={() => { setStep(i); setPlaying(false); }}
              className={`flex h-full w-full gap-3 rounded-2xl p-3 text-left transition-colors lg:flex-col lg:gap-2 ${i === step ? 'bg-white shadow-card ring-1 ring-palha-300' : 'hover:bg-white/60'}`}
              aria-current={i === step}
            >
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full font-mono text-xs font-semibold ${i === step ? 'bg-urucum-500 text-white' : 'bg-palha-200 text-jenipapo-600'}`}>{i + 1}</span>
              <span>
                <span className={`block text-sm font-semibold ${i === step ? 'text-jenipapo-900' : 'text-jenipapo-700'}`}>{s.title}</span>
                <motion.span initial={false} animate={{ opacity: i === step ? 1 : 0.65 }} className="block text-sm text-jenipapo-600">
                  {s.text}
                </motion.span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
