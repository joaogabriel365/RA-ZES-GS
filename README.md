# RAÍZES — Plataforma (protótipo)

**Rede Autônoma de Informação, Zeladoria e Emergência Socioambiental**

> “A distância física não deveria significar distância dos direitos.”

Protótipo visual da plataforma web do projeto RAÍZES, feito para a Global Solution FIAP (tema CitizenTech, Engenharia da Computação). Não tem backend: **todos os dados são simulados no front-end**. Os únicos dados reais são as estatísticas da página "Como funciona", com as fontes indicadas.

## Como rodar

Requisitos: Node.js 18 ou mais recente.

```bash
npm install
npm run dev
```

Abra o endereço que aparece no terminal (normalmente http://localhost:5173).

Para gerar a versão de produção:

```bash
npm run build
npm run preview
```

> O mapa usa imagens de satélite da Esri (sem chave de API) e as fontes vêm do Google Fonts, então é preciso ter internet durante a apresentação.

## Páginas

| Rota | O que mostra |
|---|---|
| `/` | Início: hero, indicadores ao vivo, prévia do mapa e feed de alertas que se atualiza sozinho |
| `/mapa` | Mapa interativo com os 3 tipos de nó, enlaces LoRa, pacotes animados, painel do nó e **simulação de queda de gateway** |
| `/alertas` | Lista de ocorrências com filtros (origem, categoria, prioridade, status, território, período) |
| `/alertas/:id` | Detalhe: linha do tempo, rota no minimapa, classificação da IA, relato original, gráfico do sensor e pacote JSON |
| `/ambiente` | Estações comunitárias: gráficos com faixas de atenção e alerta, e resumo por território |
| `/simulador` | **Simulador de mensagem** ponta a ponta (cerca de 18 s, repetível) |
| `/painel` | Painel institucional (login simulado): fila, encaminhamento, status, resposta e métricas |
| `/console` | Console técnico: pacotes chegando aos gateways (estilo terminal) e estado dos gateways |
| `/sobre` | Como funciona: problema, dados reais, diagrama dos 7 passos, hardware, escalabilidade, ODS, governança |

### Roteiro sugerido para o vídeo
1. **Início**: o hero e os contadores ao vivo.
2. **Simulador**: envie o relato de invasão (já preenchido). Para mostrar a entrada por voz, clique no microfone antes de enviar.
3. **Mapa**: clique em "Simular queda" no gateway Porto Esperança para mostrar a rede se redirecionando sozinha.
4. **Alertas**: mostre a visão pública (anonimizada). Depois clique em "Acesso institucional → Entrar como instituição (demonstração)" e abra a mesma ocorrência para ver o relato completo.
5. **Painel**: encaminhe uma ocorrência e envie uma resposta para a comunidade.

## Estrutura de pastas

```
src/
├── data/                 ← DADOS SIMULADOS (edite aqui)
│   ├── network.ts        territórios, nós (coordenadas, bateria, sinal), alcance LoRa
│   ├── occurrences.ts    modelos de relatos e alertas + gerador do histórico (40 ocorrências)
│   ├── sensors.ts        métricas, limites de atenção/alerta e séries das estações
│   ├── catalog.ts        categorias, prioridades, status e instituições (por função)
│   └── content.ts        textos da página "Como funciona", estatísticas reais, ODS, governança
├── lib/
│   ├── graph.ts          enlaces por alcance e rota até o gateway (BFS, limite de 7 saltos)
│   ├── classifier.ts     simulação da IA offline (regras por palavra-chave)
│   ├── factory.ts        monta ocorrência, linha do tempo e pacote compacto
│   └── format.ts, rng.ts, types.ts
├── store/
│   └── NetworkContext.tsx  estado global + simulador em tempo real (eventos a cada 8–15 s)
├── components/
│   ├── brand/            logotipo, ilustração de raízes, diagrama da arquitetura
│   ├── map/              mapa (react-leaflet), ícones dos nós, camada de pacotes animados
│   ├── alerts/           cards de ocorrência (com versão pública anonimizada)
│   ├── charts/           gráfico de sensor (Recharts)
│   ├── common/           badges, contadores, JSON, utilitários de UI
│   └── layout/           cabeçalho, rodapé, selo acadêmico, avisos
└── pages/                uma página por rota
```

## Onde editar os dados

- **Territórios e nós**: `src/data/network.ts`. Os enlaces LoRa são calculados automaticamente pela distância entre os nós (`LORA_RANGE_KM`). Se mover um nó, os enlaces e as rotas se ajustam sozinhos.
- **Relatos e alertas**: `src/data/occurrences.ts` (`reportTemplates`, `sensorAlertTemplates`). `HISTORY_COUNT` define quantas ocorrências históricas são geradas.
- **Limites dos sensores**: `src/data/sensors.ts` (`metrics`). `stationScenario` define qual estação mostra fumaça, cheia, chuva ou calor.
- **Exemplos do simulador**: `PRESETS` em `src/pages/Simulator.tsx`.
- **Textos institucionais e estatísticas**: `src/data/content.ts`.

## Princípios refletidos na interface

- Na **visão pública**, relatos comunitários aparecem só de forma agregada e anonimizada: sem relato, sem autoria, sem rota e sem horário exato.
- A IA **organiza, não decide**: o relato original é sempre preservado e o encaminhamento é humano.
- Alertas automáticos de sensores são **sujeitos a validação**.
- O RAÍZES **não substitui** a fiscalização, a presença do Estado nem os serviços públicos.

## Stack

Vite, React 18, TypeScript, Tailwind CSS, React Router, react-leaflet (Leaflet), Recharts, Framer Motion e lucide-react.

---

Protótipo acadêmico · Dados simulados · Global Solution FIAP. Todos os territórios, localidades, nós e ocorrências são fictícios. A rede mesh foi inspirada no projeto open source [Meshtastic](https://meshtastic.org).
