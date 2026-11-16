// ============================================================================
//  CONTEÚDO INSTITUCIONAL (página "Como funciona / Sobre")
//  Estes são os ÚNICOS dados reais do site — sempre com fonte.
// ============================================================================

export const CENTRAL_PHRASE = 'A distância física não deveria significar distância dos direitos.';

export const realStats = [
  { value: 1694836, label: 'pessoas indígenas no Brasil', detail: 'em 4.832 municípios', source: 'IBGE, Censo Demográfico 2022' },
  { value: 1330186, label: 'pessoas quilombolas', detail: 'em 1.700 municípios', source: 'IBGE, Censo Demográfico 2022' },
  { value: 44.5, decimals: 1, suffix: '%', label: 'da população indígena vivia em domicílios sem acesso à internet', detail: 'recorte por cor ou raça', source: 'IBGE, Censo Demográfico 2022' },
  { value: 211, label: 'assassinatos de pessoas indígenas', detail: 'em 424 ocorrências de violência contra a pessoa', source: 'CIMI, Relatório Violência contra os Povos Indígenas no Brasil (dados de 2024)' },
  { value: 230, label: 'casos de invasões, exploração ilegal de recursos e danos ao patrimônio', detail: 'e 154 conflitos territoriais', source: 'CIMI, Relatório Violência contra os Povos Indígenas no Brasil (dados de 2024)' },
  { value: 12593, label: 'hectares de vegetação nativa perdidos em Terras Indígenas', detail: 'em 2025', source: 'MapBiomas' },
];

export const architectureSteps = [
  { title: 'Dispositivo na comunidade', text: 'Cada comunidade possui um ou mais dispositivos LoRa.' },
  { title: 'Comunicação direta', text: 'Os dispositivos se comunicam diretamente ou por retransmissão entre nós próximos.' },
  { title: 'Múltiplos caminhos', text: 'As mensagens podem percorrer diferentes caminhos dentro da rede.' },
  { title: 'Saída autorizada', text: 'Ao alcançar qualquer nó com internet, a informação autorizada sai da rede local.' },
  { title: 'Gateway', text: 'O gateway encaminha a mensagem para a plataforma.' },
  { title: 'Plataforma', text: 'A plataforma organiza e encaminha a demanda para a instituição responsável.' },
  { title: 'Resposta de volta', text: 'A resposta institucional volta pelo gateway e percorre a rede até a comunidade.' },
];

export const components = [
  {
    key: 'lora',
    title: 'Rede comunitária LoRa',
    text: 'Dispositivos de rádio espalhados pelos territórios enviam, recebem e retransmitem mensagens e alertas entre si, sem internet. Rede mesh baseada no projeto open source Meshtastic.',
  },
  {
    key: 'ia',
    title: 'IA offline',
    text: 'Um modelo de linguagem rodando localmente interpreta a mensagem escrita ou falada e organiza categoria, tipo, prioridade e destinatário, sempre preservando o relato original. Reconhecimento de voz offline para quem tem dificuldade de escrita.',
  },
  {
    key: 'sensores',
    title: 'Sensores ambientais',
    text: 'Estações comunitárias medem temperatura, umidade, chuva, nível dos rios e material particulado no ar. Geram alertas automáticos quando critérios são atingidos, sempre sujeitos a validação.',
  },
  {
    key: 'plataforma',
    title: 'Plataforma institucional',
    text: 'Quando uma mensagem autorizada chega a um gateway, ela sobe para a plataforma, que organiza por categoria e prioridade, encaminha à instituição responsável e acompanha o status até a resposta.',
  },
];

export const hardware = [
  {
    title: 'Dispositivo comunitário',
    chip: 'LILYGO T-Deck',
    items: ['ESP32-S3 (rádio, display, teclado e sensores)', 'Rádio LoRa SX1262', 'Display e teclado físico', 'Microfone e alto-falante (opcionais)', 'Bateria, painel solar e antena'],
  },
  {
    title: 'Processamento de linguagem',
    chip: 'Raspberry Pi',
    items: ['Modelo de linguagem quantizado', 'Reconhecimento de voz offline', 'Gera a estrutura compacta da mensagem', 'Conectado ao ESP32-S3 da estação'],
  },
  {
    title: 'Gateway',
    chip: 'Raspberry Pi + LoRa',
    items: ['Módulo LoRa SX1262', 'Ethernet, Wi-Fi, celular ou satélite', 'Software de encaminhamento', 'Assume se outro gateway cair'],
  },
  {
    title: 'Plataforma',
    chip: 'Web',
    items: ['Backend de recebimento', 'Banco de ocorrências', 'Interface de visualização', 'Encaminhamento, status e confirmação'],
  },
];

export const scaleSteps = [
  'Comunicação entre dois dispositivos',
  'Rede comunitária com retransmissão',
  'Integração com sensores e alertas ambientais',
  'Conexão com gateways e plataforma institucional',
  'Expansão para diferentes comunidades e territórios',
];

export const audiences = [
  'Povos indígenas',
  'Comunidades quilombolas',
  'Ribeirinhos',
  'Extrativistas',
  'Caiçaras',
  'Assentamentos rurais',
  'Regiões remotas',
  'Áreas afetadas por desastres naturais',
];

export const sdgs = [
  { n: 9, title: 'Indústria, Inovação e Infraestrutura', color: '#F36D25' },
  { n: 10, title: 'Redução das Desigualdades', color: '#E11484' },
  { n: 13, title: 'Ação Climática', color: '#48773E' },
  { n: 15, title: 'Vida Terrestre', color: '#56C02B' },
  { n: 16, title: 'Paz, Justiça e Instituições Eficazes', color: '#00689D' },
  { n: 18, title: 'Igualdade Étnico-Racial', color: '#8F4A2E', note: 'objetivo adotado voluntariamente pelo Brasil' },
];

export const governance = {
  public: [
    'Estado da rede: nós online, gateways, bateria e sinal',
    'Alertas ambientais automáticos e leituras das estações',
    'Contagem agregada e anonimizada de denúncias, por território',
    'Status de encaminhamento (registrada, encaminhada, respondida)',
  ],
  restricted: [
    'Relato original da comunidade',
    'Autoria e dispositivo de origem de relatos',
    'Rota da mensagem e localização exata',
    'Horário exato, resposta e histórico de atendimento',
  ],
  principles: [
    'A comunidade decide quais informações são compartilhadas, com quem e em quais condições.',
    'O RAÍZES não substitui a fiscalização, a presença do Estado nem os serviços públicos: ele diminui a distância entre a informação e quem deve responder.',
    'A IA organiza, não decide. O relato original é sempre preservado.',
    'Canais LoRa criptografados (AES-256, padrão Meshtastic) e saída para a internet somente de informação autorizada.',
  ],
};
