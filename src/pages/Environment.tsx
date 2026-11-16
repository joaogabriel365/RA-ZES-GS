import { motion } from 'framer-motion';
import { Activity, CloudRain, Droplets, Thermometer, Waves, Wind, type LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SensorChart } from '../components/charts/SensorChart';
import { PageHeader, Reveal } from '../components/common/ui';
import { territories } from '../data/network';
import { levelInfo, levelOf, metricOrder, metrics, stations, stationScenario, worstLevel, type Level } from '../data/sensors';
import { fmtAgo, fmtNum } from '../lib/format';
import type { SensorMetric } from '../lib/types';
import { useNetwork } from '../store/NetworkContext';

const metricIcon: Record<SensorMetric, LucideIcon> = { temperatura: Thermometer, umidade: Droplets, chuva: CloudRain, rio: Waves, pm25: Wind };
const metricColor: Record<SensorMetric, string> = { temperatura: '#C2512E', umidade: '#2B6F8F', chuva: '#3A5868', rio: '#1F6FA3', pm25: '#7A5B3A' };

function LevelChip({ level }: { level: Level }) {
  const l = levelInfo[level];
  return (
    <span className="chip" style={{ background: l.soft, color: level === 'atencao' ? '#7A5B00' : l.color, boxShadow: `inset 0 0 0 1px ${l.color}40` }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: l.color }} /> {l.label}
    </span>
  );
}

export function Environment() {
  const { series } = useNetwork();
  const [stationId, setStationId] = useState(Object.keys(stationScenario)[0]);
  const station = stations.find((s) => s.id === stationId)!;
  const data = series[stationId];
  const latest = data[data.length - 1];

  const summary = useMemo(
    () =>
      territories.map((t) => {
        const st = stations.find((s) => s.territoryId === t.id);
        const last = st ? series[st.id][series[st.id].length - 1] : null;
        const levels = last ? metricOrder.map((k) => ({ k, lv: levelOf(k, last[k]) })) : [];
        const worst = worstLevel(levels.map((l) => l.lv));
        const drivers = levels.filter((l) => l.lv === worst && worst !== 'normal').map((l) => metrics[l.k].label);
        return { t, st, worst, drivers, last };
      }),
    [series],
  );

  return (
    <div>
      <PageHeader eyebrow="Monitoramento ambiental" title="Estações comunitárias">
        Cada território tem uma estação que mede temperatura, umidade, chuva, nível do rio e material particulado (fumaça). Alertas automáticos são sempre sujeitos a validação.
      </PageHeader>

      <div className="container-r py-8">
        <section aria-labelledby="sum-title">
          <h2 id="sum-title" className="font-display text-xl font-semibold">
            Resumo por território
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {summary.map(({ t, st, worst, drivers }, i) => (
              <Reveal key={t.id} delay={i * 0.04}>
                <button
                  onClick={() => st && setStationId(st.id)}
                  className={`card h-full w-full p-4 text-left transition hover:-translate-y-0.5 ${st?.id === stationId ? 'ring-2 ring-jenipapo-900' : ''}`}
                  aria-pressed={st?.id === stationId}
                >
                  <span className="block h-1 w-10 rounded-full" style={{ background: levelInfo[worst].color }} aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold leading-tight text-jenipapo-900">{t.short}</p>
                  <div className="mt-2">
                    <LevelChip level={worst} />
                  </div>
                  <p className="mt-2 text-[11px] leading-snug text-jenipapo-500">{drivers.length ? drivers.join(', ') : 'Todas as leituras na faixa normal'}</p>
                </button>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mt-10" aria-labelledby="st-title">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="eyebrow text-urucum-600">Estação selecionada</p>
              <h2 id="st-title" className="mt-1 font-display text-3xl font-semibold">
                {station.name}
              </h2>
              <p className="mt-1 text-sm text-jenipapo-600">
                {territories.find((t) => t.id === station.territoryId)?.name} · <span className="font-mono">{station.id}</span> · última leitura {fmtAgo(latest.t)} · amostragem a cada 30 min
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <span className="font-medium text-jenipapo-600">Estação</span>
              <select value={stationId} onChange={(e) => setStationId(e.target.value)} className="input w-auto">
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {territories.find((t) => t.id === s.territoryId)?.short}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {metricOrder.map((k, i) => {
              const m = metrics[k];
              const Icon = metricIcon[k];
              const lv = levelOf(k, latest[k]);
              const prev = data[Math.max(0, data.length - 7)][k];
              const delta = latest[k] - prev;
              return (
                <motion.div
                  key={`${stationId}-${k}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`card p-5 ${i === 0 ? 'lg:col-span-2' : ''}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-palha-100" style={{ color: metricColor[k] }}>
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="font-semibold text-jenipapo-900">{m.label}</h3>
                        <p className="text-xs text-jenipapo-500">
                          Atenção {m.inverse ? '≤' : '≥'} {fmtNum(m.attention, m.decimals > 1 ? 1 : 0)} · Alerta {m.inverse ? '≤' : '≥'} {fmtNum(m.alert, m.decimals > 1 ? 1 : 0)} {m.unit}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-3xl font-semibold tabular-nums text-jenipapo-900">
                        {fmtNum(latest[k], m.decimals)} <span className="text-base font-medium text-jenipapo-500">{m.unit}</span>
                      </p>
                      <div className="mt-1 flex items-center justify-end gap-2">
                        <span className="text-xs tabular-nums text-jenipapo-500">
                          {delta >= 0 ? '▲' : '▼'} {fmtNum(Math.abs(delta), m.decimals)} em 3 h
                        </span>
                        <LevelChip level={lv} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <SensorChart id={`${stationId}-${k}`} data={data.map((d) => ({ t: d.t, v: d[k] }))} metric={k} height={i === 0 ? 260 : 200} color={metricColor[k]} />
                  </div>
                </motion.div>
              );
            })}
          </div>
          <p className="mt-4 flex items-start gap-2 text-xs text-jenipapo-500">
            <Activity className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Faixas amarela (atenção) e vermelha (alerta) com limites ilustrativos. No projeto real, os critérios são definidos com a comunidade e órgãos técnicos, e todo alerta automático passa
            por validação humana antes de ser encaminhado.
          </p>
        </section>
      </div>
    </div>
  );
}
