import { Area, AreaChart, CartesianGrid, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { metrics } from '../../data/sensors';
import { fmtNum, fmtTime, fmtDateTime } from '../../lib/format';
import type { SensorMetric } from '../../lib/types';

interface Props {
  data: { t: number; v: number }[];
  metric: SensorMetric;
  height?: number;
  bands?: boolean; // faixas de atenção e alerta
  dark?: boolean;
  color?: string;
  id: string;
}

export function SensorChart({ data, metric, height = 220, bands = true, dark = false, color = '#2A7A50', id }: Props) {
  const m = metrics[metric];
  const values = data.map((d) => d.v);
  const lo = Math.min(...values, m.inverse ? m.alert : m.domain[0]);
  const hi = Math.max(...values, m.inverse ? m.domain[1] : m.alert);
  const pad = (hi - lo) * 0.12;
  const domain: [number, number] = [Math.max(m.domain[0], +(lo - pad).toFixed(2)), Math.min(m.domain[1], +(hi + pad).toFixed(2))];
  const ink = dark ? '#8FA7B3' : '#5F7C8B';
  const grid = dark ? 'rgba(255,255,255,0.06)' : 'rgba(12,25,34,0.07)';

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id={`g-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={grid} vertical={false} />
          {bands &&
            (m.inverse ? (
              <>
                <ReferenceArea y1={m.alert} y2={m.attention} fill="#E2B126" fillOpacity={0.1} ifOverflow="hidden" />
                <ReferenceArea y1={domain[0]} y2={m.alert} fill="#DC3535" fillOpacity={0.1} ifOverflow="hidden" />
              </>
            ) : (
              <>
                <ReferenceArea y1={m.attention} y2={m.alert} fill="#E2B126" fillOpacity={0.1} ifOverflow="hidden" />
                <ReferenceArea y1={m.alert} y2={domain[1]} fill="#DC3535" fillOpacity={0.1} ifOverflow="hidden" />
              </>
            ))}
          {bands && <ReferenceLine y={m.attention} stroke="#C99410" strokeDasharray="4 4" strokeWidth={1} ifOverflow="hidden" />}
          <ReferenceLine
            y={m.alert}
            stroke="#DC3535"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            ifOverflow="extendDomain"
            label={{ value: `limite ${fmtNum(m.alert, m.decimals)} ${m.unit}`, position: 'insideTopRight', fill: '#DC3535', fontSize: 11, fontWeight: 600 }}
          />
          <XAxis
            dataKey="t"
            type="number"
            domain={['dataMin', 'dataMax']}
            scale="time"
            tickFormatter={(t) => fmtTime(t, false)}
            tick={{ fill: ink, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={40}
          />
          <YAxis domain={domain} tick={{ fill: ink, fontSize: 11 }} axisLine={false} tickLine={false} width={44} tickFormatter={(v) => fmtNum(v, m.decimals > 1 ? 1 : 0)} />
          <Tooltip
            cursor={{ stroke: ink, strokeDasharray: '3 3' }}
            contentStyle={{
              background: dark ? '#0C1922' : '#fff',
              border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : '#DFCFAF'}`,
              borderRadius: 12,
              fontSize: 12,
              color: dark ? '#EDE3CF' : '#0C1922',
            }}
            labelFormatter={(t) => fmtDateTime(Number(t))}
            formatter={(v) => [`${fmtNum(Number(v), m.decimals)} ${m.unit}`, m.label]}
          />
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#g-${id})`} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
