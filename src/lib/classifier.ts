// Simulação do módulo de IA offline (no projeto real: modelo de linguagem quantizado
// rodando em Raspberry Pi). Aqui, regras por palavras-chave imitam a classificação.
// A IA NÃO decide: ela organiza. O relato original é sempre preservado.
import { categoryInfo } from '../data/catalog';
import type { AIClassification, Category, Priority } from './types';

interface Rule {
  test: RegExp;
  category: Category;
  type: string;
  priority: Priority;
  typeCode: string;
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const RULES: Rule[] = [
  { test: /(mat(ar|aram|ou)|assassin|morto|morte|tiro|arma|baleado)/, category: 'ameaca', type: 'violência contra pessoa', priority: 'critica', typeCode: 'VIO' },
  { test: /(invas|entrando|entraram|sem autoriza|estranho|cerca)/, category: 'denuncia_territorial', type: 'invasão e ameaça', priority: 'alta', typeCode: 'INV_AME' },
  { test: /(garimp|balsa|draga|mercurio)/, category: 'denuncia_territorial', type: 'garimpo ilegal', priority: 'alta', typeCode: 'GAR' },
  { test: /(madeir|motosserra|derrub|desmat|trator|caminhao)/, category: 'denuncia_territorial', type: 'extração ilegal de madeira', priority: 'alta', typeCode: 'MAD' },
  { test: /(ameac|intimid|persegu)/, category: 'ameaca', type: 'ameaça a liderança', priority: 'alta', typeCode: 'AME_LID' },
  { test: /(fogo|fumaca|queimad|incendio|queimando)/, category: 'fumaca', type: 'foco de incêndio relatado', priority: 'alta', typeCode: 'FOGO' },
  { test: /(rio (subindo|encheu|cheio)|enchente|alag|agua subi)/, category: 'rio', type: 'cheia / alagamento', priority: 'alta', typeCode: 'CHEIA' },
  { test: /(chuva|tempestade|vendaval|arvore caiu)/, category: 'chuva', type: 'chuva intensa / dano', priority: 'media', typeCode: 'TEMP' },
  { test: /(febre|doente|diarreia|vomit|picad|cobra|parto|gravida|ferid|saude|remedio|desmai)/, category: 'saude', type: 'atendimento de saúde', priority: 'alta', typeCode: 'ATD' },
  { test: /(agua potavel|sem agua|comida|alimento|combustivel|barco quebr|motor|ajuda|apoio)/, category: 'apoio', type: 'solicitação de apoio logístico', priority: 'media', typeCode: 'LOG' },
];

export interface ClassifyResult extends AIClassification {
  typeCode: string;
  keywords: string[];
}

export function classify(text: string): ClassifyResult {
  const t = norm(text);
  const hits = RULES.filter((r) => r.test.test(t));
  const rule = hits[0];
  if (!rule) {
    return {
      category: 'apoio',
      type: 'comunicação geral',
      priority: 'baixa',
      recipient: 'Liderança comunitária',
      confidence: 0.62,
      typeCode: 'GER',
      keywords: [],
    };
  }
  let priority = rule.priority;
  // urgência explícita eleva a prioridade
  if (/(urgente|agora|socorro|rapido|crianca)/.test(t) && priority !== 'critica') priority = priority === 'alta' ? 'critica' : 'alta';
  // relato combina invasão + ameaça => tipo composto
  let type = rule.type;
  if (rule.category === 'denuncia_territorial' && /(ameac)/.test(t) && rule.typeCode !== 'INV_AME') type = `${rule.type} com ameaça`;
  const keywords = hits.flatMap((h) => (t.match(h.test) ?? []).slice(0, 1));
  return {
    category: rule.category,
    type,
    priority,
    recipient: categoryInfo[rule.category].recipient,
    confidence: Math.min(0.97, 0.78 + hits.length * 0.06),
    typeCode: rule.typeCode,
    keywords,
  };
}
