import { AnimatePresence, motion } from 'framer-motion';
import { Activity, ArrowRight, BrainCircuit, Clock3, Cpu, Lock, MapPinned, Network, Radio, RadioTower, Send, ShieldCheck, Siren, Users, Waypoints } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FeedItem } from '../components/alerts/OccurrenceCard';
import { RootNetwork } from '../components/brand/RootNetwork';
import { CountUp, Reveal, SectionTitle, useNow } from '../components/common/ui';
import { GatewayPill } from '../components/layout/Layout';
import { MapLegend, NetworkMap } from '../components/map/NetworkMap';
import { CENTRAL_PHRASE, components } from '../data/content';
import { nodes, territories } from '../data/network';
import { useNetwork } from '../store/NetworkContext';

const compIcons = { lora: Radio, ia: BrainCircuit, sensores: Activity, plataforma: Network } as const;

export function Home() {
  const { occurrences, activeGateways, down, msgs24h, isInstitution, avgLatencyMs } = useNetwork();
  const now = useNow(1000);
  const online = nodes.filter((n) => !down.has(n.id) && n.type !== 'gateway').length;
  const activeAlerts = occurrences.filter((o) => !['respondida', 'encerrada'].includes(o.status)).length;
  const connected = territories.filter((t) => nodes.some((n) => n.territoryId === t.id && !down.has(n.id))).length;

  const stats = [
    { icon: Waypoints, label: 'Nós online', value: online, suffix: ` / ${nodes.length - 3}` },
    { icon: RadioTower, label: 'Gateways ativos', value: activeGateways.length, suffix: ' / 3' },
    { icon: Send, label: 'Mensagens nas últimas 24 h', value: msgs24h },
    { icon: Siren, label: 'Alertas ativos', value: activeAlerts },
    { icon: Users, label: 'Comunidades conectadas', value: connected },
    { icon: Clock3, label: 'Tempo médio até a plataforma', value: Math.round(avgLatencyMs / 1000), suffix: ' s' },
  ];

  return (
    <div>
      {/* HERO */}
      <section className="grain relative overflow-hidden bg-jenipapo-900 text-palha-100">
        <div className="bg-roots-dark absolute inset-0" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-urucum-500/10 blur-3xl" aria-hidden="true" />
        <div className="container-r relative grid items-center gap-6 pb-36 pt-12 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:pb-44 lg:pt-20">
          <div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <GatewayPill />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 font-display text-[clamp(3.6rem,11vw,8.5rem)] font-semibold leading-[0.9] tracking-[0.02em]"
            >
              RAÍZES
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="eyebrow mt-4 text-urucum-300">
              Rede Autônoma de Informação, Zeladoria e Emergência Socioambiental
            </motion.p>
            <motion.blockquote
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.7 }}
              className="mt-6 max-w-xl border-l-2 border-urucum-400 pl-5 font-display text-2xl italic leading-snug text-palha-100 sm:text-[1.9rem]"
            >
              {CENTRAL_PHRASE}
            </motion.blockquote>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-5 max-w-xl leading-relaxed text-palha-300/80">
              Uma rede comunitária de rádio LoRa, com IA offline e sensores ambientais, que leva alertas e denúncias de territórios sem sinal até as instituições que precisam responder — e
              traz a resposta de volta.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }} className="mt-8 flex flex-wrap gap-3">
              <Link to="/simulador" className="btn-primary px-6 py-3 text-base">
                <Send className="h-4 w-4" aria-hidden="true" /> Simular uma mensagem
              </Link>
              <Link to="/mapa" className="btn-ghost-dark px-6 py-3 text-base">
                <MapPinned className="h-4 w-4" aria-hidden="true" /> Ver a rede ao vivo
              </Link>
            </motion.div>
          </div>
          <div className="relative -mx-4 sm:mx-0">
            <RootNetwork className="h-auto w-full" />
          </div>
        </div>
      </section>

      {/* INDICADORES AO VIVO */}
      <section className="relative z-10 -mt-24 lg:-mt-28" aria-label="Indicadores ao vivo da rede">
        <div className="container-r">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.07, duration: 0.5 }}
                className="relative overflow-hidden rounded-2xl border border-palha-300/70 bg-white p-4 shadow-card sm:p-5"
              >
                <s.icon className="h-5 w-5 text-urucum-500" aria-hidden="true" />
                <p className="mt-3 font-display text-3xl font-semibold tabular-nums text-jenipapo-900 sm:text-[2.1rem]">
                  <CountUp value={s.value} />
                  {s.suffix && <span className="text-base font-medium text-jenipapo-400">{s.suffix}</span>}
                </p>
                <p className="mt-1 text-xs font-medium leading-snug text-jenipapo-600">{s.label}</p>
                {i === 2 && <span className="absolute right-3 top-3 h-2 w-2 animate-pulse rounded-full bg-floresta-400" aria-hidden="true" />}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MAPA + FEED */}
      <section className="container-r py-16">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <SectionTitle eyebrow="Ao vivo" title="A rede respirando agora">
            Cada ponto é um dispositivo comunitário, estação ou gateway. Os pacotes caminham de nó em nó até um ponto com internet.
          </SectionTitle>
          <Link to="/mapa" className="btn-ghost shrink-0">
            Abrir mapa completo <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-8 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <div className="relative overflow-hidden rounded-3xl border border-jenipapo-900/20 shadow-card">
            <NetworkMap className="h-[420px] sm:h-[500px]" interactive={false} />
            <MapLegend className="absolute bottom-3 right-3 z-[500] hidden sm:block" />
            <Link
              to="/mapa"
              className="absolute left-3 top-3 z-[500] inline-flex items-center gap-2 rounded-full bg-jenipapo-950/85 px-3 py-1.5 text-xs font-semibold text-palha-100 backdrop-blur hover:bg-jenipapo-900"
            >
              <MapPinned className="h-3.5 w-3.5" aria-hidden="true" /> {territories.length} territórios · {nodes.length} nós
            </Link>
          </div>
          <div className="card flex max-h-[500px] flex-col">
            <div className="flex items-center justify-between border-b border-palha-200 px-5 py-4">
              <div>
                <h3 className="font-semibold text-jenipapo-900">Alertas recentes</h3>
                <p className="text-xs text-jenipapo-500">Atualiza sozinho conforme os pacotes chegam</p>
              </div>
              <span className="chip bg-floresta-50 text-floresta-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-floresta-500" /> ao vivo
              </span>
            </div>
            <ul className="scroll-thin flex-1 space-y-1 overflow-y-auto p-2" aria-live="polite">
              <AnimatePresence initial={false}>
                {occurrences.slice(0, 12).map((o) => (
                  <FeedItem key={o.id} o={o} isInstitution={isInstitution} now={now} />
                ))}
              </AnimatePresence>
            </ul>
            {!isInstitution && (
              <p className="flex items-center gap-2 border-t border-palha-200 px-5 py-3 text-[11px] text-jenipapo-500">
                <Lock className="h-3 w-3 shrink-0" aria-hidden="true" /> Relatos comunitários aparecem de forma agregada e anonimizada na visão pública.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 4 COMPONENTES */}
      <section className="relative overflow-hidden bg-palha-50 py-16">
        <div className="bg-roots absolute inset-0 opacity-70" aria-hidden="true" />
        <div className="container-r relative">
          <SectionTitle eyebrow="Como funciona" title="Quatro camadas, uma mesma raiz">
            Do rádio na aldeia até a mesa da instituição responsável, sem depender de sinal de celular na comunidade.
          </SectionTitle>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {components.map((c, i) => {
              const Icon = compIcons[c.key as keyof typeof compIcons];
              return (
                <Reveal key={c.key} delay={i * 0.08}>
                  <div className="card group h-full p-6 transition-transform hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-jenipapo-900 text-urucum-300">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="font-mono text-xs text-jenipapo-400">0{i + 1}</span>
                    </div>
                    <h3 className="mt-5 font-display text-xl font-semibold text-jenipapo-900">{c.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-jenipapo-600">{c.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/sobre" className="btn-primary">
              Entender a arquitetura <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link to="/console" className="btn-ghost">
              <Cpu className="h-4 w-4" aria-hidden="true" /> Console técnico
            </Link>
          </div>
        </div>
      </section>

      {/* PRINCÍPIOS */}
      <section className="bg-jenipapo-900 py-16 text-palha-100">
        <div className="container-r grid gap-8 lg:grid-cols-3">
          {[
            { icon: ShieldCheck, title: 'A comunidade decide', text: 'As comunidades controlam quais informações são compartilhadas, com quem e em quais condições.' },
            { icon: BrainCircuit, title: 'A IA organiza, não decide', text: 'A classificação ajuda a priorizar, mas o relato original é sempre preservado e a decisão é humana.' },
            { icon: Network, title: 'Não substitui o Estado', text: 'O RAÍZES diminui a distância entre a informação produzida no território e quem tem o dever de responder.' },
          ].map((p, i) => (
            <Reveal key={p.title} delay={i * 0.1}>
              <div className="flex gap-4">
                <p.icon className="mt-1 h-6 w-6 shrink-0 text-urucum-300" aria-hidden="true" />
                <div>
                  <h3 className="font-display text-xl font-semibold">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-palha-300/75">{p.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
