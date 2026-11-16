import { Activity, BrainCircuit, Check, Cpu, Eye, EyeOff, Github, Lock, Network, Radio, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ArchitectureDiagram } from '../components/brand/ArchitectureDiagram';
import { RootNetwork } from '../components/brand/RootNetwork';
import { CountUp, Reveal, SectionTitle } from '../components/common/ui';
import { audiences, CENTRAL_PHRASE, components, governance, hardware, realStats, scaleSteps, sdgs } from '../data/content';

const compIcons = { lora: Radio, ia: BrainCircuit, sensores: Activity, plataforma: Network } as const;

export function About() {
  return (
    <div>
      {/* STORYTELLING */}
      <section className="grain relative overflow-hidden bg-jenipapo-900 text-palha-100">
        <div className="absolute inset-x-0 bottom-0 opacity-40" aria-hidden="true">
          <RootNetwork className="mx-auto h-auto w-full max-w-5xl" />
        </div>
        <div className="container-r relative py-20 sm:py-28">
          <p className="eyebrow text-urucum-300">Como funciona · sobre o projeto</p>
          <h1 className="mt-4 max-w-4xl font-display text-4xl font-semibold leading-[1.05] sm:text-6xl">
            Uma liderança ameaçada. Um incêndio começando. <span className="text-urucum-300">E o sinal mais próximo a quilômetros de caminhada.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-palha-300/85">
            Comunidades indígenas, quilombolas, ribeirinhas e extrativistas muitas vezes não têm sinal de telefone nem internet. Quando acontece uma emergência, pedir ajuda pode significar horas de
            deslocamento. O RAÍZES cria uma rede comunitária que leva essa informação até quem deve responder.
          </p>
          <blockquote className="mt-10 max-w-3xl border-l-2 border-urucum-400 pl-6 font-display text-2xl italic leading-snug sm:text-3xl">“{CENTRAL_PHRASE}”</blockquote>
        </div>
      </section>

      {/* DADOS REAIS */}
      <section className="container-r py-16" aria-labelledby="dados">
        <SectionTitle eyebrow="O problema em números" title={<span id="dados">Dados reais, com fonte</span>}>
          As estatísticas abaixo são os únicos dados reais deste protótipo. Todo o restante (territórios, nós e ocorrências) é simulado.
        </SectionTitle>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {realStats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.06}>
              <figure className="card flex h-full flex-col p-6">
                <p className="font-display text-4xl font-semibold tabular-nums text-urucum-600 sm:text-5xl">
                  <CountUp value={s.value} decimals={s.decimals ?? 0} suffix={s.suffix ?? ''} duration={1.8} />
                </p>
                <p className="mt-3 font-semibold leading-snug text-jenipapo-900">{s.label}</p>
                <p className="mt-1 text-sm text-jenipapo-600">{s.detail}</p>
                <figcaption className="mt-auto pt-4 text-xs text-jenipapo-500">
                  Fonte: <cite className="not-italic">{s.source}</cite>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ARQUITETURA */}
      <section className="relative overflow-hidden bg-palha-50 py-16" aria-labelledby="arq">
        <div className="bg-roots absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="container-r relative">
          <SectionTitle eyebrow="Arquitetura" title={<span id="arq">Sete passos, da comunidade à instituição — e de volta</span>}>
            A rede não depende de um único ponto de saída: se um gateway cai, outro assume. No nosso cenário, pelo menos um gateway fica online o tempo todo.
          </SectionTitle>
          <div className="mt-10">
            <ArchitectureDiagram />
          </div>
        </div>
      </section>

      {/* COMPONENTES */}
      <section className="container-r py-16" aria-labelledby="comp">
        <SectionTitle eyebrow="Componentes" title={<span id="comp">Quatro peças que trabalham juntas</span>} />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {components.map((c, i) => {
            const Icon = compIcons[c.key as keyof typeof compIcons];
            return (
              <Reveal key={c.key} delay={i * 0.06}>
                <div className="card flex h-full gap-5 p-6">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-jenipapo-900 text-urucum-300">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-semibold">{c.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-jenipapo-600">{c.text}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* HARDWARE */}
      <section className="bg-jenipapo-900 py-16 text-palha-100" aria-labelledby="hw">
        <div className="container-r">
          <SectionTitle dark eyebrow="Hardware" title={<span id="hw">Peças acessíveis, energia solar, código aberto</span>}>
            O ESP32-S3 controla rádio, display, teclado e sensores; a Raspberry Pi roda o modelo de linguagem. A camada de rede se apoia no Meshtastic, projeto open source de mesh sobre LoRa.
          </SectionTitle>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {hardware.map((h, i) => (
              <Reveal key={h.title} delay={i * 0.06}>
                <div className="card-dark h-full p-5">
                  <div className="flex items-center justify-between">
                    <Cpu className="h-5 w-5 text-urucum-300" aria-hidden="true" />
                    <span className="rounded-full bg-urucum-500/15 px-2.5 py-1 font-mono text-[10px] font-semibold text-urucum-200">{h.chip}</span>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold">{h.title}</h3>
                  <ul className="mt-3 space-y-1.5 text-sm text-palha-300/80">
                    {h.items.map((it) => (
                      <li key={it} className="flex gap-2">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-floresta-300" aria-hidden="true" />
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { t: 'Mensagens curtas', d: 'LoRa tem baixa taxa de transmissão: trafegam textos curtos, dados estruturados e alertas — não imagens ou vídeos.' },
              { t: 'Estrutura compacta', d: 'A IA gera um pacote enxuto (categoria, tipo, prioridade, destinatário) junto do relato original.' },
              { t: 'Até 7 saltos', d: 'Cada mensagem pode ser retransmitida por até 7 nós até encontrar um gateway — limite padrão do Meshtastic.' },
            ].map((x) => (
              <div key={x.t} className="rounded-2xl border border-white/10 p-5">
                <p className="font-semibold">{x.t}</p>
                <p className="mt-1 text-sm text-palha-300/70">{x.d}</p>
              </div>
            ))}
          </div>
          <a href="https://meshtastic.org" target="_blank" rel="noreferrer" className="btn-ghost-dark mt-6">
            <Github className="h-4 w-4" aria-hidden="true" /> Conheça o Meshtastic (open source)
          </a>
        </div>
      </section>

      {/* ESCALABILIDADE */}
      <section className="container-r py-16" aria-labelledby="esc">
        <SectionTitle eyebrow="Escalabilidade" title={<span id="esc">Cresce como raiz: de dois dispositivos a muitos territórios</span>} />
        <ol className="mt-10 grid gap-4 md:grid-cols-5">
          {scaleSteps.map((s, i) => (
            <Reveal key={s} delay={i * 0.07}>
              <li className="relative h-full rounded-2xl border border-palha-300 bg-white p-5">
                <span className="font-display text-4xl font-semibold text-urucum-500/80">{i + 1}</span>
                <p className="mt-2 text-sm font-semibold leading-snug text-jenipapo-900">{s}</p>
                <span className="absolute bottom-0 left-5 right-5 h-1 rounded-t-full bg-gradient-to-r from-floresta-400 to-urucum-400" style={{ opacity: 0.25 + i * 0.18 }} aria-hidden="true" />
              </li>
            </Reveal>
          ))}
        </ol>
        <div className="mt-10">
          <p className="font-semibold text-jenipapo-900">Pode ser adaptado para</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {audiences.map((a) => (
              <li key={a} className="rounded-full border border-palha-400 bg-white px-4 py-2 text-sm font-medium text-jenipapo-800">
                {a}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ODS */}
      <section className="bg-palha-50 py-16" aria-labelledby="ods">
        <div className="container-r">
          <SectionTitle eyebrow="Agenda 2030" title={<span id="ods">Objetivos de Desenvolvimento Sustentável</span>} />
          <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {sdgs.map((o, i) => (
              <Reveal key={o.n} delay={i * 0.05}>
                <li className="flex aspect-square flex-col justify-between rounded-2xl p-4 text-white shadow-card" style={{ background: o.color }}>
                  <span className="font-display text-5xl font-bold leading-none">{o.n}</span>
                  <span className="text-sm font-semibold leading-tight">
                    {o.title}
                    {o.note && <span className="mt-1 block text-[10px] font-medium opacity-80">{o.note}</span>}
                  </span>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* GOVERNANÇA */}
      <section className="container-r py-16" aria-labelledby="gov">
        <SectionTitle eyebrow="Governança e privacidade" title={<span id="gov">A comunidade decide o que compartilha</span>}>
          Segurança e governança dos dados são fundamentais. A plataforma separa com clareza o que é público do que é restrito.
        </SectionTitle>
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <div className="card p-6">
            <h3 className="flex items-center gap-2 font-display text-xl font-semibold">
              <Eye className="h-5 w-5 text-floresta-500" aria-hidden="true" /> Público
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-jenipapo-700">
              {governance.public.map((g) => (
                <li key={g} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-floresta-500" aria-hidden="true" />
                  {g}
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-6">
            <h3 className="flex items-center gap-2 font-display text-xl font-semibold">
              <EyeOff className="h-5 w-5 text-urucum-500" aria-hidden="true" /> Restrito a instituições autorizadas
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-jenipapo-700">
              {governance.restricted.map((g) => (
                <li key={g} className="flex gap-2">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-urucum-500" aria-hidden="true" />
                  {g}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-4 rounded-3xl bg-jenipapo-900 p-6 text-palha-100 sm:p-8">
          <h3 className="flex items-center gap-2 font-display text-xl font-semibold">
            <Scale className="h-5 w-5 text-urucum-300" aria-hidden="true" /> Princípios
          </h3>
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {governance.principles.map((p) => (
              <li key={p} className="flex gap-3 text-sm leading-relaxed text-palha-300/85">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-urucum-400" aria-hidden="true" />
                {p}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/simulador" className="btn-primary">
              Ver o simulador
            </Link>
            <Link to="/mapa" className="btn-ghost-dark">
              Explorar o mapa da rede
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
