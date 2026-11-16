import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Pause, Play, Power, PowerOff, RadioTower, SignalHigh, Terminal, Waypoints } from 'lucide-react';
import { useMemo, useState } from 'react';
import { LiveDot, useNow } from '../components/common/ui';
import { nodes } from '../data/network';
import { fmtAgo, fmtNum, fmtTime } from '../lib/format';
import type { PacketLog } from '../lib/types';
import { useNetwork } from '../store/NetworkContext';

const kindColor: Record<PacketLog['kind'], string> = {
  TELEMETRIA: 'text-jenipapo-300',
  BEACON: 'text-jenipapo-300',
  SENSOR: 'text-floresta-300',
  ALERTA: 'text-orange-400',
  RELATO: 'text-urucum-300',
  ACK: 'text-emerald-300',
  RESPOSTA: 'text-emerald-300',
};
const KINDS: PacketLog['kind'][] = ['TELEMETRIA', 'BEACON', 'SENSOR', 'ALERTA', 'RELATO', 'ACK', 'RESPOSTA'];

export function Console() {
  const { packetLog, gatewaysDown, toggleGateway, lastSync, queue, msgs24h, activeGateways } = useNetwork();
  const now = useNow(1000);
  const [paused, setPaused] = useState(false);
  const [frozen, setFrozen] = useState<PacketLog[] | null>(null);
  const [hidden, setHidden] = useState<Set<PacketLog['kind']>>(new Set());
  const gws = nodes.filter((n) => n.type === 'gateway');

  const source = paused && frozen ? frozen : packetLog;
  const lines = source.filter((l) => !hidden.has(l.kind)).slice(0, 120);

  const stats = useMemo(() => {
    const recent = packetLog.filter((l) => now - l.at < 60000);
    const avgHops = packetLog.slice(0, 50).reduce((s, l) => s + l.hops, 0) / Math.max(1, Math.min(50, packetLog.length));
    const avgRssi = packetLog.slice(0, 50).reduce((s, l) => s + l.rssi, 0) / Math.max(1, Math.min(50, packetLog.length));
    const bytes = recent.reduce((s, l) => s + l.bytes, 0);
    return { perMin: recent.length, avgHops, avgRssi, bytes };
  }, [packetLog, now]);

  const togglePause = () => {
    if (paused) {
      setPaused(false);
      setFrozen(null);
    } else {
      setFrozen(packetLog);
      setPaused(true);
    }
  };

  return (
    <div className="mx-auto max-w-[1800px] p-4 text-palha-100 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-urucum-300">Console técnico</p>
          <h1 className="font-display text-3xl font-semibold">Tráfego recebido pelos gateways</h1>
          <p className="mt-1 text-sm text-palha-300/70">Fluxo ao vivo dos pacotes que saem da rede LoRa e chegam à plataforma. Relatos e respostas trafegam cifrados.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { icon: Activity, l: 'Pacotes/min', v: fmtNum(stats.perMin) },
            { icon: Waypoints, l: 'Saltos médios', v: fmtNum(stats.avgHops, 1) },
            { icon: SignalHigh, l: 'RSSI médio', v: `${fmtNum(stats.avgRssi)} dBm` },
            { icon: Terminal, l: 'Mensagens 24 h', v: fmtNum(msgs24h) },
          ].map((s) => (
            <div key={s.l} className="card-dark px-3 py-2">
              <p className="flex items-center gap-1.5 text-[11px] text-palha-300/60">
                <s.icon className="h-3 w-3" aria-hidden="true" /> {s.l}
              </p>
              <p className="font-mono text-lg font-semibold tabular-nums">{s.v}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_360px]">
        {/* terminal */}
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#060d12] shadow-2xl" aria-label="Fluxo de pacotes">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-jenipapo-900/60 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="flex gap-1.5" aria-hidden="true">
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]/80" />
                <span className="h-3 w-3 rounded-full bg-[#febc2e]/80" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]/80" />
              </span>
              <span className="ml-2 font-mono text-xs text-palha-300/70">raizes-gw · tail -f /var/log/mesh/inbound</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {KINDS.map((k) => (
                <button
                  key={k}
                  onClick={() => setHidden((h) => { const n = new Set(h); if (n.has(k)) n.delete(k); else n.add(k); return n; })}
                  aria-pressed={!hidden.has(k)}
                  className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] ring-1 ring-inset transition ${hidden.has(k) ? 'text-palha-300/30 ring-white/5' : `${kindColor[k]} ring-white/15 bg-white/5`}`}
                >
                  {k}
                </button>
              ))}
              <button onClick={togglePause} className="ml-1 inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 font-mono text-[11px] hover:bg-white/15">
                {paused ? <Play className="h-3 w-3" aria-hidden="true" /> : <Pause className="h-3 w-3" aria-hidden="true" />}
                {paused ? 'retomar' : 'pausar'}
              </button>
            </div>
          </div>
          <div className="scroll-thin h-[62vh] min-h-[420px] overflow-auto p-3 font-mono text-[12px] leading-relaxed" role="log" aria-live="off">
            <div className="hidden grid-cols-[72px_52px_80px_34px_120px_82px_44px_1fr] gap-x-3 border-b border-white/5 pb-1.5 text-[10px] uppercase tracking-wider text-palha-300/40 lg:grid">
              <span>hora</span>
              <span>gw</span>
              <span>origem</span>
              <span>hops</span>
              <span>rssi / snr</span>
              <span>tipo</span>
              <span>bytes</span>
              <span>payload</span>
            </div>
            <AnimatePresence initial={false}>
              {lines.map((l) => (
                <motion.div
                  key={l.id}
                  initial={{ opacity: 0, backgroundColor: 'rgba(212,108,65,0.18)' }}
                  animate={{ opacity: 1, backgroundColor: 'rgba(0,0,0,0)' }}
                  transition={{ duration: 0.4, backgroundColor: { duration: 1.6 } }}
                  className="grid grid-cols-[64px_1fr] gap-x-3 rounded px-1 py-0.5 hover:bg-white/[0.03] lg:grid-cols-[72px_52px_80px_34px_120px_82px_44px_1fr]"
                >
                  <span className="text-palha-300/50">{fmtTime(l.at)}</span>
                  <span className="text-urucum-200 lg:contents">
                    <span className="lg:block">{l.gatewayId}</span>
                  </span>
                  <span className="hidden text-palha-100 lg:block">!{l.originId.replace('-', '').toLowerCase()}</span>
                  <span className="hidden text-sky-300 lg:block">h={l.hops}</span>
                  <span className="hidden text-palha-300/70 lg:block">
                    {l.rssi} / {l.snr > 0 ? '+' : ''}
                    {l.snr}
                  </span>
                  <span className={`hidden font-semibold lg:block ${kindColor[l.kind]}`}>{l.kind}</span>
                  <span className="hidden text-palha-300/50 lg:block">{l.bytes}B</span>
                  <span className="col-span-2 truncate text-palha-300/80 lg:col-span-1" title={l.payload}>
                    <span className={`mr-2 font-semibold lg:hidden ${kindColor[l.kind]}`}>{l.kind}</span>
                    {l.payload}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            {!paused && (
              <p className="mt-1 text-floresta-300">
                ▍<span className="animate-blink">_</span> aguardando pacotes…
              </p>
            )}
          </div>
        </section>

        {/* gateways */}
        <aside className="space-y-3" aria-label="Estado dos gateways">
          <h2 className="font-display text-xl font-semibold">Gateways</h2>
          {gws.map((g) => {
            const down = gatewaysDown.has(g.id);
            const last = activeGateways.length === 1 && !down;
            return (
              <div key={g.id} className={`card-dark p-4 ${down ? 'ring-1 ring-urucum-500/40' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="flex items-center gap-2 font-semibold">
                      <RadioTower className={`h-4 w-4 ${down ? 'text-jenipapo-400' : 'text-urucum-300'}`} aria-hidden="true" /> {g.id} · {g.place}
                    </p>
                    <p className="mt-0.5 text-xs text-palha-300/60">{g.hardware}</p>
                  </div>
                  <span className={`chip ${down ? 'bg-urucum-500/15 text-urucum-200' : 'bg-floresta-400/15 text-floresta-200'}`}>
                    <LiveDot color={down ? '#C2512E' : '#3F9465'} size={6} /> {down ? 'OFFLINE' : 'ONLINE'}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 font-mono text-xs">
                  <div>
                    <dt className="text-palha-300/50">conexão</dt>
                    <dd className="text-palha-100">{g.connection}</dd>
                  </div>
                  <div>
                    <dt className="text-palha-300/50">fila</dt>
                    <dd className="text-palha-100">{down ? '—' : `${queue[g.id] ?? 0} msg`}</dd>
                  </div>
                  <div>
                    <dt className="text-palha-300/50">sync</dt>
                    <dd className="text-palha-100">{down ? 'perdida' : fmtAgo(lastSync[g.id], now)}</dd>
                  </div>
                </dl>
                <button
                  onClick={() => toggleGateway(g.id)}
                  disabled={last}
                  className={`btn mt-3 w-full py-1.5 text-xs ${down ? 'bg-floresta-500 text-white hover:bg-floresta-600' : 'bg-white/5 ring-1 ring-inset ring-white/10 hover:bg-urucum-500/20'}`}
                >
                  {down ? <Power className="h-3.5 w-3.5" aria-hidden="true" /> : <PowerOff className="h-3.5 w-3.5" aria-hidden="true" />}
                  {down ? 'Restabelecer' : last ? 'Último gateway online' : 'Simular queda'}
                </button>
              </div>
            );
          })}
          <div className="card-dark p-4 text-xs leading-relaxed text-palha-300/70">
            <p className="font-semibold text-palha-100">Formato dos pacotes</p>
            <p className="mt-1">
              Payload JSON compacto (≤ 237 B, limite útil do LoRa/Meshtastic). Campos: <code className="text-urucum-200">t</code> tipo, <code className="text-urucum-200">src</code> nó de origem,{' '}
              <code className="text-urucum-200">cat</code> categoria, <code className="text-urucum-200">pri</code> prioridade, <code className="text-urucum-200">vld</code> exige validação.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
