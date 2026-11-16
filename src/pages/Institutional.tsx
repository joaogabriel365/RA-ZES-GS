import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Building2, CheckCircle2, Clock, Eye, Inbox, LogIn, LogOut, MessageSquareReply, Send, ShieldCheck, Siren, Timer } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { territoryShort } from '../components/alerts/OccurrenceCard';
import { CategoryIcon, PageHeader, PriorityBadge, StatusBadge, useNow } from '../components/common/ui';
import { LogoMark } from '../components/brand/Logo';
import { categories, categoryInfo, institutionInfo, institutions, priorityInfo, statuses, statusInfo } from '../data/catalog';
import { territories } from '../data/network';
import { fmtDuration, fmtNum } from '../lib/format';
import { nodeById } from '../lib/graph';
import type { InstitutionId, Occurrence, OccurrenceStatus } from '../lib/types';
import { responseTemplates, useNetwork } from '../store/NetworkContext';

function Gate() {
  const { login } = useNetwork();
  return (
    <div className="relative overflow-hidden bg-jenipapo-900 text-palha-100">
      <div className="bg-roots-dark absolute inset-0" aria-hidden="true" />
      <div className="container-r relative grid min-h-[70vh] items-center gap-10 py-16 lg:grid-cols-2">
        <div>
          <LogoMark size={56} />
          <p className="eyebrow mt-6 text-urucum-300">Acesso restrito</p>
          <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">Painel institucional</h1>
          <p className="mt-4 max-w-lg leading-relaxed text-palha-300/80">
            Instituições autorizadas pelas comunidades veem o relato original, a classificação da IA, a rota da mensagem e podem encaminhar, atualizar status e responder de volta à comunidade.
          </p>
          <button onClick={login} className="btn-primary mt-8 px-6 py-3 text-base">
            <LogIn className="h-4 w-4" aria-hidden="true" /> Entrar como instituição (demonstração)
          </button>
          <p className="mt-3 text-xs text-palha-300/50">Login simulado — nenhum dado real é acessado.</p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            { icon: Eye, t: 'Relato original', d: 'Exatamente como a comunidade escreveu ou falou.' },
            { icon: Inbox, t: 'Fila priorizada', d: 'Ordenada por prioridade e tempo de espera.' },
            { icon: Send, t: 'Encaminhamento', d: 'Para o órgão responsável, com registro de envio.' },
            { icon: MessageSquareReply, t: 'Resposta de volta', d: 'Desce pelo gateway e pela rede até o dispositivo.' },
          ].map((x, i) => (
            <motion.li key={x.t} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.08 }} className="card-dark p-5">
              <x.icon className="h-5 w-5 text-urucum-300" aria-hidden="true" />
              <p className="mt-3 font-semibold">{x.t}</p>
              <p className="mt-1 text-sm text-palha-300/70">{x.d}</p>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MiniBars({ data, color = '#2A7A50', height = 220 }: { data: { name: string; v: number }[]; color?: string; height?: number }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 0 }} barCategoryGap={6}>
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={130} tick={{ fill: '#3A5868', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: 'rgba(12,25,34,0.04)' }} contentStyle={{ borderRadius: 12, border: '1px solid #DFCFAF', fontSize: 12 }} formatter={(v) => [v, 'Ocorrências']} />
          <Bar dataKey="v" radius={[0, 4, 4, 0]} isAnimationActive label={{ position: 'right', fill: '#0C1922', fontSize: 11, fontWeight: 600 }}>
            {data.map((d) => (
              <Cell key={d.name} fill={color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ActionPanel({ o }: { o: Occurrence }) {
  const { forward, setStatus, respond } = useNetwork();
  const [inst, setInst] = useState<InstitutionId>(o.institution ?? categoryInfo[o.category].institution);
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <motion.div key={o.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="card overflow-hidden">
      <div className="border-b border-palha-200 p-5" style={{ boxShadow: `inset 4px 0 0 ${priorityInfo[o.priority].color}` }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-xs text-jenipapo-500">{o.id}</span>
          <div className="flex gap-1.5">
            <PriorityBadge priority={o.priority} />
            <StatusBadge status={o.status} />
          </div>
        </div>
        <h2 className="mt-2 flex items-center gap-2 font-display text-2xl font-semibold">
          <CategoryIcon category={o.category} className="h-5 w-5" /> {categoryInfo[o.category].label}
        </h2>
        <p className="text-sm text-jenipapo-600">
          {o.type} · {territoryShort(o.territoryId)} · {nodeById[o.originNodeId].name}
        </p>
        {o.report && <blockquote className="mt-3 rounded-xl bg-palha-100 p-3 font-display italic leading-snug text-jenipapo-900">“{o.report}”</blockquote>}
        {o.kind === 'sensor' && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-inset ring-amber-200">Alerta automático de sensor — sujeito a validação humana antes do encaminhamento.</p>}
        <p className="mt-3 text-xs text-jenipapo-500">
          IA sugeriu: <strong className="text-jenipapo-800">{o.ai.recipient}</strong> · confiança {Math.round(o.ai.confidence * 100)}%
        </p>
      </div>

      <div className="space-y-5 p-5">
        <div>
          <label htmlFor="inst" className="text-xs font-semibold uppercase tracking-wider text-jenipapo-500">
            Encaminhar para
          </label>
          <div className="mt-1.5 flex gap-2">
            <select id="inst" value={inst} onChange={(e) => setInst(e.target.value as InstitutionId)} className="input">
              {institutions.map((i) => (
                <option key={i} value={i}>
                  {institutionInfo[i].label}
                </option>
              ))}
            </select>
            <button onClick={() => forward(o.id, inst)} className="btn-primary shrink-0 px-4">
              <Send className="h-4 w-4" aria-hidden="true" /> Encaminhar
            </button>
          </div>
          {o.institution && <p className="mt-1.5 text-xs text-floresta-700">Encaminhada ao {institutionInfo[o.institution].label}</p>}
        </div>

        <div>
          <label htmlFor="st" className="text-xs font-semibold uppercase tracking-wider text-jenipapo-500">
            Status
          </label>
          <select id="st" value={o.status} onChange={(e) => setStatus(o.id, e.target.value as OccurrenceStatus)} className="input mt-1.5">
            {statuses.map((s) => (
              <option key={s} value={s} disabled={s === 'respondida'}>
                {statusInfo[s].label}
                {s === 'respondida' ? ' (envie uma resposta abaixo)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="resp" className="text-xs font-semibold uppercase tracking-wider text-jenipapo-500">
            Resposta para a comunidade
          </label>
          <textarea
            id="resp"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setSent(false);
            }}
            rows={3}
            maxLength={160}
            className="input mt-1.5 resize-none"
            placeholder="Mensagem curta que descerá pela rede LoRa até o dispositivo de origem"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {responseTemplates[inst].map((t) => (
              <button key={t} onClick={() => setText(t)} className="rounded-full bg-palha-100 px-2.5 py-1 text-left text-[11px] text-jenipapo-700 hover:bg-palha-200">
                {t.slice(0, 48)}…
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-[11px] text-jenipapo-400">{text.length}/160 · trafega cifrada</span>
            <button
              disabled={!text.trim()}
              onClick={() => {
                respond(o.id, text.trim());
                setSent(true);
                setText('');
              }}
              className="btn bg-floresta-500 text-white hover:bg-floresta-600"
            >
              <MessageSquareReply className="h-4 w-4" aria-hidden="true" /> Enviar resposta
            </button>
          </div>
          <AnimatePresence>
            {sent && (
              <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 flex items-center gap-1.5 text-xs font-medium text-floresta-700">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Resposta enviada ao gateway; descendo pela rede até {nodeById[o.originNodeId].name}.
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <Link to={`/alertas/${o.id}`} className="flex items-center justify-center gap-1.5 text-sm font-semibold text-urucum-600 hover:underline">
          Ver linha do tempo completa <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </motion.div>
  );
}

export function Institutional() {
  const { isInstitution, occurrences, logout } = useNetwork();
  const now = useNow(5000);
  const [selected, setSelected] = useState<string | null>(null);

  const open = useMemo(
    () =>
      occurrences
        .filter((o) => !['respondida', 'encerrada'].includes(o.status))
        .sort((a, b) => priorityInfo[b.priority].rank - priorityInfo[a.priority].rank || a.arrivedAt - b.arrivedAt),
    [occurrences],
  );

  const metrics = useMemo(() => {
    const responded = occurrences.map((o) => ({ o, ev: o.timeline.find((e) => e.key === 'confirmada') })).filter((x) => x.ev);
    const avgConfirm = responded.reduce((s, x) => s + (x.ev!.at - x.o.arrivedAt), 0) / Math.max(1, responded.length);
    const answered = occurrences.map((o) => ({ o, ev: o.timeline.find((e) => e.key === 'resposta') })).filter((x) => x.ev);
    const avgResp = answered.reduce((s, x) => s + (x.ev!.at - x.o.arrivedAt), 0) / Math.max(1, answered.length);
    return {
      avgConfirm,
      avgResp,
      open: open.length,
      critical: open.filter((o) => o.priority === 'critica' || o.priority === 'alta').length,
      byCategory: categories.map((c) => ({ name: categoryInfo[c].label, v: occurrences.filter((o) => o.category === c).length })).sort((a, b) => b.v - a.v),
      byTerritory: territories.map((t) => ({ name: t.short, v: occurrences.filter((o) => o.territoryId === t.id).length })).sort((a, b) => b.v - a.v),
      byStatus: statuses.map((s) => ({ name: statusInfo[s].label, v: occurrences.filter((o) => o.status === s).length })),
    };
  }, [occurrences, open]);

  if (!isInstitution) return <Gate />;
  const current = occurrences.find((o) => o.id === (selected ?? open[0]?.id));

  return (
    <div>
      <PageHeader
        eyebrow="Painel institucional · demonstração"
        title="Fila de ocorrências"
        right={
          <div className="flex items-center gap-3">
            <span className="chip bg-floresta-50 px-3 py-1.5 text-floresta-700 ring-1 ring-inset ring-floresta-200">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Central de articulação (perfil demo)
            </span>
            <button onClick={logout} className="btn-ghost px-4 py-2">
              <LogOut className="h-4 w-4" aria-hidden="true" /> Sair
            </button>
          </div>
        }
      >
        Ordenada por prioridade e tempo de espera. Encaminhe para o órgão responsável, atualize o status e responda à comunidade.
      </PageHeader>

      <div className="container-r py-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { icon: Inbox, label: 'Ocorrências abertas', value: String(metrics.open) },
            { icon: Siren, label: 'Abertas de prioridade alta ou crítica', value: String(metrics.critical) },
            { icon: Timer, label: 'Tempo médio até confirmação', value: fmtDuration(metrics.avgConfirm) },
            { icon: Clock, label: 'Tempo médio de resposta', value: fmtDuration(metrics.avgResp) },
          ].map((m) => (
            <div key={m.label} className="card p-4">
              <m.icon className="h-5 w-5 text-urucum-500" aria-hidden="true" />
              <p className="mt-2 font-display text-2xl font-semibold text-jenipapo-900 sm:text-3xl">{m.value}</p>
              <p className="text-xs text-jenipapo-600">{m.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <section className="card overflow-hidden" aria-labelledby="q-title">
            <div className="flex items-center justify-between border-b border-palha-200 px-5 py-4">
              <h2 id="q-title" className="font-semibold">
                Fila ({open.length})
              </h2>
              <span className="text-xs text-jenipapo-500">prioridade ↓ · espera ↓</span>
            </div>
            <ul className="scroll-thin max-h-[640px] divide-y divide-palha-200 overflow-y-auto">
              <AnimatePresence initial={false}>
                {open.map((o) => {
                  const active = current?.id === o.id;
                  return (
                    <motion.li key={o.id} layout initial={{ opacity: 0, backgroundColor: 'rgba(194,81,46,0.12)' }} animate={{ opacity: 1, backgroundColor: 'rgba(0,0,0,0)' }} transition={{ backgroundColor: { duration: 2 } }}>
                      <button
                        onClick={() => setSelected(o.id)}
                        className={`flex w-full items-center gap-3 px-5 py-3 text-left transition-colors ${active ? 'bg-palha-100' : 'hover:bg-palha-50'}`}
                        aria-current={active}
                      >
                        <span className="h-10 w-1 shrink-0 rounded-full" style={{ background: priorityInfo[o.priority].color }} aria-hidden="true" />
                        <CategoryIcon category={o.category} className="h-4 w-4 shrink-0 text-jenipapo-600" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-jenipapo-900">
                            {categoryInfo[o.category].label} <span className="font-normal text-jenipapo-500">· {o.type}</span>
                          </p>
                          <p className="truncate text-xs text-jenipapo-500">
                            <span className="font-mono">{o.id}</span> · {territoryShort(o.territoryId)} · {statusInfo[o.status].label}
                            {o.institution && ` · ${institutionInfo[o.institution].short}`}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs font-semibold" style={{ color: o.priority === 'media' ? '#8A6500' : priorityInfo[o.priority].color }}>
                            {priorityInfo[o.priority].label}
                          </p>
                          <p className="font-mono text-[11px] text-jenipapo-500">espera {fmtDuration(now - o.arrivedAt)}</p>
                        </div>
                      </button>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          </section>

          <div className="lg:sticky lg:top-20 lg:self-start">
            {current ? (
              <ActionPanel key={current.id} o={current} />
            ) : (
              <div className="card p-10 text-center text-jenipapo-600">
                <Building2 className="mx-auto h-8 w-8 text-jenipapo-400" aria-hidden="true" />
                <p className="mt-3">Nenhuma ocorrência aberta.</p>
              </div>
            )}
          </div>
        </div>

        <section className="mt-8 grid gap-4 lg:grid-cols-3" aria-label="Métricas">
          <div className="card p-5">
            <h3 className="font-semibold">Ocorrências por categoria</h3>
            <MiniBars data={metrics.byCategory} color="#C2512E" height={250} />
          </div>
          <div className="card p-5">
            <h3 className="font-semibold">Por território</h3>
            <MiniBars data={metrics.byTerritory} color="#2A7A50" height={250} />
          </div>
          <div className="card p-5">
            <h3 className="font-semibold">Por status</h3>
            <MiniBars data={metrics.byStatus} color="#264252" height={250} />
            <p className="mt-1 text-[11px] text-jenipapo-500">Total: {fmtNum(occurrences.length)} ocorrências</p>
          </div>
        </section>
      </div>
    </div>
  );
}
