// ============================================================================
//  SENSORES AMBIENTAIS SIMULADOS
//  Limites de atenção/alerta são ILUSTRATIVOS: no projeto real eles são
//  definidos com a comunidade e com órgãos técnicos, e todo alerta automático
//  é sujeito a validação humana.
// ============================================================================
import { mulberry32 } from '../lib/rng';
import type { MetricDef, SensorMetric, SensorPoint } from '../lib/types';
import { nodes } from './network';

export const metrics: Record<SensorMetric, MetricDef> = {
  temperatura: { key: 'temperatura', label: 'Temperatura', unit: '°C', attention: 36, alert: 39, domain: [18, 44], decimals: 1 },
  umidade: { key: 'umidade', label: 'Umidade relativa', unit: '%', attention: 40, alert: 30, inverse: true, domain: [0, 100], decimals: 0 },
  chuva: { key: 'chuva', label: 'Chuva', unit: 'mm/h', attention: 20, alert: 40, domain: [0, 70], decimals: 1 },
  rio: { key: 'rio', label: 'Nível do rio', unit: 'm', attention: 6.5, alert: 7.5, domain: [2, 9], decimals: 2 },
  pm25: { key: 'pm25', label: 'Material particulado (PM2.5)', unit: 'µg/m³', attention: 35, alert: 75, domain: [0, 200], decimals: 0 },
};

export const metricOrder: SensorMetric[] = ['pm25', 'rio', 'chuva', 'temperatura', 'umidade'];

/** Cenário de cada estação — muda o comportamento das curvas simuladas. */
type Scenario = 'normal' | 'fumaca' | 'cheia' | 'chuva' | 'calor';
export const stationScenario: Record<string, Scenario> = {
  'CAL-02': 'fumaca', // Reserva Extrativista Castanhal Alto — fumaça subindo
  'LGS-02': 'cheia', // Lago Sereno — rio acima da cota de alerta
  'MFD-02': 'chuva', // Mata Funda — temporal nas últimas horas
  'CDS-02': 'calor', // Cabeceira do Sol — calor e ar seco
};

export const stations = nodes.filter((n) => n.type === 'estacao');

export const SAMPLE_MINUTES = 30;
const POINTS = 96; // 48 h

function genSeries(stationId: string, idx: number, end: number): SensorPoint[] {
  const r = mulberry32(1000 + idx * 97);
  const sc = stationScenario[stationId] ?? 'normal';
  const out: SensorPoint[] = [];
  let river = 4.2 + r() * 1.2;
  for (let i = 0; i < POINTS; i++) {
    const t = end - (POINTS - 1 - i) * SAMPLE_MINUTES * 60000;
    const hour = new Date(t).getHours() + new Date(t).getMinutes() / 60;
    const diurnal = Math.sin(((hour - 9) / 24) * Math.PI * 2); // pico à tarde
    const k = i / (POINTS - 1); // 0..1 ao longo das 48 h
    const late = Math.max(0, (k - 0.72) / 0.28); // cresce nas últimas ~13 h

    let temperatura = 27.5 + diurnal * 4.2 + (r() - 0.5) * 0.8;
    let umidade = 78 - diurnal * 14 + (r() - 0.5) * 4;
    let chuva = r() < 0.08 ? r() * 9 : 0;
    let pm25 = 9 + r() * 7;
    river += (r() - 0.5) * 0.04;

    if (sc === 'fumaca') {
      pm25 += late ** 1.6 * 130 + Math.max(0, diurnal) * 8 * late;
      temperatura += late * 3.5;
      umidade -= late * 26;
      chuva = 0;
    }
    if (sc === 'cheia') {
      river = 5.6 + k ** 1.8 * 2.4 + (r() - 0.5) * 0.03;
      chuva = r() < 0.3 ? r() * 16 : chuva;
    }
    if (sc === 'chuva') {
      const storm = Math.exp(-(((k - 0.86) / 0.05) ** 2));
      chuva = Math.max(chuva, storm * 52 + (storm > 0.2 ? r() * 6 : 0));
      river = 4.6 + Math.max(0, k - 0.84) * 6 + (r() - 0.5) * 0.03;
      temperatura -= storm * 4;
      umidade = Math.min(99, umidade + storm * 20);
    }
    if (sc === 'calor') {
      temperatura += 3 + late * 3.2;
      umidade -= 12 + late * 6;
      pm25 += 10 + late * 18;
    }
    out.push({
      t,
      temperatura: +temperatura.toFixed(1),
      umidade: +Math.max(8, Math.min(100, umidade)).toFixed(0),
      chuva: +Math.max(0, chuva).toFixed(1),
      rio: +river.toFixed(2),
      pm25: +Math.max(2, pm25).toFixed(0),
    });
  }
  return out;
}

const END = Math.floor(Date.now() / (SAMPLE_MINUTES * 60000)) * SAMPLE_MINUTES * 60000;

export const initialSeries: Record<string, SensorPoint[]> = Object.fromEntries(
  stations.map((s, i) => [s.id, genSeries(s.id, i, END)]),
);

export type Level = 'normal' | 'atencao' | 'alerta';

export function levelOf(metric: SensorMetric, v: number): Level {
  const m = metrics[metric];
  if (m.inverse) return v <= m.alert ? 'alerta' : v <= m.attention ? 'atencao' : 'normal';
  return v >= m.alert ? 'alerta' : v >= m.attention ? 'atencao' : 'normal';
}

export const levelInfo: Record<Level, { label: string; color: string; soft: string }> = {
  normal: { label: 'Normal', color: '#2F9E5B', soft: '#E3F3E9' },
  atencao: { label: 'Atenção', color: '#C99410', soft: '#FBF2D6' },
  alerta: { label: 'Alerta', color: '#DC3535', soft: '#FADCDC' },
};

export function worstLevel(levels: Level[]): Level {
  return levels.includes('alerta') ? 'alerta' : levels.includes('atencao') ? 'atencao' : 'normal';
}
