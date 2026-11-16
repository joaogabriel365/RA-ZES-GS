// Tipos centrais do protótipo RAÍZES

export type NodeType = 'dispositivo' | 'estacao' | 'gateway';
export type NodeStatus = 'online' | 'instavel' | 'offline';

export type Priority = 'baixa' | 'media' | 'alta' | 'critica';

export type Category =
  | 'fumaca'
  | 'rio'
  | 'chuva'
  | 'temperatura'
  | 'denuncia_territorial'
  | 'ameaca'
  | 'saude'
  | 'apoio';

export type OccurrenceKind = 'sensor' | 'comunitaria';

export type OccurrenceStatus =
  | 'validacao' // alerta automático aguardando validação humana
  | 'registrada' // chegou à plataforma
  | 'encaminhada' // enviada à instituição responsável
  | 'confirmada' // instituição confirmou recebimento
  | 'em_atendimento'
  | 'respondida' // resposta enviada de volta à comunidade
  | 'encerrada';

export type InstitutionId =
  | 'org_indigenista'
  | 'org_ambiental'
  | 'defesa_civil'
  | 'seguranca'
  | 'saude_indigena';

export type TerritoryKind = 'indigena' | 'quilombola' | 'ribeirinha' | 'extrativista' | 'assentamento';

export interface Territory {
  id: string;
  name: string;
  short: string;
  kind: TerritoryKind;
  center: [number, number];
  families: number;
}

export interface MeshNode {
  id: string;
  name: string;
  territoryId: string | null; // gateways não pertencem a um território
  type: NodeType;
  lat: number;
  lng: number;
  status: NodeStatus;
  battery: number; // %
  solar: number; // W instantâneo do painel
  rssi: number; // dBm
  snr: number; // dB
  hardware: string;
  connection?: 'Fibra/Ethernet' | 'Celular 4G' | 'Satélite' | 'Wi-Fi';
  place?: string; // para gateways: localidade
}

export type SensorMetric = 'temperatura' | 'umidade' | 'chuva' | 'rio' | 'pm25';

export interface MetricDef {
  key: SensorMetric;
  label: string;
  unit: string;
  attention: number;
  alert: number;
  inverse?: boolean; // true quando valores BAIXOS são o problema (umidade)
  domain: [number, number];
  decimals: number;
}

export interface SensorPoint {
  t: number;
  temperatura: number;
  umidade: number;
  chuva: number;
  rio: number;
  pm25: number;
}

export interface TimelineEvent {
  key:
    | 'criada'
    | 'classificada'
    | 'salto'
    | 'gateway'
    | 'registrada'
    | 'validacao'
    | 'encaminhada'
    | 'confirmada'
    | 'em_atendimento'
    | 'resposta'
    | 'entregue'
    | 'encerrada';
  label: string;
  detail?: string;
  at: number;
  nodeId?: string;
  rssi?: number;
  snr?: number;
}

export interface AIClassification {
  category: Category;
  type: string;
  priority: Priority;
  recipient: string;
  confidence: number;
}

export interface SensorTrigger {
  metric: SensorMetric;
  value: number;
  threshold: number;
  series: { t: number; v: number }[];
}

export interface Occurrence {
  id: string;
  kind: OccurrenceKind;
  category: Category;
  type: string;
  priority: Priority;
  status: OccurrenceStatus;
  territoryId: string;
  originNodeId: string;
  gatewayId: string;
  route: string[]; // ids dos nós, origem → gateway
  createdAt: number;
  arrivedAt: number;
  report?: string; // relato original preservado (restrito)
  ai: AIClassification;
  institution?: InstitutionId;
  sensor?: SensorTrigger;
  response?: string;
  timeline: TimelineEvent[];
  packet: Record<string, unknown>;
  live?: boolean; // gerada durante a sessão
}

export interface PacketLog {
  id: string;
  at: number;
  originId: string;
  gatewayId: string;
  hops: number;
  rssi: number;
  snr: number;
  kind: 'TELEMETRIA' | 'SENSOR' | 'ALERTA' | 'RELATO' | 'ACK' | 'RESPOSTA' | 'BEACON';
  payload: string;
  bytes: number;
}
