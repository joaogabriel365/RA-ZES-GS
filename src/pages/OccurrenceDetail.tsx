import { motion } from 'framer-motion';
import { ArrowLeft, BrainCircuit, CheckCircle2, FileJson2, LayoutDashboard, Lock, LogIn, MapPinned, MessageSquareQuote, Radio, ShieldAlert } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { isRestricted, publicSummary, sensorHeadline, territoryName } from '../components/alerts/OccurrenceCard';
import { SensorChart } from '../components/charts/SensorChart';
import { CategoryIcon, PriorityBadge, StatusBadge } from '../components/common/ui';
import { JsonView } from '../components/common/JsonView';
import { NetworkMap } from '../components/map/NetworkMap';
import { categoryInfo, institutionInfo, priorityInfo } from '../data/catalog';
import { metrics } from '../data/sensors';
import { bytesOf, fmtDateTime, fmtDuration, fmtPeriod, fmtTime } from '../lib/format';
import { nodeById } from '../lib/graph';
import type { TimelineEvent } from '../lib/types';
import { useNetwork } from '../store/NetworkContext';

const dotColor: Partial<Record<TimelineEvent['key'], string>> = {
  criada: '#C2512E',
  classificada: '#C2512E',
  salto: '#8FA7B3',
  gateway: '#C2512E',
  registrada: '#0C1922',
  validacao: '#C99410',
  encaminhada: '#4F46E5',
  confirmada: '#7C3AED',
  em_atendimento: '#E8742A',
  resposta: '#2A7A50',
  entregue: '#2A7A50',
  encerrada: '#5F7C8B',
};

export function OccurrenceDetail() {
  const { id } = useParams();
  const { occurrences, isInstitution, login } = useNetwork();
  const o = occurrences.find((x) => x.id === id);

  if (!o) {
    return (
      <div className="container-r py-20 text-center">
        <h1 className="font-display text-3xl font-semibold">Ocorrência não encontrada</h1>
        <Link to="/alertas" className="btn-primary mt-6">
          Voltar aos alertas
        </Link>
      </div>
    );
  }

  const restricted = isRestricted(o, isInstitution);
  const p = priorityInfo[o.priority];
  // na visão pública de relatos, a linha do tempo omite nós, saltos e horários exatos
  const timeline = restricted ? o.timeline.filter((e) => !['salto', 'criada', 'classificada', 'gateway', 'entregue'].includes(e.key)) : o.timeline;

  return (
    <div>
      <div className="relative overflow-hidden border-b border-palha-300/60 bg-palha-50">
        <div className="bg-roots absolute inset-0 opacity-60" aria-hidden="true" />
        <span className="absolute inset-x-0 top-0 h-1" style={{ background: p.color }} aria-hidden="true" />
        <div className="container-r relative py-8">
          <Link to="/alertas" className="inline-flex items-center gap-1.5 text-sm font-medium text-jenipapo-600 hover:text-urucum-600">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Alertas e ocorrências
          </Link>
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl" style={{ background: p.soft, color: o.priority === 'media' ? '#8A6500' : p.color }}>
                <CategoryIcon category={o.category} className="h-7 w-7" />
              </span>
              <div>
                <p className="eyebrow text-urucum-600">
                  {o.kind === 'sensor' ? 'Alerta automático de sensor' : 'Relato comunitário'} · {o.id}
                </p>
                <h1 className="mt-1 font-display text-3xl font-semibold text-jenipapo-900 sm:text-4xl">{categoryInfo[o.category].label}</h1>
                <p className="mt-1 text-jenipapo-600">
                  {restricted ? `${territoryName(o.territoryId)} · ${fmtPeriod(o.createdAt)}` : `${o.type} · ${territoryName(o.territoryId)} · ${fmtDateTime(o.createdAt)}`}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <PriorityBadge priority={o.priority} size="md" />
              <StatusBadge status={o.status} />
            </div>
          </div>
        </div>
      </div>

      <div className="container-r grid gap-6 py-8 lg:grid-cols-[1fr_1.25fr]">
        {/* LINHA DO TEMPO */}
        <section className="card p-5 sm:p-6" aria-labelledby="tl-title">
          <h2 id="tl-title" className="font-display text-xl font-semibold">
            Linha do tempo
          </h2>
          {!restricted && (
            <p className="mt-1 text-sm text-jenipapo-500">
              Do dispositivo à plataforma em <strong className="text-jenipapo-800">{fmtDuration(o.arrivedAt - o.createdAt)}</strong> · {o.route.length - 1} saltos
            </p>
          )}
          <ol className="mt-6">
            {timeline.map((e, i) => (
              <motion.li
                key={`${e.key}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.8) }}
                className="relative flex gap-4 pb-5 last:pb-0"
              >
                {i < timeline.length - 1 && <span className="absolute left-[7px] top-5 h-full w-px bg-palha-300" aria-hidden="true" />}
                <span
                  className={`relative mt-1 h-[15px] w-[15px] shrink-0 rounded-full ring-4 ring-white ${e.key === 'salto' ? 'scale-75' : ''}`}
                  style={{ background: dotColor[e.key] ?? '#0C1922' }}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className={`font-semibold ${e.key === 'salto' ? 'text-sm text-jenipapo-700' : 'text-jenipapo-900'}`}>{e.label}</p>
                    <span className="font-mono text-xs tabular-nums text-jenipapo-500">{restricted ? fmtPeriod(e.at) : `${i > 0 && e.at - o.createdAt < 86400000 ? fmtTime(e.at) : fmtDateTime(e.at)}`}</span>
                  </div>
                  {(e.detail || e.rssi) && (
                    <p className="text-xs text-jenipapo-500">
                      {e.detail}
                      {e.rssi && !restricted && (
                        <span className="ml-2 font-mono">
                          RSSI {e.rssi} dBm · SNR {e.snr} dB
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </motion.li>
            ))}
          </ol>
          {o.response && !restricted && (
            <div className="mt-6 rounded-2xl bg-floresta-50 p-4 ring-1 ring-inset ring-floresta-200">
              <p className="flex items-center gap-2 text-sm font-semibold text-floresta-700">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Resposta enviada à comunidade {o.institution && `· ${institutionInfo[o.institution].label}`}
              </p>
              <p className="mt-1.5 text-sm text-floresta-800">“{o.response}”</p>
            </div>
          )}
        </section>

        <div className="space-y-6">
          {restricted ? (
            <section className="card relative overflow-hidden p-6" aria-labelledby="rs-title">
              <div className="bg-roots absolute inset-0 opacity-50" aria-hidden="true" />
              <div className="relative">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-jenipapo-900 text-urucum-300">
                  <Lock className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 id="rs-title" className="mt-4 font-display text-2xl font-semibold">
                  Conteúdo restrito
                </h2>
                <p className="mt-2 text-jenipapo-600">{publicSummary(o)}.</p>
                <p className="mt-3 text-sm leading-relaxed text-jenipapo-600">
                  O relato original, a autoria, a rota da mensagem e a localização exata ficam visíveis apenas para instituições autorizadas pela comunidade. Isso protege quem denuncia.
                </p>
                <ul className="mt-4 grid gap-2 text-sm text-jenipapo-700 sm:grid-cols-2">
                  {['Relato original', 'Classificação da IA', 'Rota e dispositivo', 'Pacote transmitido'].map((x) => (
                    <li key={x} className="flex items-center gap-2 rounded-xl bg-palha-100 px-3 py-2">
                      <Lock className="h-3.5 w-3.5 text-jenipapo-400" aria-hidden="true" /> {x}
                    </li>
                  ))}
                </ul>
                <button onClick={login} className="btn-primary mt-6">
                  <LogIn className="h-4 w-4" aria-hidden="true" /> Entrar como instituição (demonstração)
                </button>
              </div>
            </section>
          ) : (
            <>
              <section className="card overflow-hidden" aria-labelledby="route-title">
                <div className="flex items-center justify-between px-5 py-4">
                  <h2 id="route-title" className="flex items-center gap-2 font-display text-xl font-semibold">
                    <MapPinned className="h-5 w-5 text-urucum-500" aria-hidden="true" /> Rota percorrida
                  </h2>
                  <span className="font-mono text-xs text-jenipapo-500">{o.route.join(' → ')}</span>
                </div>
                <NetworkMap className="h-[300px]" interactive={false} highlightRoute={o.route} dimOthers fitTo={o.route} packets={[]} showTerritories={false} fitPad={0.8} fitMaxZoom={10} />
              </section>

              {o.kind === 'comunitaria' && (
                <section className="grid gap-4 md:grid-cols-2">
                  <div className="card p-5">
                    <h2 className="flex items-center gap-2 font-semibold">
                      <BrainCircuit className="h-4 w-4 text-urucum-500" aria-hidden="true" /> Classificação da IA
                    </h2>
                    <dl className="mt-3 divide-y divide-palha-200 text-sm">
                      {[
                        ['Categoria', categoryInfo[o.ai.category].label],
                        ['Tipo', o.ai.type],
                        ['Prioridade', priorityInfo[o.ai.priority].label],
                        ['Destinatário sugerido', o.ai.recipient],
                        ['Confiança', `${Math.round(o.ai.confidence * 100)}%`],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-3 py-2">
                          <dt className="text-jenipapo-500">{k}</dt>
                          <dd className="text-right font-semibold text-jenipapo-900">{v}</dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-3 text-[11px] leading-relaxed text-jenipapo-500">A IA organiza; quem decide o encaminhamento é uma pessoa.</p>
                  </div>
                  <div className="card flex flex-col p-5">
                    <h2 className="flex items-center gap-2 font-semibold">
                      <MessageSquareQuote className="h-4 w-4 text-urucum-500" aria-hidden="true" /> Relato original preservado
                    </h2>
                    <blockquote className="mt-3 flex-1 rounded-xl bg-palha-100 p-4 font-display text-lg italic leading-snug text-jenipapo-900">“{o.report}”</blockquote>
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-jenipapo-500">
                      <Radio className="h-3.5 w-3.5" aria-hidden="true" /> Enviado de {nodeById[o.originNodeId].name} ({o.originNodeId})
                    </p>
                  </div>
                </section>
              )}

              {o.kind === 'sensor' && o.sensor && (
                <section className="card p-5" aria-labelledby="sens-title">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 id="sens-title" className="flex items-center gap-2 font-display text-xl font-semibold">
                        <ShieldAlert className="h-5 w-5 text-urucum-500" aria-hidden="true" /> Leitura que disparou o alerta
                      </h2>
                      <p className="mt-1 text-sm text-jenipapo-600">
                        {sensorHeadline(o)} · {nodeById[o.originNodeId].name}
                      </p>
                    </div>
                    <span className="chip bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-300">Sujeito a validação</span>
                  </div>
                  <div className="mt-4">
                    <SensorChart id={o.id} data={o.sensor.series} metric={o.sensor.metric} height={240} color={o.priority === 'critica' ? '#DC3535' : '#C2512E'} />
                  </div>
                  <p className="mt-2 text-xs text-jenipapo-500">
                    {metrics[o.sensor.metric].label} nas 6 horas anteriores ao alerta. Limites ilustrativos — no projeto real, definidos com a comunidade e órgãos técnicos.
                  </p>
                </section>
              )}

              <section className="card p-5" aria-labelledby="pkt-title">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 id="pkt-title" className="flex items-center gap-2 font-semibold">
                    <FileJson2 className="h-4 w-4 text-urucum-500" aria-hidden="true" /> Pacote compacto que trafegou pela rede
                  </h2>
                  <span className="font-mono text-xs text-jenipapo-500">{bytesOf(o.packet)} bytes · LoRa · AES-256</span>
                </div>
                <JsonView data={o.packet} className="mt-3" />
                <p className="mt-2 text-xs text-jenipapo-500">LoRa tem baixa taxa de transmissão: trafegam só mensagens curtas e dados estruturados — nada de imagens ou vídeos.</p>
              </section>

              {isInstitution && (
                <Link to="/painel" className="btn-ghost w-full">
                  <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> Gerenciar no painel institucional
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
