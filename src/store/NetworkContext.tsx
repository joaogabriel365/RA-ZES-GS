// Estado global simulado: ocorrências, pacotes, gateways, sensores e acesso institucional.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { categoryInfo, institutionInfo } from '../data/catalog';
import { nodes, PRIMARY_GATEWAY_ID } from '../data/network';
import { communityNodes, generateHistory, reportTemplates, sensorAlertTemplates, stationNodes } from '../data/occurrences';
import { initialSeries, stations } from '../data/sensors';
import { buildOccurrence, responseTemplates, sensorTriggerFor } from '../lib/factory';
import { bytesOf } from '../lib/format';
import { nodeById, routeBetween, routeToGateway, staticDown } from '../lib/graph';
import { pick } from '../lib/rng';
import type { InstitutionId, Occurrence, OccurrenceStatus, PacketLog, SensorPoint } from '../lib/types';

export interface MapPacket {
  id: string;
  path: string[];
  hopMs: number;
  color: string;
  startAt: number; // performance.now()
  kind: PacketLog['kind'];
}

export interface Notice {
  id: string;
  tone: 'warn' | 'ok' | 'info';
  title: string;
  text: string;
  at: number;
}

interface NetworkState {
  occurrences: Occurrence[];
  packetLog: PacketLog[];
  gatewaysDown: Set<string>;
  down: Set<string>;
  activeGateways: string[];
  primaryGateway: string;
  lastSync: Record<string, number>;
  lastSeen: Record<string, number>;
  queue: Record<string, number>;
  msgs24h: number;
  series: Record<string, SensorPoint[]>;
  notices: Notice[];
  isInstitution: boolean;
  avgLatencyMs: number;
  toggleGateway: (id: string) => void;
  sendTestPacket: (nodeId: string) => void;
  addOccurrence: (o: Occurrence) => void;
  forward: (id: string, inst: InstitutionId) => void;
  setStatus: (id: string, status: OccurrenceStatus) => void;
  respond: (id: string, text: string) => void;
  login: () => void;
  logout: () => void;
  dismissNotice: (id: string) => void;
  nextId: () => string;
  logPacket: (p: Omit<PacketLog, 'id'>) => void;
  updateOccurrence: (id: string, fn: (o: Occurrence) => Occurrence) => void;
}

const NetworkCtx = createContext<NetworkState | null>(null);
const PacketCtx = createContext<MapPacket[]>([]);

const LIVE_HOP_MS = 650;
const GATEWAY_ORDER = [PRIMARY_GATEWAY_ID, ...nodes.filter((n) => n.type === 'gateway' && n.id !== PRIMARY_GATEWAY_ID).map((n) => n.id)];

const readSession = () => {
  try {
    return sessionStorage.getItem('raizes-inst') === '1';
  } catch {
    return false;
  }
};
const writeSession = (v: boolean) => {
  try {
    if (v) sessionStorage.setItem('raizes-inst', '1');
    else sessionStorage.removeItem('raizes-inst');
  } catch {
    /* sem armazenamento: ok */
  }
};

let uid = 0;
const newId = () => `${Date.now().toString(36)}-${(uid++).toString(36)}`;

/** Histórico inicial do console (últimos ~2 min de tráfego). */
function seedLog(): PacketLog[] {
  const now = Date.now();
  const pool = nodes.filter((n) => n.status !== 'offline' && n.type !== 'gateway');
  const out: PacketLog[] = [];
  for (let i = 0; i < 28; i++) {
    const n = pool[(i * 17 + 5) % pool.length];
    const route = routeToGateway(n.id, staticDown);
    if (!route) continue;
    const src = `!${n.id.replace('-', '').toLowerCase()}`;
    const isSensor = n.type === 'estacao';
    const kind: PacketLog['kind'] = isSensor ? 'SENSOR' : i % 3 === 0 ? 'BEACON' : 'TELEMETRIA';
    const payload = isSensor
      ? { t: 'SEN', src, tp: +(27 + (i % 7) * 0.8).toFixed(1), um: 70 - (i % 9), ch: 0, rio: +(4.4 + (i % 5) * 0.1).toFixed(2), pm: 10 + (i % 6) }
      : kind === 'BEACON'
        ? { t: 'NBR', src, nb: 2 + (i % 5) }
        : { t: 'TEL', src, bat: n.battery, sol: n.solar, up: 40000 + i * 1311 };
    out.push({
      id: `seed-${i}`,
      at: now - (i + 1) * 4200,
      originId: n.id,
      gatewayId: route[route.length - 1],
      hops: route.length - 1,
      rssi: -(82 + ((i * 13) % 34)),
      snr: +(-4 + ((i * 7) % 14)).toFixed(1),
      kind,
      payload: JSON.stringify(payload),
      bytes: bytesOf(payload) + 16,
    });
  }
  return out;
}

export const PACKET_COLORS: Record<PacketLog['kind'], string> = {
  TELEMETRIA: '#8FA7B3',
  BEACON: '#8FA7B3',
  SENSOR: '#6FB38A',
  ALERTA: '#E8742A',
  RELATO: '#E08C64',
  ACK: '#6FB38A',
  RESPOSTA: '#6FB38A',
};

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [occurrences, setOccurrences] = useState<Occurrence[]>(() => generateHistory());
  const [packetLog, setPacketLog] = useState<PacketLog[]>(seedLog);
  const [packets, setPackets] = useState<MapPacket[]>([]);
  const [gatewaysDown, setGatewaysDown] = useState<Set<string>>(new Set());
  const [lastSync, setLastSync] = useState<Record<string, number>>(() => {
    const now = Date.now();
    return Object.fromEntries(GATEWAY_ORDER.map((g, i) => [g, now - (i + 1) * 2300]));
  });
  const [lastSeen, setLastSeen] = useState<Record<string, number>>(() => {
    const now = Date.now();
    return Object.fromEntries(
      nodes.map((n, i) => [n.id, n.status === 'offline' ? now - (5 + (i % 7)) * 3600000 : now - ((i * 37) % 240) * 1000]),
    );
  });
  const [queue, setQueue] = useState<Record<string, number>>({ 'GW-01': 0, 'GW-02': 1, 'GW-03': 0 });
  const [msgs24h, setMsgs24h] = useState(1287);
  const [series, setSeries] = useState<Record<string, SensorPoint[]>>(initialSeries);
  const seriesRef = useRef(series);
  seriesRef.current = series;
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isInstitution, setIsInstitution] = useState(readSession);
  const seq = useRef(1000 + occurrences.length);

  const down = useMemo(() => new Set([...staticDown, ...gatewaysDown]), [gatewaysDown]);
  const downRef = useRef(down);
  downRef.current = down;
  const activeGateways = GATEWAY_ORDER.filter((g) => !gatewaysDown.has(g));
  const primaryGateway = activeGateways[0] ?? PRIMARY_GATEWAY_ID;

  const nextId = useCallback(() => `RZ-${String(++seq.current).padStart(4, '0')}`, []);

  const logPacket = useCallback((p: Omit<PacketLog, 'id'>) => {
    setPacketLog((l) => [{ ...p, id: newId() }, ...l].slice(0, 250));
    setMsgs24h((m) => m + 1);
    setLastSync((s) => ({ ...s, [p.gatewayId]: p.at }));
    setLastSeen((s) => ({ ...s, [p.originId]: p.at }));
  }, []);

  /** Anima um pacote pela rota e executa `onArrive` quando chega ao destino. */
  const animate = useCallback((path: string[], kind: PacketLog['kind'], onArrive?: () => void, hopMs = LIVE_HOP_MS) => {
    const p: MapPacket = { id: newId(), path, hopMs, color: PACKET_COLORS[kind], startAt: performance.now(), kind };
    setPackets((ps) => [...ps, p]);
    const total = (path.length - 1) * hopMs;
    window.setTimeout(() => onArrive?.(), total);
    window.setTimeout(() => setPackets((ps) => ps.filter((x) => x.id !== p.id)), total + 900);
  }, []);

  const sendFrom = useCallback(
    (originId: string, kind: PacketLog['kind'], payload: Record<string, unknown>, onArrive?: (route: string[]) => void) => {
      const route = routeToGateway(originId, downRef.current);
      if (!route) return;
      animate(route, kind, () => {
        logPacket({
          at: Date.now(),
          originId,
          gatewayId: route[route.length - 1],
          hops: route.length - 1,
          rssi: -Math.round(80 + Math.random() * 36),
          snr: +(-5 + Math.random() * 15).toFixed(1),
          kind,
          payload: JSON.stringify(payload),
          bytes: bytesOf(payload) + 16,
        });
        onArrive?.(route);
      });
    },
    [animate, logPacket],
  );

  const addOccurrence = useCallback((o: Occurrence) => setOccurrences((l) => [o, ...l]), []);

  // ---------------------------------------------------------------- ciclo ao vivo
  useEffect(() => {
    const online = nodes.filter((n) => n.status !== 'offline' && n.type !== 'gateway');
    // telemetria leve: bateria, sinal, vizinhos
    const tele = window.setInterval(() => {
      if (document.hidden) return;
      const n = pick(Math.random, online);
      const kind = Math.random() < 0.7 ? 'TELEMETRIA' : 'BEACON';
      const payload =
        kind === 'TELEMETRIA'
          ? { t: 'TEL', src: `!${n.id.replace('-', '').toLowerCase()}`, bat: n.battery - Math.round(Math.random() * 2), sol: n.solar, up: Math.round(Math.random() * 90000) }
          : { t: 'NBR', src: `!${n.id.replace('-', '').toLowerCase()}`, nb: Math.round(2 + Math.random() * 5) };
      sendFrom(n.id, kind, payload);
    }, 3600);

    // eventos de 8 a 15 s: leituras, alertas e relatos
    let evTimer = 0;
    const scheduleEvent = () => {
      evTimer = window.setTimeout(() => {
        if (!document.hidden) fireEvent();
        scheduleEvent();
      }, 8000 + Math.random() * 7000);
    };
    const fireEvent = () => {
      const roll = Math.random();
      if (roll < 0.5) {
        // nova leitura de sensor (atualiza série da estação)
        const st = pick(Math.random, stations.filter((s) => s.status !== 'offline'));
        const arr = seriesRef.current[st.id];
        const last = arr[arr.length - 1];
        const jitter = (k: number, d: number) => +(k + (Math.random() - 0.5) * d).toFixed(2);
        const pt: SensorPoint = {
          t: Date.now(),
          temperatura: +jitter(last.temperatura, 0.6).toFixed(1),
          umidade: Math.round(jitter(last.umidade, 3)),
          chuva: Math.max(0, +jitter(last.chuva, 1.5).toFixed(1)),
          rio: +jitter(last.rio, 0.04).toFixed(2),
          pm25: Math.max(2, Math.round(jitter(last.pm25, 6))),
        };
        const payload = { t: 'SEN', src: `!${st.id.replace('-', '').toLowerCase()}`, tp: pt.temperatura, um: pt.umidade, ch: pt.chuva, rio: pt.rio, pm: pt.pm25 };
        sendFrom(st.id, 'SENSOR', payload, () =>
          setSeries((all) => ({ ...all, [st.id]: [...all[st.id].slice(-140), pt] })),
        );
      } else if (roll < 0.78) {
        const tpl = pick(Math.random, sensorAlertTemplates);
        const st = pick(Math.random, stationNodes);
        const createdAt = Date.now();
        const occ = buildOccurrence({
          id: nextId(), kind: 'sensor', category: tpl.category, type: tpl.type, priority: tpl.priority,
          originNodeId: st.id, createdAt, status: 'validacao',
          sensor: sensorTriggerFor(tpl.category, createdAt, Math.random, tpl.priority), down: downRef.current, rand: Math.random,
          hopMs: [LIVE_HOP_MS, LIVE_HOP_MS + 1],
        });
        if (!occ) return;
        sendFrom(st.id, 'ALERTA', occ.packet, () => addOccurrence({ ...occ, live: true, arrivedAt: Date.now() }));
      } else {
        const tpl = pick(Math.random, reportTemplates);
        const origin = pick(Math.random, communityNodes);
        const occ = buildOccurrence({
          id: nextId(), kind: 'comunitaria', category: tpl.category, type: tpl.type, priority: tpl.priority,
          originNodeId: origin.id, createdAt: Date.now(), status: 'registrada', report: tpl.text,
          down: downRef.current, rand: Math.random, hopMs: [LIVE_HOP_MS, LIVE_HOP_MS + 1],
        });
        if (!occ) return;
        // payload no console sai cifrado: o texto não trafega em claro
        const shown = { ...occ.packet, txt: `«cifrado ${String(occ.packet.txt ?? '').length} B»` };
        sendFrom(origin.id, 'RELATO', shown, () => addOccurrence({ ...occ, live: true, arrivedAt: Date.now() }));
      }
    };
    scheduleEvent();
    const q = window.setInterval(() => {
      setQueue((qq) => Object.fromEntries(Object.keys(qq).map((k) => [k, Math.max(0, Math.round(Math.random() * 3 - 1))])));
    }, 5000);
    return () => {
      window.clearInterval(tele);
      window.clearTimeout(evTimer);
      window.clearInterval(q);
    };
  }, [sendFrom, nextId, addOccurrence]);

  // ---------------------------------------------------------------- ações
  const pushNotice = useCallback((n: Omit<Notice, 'id' | 'at'>) => {
    const notice = { ...n, id: newId(), at: Date.now() };
    setNotices((l) => [notice, ...l].slice(0, 4));
    window.setTimeout(() => setNotices((l) => l.filter((x) => x.id !== notice.id)), 9000);
  }, []);

  const gwDownRef = useRef(gatewaysDown);
  gwDownRef.current = gatewaysDown;

  const toggleGateway = useCallback(
    (id: string) => {
      {
        const prev = gwDownRef.current;
        const next = new Set(prev);
        const gw = nodeById[id];
        if (next.has(id)) {
          next.delete(id);
          pushNotice({ tone: 'ok', title: `${gw.name} restabelecido`, text: 'O gateway voltou a publicar na plataforma. Rotas recalculadas.' });
        } else {
          const online = GATEWAY_ORDER.filter((g) => !next.has(g));
          if (online.length <= 1) {
            pushNotice({ tone: 'info', title: 'Pelo menos um gateway permanece online', text: 'No cenário do RAÍZES sempre há um gateway publicando na plataforma.' });
            return;
          }
          next.add(id);
          // quantos nós usavam este gateway?
          const before = new Set([...staticDown, ...prev]);
          const after = new Set([...staticDown, ...next]);
          const affected = nodes.filter((n) => n.type !== 'gateway' && n.status !== 'offline' && routeToGateway(n.id, before)?.at(-1) === id);
          const targets = new Set(affected.map((n) => routeToGateway(n.id, after)?.at(-1)).filter(Boolean) as string[]);
          pushNotice({
            tone: 'warn',
            title: `${gw.name} fora do ar`,
            text: `${affected.length} nós redirecionados automaticamente para ${[...targets].map((t) => nodeById[t].name.replace('Gateway ', '')).join(' e ')}. Nenhuma mensagem perdida.`,
          });
          // demonstra o redirecionamento com pacotes saindo dos nós afetados
          affected
            .filter((_, i) => i % Math.max(1, Math.floor(affected.length / 4)) === 0)
            .slice(0, 4)
            .forEach((n, i) => {
              window.setTimeout(() => {
                const route = routeToGateway(n.id, after);
                if (!route) return;
                animate(route, 'ALERTA', () =>
                  logPacket({
                    at: Date.now(), originId: n.id, gatewayId: route[route.length - 1], hops: route.length - 1,
                    rssi: -Math.round(85 + Math.random() * 30), snr: +(Math.random() * 9).toFixed(1), kind: 'TELEMETRIA',
                    payload: JSON.stringify({ t: 'RRT', src: `!${n.id.replace('-', '').toLowerCase()}`, via: route[route.length - 1] }), bytes: 38,
                  }),
                );
              }, 300 + i * 450);
            });
        }
        gwDownRef.current = next;
        setGatewaysDown(next);
      }
    },
    [animate, logPacket, pushNotice],
  );

  const sendTestPacket = useCallback(
    (nodeId: string) => sendFrom(nodeId, 'BEACON', { t: 'PING', src: `!${nodeId.replace('-', '').toLowerCase()}`, ts: Math.floor(Date.now() / 1000) }),
    [sendFrom],
  );

  const update = useCallback((id: string, fn: (o: Occurrence) => Occurrence) => {
    setOccurrences((l) => l.map((o) => (o.id === id ? fn(o) : o)));
  }, []);

  const forward = useCallback(
    (id: string, inst: InstitutionId) =>
      update(id, (o) => ({
        ...o,
        institution: inst,
        status: ['validacao', 'registrada'].includes(o.status) ? 'encaminhada' : o.status,
        timeline: [...o.timeline, { key: 'encaminhada', label: `Encaminhada ao ${institutionInfo[inst].label}`, detail: 'Envio registrado pelo painel institucional', at: Date.now() }],
      })),
    [update],
  );

  const setStatus = useCallback(
    (id: string, status: OccurrenceStatus) =>
      update(id, (o) => {
        const map: Partial<Record<OccurrenceStatus, { key: Occurrence['timeline'][number]['key']; label: string }>> = {
          registrada: { key: 'validacao', label: 'Alerta validado manualmente' },
          confirmada: { key: 'confirmada', label: 'Recebimento confirmado pela instituição' },
          em_atendimento: { key: 'em_atendimento', label: 'Em atendimento' },
          encerrada: { key: 'encerrada', label: 'Ocorrência encerrada' },
          encaminhada: { key: 'encaminhada', label: `Encaminhada ao ${institutionInfo[o.institution ?? categoryInfo[o.category].institution].label}` },
        };
        const ev = map[status];
        return {
          ...o,
          status,
          institution: o.institution ?? (status !== 'registrada' && status !== 'validacao' ? categoryInfo[o.category].institution : undefined),
          timeline: ev ? [...o.timeline, { ...ev, at: Date.now(), detail: 'Atualizado no painel institucional' }] : o.timeline,
        };
      }),
    [update],
  );

  const respond = useCallback(
    (id: string, text: string) => {
      const occ = occurrences.find((o) => o.id === id);
      if (!occ) return;
      const gw = activeGateways.includes(occ.gatewayId) ? occ.gatewayId : activeGateways[0];
      const path = routeBetween(gw, occ.originNodeId, downRef.current) ?? [...occ.route].reverse();
      update(id, (o) => ({
        ...o,
        status: 'respondida',
        response: text,
        timeline: [...o.timeline, { key: 'resposta', label: 'Resposta enviada de volta à comunidade', detail: `Via ${nodeById[gw].name} → rede LoRa`, at: Date.now() }],
      }));
      animate(path, 'RESPOSTA', () => {
        update(id, (o) => ({
          ...o,
          timeline: [...o.timeline, { key: 'entregue', label: `Resposta entregue no dispositivo ${nodeById[o.originNodeId].name}`, detail: `${path.length - 1} saltos de volta`, at: Date.now(), nodeId: o.originNodeId }],
        }));
        logPacket({
          at: Date.now(), originId: gw, gatewayId: gw, hops: path.length - 1, rssi: -92, snr: 6.1, kind: 'RESPOSTA',
          payload: JSON.stringify({ t: 'RSP', ref: id.slice(-4), dst: `!${occ.originNodeId.replace('-', '').toLowerCase()}`, txt: `«cifrado ${text.length} B»` }),
          bytes: 48 + text.length,
        });
      });
    },
    [occurrences, activeGateways, update, animate, logPacket],
  );

  const login = useCallback(() => {
    setIsInstitution(true);
    writeSession(true);
  }, []);
  const logout = useCallback(() => {
    setIsInstitution(false);
    writeSession(false);
  }, []);
  const dismissNotice = useCallback((id: string) => setNotices((l) => l.filter((n) => n.id !== id)), []);

  const avgLatencyMs = useMemo(() => {
    const recent = occurrences.slice(0, 30);
    return recent.reduce((s, o) => s + (o.arrivedAt - o.createdAt), 0) / Math.max(1, recent.length);
  }, [occurrences]);

  const value: NetworkState = {
    occurrences, packetLog, gatewaysDown, down, activeGateways, primaryGateway, lastSync, lastSeen, queue, msgs24h, series,
    notices, isInstitution, avgLatencyMs, toggleGateway, sendTestPacket, addOccurrence, forward, setStatus, respond,
    login, logout, dismissNotice, nextId, logPacket, updateOccurrence: update,
  };

  return (
    <NetworkCtx.Provider value={value}>
      <PacketCtx.Provider value={packets}>{children}</PacketCtx.Provider>
    </NetworkCtx.Provider>
  );
}

export function useNetwork() {
  const ctx = useContext(NetworkCtx);
  if (!ctx) throw new Error('useNetwork fora do NetworkProvider');
  return ctx;
}

export const useLivePackets = () => useContext(PacketCtx);

export { responseTemplates };
