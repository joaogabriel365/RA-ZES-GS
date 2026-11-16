import { motion } from 'framer-motion';
import { ArrowRight, Clock, Lock, Radio, Route } from 'lucide-react';
import { Link } from 'react-router-dom';
import { categoryInfo, priorityInfo, statusInfo } from '../../data/catalog';
import { metrics } from '../../data/sensors';
import { territories } from '../../data/network';
import { fmtAgo, fmtDateTime, fmtDuration, fmtNum, fmtPeriod, fmtTime } from '../../lib/format';
import { nodeById } from '../../lib/graph';
import type { Occurrence } from '../../lib/types';
import { CategoryIcon, PriorityBadge, StatusBadge } from '../common/ui';

export const territoryName = (id: string) => territories.find((t) => t.id === id)?.name ?? id;
export const territoryShort = (id: string) => territories.find((t) => t.id === id)?.short ?? id;

/** Para a visão pública: relatos comunitários só aparecem agregados e anonimizados. */
export const isRestricted = (o: Occurrence, isInstitution: boolean) => o.kind === 'comunitaria' && !isInstitution;

export function publicSummary(o: Occurrence) {
  const cat = categoryInfo[o.category].label.toLowerCase();
  const status = statusInfo[o.status].label.toLowerCase();
  return `1 ${o.category === 'apoio' ? 'solicitação de apoio' : cat} de prioridade ${priorityInfo[o.priority].label.toLowerCase()} registrada em ${territoryName(o.territoryId)} · ${status}`;
}

export function sensorHeadline(o: Occurrence) {
  if (!o.sensor) return o.type;
  const m = metrics[o.sensor.metric];
  return `${m.label}: ${fmtNum(o.sensor.value, m.decimals)} ${m.unit} (limite ${fmtNum(o.sensor.threshold, m.decimals)} ${m.unit})`;
}

export function OccurrenceCard({ o, isInstitution, now }: { o: Occurrence; isInstitution: boolean; now: number }) {
  const restricted = isRestricted(o, isInstitution);
  const p = priorityInfo[o.priority];
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="group relative overflow-hidden rounded-2xl border border-palha-300/70 bg-white shadow-card transition-shadow hover:shadow-lg"
    >
      <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: p.color }} aria-hidden="true" />
      <Link to={`/alertas/${o.id}`} className="block p-4 pl-5 focus-visible:outline-offset-[-3px] sm:p-5 sm:pl-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: p.soft, color: o.priority === 'media' ? '#8A6500' : p.color }}>
              <CategoryIcon category={o.category} className="h-[18px] w-[18px]" />
            </span>
            <div>
              <p className="font-semibold leading-tight text-jenipapo-900">{categoryInfo[o.category].label}</p>
              <p className="text-xs text-jenipapo-500">
                {o.kind === 'sensor' ? 'Alerta automático · sensor' : 'Relato comunitário'} · <span className="font-mono">{o.id}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {o.live && (
              <span className="chip bg-urucum-50 text-urucum-700 ring-1 ring-inset ring-urucum-200">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-urucum-500" />
                Nova
              </span>
            )}
            <PriorityBadge priority={o.priority} />
          </div>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-jenipapo-700">
          {restricted ? publicSummary(o) : o.kind === 'sensor' ? sensorHeadline(o) : <>“{o.report}”</>}
        </p>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-jenipapo-600 sm:grid-cols-4">
          <div>
            <dt className="text-jenipapo-400">Território</dt>
            <dd className="font-medium text-jenipapo-800">{territoryShort(o.territoryId)}</dd>
          </div>
          <div>
            <dt className="text-jenipapo-400">Origem</dt>
            <dd className="font-medium tabular-nums text-jenipapo-800">{restricted ? fmtPeriod(o.createdAt) : fmtDateTime(o.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-jenipapo-400">Chegada</dt>
            <dd className="font-medium tabular-nums text-jenipapo-800">
              {restricted ? '—' : <>{fmtTime(o.arrivedAt)} <span className="text-jenipapo-400">(+{fmtDuration(o.arrivedAt - o.createdAt)})</span></>}
            </dd>
          </div>
          <div>
            <dt className="text-jenipapo-400">Rota</dt>
            <dd className="flex items-center gap-1 font-medium text-jenipapo-800">
              {restricted ? (
                <>
                  <Lock className="h-3 w-3" aria-hidden="true" /> restrita
                </>
              ) : (
                <>
                  <Route className="h-3 w-3" aria-hidden="true" /> {o.route.length - 1} saltos
                </>
              )}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex items-center justify-between border-t border-palha-200 pt-3">
          <StatusBadge status={o.status} />
          <span className="flex items-center gap-1 text-xs font-medium text-urucum-600 opacity-80 group-hover:opacity-100">
            {fmtAgo(o.arrivedAt, now)} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}

/** Item compacto para feeds (início). */
export function FeedItem({ o, isInstitution, now, dark = false }: { o: Occurrence; isInstitution: boolean; now: number; dark?: boolean }) {
  const restricted = isRestricted(o, isInstitution);
  const p = priorityInfo[o.priority];
  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -16, backgroundColor: dark ? 'rgba(194,81,46,0.25)' : 'rgba(194,81,46,0.12)' }}
      animate={{ opacity: 1, x: 0, backgroundColor: 'rgba(0,0,0,0)' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, backgroundColor: { duration: 2.5 } }}
      className="rounded-xl"
    >
      <Link to={`/alertas/${o.id}`} className={`flex gap-3 rounded-xl p-3 ${dark ? 'hover:bg-white/5' : 'hover:bg-palha-100'}`}>
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: dark ? `${p.color}26` : p.soft, color: p.color }}>
          <CategoryIcon category={o.category} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className={`truncate text-sm font-semibold ${dark ? 'text-palha-100' : 'text-jenipapo-900'}`}>{categoryInfo[o.category].label}</p>
            <span className={`shrink-0 font-mono text-[11px] tabular-nums ${dark ? 'text-palha-300/60' : 'text-jenipapo-400'}`}>{fmtAgo(o.arrivedAt, now)}</span>
          </div>
          <p className={`mt-0.5 line-clamp-2 text-xs leading-relaxed ${dark ? 'text-palha-300/75' : 'text-jenipapo-600'}`}>
            {restricted ? publicSummary(o) : o.kind === 'sensor' ? `${territoryShort(o.territoryId)} · ${sensorHeadline(o)}` : `${territoryShort(o.territoryId)} · ${o.type}`}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 font-semibold" style={{ color: o.priority === 'media' && !dark ? '#8A6500' : p.color }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
              {p.label}
            </span>
            <span className={dark ? 'text-palha-300/40' : 'text-jenipapo-300'}>•</span>
            <span className={`inline-flex items-center gap-1 ${dark ? 'text-palha-300/60' : 'text-jenipapo-500'}`}>
              {restricted ? <Lock className="h-3 w-3" aria-hidden="true" /> : <Radio className="h-3 w-3" aria-hidden="true" />}
              {restricted ? 'anonimizado' : `${o.route.length - 1} saltos via ${nodeById[o.gatewayId].id}`}
            </span>
            <span className={dark ? 'text-palha-300/40' : 'text-jenipapo-300'}>•</span>
            <span className={`inline-flex items-center gap-1 ${dark ? 'text-palha-300/60' : 'text-jenipapo-500'}`}>
              <Clock className="h-3 w-3" aria-hidden="true" />
              {statusInfo[o.status].label}
            </span>
          </div>
        </div>
      </Link>
    </motion.li>
  );
}

export { StatusBadge };
