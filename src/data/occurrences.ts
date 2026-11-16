// ============================================================================
//  OCORRÊNCIAS SIMULADAS
//  Relatos FICTÍCIOS, sem nomes de pessoas, etnias ou comunidades reais.
//  Edite os modelos abaixo para mudar o conteúdo gerado.
// ============================================================================
import { buildOccurrence, sensorTriggerFor } from '../lib/factory';
import { staticDown } from '../lib/graph';
import { mulberry32, pick } from '../lib/rng';
import type { Category, Occurrence, OccurrenceStatus, Priority } from '../lib/types';
import { nodes } from './network';

export interface ReportTemplate {
  category: Category;
  type: string;
  priority: Priority;
  text: string;
}

/** Relatos comunitários usados no histórico e no gerador em tempo real. */
export const reportTemplates: ReportTemplate[] = [
  { category: 'denuncia_territorial', type: 'invasão e ameaça', priority: 'alta', text: 'Tem gente entrando no território sem autorização e ameaçando os moradores. Precisamos comunicar isso.' },
  { category: 'denuncia_territorial', type: 'extração ilegal de madeira', priority: 'alta', text: 'Ouvimos motosserra perto da trilha leste desde cedo. Tem caminhão parado no ramal.' },
  { category: 'denuncia_territorial', type: 'garimpo ilegal', priority: 'alta', text: 'Apareceu uma balsa de garimpo no rio, abaixo da comunidade. A água está ficando barrenta.' },
  { category: 'denuncia_territorial', type: 'ocupação irregular', priority: 'media', text: 'Colocaram cerca nova dentro da área de roça comunitária durante a noite.' },
  { category: 'denuncia_territorial', type: 'exploração ilegal de recursos', priority: 'media', text: 'Pessoas de fora estão pescando com rede grande no lago reservado da comunidade.' },
  { category: 'ameaca', type: 'ameaça a liderança', priority: 'critica', text: 'Uma liderança recebeu recado para parar as denúncias. Estão rondando a casa dela à noite.' },
  { category: 'ameaca', type: 'intimidação armada', priority: 'critica', text: 'Homens armados passaram de barco perguntando pelos professores da escola.' },
  { category: 'ameaca', type: 'ameaça coletiva', priority: 'alta', text: 'Recebemos ameaça na cidade contra quem participou da reunião da associação.' },
  { category: 'saude', type: 'atendimento de saúde', priority: 'alta', text: 'Criança com febre alta há dois dias e vomitando. Precisamos de atendimento.' },
  { category: 'saude', type: 'picada de animal peçonhento', priority: 'critica', text: 'Picada de cobra em um morador na roça. Já fizemos os primeiros cuidados.' },
  { category: 'saude', type: 'suspeita de água contaminada', priority: 'alta', text: 'Vários casos de diarreia depois que a água do igarapé mudou de cor.' },
  { category: 'saude', type: 'urgência obstétrica', priority: 'alta', text: 'Gestante com dores fortes, precisa de transporte para a cidade.' },
  { category: 'apoio', type: 'apoio logístico', priority: 'media', text: 'O motor do barco comunitário quebrou e estamos sem transporte para a cidade.' },
  { category: 'apoio', type: 'falta de água potável', priority: 'alta', text: 'O poço secou. Estamos sem água potável para as famílias da parte de cima.' },
  { category: 'apoio', type: 'apoio logístico', priority: 'baixa', text: 'Precisamos de combustível para o gerador da escola e do posto.' },
  { category: 'apoio', type: 'via bloqueada', priority: 'media', text: 'Uma árvore caiu e bloqueou a trilha até o porto depois do temporal.' },
  { category: 'fumaca', type: 'foco de incêndio relatado', priority: 'alta', text: 'Tem fumaça forte vindo do lado da cabeceira, parece fogo grande.' },
];

/** Alertas automáticos de sensores (estações comunitárias). */
export const sensorAlertTemplates: { category: Category; type: string; priority: Priority }[] = [
  { category: 'fumaca', type: 'PM2.5 acima do limite · possível queimada', priority: 'alta' },
  { category: 'fumaca', type: 'PM2.5 muito acima do limite · fumaça densa', priority: 'critica' },
  { category: 'rio', type: 'nível do rio acima da cota de alerta', priority: 'alta' },
  { category: 'rio', type: 'subida rápida do nível do rio', priority: 'media' },
  { category: 'chuva', type: 'chuva intensa acima do limite', priority: 'media' },
  { category: 'temperatura', type: 'calor extremo e ar seco', priority: 'media' },
  { category: 'temperatura', type: 'temperatura acima do limite', priority: 'baixa' },
];

export const communityNodes = nodes.filter((n) => n.type === 'dispositivo' && n.status !== 'offline' && !n.name.startsWith('Repetidor'));
export const stationNodes = nodes.filter((n) => n.type === 'estacao' && n.status !== 'offline');

const HISTORY_COUNT = 40;
const DAYS = 14;

function statusForAge(ageMs: number, kind: 'sensor' | 'comunitaria', r: () => number): OccurrenceStatus {
  const h = ageMs / 3600000;
  if (h < 1.5) return kind === 'sensor' ? (r() < 0.6 ? 'validacao' : 'encaminhada') : r() < 0.5 ? 'registrada' : 'encaminhada';
  if (h < 8) return pick(r, ['encaminhada', 'confirmada', 'em_atendimento'] as const);
  if (h < 48) return pick(r, ['confirmada', 'em_atendimento', 'respondida', 'respondida'] as const);
  return pick(r, ['respondida', 'encerrada', 'encerrada'] as const);
}

export function generateHistory(now = Date.now()): Occurrence[] {
  const r = mulberry32(2026);
  const list: Occurrence[] = [];
  for (let i = 0; i < HISTORY_COUNT; i++) {
    // mais ocorrências recentes que antigas
    const age = Math.pow(r(), 1.7) * DAYS * 86400000 + 12 * 60000;
    const createdAt = now - age;
    const isSensor = r() < 0.48;
    const id = `RZ-${String(1000 + i).padStart(4, '0')}`;
    let occ: Occurrence | null;
    if (isSensor) {
      const tpl = pick(r, sensorAlertTemplates);
      const origin = pick(r, stationNodes);
      occ = buildOccurrence({
        id, kind: 'sensor', category: tpl.category, type: tpl.type, priority: tpl.priority,
        originNodeId: origin.id, createdAt, status: statusForAge(age, 'sensor', r),
        sensor: sensorTriggerFor(tpl.category, createdAt, r, tpl.priority), down: staticDown, rand: r,
      });
    } else {
      const tpl = pick(r, reportTemplates);
      const origin = pick(r, communityNodes);
      occ = buildOccurrence({
        id, kind: 'comunitaria', category: tpl.category, type: tpl.type, priority: tpl.priority,
        originNodeId: origin.id, createdAt, status: statusForAge(age, 'comunitaria', r),
        report: tpl.text, down: staticDown, rand: r,
      });
    }
    if (occ) list.push(occ);
  }
  return list.sort((a, b) => b.createdAt - a.createdAt);
}
