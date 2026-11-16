// ============================================================================
//  CATÁLOGOS: categorias, prioridades, status e instituições (nomes por função).
//  Não use nomes de órgãos reais aqui — o protótipo usa apenas funções.
// ============================================================================
import type { Category, InstitutionId, OccurrenceStatus, Priority } from '../lib/types';

export const categoryInfo: Record<
  Category,
  { label: string; kind: 'sensor' | 'comunitaria'; code: string; institution: InstitutionId; recipient: string }
> = {
  fumaca: { label: 'Fumaça / queimada', kind: 'sensor', code: 'FUM', institution: 'org_ambiental', recipient: 'Brigada comunitária e Órgão ambiental' },
  rio: { label: 'Nível do rio', kind: 'sensor', code: 'RIO', institution: 'defesa_civil', recipient: 'Defesa Civil' },
  chuva: { label: 'Chuva intensa', kind: 'sensor', code: 'CHV', institution: 'defesa_civil', recipient: 'Defesa Civil' },
  temperatura: { label: 'Temperatura extrema', kind: 'sensor', code: 'TMP', institution: 'saude_indigena', recipient: 'Saúde indígena e liderança comunitária' },
  denuncia_territorial: { label: 'Denúncia territorial', kind: 'comunitaria', code: 'DT', institution: 'org_indigenista', recipient: 'Liderança comunitária ou instituição autorizada' },
  ameaca: { label: 'Ameaça a pessoas', kind: 'comunitaria', code: 'AME', institution: 'seguranca', recipient: 'Segurança pública e Órgão indigenista' },
  saude: { label: 'Saúde', kind: 'comunitaria', code: 'SAU', institution: 'saude_indigena', recipient: 'Saúde indígena' },
  apoio: { label: 'Solicitação de apoio', kind: 'comunitaria', code: 'APO', institution: 'defesa_civil', recipient: 'Liderança comunitária e Defesa Civil' },
};

export const categories = Object.keys(categoryInfo) as Category[];

export const priorityInfo: Record<Priority, { label: string; rank: number; color: string; soft: string; code: string }> = {
  baixa: { label: 'Baixa', rank: 1, color: '#2F9E5B', soft: '#E3F3E9', code: 'B' },
  media: { label: 'Média', rank: 2, color: '#E2B126', soft: '#FBF2D6', code: 'M' },
  alta: { label: 'Alta', rank: 3, color: '#E8742A', soft: '#FCE7D8', code: 'A' },
  critica: { label: 'Crítica', rank: 4, color: '#DC3535', soft: '#FADCDC', code: 'C' },
};

export const priorities: Priority[] = ['critica', 'alta', 'media', 'baixa'];

export const statusInfo: Record<OccurrenceStatus, { label: string; step: number }> = {
  validacao: { label: 'Aguardando validação', step: 0 },
  registrada: { label: 'Registrada', step: 1 },
  encaminhada: { label: 'Encaminhada', step: 2 },
  confirmada: { label: 'Recebimento confirmado', step: 3 },
  em_atendimento: { label: 'Em atendimento', step: 4 },
  respondida: { label: 'Resposta enviada', step: 5 },
  encerrada: { label: 'Encerrada', step: 6 },
};

export const statuses = Object.keys(statusInfo) as OccurrenceStatus[];

export const institutionInfo: Record<InstitutionId, { label: string; short: string }> = {
  org_indigenista: { label: 'Órgão indigenista', short: 'Indigenista' },
  org_ambiental: { label: 'Órgão ambiental', short: 'Ambiental' },
  defesa_civil: { label: 'Defesa Civil', short: 'Defesa Civil' },
  seguranca: { label: 'Segurança pública', short: 'Segurança' },
  saude_indigena: { label: 'Saúde indígena', short: 'Saúde' },
};

export const institutions = Object.keys(institutionInfo) as InstitutionId[];
