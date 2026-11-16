import { AnimatePresence, motion } from 'framer-motion';
import { BatteryMedium, Cpu, Power, PowerOff, Radio, RadioTower, Route, Send, SignalHigh, Sun, Timer, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { LiveDot, useNow } from '../components/common/ui';
import { GatewayPill } from '../components/layout/Layout';
import { MapLegend, NetworkMap } from '../components/map/NetworkMap';
import { metricOrder, metrics, levelInfo, levelOf } from '../data/sensors';
import { nodes, territories, territoryKindLabel } from '../data/network';
import { fmtAgo, fmtNum } from '../lib/format';
import { links, neighbors, nodeById, routeToGateway } from '../lib/graph';
import type { MeshNode } from '../lib/types';
import { useNetwork } from '../store/NetworkContext';

const typeLabel: Record<MeshNode['type'], string> = { dispositivo: 'Dispositivo comunitário', estacao: 'Estação com IA offline e sensores', gateway: 'Gateway com internet' };
const statusLabel = { online: 'Online', instavel: 'Sinal instável', offline: 'Offline' } as const;
const statusColor = { online: '#3F9465', instavel: '#E2B126', offline: '#8FA7B3' } as const;

function Meter({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10" role="presentation">
      <motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.6 }} />
    </div>
  );
}

function NodePanel({ id, onClose, onSelect }: { id: string; onClose: () => void; onSelect: (id: string) => void }) {
  const n = nodeById[id];
  const { lastSeen, down, series, sendTestPacket, gatewaysDown, toggleGateway, queue, lastSync } = useNetwork();
  const now = useNow(1000);
  const terr = territories.find((t) => t.id === n.territoryId);
  const isGwDown = gatewaysDown.has(n.id);
  const status = isGwDown ? 'offline' : n.status;
  const route = n.type !== 'gateway' && status !== 'offline' ? routeToGateway(n.id, down) : null;
  const latest = series[n.id]?.[series[n.id].length - 1];
  const batteryColor = n.battery > 50 ? '#3F9465' : n.battery > 20 ? '#E2B126' : '#DC3535';

  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.3 }}
      className="flex h-full flex-col"
    >
      <div className="flex items-start justify-between gap-3 border-b border-white/10 p-5">
        <div>
          <p className="eyebrow text-urucum-300">{typeLabel[n.type]}</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-palha-100">{n.name}</h2>
          <p className="mt-1 text-sm text-palha-300/70">
            <span className="font-mono">{n.id}</span> · {terr ? `${terr.name}` : n.place}
          </p>
        </div>
        <button onClick={onClose} className="rounded-full p-2 text-palha-300 hover:bg-white/10 hover:text-white" aria-label="Fechar painel do nó">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="scroll-thin flex-1 space-y-5 overflow-y-auto p-5 text-sm text-palha-200">
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip bg-white/5 text-palha-100 ring-1 ring-inset ring-white/10">
            <LiveDot color={statusColor[status]} size={7} /> {statusLabel[status]}
          </span>
          {terr && <span className="chip bg-white/5 text-palha-300 ring-1 ring-inset ring-white/10">Comunidade {territoryKindLabel[terr.kind].toLowerCase()}</span>}
          {n.connection && <span className="chip bg-urucum-500/15 text-urucum-200 ring-1 ring-inset ring-urucum-400/30">{n.connection}</span>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/5 p-3">
            <p className="flex items-center gap-1.5 text-xs text-palha-300/70"><BatteryMedium className="h-3.5 w-3.5" aria-hidden="true" /> Bateria</p>
            <p className="mt-1 font-display text-2xl font-semibold text-palha-100">{n.battery}%</p>
            <Meter value={n.battery} color={batteryColor} />
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="flex items-center gap-1.5 text-xs text-palha-300/70"><Sun className="h-3.5 w-3.5" aria-hidden="true" /> Carga solar</p>
            <p className="mt-1 font-display text-2xl font-semibold text-palha-100">{fmtNum(n.solar, 1)} W</p>
            <Meter value={Math.min(100, (n.solar / (n.type === 'gateway' ? 18 : 6)) * 100)} color="#E2B126" />
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="flex items-center gap-1.5 text-xs text-palha-300/70"><SignalHigh className="h-3.5 w-3.5" aria-hidden="true" /> Sinal (RSSI / SNR)</p>
            <p className="mt-1 font-mono text-base font-semibold text-palha-100">
              {n.rssi} dBm · {n.snr > 0 ? '+' : ''}
              {fmtNum(n.snr, 1)} dB
            </p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="flex items-center gap-1.5 text-xs text-palha-300/70"><Timer className="h-3.5 w-3.5" aria-hidden="true" /> Último contato</p>
            <p className="mt-1 font-mono text-base font-semibold text-palha-100">{fmtAgo(n.type === 'gateway' ? lastSync[n.id] ?? now : lastSeen[n.id], now)}</p>
          </div>
        </div>

        {n.type === 'gateway' && (
          <div className="rounded-xl border border-white/10 p-3">
            <p className="text-xs text-palha-300/70">Fila de saída para a plataforma</p>
            <p className="mt-1 font-mono text-palha-100">{isGwDown ? 'sem conexão — rede redirecionou' : `${queue[n.id] ?? 0} mensagens · sincronizado ${fmtAgo(lastSync[n.id], now)}`}</p>
            <button onClick={() => toggleGateway(n.id)} className={`btn mt-3 w-full ${isGwDown ? 'bg-floresta-500 text-white hover:bg-floresta-600' : 'bg-urucum-500/15 text-urucum-200 ring-1 ring-inset ring-urucum-400/40 hover:bg-urucum-500/25'}`}>
              {isGwDown ? <Power className="h-4 w-4" aria-hidden="true" /> : <PowerOff className="h-4 w-4" aria-hidden="true" />}
              {isGwDown ? 'Restabelecer gateway' : 'Simular queda deste gateway'}
            </button>
          </div>
        )}

        {route && (
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-palha-300/70"><Route className="h-3.5 w-3.5" aria-hidden="true" /> Rota atual até a internet · {route.length - 1} saltos</p>
            <ol className="mt-2 flex flex-wrap items-center gap-1 text-xs">
              {route.map((r, i) => (
                <li key={r} className="flex items-center gap-1">
                  <button onClick={() => onSelect(r)} className={`rounded-md px-1.5 py-0.5 font-mono ${nodeById[r].type === 'gateway' ? 'bg-urucum-500/20 text-urucum-200' : 'bg-white/5 text-palha-200 hover:bg-white/10'}`}>
                    {r}
                  </button>
                  {i < route.length - 1 && <span className="text-palha-300/40">→</span>}
                </li>
              ))}
            </ol>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-palha-300/70">Vizinhos LoRa ({neighbors[n.id].length})</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {neighbors[n.id].map((v) => {
              const km = links.find((l) => (l.a === n.id && l.b === v) || (l.b === n.id && l.a === v))?.km ?? 0;
              return (
                <button key={v} onClick={() => onSelect(v)} className="rounded-lg bg-white/5 px-2 py-1 text-left text-xs hover:bg-white/10">
                  <span className="font-mono text-palha-100">{v}</span> <span className="text-palha-300/60">{fmtNum(km, 1)} km</span>
                </button>
              );
            })}
          </div>
        </div>

        {latest && (
          <div>
            <p className="text-xs font-semibold text-palha-300/70">Últimas leituras dos sensores</p>
            <ul className="mt-2 divide-y divide-white/5 rounded-xl bg-white/5">
              {metricOrder.map((k) => {
                const m = metrics[k];
                const lv = levelOf(k, latest[k]);
                return (
                  <li key={k} className="flex items-center justify-between px-3 py-2">
                    <span className="text-palha-300">{m.label}</span>
                    <span className="flex items-center gap-2 font-mono text-palha-100">
                      {fmtNum(latest[k], m.decimals)} {m.unit}
                      <span className="h-2 w-2 rounded-full" style={{ background: levelInfo[lv].color }} title={levelInfo[lv].label} />
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <p className="flex items-center gap-2 text-xs text-palha-300/60">
          <Cpu className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {n.hardware}
        </p>
      </div>

      {n.type !== 'gateway' && status !== 'offline' && (
        <div className="border-t border-white/10 p-4">
          <button onClick={() => sendTestPacket(n.id)} className="btn-primary w-full">
            <Send className="h-4 w-4" aria-hidden="true" /> Enviar pacote de teste
          </button>
        </div>
      )}
    </motion.div>
  );
}

function ResiliencePanel({ onSelect }: { onSelect: (id: string) => void }) {
  const { gatewaysDown, toggleGateway, lastSync, queue, down, activeGateways } = useNetwork();
  const now = useNow(1000);
  const gws = nodes.filter((n) => n.type === 'gateway');
  const usage = useMemo(() => {
    const c: Record<string, number> = {};
    for (const n of nodes) {
      if (n.type === 'gateway' || down.has(n.id)) continue;
      const r = routeToGateway(n.id, down);
      if (r) c[r[r.length - 1]] = (c[r[r.length - 1]] ?? 0) + 1;
    }
    return c;
  }, [down]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-full flex-col">
      <div className="border-b border-white/10 p-5">
        <p className="eyebrow text-urucum-300">Resiliência</p>
        <h2 className="mt-1 font-display text-2xl font-semibold text-palha-100">Nenhum ponto único de falha</h2>
        <p className="mt-2 text-sm leading-relaxed text-palha-300/75">
          Se um gateway cai, os nós recalculam a rota e a mensagem sai pelo próximo ponto com internet. Experimente derrubar um deles.
        </p>
      </div>
      <div className="scroll-thin flex-1 space-y-3 overflow-y-auto p-5">
        {gws.map((g) => {
          const isDown = gatewaysDown.has(g.id);
          const last = activeGateways.length === 1 && !isDown;
          return (
            <div key={g.id} className={`rounded-2xl border p-4 transition-colors ${isDown ? 'border-urucum-400/30 bg-urucum-500/5' : 'border-white/10 bg-white/[0.03]'}`}>
              <div className="flex items-start justify-between gap-2">
                <button onClick={() => onSelect(g.id)} className="text-left">
                  <p className="flex items-center gap-2 font-semibold text-palha-100">
                    <RadioTower className={`h-4 w-4 ${isDown ? 'text-jenipapo-400' : 'text-urucum-300'}`} aria-hidden="true" />
                    {g.place}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-palha-300/60">
                    {g.id} · {g.connection}
                  </p>
                </button>
                <span className={`chip ${isDown ? 'bg-urucum-500/15 text-urucum-200' : 'bg-floresta-400/15 text-floresta-200'}`}>
                  <LiveDot color={isDown ? '#C2512E' : '#3F9465'} size={6} /> {isDown ? 'offline' : 'online'}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-palha-300/50">Nós servidos</p>
                  <p className="font-mono text-base text-palha-100">{isDown ? 0 : usage[g.id] ?? 0}</p>
                </div>
                <div>
                  <p className="text-palha-300/50">Fila</p>
                  <p className="font-mono text-base text-palha-100">{isDown ? '—' : queue[g.id] ?? 0}</p>
                </div>
                <div>
                  <p className="text-palha-300/50">Sincronização</p>
                  <p className="font-mono text-base text-palha-100">{isDown ? '—' : fmtAgo(lastSync[g.id], now).replace('há ', '')}</p>
                </div>
              </div>
              <button
                onClick={() => toggleGateway(g.id)}
                disabled={last}
                title={last ? 'Pelo menos um gateway permanece online' : undefined}
                className={`btn mt-3 w-full py-2 ${isDown ? 'bg-floresta-500 text-white hover:bg-floresta-600' : 'bg-white/5 text-palha-100 ring-1 ring-inset ring-white/15 hover:bg-urucum-500/20 hover:ring-urucum-400/40'}`}
              >
                {isDown ? <Power className="h-4 w-4" aria-hidden="true" /> : <PowerOff className="h-4 w-4" aria-hidden="true" />}
                {isDown ? 'Restabelecer' : last ? 'Último gateway online' : 'Simular queda'}
              </button>
            </div>
          );
        })}
        <p className="flex gap-2 pt-1 text-xs leading-relaxed text-palha-300/60">
          <Radio className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /> Clique em qualquer nó do mapa para ver bateria, carga solar, sinal, vizinhos e leituras.
        </p>
      </div>
    </motion.div>
  );
}

export function MapPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const { down } = useNetwork();
  const route = selected && nodeById[selected].type !== 'gateway' && !down.has(selected) ? routeToGateway(selected, down) : null;

  return (
    <div className="grid min-h-[calc(100vh-64px-40px)] grid-rows-[auto_1fr] text-palha-100 lg:grid-cols-[1fr_400px] lg:grid-rows-1">
      <div className="relative h-[62vh] lg:h-auto">
        <NetworkMap className="absolute inset-0 h-full" selectedId={selected} onSelect={setSelected} highlightRoute={route} />
        <div className="pointer-events-none absolute left-3 right-3 top-3 z-[500] flex flex-wrap items-start justify-between gap-2 sm:left-14">
          <div className="pointer-events-auto rounded-2xl border border-white/10 bg-jenipapo-950/85 px-4 py-3 backdrop-blur">
            <h1 className="font-display text-xl font-semibold">Mapa da rede</h1>
            <p className="text-xs text-palha-300/70">
              {territories.length} territórios · {nodes.length} nós · {links.length} enlaces LoRa
            </p>
          </div>
          <div className="pointer-events-auto">
            <GatewayPill />
          </div>
        </div>
        <MapLegend className="absolute bottom-6 right-3 z-[500]" />
      </div>
      <aside className="border-l border-white/10 bg-jenipapo-900 lg:h-[calc(100vh-64px-40px)]" aria-label={selected ? 'Detalhes do nó selecionado' : 'Painel de resiliência'}>
        <AnimatePresence mode="wait">
          {selected ? (
            <NodePanel key={selected} id={selected} onClose={() => setSelected(null)} onSelect={setSelected} />
          ) : (
            <ResiliencePanel key="res" onSelect={setSelected} />
          )}
        </AnimatePresence>
      </aside>
    </div>
  );
}
