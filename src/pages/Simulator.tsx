// Simulador de mensagem: dispositivo → IA offline → pacote → saltos → gateway → plataforma → instituição → confirmação
import { AnimatePresence, motion } from 'framer-motion';
import {
  BrainCircuit,
  Building2,
  Check,
  CheckCheck,
  FileJson2,
  Lock,
  Mic,
  RadioTower,
  RotateCcw,
  Send,
  Smartphone,
  Square,
  Undo2,
  Waypoints,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CategoryIcon, PriorityBadge } from '../components/common/ui';
import { JsonView } from '../components/common/JsonView';
import { NetworkMap } from '../components/map/NetworkMap';
import { categoryInfo, institutionInfo, priorityInfo } from '../data/catalog';
import { MAX_PAYLOAD_BYTES, territories } from '../data/network';
import { communityNodes } from '../data/occurrences';
import { classify, type ClassifyResult } from '../lib/classifier';
import { buildOccurrence, compactPacket } from '../lib/factory';
import { bytesOf, fmtNum, fmtTime } from '../lib/format';
import { nodeById, routeBetween, routeToGateway } from '../lib/graph';
import { PACKET_COLORS, useNetwork, type MapPacket } from '../store/NetworkContext';

const DEFAULT_TEXT = 'Tem gente entrando no território sem autorização e ameaçando os moradores. Precisamos comunicar isso.';

const PRESETS = [
  { label: 'Invasão', text: DEFAULT_TEXT },
  { label: 'Queimada', text: 'Tem fumaça forte vindo do lado da cabeceira, parece fogo grande perto das roças.' },
  { label: 'Saúde', text: 'Criança com febre alta há dois dias e vomitando. Precisamos de atendimento urgente.' },
  { label: 'Garimpo', text: 'Apareceu uma balsa de garimpo no rio, abaixo da comunidade. A água está ficando barrenta.' },
  { label: 'Rio subindo', text: 'O rio está subindo rápido, a água já chegou perto das casas baixas.' },
];

const STAGES = [
  { icon: Smartphone, title: 'Mensagem criada no dispositivo' },
  { icon: BrainCircuit, title: 'IA offline organiza o relato' },
  { icon: FileJson2, title: 'Pacote compacto gerado' },
  { icon: Waypoints, title: 'Saltando pela rede mesh' },
  { icon: RadioTower, title: 'Gateway → registrada na plataforma' },
  { icon: Building2, title: 'Encaminhada à instituição' },
  { icon: Undo2, title: 'Confirmação volta à comunidade' },
];

interface Hop {
  id: string;
  rssi: number;
  snr: number;
  at: number;
}

interface Run {
  originId: string;
  text: string;
  cls: ClassifyResult;
  route: string[];
  back: string[];
  hopMs: number;
  backMs: number;
  packet: Record<string, unknown>;
  bytes: number;
  occId: string;
  startedAt: number;
  institution: keyof typeof institutionInfo;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function pickDefaultOrigin(down: Set<string>) {
  const withHops = communityNodes
    .map((n) => ({ n, h: (routeToGateway(n.id, down)?.length ?? 0) - 1 }))
    .filter((x) => x.h > 0);
  // prefere uma origem com 4 saltos: rota visível e demonstração em ~18 s
  return (withHops.find((x) => x.n.id === 'MFD-04' && x.h === 4) ?? withHops.find((x) => x.h === 4) ?? withHops.sort((a, b) => b.h - a.h)[0]).n.id;
}

/* ------------------------------------------------------------ cronômetro sem re-render */
function Stopwatch({ startedAt, running }: { startedAt: number | null; running: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!startedAt) {
      if (ref.current) ref.current.textContent = '00,0 s';
      return;
    }
    let raf = 0;
    const tick = () => {
      const s = (performance.now() - startedAt) / 1000;
      if (ref.current) ref.current.textContent = `${s < 10 ? '0' : ''}${s.toFixed(1).replace('.', ',')} s`;
      if (running) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [startedAt, running]);
  return <span ref={ref} className="font-mono tabular-nums" />;
}

/* ------------------------------------------------------------ mock do dispositivo (estilo T-Deck) */
function Device({ origin, lines, recording }: { origin: string; lines: { text: string; tone?: 'ok' | 'warn' | 'muted' | 'msg' }[]; recording: boolean }) {
  const n = nodeById[origin];
  return (
    <div className="mx-auto w-full max-w-[300px] rounded-[26px] bg-gradient-to-b from-[#2a2f33] to-[#16191c] p-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="font-mono text-[9px] tracking-widest text-white/40">RAÍZES · LORA</span>
        <span className="flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-floresta-400 shadow-[0_0_6px_#3F9465]" />
          <span className={`h-1.5 w-1.5 rounded-full ${recording ? 'animate-pulse bg-urucum-400' : 'bg-white/20'}`} />
        </span>
      </div>
      <div className="relative h-[168px] overflow-hidden rounded-xl bg-[#0b1410] p-2.5 font-mono text-[11px] leading-snug text-[#cfe9d6] ring-1 ring-black">
        <div className="flex justify-between border-b border-[#cfe9d6]/15 pb-1 text-[9px] text-[#cfe9d6]/70">
          <span>{n.id}</span>
          <span>▂▄▆ {n.battery}%</span>
        </div>
        <div className="mt-1.5 space-y-1">
          <AnimatePresence initial={false}>
            {lines.slice(-5).map((l, i) => (
              <motion.p
                key={`${l.text}-${i}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={
                  l.tone === 'msg'
                    ? 'line-clamp-3 rounded-md bg-[#cfe9d6]/10 px-1.5 py-1 text-[#e9f7ec]'
                    : l.tone === 'ok'
                      ? 'text-[#7fe0a0]'
                      : l.tone === 'warn'
                        ? 'text-[#ffb27a]'
                        : 'text-[#cfe9d6]/55'
                }
              >
                {l.text}
              </motion.p>
            ))}
          </AnimatePresence>
          <span className="inline-block h-3 w-1.5 animate-blink bg-[#cfe9d6]/70 align-middle" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-3 grid gap-1" aria-hidden="true">
        {['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].map((row) => (
          <div key={row} className="flex justify-center gap-1">
            {row.split('').map((k) => (
              <span key={k} className="grid h-4 w-[22px] place-items-center rounded-[4px] bg-white/[0.07] text-[7px] text-white/40 shadow-[inset_0_-1px_0_rgba(0,0,0,0.5)]">
                {k}
              </span>
            ))}
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-[9px] text-white/30">{n.name} · {territories.find((t) => t.id === n.territoryId)?.short}</p>
    </div>
  );
}

/* ------------------------------------------------------------ linha da etapa */
function StageRow({ i, phase, summary, children, time }: { i: number; phase: number; summary?: ReactNode; children?: ReactNode; time?: string }) {
  const S = STAGES[i];
  const state = phase > i ? 'done' : phase === i ? 'active' : 'todo';
  return (
    <li className="relative pl-11">
      {i < STAGES.length - 1 && (
        <span className="absolute left-[15px] top-8 h-[calc(100%-16px)] w-px bg-white/10" aria-hidden="true">
          <motion.span className="absolute inset-x-0 top-0 bg-urucum-400" initial={false} animate={{ height: phase > i ? '100%' : '0%' }} transition={{ duration: 0.4 }} />
        </span>
      )}
      <span
        className={`absolute left-0 top-0 grid h-8 w-8 place-items-center rounded-full ring-1 transition-colors duration-300 ${
          state === 'done' ? 'bg-urucum-500 text-white ring-urucum-400' : state === 'active' ? 'bg-urucum-500/20 text-urucum-200 ring-urucum-400' : 'bg-white/5 text-palha-300/40 ring-white/10'
        }`}
      >
        {state === 'done' ? <Check className="h-4 w-4" aria-hidden="true" /> : <S.icon className="h-4 w-4" aria-hidden="true" />}
        {state === 'active' && <span className="absolute inset-0 animate-ping2 rounded-full ring-2 ring-urucum-400/60" aria-hidden="true" />}
      </span>
      <div className="pb-4">
        <div className="flex min-h-8 items-center justify-between gap-2">
          <p className={`text-sm font-semibold ${state === 'todo' ? 'text-palha-300/40' : 'text-palha-100'}`}>{S.title}</p>
          {time && state !== 'todo' && <span className="font-mono text-[11px] text-palha-300/50">{time}</span>}
        </div>
        <AnimatePresence initial={false}>
          {state === 'done' && summary && (
            <motion.p key="s" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-xs text-palha-300/70">
              {summary}
            </motion.p>
          )}
          {state === 'active' && children && (
            <motion.div key="c" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
              <div className="pt-2">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </li>
  );
}

function Thinking() {
  return (
    <span className="inline-flex items-center gap-1" aria-label="processando">
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-urucum-300" animate={{ opacity: [0.2, 1, 0.2], y: [0, -2, 0] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }} />
      ))}
    </span>
  );
}

function Field({ label, value, show, children }: { label: string; value?: string; show: boolean; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 py-1.5 last:border-0">
      <span className="text-xs text-palha-300/60">{label}</span>
      {show ? (
        <motion.span initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="text-right text-sm font-semibold text-palha-100">
          {children ?? value}
        </motion.span>
      ) : (
        <span className="h-3 w-24 animate-shimmer rounded bg-[linear-gradient(90deg,rgba(255,255,255,0.04),rgba(255,255,255,0.14),rgba(255,255,255,0.04))] bg-[length:200%_100%]" />
      )}
    </div>
  );
}

/* ------------------------------------------------------------ página */
export function Simulator() {
  const { down, nextId, addOccurrence, updateOccurrence, logPacket } = useNetwork();
  const [origin, setOrigin] = useState(() => pickDefaultOrigin(down));
  const [text, setText] = useState(DEFAULT_TEXT);
  const [mic, setMic] = useState<'idle' | 'recording' | 'transcribing'>('idle');
  const [phase, setPhase] = useState(-1);
  const [run, setRun] = useState<Run | null>(null);
  const [aiFields, setAiFields] = useState(0);
  const [hops, setHops] = useState<Hop[]>([]);
  const [backHops, setBackHops] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [packets, setPackets] = useState<MapPacket[]>([]);
  const [deviceLines, setDeviceLines] = useState<{ text: string; tone?: 'ok' | 'warn' | 'muted' | 'msg' }[]>([{ text: 'Rede RAÍZES · canal comunitário', tone: 'muted' }, { text: 'Pronto para enviar.', tone: 'muted' }]);
  const timers = useRef<number[]>([]);

  const at = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  const clearAll = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);
  useEffect(() => clearAll, [clearAll]);

  const running = phase >= 0 && phase < STAGES.length;
  const done = phase >= STAGES.length;
  const previewRoute = useMemo(() => routeToGateway(origin, down), [origin, down]);

  const grouped = useMemo(
    () => territories.map((t) => ({ t, nodes: communityNodes.filter((n) => n.territoryId === t.id && !down.has(n.id)) })).filter((g) => g.nodes.length),
    [down],
  );

  const reset = useCallback(() => {
    clearAll();
    setPhase(-1);
    setRun(null);
    setAiFields(0);
    setHops([]);
    setBackHops(0);
    setConfirmed(false);
    setPackets([]);
    setDeviceLines([{ text: 'Rede RAÍZES · canal comunitário', tone: 'muted' }, { text: 'Pronto para enviar.', tone: 'muted' }]);
  }, [clearAll]);

  const record = () => {
    if (mic !== 'idle' || running) return;
    setMic('recording');
    setText('');
    const target = PRESETS.find((p) => p.text === text)?.text ?? DEFAULT_TEXT;
    at(2400, () => {
      setMic('transcribing');
      const words = target.split(' ');
      words.forEach((_, i) => at(i * 70, () => setText(words.slice(0, i + 1).join(' '))));
      at(words.length * 70 + 150, () => setMic('idle'));
    });
  };

  const send = () => {
    if (running || !text.trim()) return;
    const route = routeToGateway(origin, down);
    if (!route) return;
    clearAll();
    const H = route.length - 1;
    const hopMs = clamp(4800 / H, 750, 1300);
    const backMs = clamp(2600 / H, 450, 750);
    const gw = route[route.length - 1];
    const back = routeBetween(gw, origin, down) ?? [...route].reverse();
    const cls = classify(text);
    const occId = nextId();
    const institution = categoryInfo[cls.category].institution;
    const createdAt = Date.now();
    const packet = compactPacket({ id: occId, kind: 'comunitaria', category: cls.category, typeCode: cls.typeCode, priority: cls.priority, originNodeId: origin, createdAt, report: text.trim(), institution });
    const bytes = bytesOf(packet);
    const r: Run = { originId: origin, text: text.trim(), cls, route, back, hopMs, backMs, packet, bytes, occId, startedAt: performance.now(), institution };
    setRun(r);
    setAiFields(0);
    setHops([]);
    setBackHops(0);
    setConfirmed(false);
    setPackets([]);
    setPhase(0);
    setDeviceLines([
      { text: '> Nova mensagem', tone: 'muted' },
      { text: r.text, tone: 'msg' },
      { text: 'Enviando para a rede…', tone: 'muted' },
    ]);

    // cronograma (ms)
    const T_AI = 1100;
    const T_PKT = 4700;
    const T_MESH = 6200;
    const T_GW = T_MESH + H * hopMs + 150;
    const T_FWD = T_GW + 1700;
    const T_CONF = T_FWD + 1000;
    const T_BACK = T_FWD + 1900;
    const T_DONE = T_BACK + H * backMs + 500;

    at(T_AI, () => {
      setPhase(1);
      setDeviceLines((l) => [...l, { text: 'IA local interpretando…', tone: 'muted' }]);
    });
    [700, 1350, 2000, 2650].forEach((d, i) => at(T_AI + d, () => setAiFields(i + 1)));
    at(T_PKT, () => {
      setPhase(2);
      setDeviceLines((l) => [...l, { text: `${categoryInfo[cls.category].code} · prioridade ${priorityInfo[cls.priority].label.toUpperCase()}`, tone: 'warn' }]);
    });
    at(T_MESH, () => {
      setPhase(3);
      setDeviceLines((l) => [...l, { text: `Transmitido ✓ (${bytes} B)`, tone: 'ok' }]);
      setPackets([{ id: `${occId}-up`, path: route, hopMs, color: PACKET_COLORS.RELATO, startAt: performance.now(), kind: 'RELATO' }]);
      route.slice(1).forEach((id, i) =>
        at((i + 1) * hopMs, () => setHops((h) => [...h, { id, rssi: -Math.round(84 + Math.random() * 30), snr: +(-3 + Math.random() * 12).toFixed(1), at: Date.now() }])),
      );
    });
    at(T_GW, () => {
      setPhase(4);
      const occ = buildOccurrence({
        id: occId, kind: 'comunitaria', category: cls.category, type: cls.type, priority: cls.priority, originNodeId: origin,
        createdAt, status: 'registrada', report: r.text, down, rand: Math.random, route, hopMs: [hopMs, hopMs + 1],
        ai: { recipient: cls.recipient, confidence: +cls.confidence.toFixed(2) },
      });
      if (occ) addOccurrence({ ...occ, packet, live: true, arrivedAt: Date.now() });
      logPacket({ at: Date.now(), originId: origin, gatewayId: gw, hops: H, rssi: -96, snr: 5.5, kind: 'RELATO', payload: JSON.stringify({ ...packet, txt: `«cifrado ${r.text.length} B»` }), bytes: bytes + 16 });
    });
    at(T_FWD, () => {
      setPhase(5);
      updateOccurrence(occId, (o) => ({
        ...o, status: 'encaminhada', institution,
        timeline: [...o.timeline, { key: 'encaminhada', label: `Encaminhada ao ${institutionInfo[institution].label}`, detail: 'Envio registrado automaticamente', at: Date.now() }],
      }));
    });
    at(T_CONF, () => {
      setConfirmed(true);
      updateOccurrence(occId, (o) => ({
        ...o, status: 'confirmada',
        timeline: [...o.timeline, { key: 'confirmada', label: 'Recebimento confirmado pela instituição', detail: institutionInfo[institution].label, at: Date.now() }],
      }));
    });
    at(T_BACK, () => {
      setPhase(6);
      setPackets((p) => [...p, { id: `${occId}-ack`, path: back, hopMs: backMs, color: PACKET_COLORS.ACK, startAt: performance.now(), kind: 'ACK' }]);
      back.slice(1).forEach((_, i) => at((i + 1) * backMs, () => setBackHops(i + 1)));
    });
    at(T_DONE - 300, () => {
      setDeviceLines((l) => [...l, { text: `✓ Recebido · ${institutionInfo[institution].label}`, tone: 'ok' }, { text: fmtTime(Date.now()), tone: 'muted' }]);
      updateOccurrence(occId, (o) => ({
        ...o,
        timeline: [...o.timeline, { key: 'entregue', label: `Confirmação entregue no dispositivo ${nodeById[origin].name}`, detail: `${back.length - 1} saltos de volta`, at: Date.now(), nodeId: origin }],
      }));
      logPacket({ at: Date.now(), originId: gw, gatewayId: gw, hops: back.length - 1, rssi: -90, snr: 7.2, kind: 'ACK', payload: JSON.stringify({ t: 'ACK', ref: occId.slice(-4).toLowerCase(), dst: packet.src, by: institution.toUpperCase().replace('_', '') }), bytes: 34 });
    });
    at(T_DONE, () => setPhase(STAGES.length));
  };

  const elapsedLabel = (ms: number) => `+${(ms / 1000).toFixed(1).replace('.', ',')} s`;
  const H = run ? run.route.length - 1 : 0;
  const offsets = run
    ? [0, 1100, 4700, 6200, 6200 + H * run.hopMs + 150, 6200 + H * run.hopMs + 1850, 6200 + H * run.hopMs + 3750]
    : [];
  const totalMs = run ? offsets[6] + (run.back.length - 1) * run.backMs + 500 : 0;

  const mapRoute = phase >= 3 && run ? run.route : previewRoute;

  return (
    <div className="min-h-[calc(100vh-64px-40px)] text-palha-100">
      {/* barra superior */}
      <div className="border-b border-white/10 bg-jenipapo-900">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div>
            <p className="eyebrow text-urucum-300">Demonstração ponta a ponta</p>
            <h1 className="font-display text-2xl font-semibold">Simulador de mensagem</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1 md:flex" aria-hidden="true">
              {STAGES.map((s, i) => (
                <span key={s.title} className={`h-1.5 w-8 rounded-full transition-colors duration-300 ${phase > i ? 'bg-urucum-400' : phase === i ? 'bg-urucum-400/60' : 'bg-white/10'}`} />
              ))}
            </div>
            <span className="rounded-full bg-white/5 px-3 py-1.5 text-sm ring-1 ring-inset ring-white/10" aria-label="Tempo decorrido">
              ⏱ <Stopwatch startedAt={run?.startedAt ?? null} running={running} />
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1800px] gap-4 p-4 sm:p-6 lg:grid-cols-[340px_1fr] 2xl:grid-cols-[350px_1fr_400px]">
        {/* coluna esquerda: dispositivo e mensagem */}
        <section className="card-dark space-y-4 p-4" aria-label="Dispositivo de origem e mensagem">
          <div>
            <label htmlFor="sim-origin" className="text-xs font-semibold text-palha-300/70">
              Dispositivo de origem
            </label>
            <select id="sim-origin" value={origin} disabled={running} onChange={(e) => { reset(); setOrigin(e.target.value); }} className="input-dark mt-1.5">
              {grouped.map((g) => (
                <optgroup key={g.t.id} label={g.t.name}>
                  {g.nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name} · {n.id} ({(routeToGateway(n.id, down)?.length ?? 1) - 1} saltos)
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <Device origin={origin} lines={deviceLines} recording={mic === 'recording'} />

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="sim-text" className="text-xs font-semibold text-palha-300/70">
                Relato (escrito ou falado)
              </label>
              <span className="text-[11px] text-palha-300/50">{text.length} caracteres</span>
            </div>
            <div className="relative mt-1.5">
              <textarea
                id="sim-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={running || mic !== 'idle'}
                rows={4}
                maxLength={180}
                className="input-dark resize-none pr-12 leading-relaxed"
                placeholder="Descreva o que está acontecendo…"
              />
              <button
                onClick={record}
                disabled={running || mic !== 'idle'}
                className={`absolute bottom-2.5 right-2.5 grid h-9 w-9 place-items-center rounded-full transition-colors ${mic === 'recording' ? 'bg-urucum-500 text-white' : 'bg-white/10 text-palha-100 hover:bg-white/20'} disabled:cursor-not-allowed`}
                aria-label="Gravar relato por voz (reconhecimento offline)"
                title="Gravar por voz"
              >
                {mic === 'recording' && <span className="absolute inset-0 animate-ping2 rounded-full bg-urucum-500" />}
                {mic === 'recording' ? <Square className="relative h-3.5 w-3.5" /> : <Mic className="relative h-4 w-4" />}
              </button>
              <AnimatePresence>
                {mic !== 'idle' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-x-2 top-2 flex items-center gap-2 rounded-lg bg-jenipapo-900/95 px-2 py-1.5 text-[11px] text-palha-200">
                    {mic === 'recording' ? (
                      <>
                        <span className="flex h-5 items-center gap-[2px]" aria-hidden="true">
                          {Array.from({ length: 22 }).map((_, i) => (
                            <motion.span key={i} className="w-[2px] rounded-full bg-urucum-300" animate={{ height: [4, 6 + ((i * 7) % 14), 4] }} transition={{ duration: 0.5 + (i % 4) * 0.12, repeat: Infinity }} />
                          ))}
                        </span>
                        Ouvindo… reconhecimento de voz offline
                      </>
                    ) : (
                      <>
                        <BrainCircuit className="h-3.5 w-3.5 text-urucum-300" aria-hidden="true" /> Transcrevendo localmente, sem internet
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Exemplos de relato">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  disabled={running}
                  onClick={() => { reset(); setText(p.text); }}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors ${text === p.text ? 'bg-urucum-500/20 text-urucum-100 ring-urucum-400/50' : 'text-palha-300 ring-white/10 hover:bg-white/5'} disabled:opacity-40`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {done ? (
            <button onClick={reset} className="btn-ghost-dark w-full py-3 text-base">
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Nova simulação
            </button>
          ) : (
            <button onClick={send} disabled={running || !text.trim() || mic !== 'idle'} className="btn-primary w-full py-3 text-base">
              <Send className="h-4 w-4" aria-hidden="true" /> {running ? 'Transmitindo…' : 'Enviar pela rede LoRa'}
            </button>
          )}
          <p className="flex items-start gap-2 text-[11px] leading-relaxed text-palha-300/50">
            <Lock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" /> Sem internet na comunidade: a mensagem viaja por rádio, cifrada, até um gateway autorizado.
          </p>
        </section>

        {/* mapa */}
        <section className="relative min-h-[420px] overflow-hidden rounded-2xl border border-white/10 lg:min-h-[640px] 2xl:min-h-0" aria-label="Mapa com a rota da mensagem">
          <NetworkMap
            className="absolute inset-0 h-full"
            interactive
            packets={packets}
            bigPackets
            highlightRoute={mapRoute}
            routeColor={phase >= 6 ? '#6FB38A' : '#E8742A'}
            dimOthers={phase >= 3}
            selectedId={origin}
            fitTo={run && phase >= 3 ? run.route : null}
            fitPad={0.9}
            fitMaxZoom={10}
            showTerritories
          />
          <div className="pointer-events-none absolute left-3 top-3 z-[500] flex flex-wrap gap-2 sm:left-14">
            <span className="rounded-full bg-jenipapo-950/85 px-3 py-1.5 text-xs font-semibold backdrop-blur">
              {nodeById[origin].name} → {mapRoute ? nodeById[mapRoute[mapRoute.length - 1]].name : '—'}
            </span>
            {mapRoute && <span className="rounded-full bg-urucum-500/90 px-3 py-1.5 text-xs font-semibold text-white">{mapRoute.length - 1} saltos LoRa</span>}
          </div>
          <AnimatePresence>
            {done && run && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-x-3 bottom-3 z-[600] mx-auto max-w-2xl rounded-2xl border border-floresta-300/30 bg-jenipapo-950/90 p-4 shadow-2xl backdrop-blur sm:p-5"
              >
                <div className="flex flex-wrap items-center gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-floresta-500 text-white">
                    <CheckCheck className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div className="min-w-[200px] flex-1">
                    <p className="font-display text-xl font-semibold">Da comunidade à instituição — e de volta.</p>
                    <p className="mt-0.5 text-sm text-palha-300/80">
                      {fmtNum(totalMs / 1000, 1)} s · {H} saltos de ida, {run.back.length - 1} de volta · {run.bytes} bytes · zero dependência de internet no território
                    </p>
                  </div>
                  <Link to={`/alertas/${run.occId}`} className="btn-primary">
                    Ver ocorrência {run.occId}
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* linha do tempo */}
        <section className="card-dark p-4 lg:col-span-2 2xl:col-span-1" aria-label="Etapas da mensagem" aria-live="polite">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Caminho da mensagem</h2>
            {run && <span className="font-mono text-xs text-palha-300/60">{run.occId}</span>}
          </div>
          {!run ? (
            <div className="grid place-items-center rounded-xl border border-dashed border-white/10 px-6 py-10 text-center">
              <Send className="h-8 w-8 text-urucum-300" aria-hidden="true" />
              <p className="mt-3 font-semibold">Escolha um dispositivo e envie o relato</p>
              <p className="mt-1 text-sm text-palha-300/60">Você verá a IA offline organizar a mensagem, o pacote saltar de nó em nó até o gateway e a confirmação voltar à comunidade.</p>
              <ol className="mt-6 w-full space-y-2 text-left">
                {STAGES.map((s, i) => (
                  <li key={s.title} className="flex items-center gap-3 text-sm text-palha-300/60">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-white/5 font-mono text-[11px]">{i + 1}</span>
                    {s.title}
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <ol>
              <StageRow i={0} phase={phase} time={elapsedLabel(offsets[0])} summary={`${nodeById[run.originId].name} · ${run.text.length} caracteres · relato original preservado`}>
                <p className="rounded-xl bg-white/5 p-3 text-sm italic leading-relaxed text-palha-200">“{run.text}”</p>
              </StageRow>

              <StageRow
                i={1}
                phase={phase}
                time={elapsedLabel(offsets[1])}
                summary={
                  <span className="inline-flex flex-wrap items-center gap-1.5">
                    <CategoryIcon category={run.cls.category} className="h-3.5 w-3.5" /> {categoryInfo[run.cls.category].label} · {run.cls.type} ·{' '}
                    <span style={{ color: priorityInfo[run.cls.priority].color }} className="font-semibold">
                      {priorityInfo[run.cls.priority].label}
                    </span>
                  </span>
                }
              >
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="mb-1 flex items-center gap-2 text-xs text-palha-300/70">
                    <BrainCircuit className="h-3.5 w-3.5 text-urucum-300" aria-hidden="true" /> Modelo local · Raspberry Pi {aiFields < 4 && <Thinking />}
                  </p>
                  <Field label="Categoria" show={aiFields >= 1}>
                    <span className="inline-flex items-center gap-1.5">
                      <CategoryIcon category={run.cls.category} /> {categoryInfo[run.cls.category].label}
                    </span>
                  </Field>
                  <Field label="Tipo" value={run.cls.type} show={aiFields >= 2} />
                  <Field label="Prioridade" show={aiFields >= 3}>
                    <PriorityBadge priority={run.cls.priority} />
                  </Field>
                  <Field label="Destinatário" value={run.cls.recipient} show={aiFields >= 4} />
                  {aiFields >= 4 && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 flex items-center gap-1.5 text-[11px] text-floresta-300">
                      <Check className="h-3 w-3" aria-hidden="true" /> Relato original preservado · confiança {Math.round(run.cls.confidence * 100)}% · decisão final é humana
                    </motion.p>
                  )}
                </div>
              </StageRow>

              <StageRow
                i={2}
                phase={phase}
                time={elapsedLabel(offsets[2])}
                summary={`${run.bytes} bytes · ${run.bytes <= MAX_PAYLOAD_BYTES ? 'cabe em 1 pacote LoRa' : `${Math.ceil(run.bytes / MAX_PAYLOAD_BYTES)} fragmentos LoRa`} · cifrado AES-256`}
              >
                <JsonView data={run.packet} animateLines />
                <div className="mt-2">
                  <div className="flex justify-between text-[11px] text-palha-300/60">
                    <span>
                      {run.bytes <= MAX_PAYLOAD_BYTES ? `${run.bytes} de ${MAX_PAYLOAD_BYTES} bytes do pacote` : `${run.bytes} B → ${Math.ceil(run.bytes / MAX_PAYLOAD_BYTES)} fragmentos de até ${MAX_PAYLOAD_BYTES} B`}
                    </span>
                    <span>cifrado · AES-256</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div className="h-full rounded-full bg-floresta-400" initial={{ width: 0 }} animate={{ width: `${Math.min(100, (run.bytes / MAX_PAYLOAD_BYTES) * 100)}%` }} transition={{ duration: 1 }} />
                  </div>
                </div>
              </StageRow>

              <StageRow i={3} phase={phase} time={elapsedLabel(offsets[3])} summary={`${H} saltos em ${fmtNum((H * run.hopMs) / 1000, 1)} s · chegou ao ${nodeById[run.route[H]].name}`}>
                <ol className="space-y-1">
                  {run.route.map((id, i) => {
                    const hop = i === 0 ? null : hops[i - 1];
                    const reached = i === 0 || !!hop;
                    return (
                      <li key={id} className={`flex items-center gap-2 rounded-lg px-2 py-1 text-xs transition-colors ${reached ? 'bg-white/5' : 'opacity-40'}`}>
                        <span className={`grid h-5 w-5 place-items-center rounded-full font-mono text-[10px] ${reached ? 'bg-urucum-500 text-white' : 'bg-white/10'}`}>{i}</span>
                        <span className="flex-1 truncate">
                          <span className="font-mono text-palha-100">{id}</span> <span className="text-palha-300/60">{nodeById[id].name}</span>
                        </span>
                        {hop && <span className="font-mono text-[10px] text-palha-300/70">{hop.rssi} dBm · {hop.snr} dB</span>}
                        {i === 0 && <span className="text-[10px] text-palha-300/60">origem</span>}
                      </li>
                    );
                  })}
                </ol>
              </StageRow>

              <StageRow i={4} phase={phase} time={elapsedLabel(offsets[4])} summary={`Ocorrência ${run.occId} na fila · via ${run.route[H]} (${nodeById[run.route[H]].connection})`}>
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-xl bg-palha-50 p-3 text-jenipapo-900">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-jenipapo-500">{run.occId}</span>
                    <PriorityBadge priority={run.cls.priority} />
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 font-semibold">
                    <CategoryIcon category={run.cls.category} /> {categoryInfo[run.cls.category].label}
                  </p>
                  <p className="mt-0.5 text-xs text-jenipapo-600">
                    {territories.find((t) => t.id === nodeById[run.originId].territoryId)?.name} · registrada às {fmtTime(Date.now())}
                  </p>
                </motion.div>
              </StageRow>

              <StageRow i={5} phase={phase} time={elapsedLabel(offsets[5])} summary={`${institutionInfo[run.institution].label} confirmou o recebimento`}>
                <div className="rounded-xl bg-white/5 p-3 text-sm">
                  <p className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-urucum-300" aria-hidden="true" /> Enviado ao <strong>{institutionInfo[run.institution].label}</strong>
                  </p>
                  <p className={`mt-2 flex items-center gap-2 text-xs ${confirmed ? 'text-floresta-300' : 'text-palha-300/60'}`}>
                    {confirmed ? <CheckCheck className="h-4 w-4" aria-hidden="true" /> : <Thinking />}
                    {confirmed ? 'Recebimento confirmado · registrado na plataforma' : 'Aguardando confirmação de recebimento'}
                  </p>
                </div>
              </StageRow>

              <StageRow i={6} phase={phase} time={elapsedLabel(offsets[6])} summary={`Entregue no dispositivo ${nodeById[run.originId].name}`}>
                <div className="rounded-xl bg-white/5 p-3 text-xs">
                  <p className="text-palha-200">Confirmação descendo pela rede: gateway → comunidade</p>
                  <div className="mt-2 flex items-center gap-1">
                    {run.back.map((id, i) => (
                      <span key={id} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= backHops ? 'bg-floresta-400' : 'bg-white/10'}`} />
                    ))}
                  </div>
                  <p className="mt-1.5 font-mono text-[10px] text-palha-300/60">
                    {backHops}/{run.back.length - 1} saltos
                  </p>
                </div>
              </StageRow>
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
