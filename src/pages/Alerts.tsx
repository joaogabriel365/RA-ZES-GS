import { AnimatePresence } from 'framer-motion';
import { Filter, Lock, RotateCcw, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { OccurrenceCard } from '../components/alerts/OccurrenceCard';
import { PageHeader, useNow } from '../components/common/ui';
import { categories, categoryInfo, priorities, priorityInfo, statuses, statusInfo } from '../data/catalog';
import { territories } from '../data/network';
import type { Category, OccurrenceKind, OccurrenceStatus, Priority } from '../lib/types';
import { useNetwork } from '../store/NetworkContext';

const PERIODS = [
  { v: 'all', label: 'Todo o período', ms: Infinity },
  { v: '24h', label: 'Últimas 24 h', ms: 86400000 },
  { v: '72h', label: 'Últimos 3 dias', ms: 3 * 86400000 },
  { v: '7d', label: 'Últimos 7 dias', ms: 7 * 86400000 },
] as const;

export function Alerts() {
  const { occurrences, isInstitution } = useNetwork();
  const now = useNow(5000);
  const [kind, setKind] = useState<OccurrenceKind | 'all'>('all');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [priority, setPriority] = useState<Priority | 'all'>('all');
  const [status, setStatus] = useState<OccurrenceStatus | 'all'>('all');
  const [territory, setTerritory] = useState<string>('all');
  const [period, setPeriod] = useState<(typeof PERIODS)[number]['v']>('all');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const pms = PERIODS.find((p) => p.v === period)!.ms;
    const query = q.trim().toLowerCase();
    return occurrences.filter(
      (o) =>
        (kind === 'all' || o.kind === kind) &&
        (category === 'all' || o.category === category) &&
        (priority === 'all' || o.priority === priority) &&
        (status === 'all' || o.status === status) &&
        (territory === 'all' || o.territoryId === territory) &&
        now - o.createdAt <= pms &&
        (!query || o.id.toLowerCase().includes(query) || o.type.toLowerCase().includes(query) || categoryInfo[o.category].label.toLowerCase().includes(query)),
    );
  }, [occurrences, kind, category, priority, status, territory, period, q, now]);

  const counts = useMemo(() => {
    const c: Record<Priority, number> = { critica: 0, alta: 0, media: 0, baixa: 0 };
    filtered.forEach((o) => c[o.priority]++);
    return c;
  }, [filtered]);

  const anyFilter = kind !== 'all' || category !== 'all' || priority !== 'all' || status !== 'all' || territory !== 'all' || period !== 'all' || q;
  const clear = () => {
    setKind('all');
    setCategory('all');
    setPriority('all');
    setStatus('all');
    setTerritory('all');
    setPeriod('all');
    setQ('');
  };

  const sel = 'input py-2';

  return (
    <div>
      <PageHeader
        eyebrow="Alertas e ocorrências"
        title="O que a rede registrou"
        right={
          <div className="flex flex-wrap gap-2">
            {priorities.map((p) => (
              <button
                key={p}
                onClick={() => setPriority(priority === p ? 'all' : p)}
                className={`rounded-2xl border px-4 py-2 text-left transition ${priority === p ? 'border-jenipapo-900 bg-white shadow' : 'border-palha-300 bg-white/60 hover:bg-white'}`}
                aria-pressed={priority === p}
              >
                <span className="block font-display text-2xl font-semibold tabular-nums" style={{ color: p === 'media' ? '#A87F00' : priorityInfo[p].color }}>
                  {counts[p]}
                </span>
                <span className="text-xs font-medium text-jenipapo-600">{priorityInfo[p].label}</span>
              </button>
            ))}
          </div>
        }
      >
        Alertas automáticos dos sensores e relatos enviados pelas comunidades, do mais recente ao mais antigo.
      </PageHeader>

      <div className="container-r py-8">
        <div className="card p-4" role="search" aria-label="Filtros de ocorrências">
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-semibold text-jenipapo-800">
              <Filter className="h-4 w-4 text-urucum-500" aria-hidden="true" /> Filtros
            </p>
            {anyFilter && (
              <button onClick={clear} className="flex items-center gap-1 text-xs font-semibold text-urucum-600 hover:underline">
                <RotateCcw className="h-3 w-3" aria-hidden="true" /> Limpar
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-jenipapo-400" aria-hidden="true" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar (ID, tipo)" className="input py-2 pl-9" aria-label="Buscar ocorrência" />
            </div>
            <select value={kind} onChange={(e) => setKind(e.target.value as OccurrenceKind | 'all')} className={sel} aria-label="Tipo de origem">
              <option value="all">Origem: todas</option>
              <option value="sensor">Automático (sensor)</option>
              <option value="comunitaria">Comunitário</option>
            </select>
            <select value={category} onChange={(e) => setCategory(e.target.value as Category | 'all')} className={sel} aria-label="Categoria">
              <option value="all">Categoria: todas</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {categoryInfo[c].label}
                </option>
              ))}
            </select>
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority | 'all')} className={sel} aria-label="Prioridade">
              <option value="all">Prioridade: todas</option>
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {priorityInfo[p].label}
                </option>
              ))}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value as OccurrenceStatus | 'all')} className={sel} aria-label="Status">
              <option value="all">Status: todos</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {statusInfo[s].label}
                </option>
              ))}
            </select>
            <select value={territory} onChange={(e) => setTerritory(e.target.value)} className={sel} aria-label="Território">
              <option value="all">Território: todos</option>
              {territories.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.short}
                </option>
              ))}
            </select>
            <select value={period} onChange={(e) => setPeriod(e.target.value as (typeof PERIODS)[number]['v'])} className={sel} aria-label="Período">
              {PERIODS.map((p) => (
                <option key={p.v} value={p.v}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-sm text-jenipapo-600">
          <p>
            <strong className="text-jenipapo-900">{filtered.length}</strong> ocorrências
          </p>
          {!isInstitution && (
            <p className="flex items-center gap-1.5 text-xs">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Visão pública: relatos comunitários sem conteúdo, autoria ou localização exata.
            </p>
          )}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {filtered.map((o) => (
              <OccurrenceCard key={o.id} o={o} isInstitution={isInstitution} now={now} />
            ))}
          </AnimatePresence>
        </div>
        {filtered.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-palha-400 p-10 text-center text-jenipapo-600">
            Nenhuma ocorrência com esses filtros.{' '}
            <button onClick={clear} className="font-semibold text-urucum-600 underline">
              Limpar filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
