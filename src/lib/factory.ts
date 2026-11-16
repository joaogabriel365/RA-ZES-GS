// Fábrica de ocorrências: monta rota, linha do tempo e pacote compacto
import { categoryInfo, institutionInfo, priorityInfo } from '../data/catalog';
import { metrics } from '../data/sensors';
import { nodeById, routeToGateway } from './graph';
import type {
  AIClassification,
  Category,
  InstitutionId,
  Occurrence,
  OccurrenceKind,
  OccurrenceStatus,
  Priority,
  SensorTrigger,
  TimelineEvent,
} from './types';

export const responseTemplates: Record<InstitutionId, string[]> = {
  org_indigenista: [
    'Ocorrência recebida pelo Órgão indigenista. Equipe acionada; contato com a liderança em até 24 h.',
    'Recebido. Caso encaminhado à coordenação regional e à Segurança pública. Mantenham registro dos fatos.',
  ],
  org_ambiental: [
    'Órgão ambiental ciente. Foco verificado por satélite; brigada em deslocamento.',
    'Recebido. Fiscalização programada para a área indicada. Evitem aproximação.',
  ],
  defesa_civil: [
    'Defesa Civil ciente. Monitorando o nível do rio; orientação: retirar pertences das casas baixas.',
    'Recebido. Apoio logístico solicitado; previsão de chegada em 48 h.',
  ],
  seguranca: [
    'Segurança pública acionada. Equipe orientada a fazer contato com a liderança. Evitem confronto.',
    'Recebido. Registro de ocorrência aberto e repassado ao órgão indigenista.',
  ],
  saude_indigena: [
    'Saúde indígena ciente. Equipe de saúde a caminho; manter hidratação e repouso.',
    'Recebido. Remoção agendada; ponto de encontro no porto às 7 h.',
  ],
};

/** Códigos curtos de destinatário (economizam bytes no pacote LoRa). */
export const INST_CODE: Record<InstitutionId, string> = {
  org_indigenista: 'IND',
  org_ambiental: 'AMB',
  defesa_civil: 'DC',
  seguranca: 'SEG',
  saude_indigena: 'SAU',
};

const order: OccurrenceStatus[] = ['validacao', 'registrada', 'encaminhada', 'confirmada', 'em_atendimento', 'respondida', 'encerrada'];

export interface BuildParams {
  id: string;
  kind: OccurrenceKind;
  category: Category;
  type: string;
  priority: Priority;
  originNodeId: string;
  createdAt: number;
  status: OccurrenceStatus;
  report?: string;
  sensor?: SensorTrigger;
  down: Set<string>;
  rand: () => number;
  hopMs?: [number, number]; // intervalo de tempo por salto
  route?: string[];
  ai?: Partial<AIClassification>;
  responseText?: string;
}

export function compactPacket(p: {
  id: string;
  kind: OccurrenceKind;
  category: Category;
  typeCode: string;
  priority: Priority;
  originNodeId: string;
  createdAt: number;
  report?: string;
  sensor?: SensorTrigger;
  institution?: InstitutionId;
}) {
  const src = `!${p.originNodeId.replace('-', '').toLowerCase()}`;
  const base = { v: 1, id: p.id.slice(-4).toLowerCase(), src, ts: Math.floor(p.createdAt / 1000) };
  if (p.kind === 'sensor' && p.sensor) {
    return {
      ...base,
      t: 'ALR',
      cat: categoryInfo[p.category].code,
      m: p.sensor.metric,
      val: p.sensor.value,
      lim: p.sensor.threshold,
      pri: priorityInfo[p.priority].code,
      vld: 1,
    };
  }
  return {
    ...base,
    t: 'REL',
    cat: categoryInfo[p.category].code,
    tp: p.typeCode,
    pri: priorityInfo[p.priority].code,
    dst: INST_CODE[p.institution ?? categoryInfo[p.category].institution],
    txt: p.report ?? '',
  };
}

const typeCodeOf = (type: string) =>
  type
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .split(/[^A-Z]+/)
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w.slice(0, 3))
    .join('_');

export function buildOccurrence(p: BuildParams): Occurrence | null {
  const route = p.route ?? routeToGateway(p.originNodeId, p.down);
  if (!route) return null;
  const r = p.rand;
  const [hMin, hMax] = p.hopMs ?? [1500, 6000];
  const origin = nodeById[p.originNodeId];
  const institution = categoryInfo[p.category].institution;
  const targetStep = order.indexOf(p.status);

  const ai: AIClassification = {
    category: p.category,
    type: p.type,
    priority: p.priority,
    recipient: categoryInfo[p.category].recipient,
    confidence: +(0.82 + r() * 0.15).toFixed(2),
    ...p.ai,
  };

  const tl: TimelineEvent[] = [];
  let t = p.createdAt;
  tl.push({
    key: 'criada',
    label: p.kind === 'sensor' ? 'Leitura fora do limite detectada pela estação' : 'Mensagem criada no dispositivo',
    detail: `${origin.name} · ${origin.id}`,
    at: t,
    nodeId: origin.id,
  });
  t += 1200 + r() * 3000;
  tl.push({
    key: 'classificada',
    label: p.kind === 'sensor' ? 'Critério automático atingido · alerta gerado' : 'Classificada pela IA offline',
    detail: p.kind === 'sensor' ? 'Sujeito a validação humana' : `${categoryInfo[p.category].label} · prioridade ${priorityInfo[p.priority].label.toLowerCase()}`,
    at: t,
    nodeId: origin.id,
  });
  for (let i = 1; i < route.length; i++) {
    t += hMin + r() * (hMax - hMin);
    const n = nodeById[route[i]];
    const isLast = i === route.length - 1;
    tl.push({
      key: isLast ? 'gateway' : 'salto',
      label: isLast ? `Chegou ao ${n.name}` : `Retransmitida por ${n.name}`,
      detail: isLast ? `${n.connection} · saída da rede local` : `Salto ${i} de ${route.length - 1}`,
      at: t,
      nodeId: n.id,
      rssi: -Math.round(82 + r() * 34),
      snr: +(-4 + r() * 14).toFixed(1),
    });
  }
  const arrivedAt = t;
  t += 400 + r() * 900;
  tl.push({ key: 'registrada', label: 'Registrada na plataforma', detail: 'Ocorrência armazenada e classificada na fila', at: t });

  const pushIf = (step: OccurrenceStatus, ev: Omit<TimelineEvent, 'at'>, delay: number) => {
    if (targetStep >= order.indexOf(step)) {
      t += delay;
      tl.push({ ...ev, at: t });
    }
  };
  const fast = p.priority === 'critica' || p.priority === 'alta';
  if (p.kind === 'sensor' && targetStep > order.indexOf('registrada')) {
    t += (2 + r() * 18) * 60000;
    tl.push({ key: 'validacao', label: 'Alerta validado', detail: 'Confirmado pela brigada comunitária', at: t });
  }
  pushIf('encaminhada', { key: 'encaminhada', label: `Encaminhada ao ${institutionInfo[institution].label}`, detail: 'Envio registrado' }, (fast ? 0.5 + r() * 4 : 3 + r() * 30) * 60000);
  pushIf('confirmada', { key: 'confirmada', label: 'Recebimento confirmado pela instituição', detail: institutionInfo[institution].label }, (fast ? 3 + r() * 20 : 15 + r() * 90) * 60000);
  pushIf('em_atendimento', { key: 'em_atendimento', label: 'Em atendimento', detail: 'Equipe designada' }, (20 + r() * 120) * 60000);

  let response: string | undefined;
  if (targetStep >= order.indexOf('respondida')) {
    response = p.responseText ?? responseTemplates[institution][Math.floor(r() * 2)];
    t += (30 + r() * 240) * 60000;
    tl.push({ key: 'resposta', label: 'Resposta enviada de volta à comunidade', detail: 'Via gateway → rede LoRa', at: t });
    t += 8000 + r() * 30000;
    tl.push({ key: 'entregue', label: `Resposta entregue no dispositivo ${origin.name}`, detail: `${route.length - 1} saltos de volta`, at: t, nodeId: origin.id });
  }
  pushIf('encerrada', { key: 'encerrada', label: 'Ocorrência encerrada', detail: 'Encerrada em acordo com a comunidade' }, (6 + r() * 40) * 3600000);

  const typeCode = typeCodeOf(p.type);
  return {
    id: p.id,
    kind: p.kind,
    category: p.category,
    type: p.type,
    priority: p.priority,
    status: p.status,
    territoryId: origin.territoryId!,
    originNodeId: origin.id,
    gatewayId: route[route.length - 1],
    route,
    createdAt: p.createdAt,
    arrivedAt,
    report: p.report,
    ai,
    institution: targetStep >= order.indexOf('encaminhada') ? institution : undefined,
    sensor: p.sensor,
    response,
    timeline: tl,
    packet: compactPacket({ ...p, typeCode, institution }),
  };
}

/** Série curta de leituras que antecede um alerta de sensor. */
export function sensorTriggerFor(category: Category, end: number, rand: () => number, priority: Priority = 'alta'): SensorTrigger {
  const metric = category === 'fumaca' ? 'pm25' : category === 'rio' ? 'rio' : category === 'chuva' ? 'chuva' : 'temperatura';
  const m = metrics[metric];
  // picos plausíveis: temperatura e rio ultrapassam pouco o limite; chuva e fumaça podem disparar
  const peak = metric === 'temperatura' || metric === 'rio' ? m.alert + (m.alert - m.attention) * (0.3 + rand() * 1.2) : m.alert * (priority === 'critica' ? 1.7 + rand() * 0.6 : priority === 'alta' ? 1.2 + rand() * 0.4 : 1.05 + rand() * 0.2);
  const base = metric === 'pm25' ? 12 : metric === 'rio' ? m.attention - 1.6 : metric === 'chuva' ? 2 : 30;
  const series = Array.from({ length: 24 }, (_, i) => {
    const k = i / 23;
    const v = base + (peak - base) * k ** 2.2 + (rand() - 0.5) * (m.alert - base) * 0.08;
    return { t: end - (23 - i) * 15 * 60000, v: +Math.max(0, v).toFixed(m.decimals) };
  });
  const value = series[series.length - 1].v;
  return { metric, value, threshold: m.alert, series };
}
