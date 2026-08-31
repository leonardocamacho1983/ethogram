# Ethogram — estratégia global de SEO e GEO

**Versão:** 1.0  
**Data:** 30 de agosto de 2026  
**Horizonte:** alpha OSS → autoridade de categoria em 12 meses  
**Mercado inicial:** global, em inglês  
**Categoria de entrada:** behavioral development and testing for AI agents  
**Território a possuir:** behavioral contracts for AI agents

---

## 1. Decisão executiva

Ethogram não deve competir inicialmente pela expressão genérica **AI evals**. O termo já é ocupado por plataformas com datasets, tracing, experimentos, LLM-as-a-judge, produção e CI. O produto atual não oferece essa superfície — e não precisa oferecê-la para ser relevante.

A estratégia recomendada é criar e dominar uma subcategoria tecnicamente defensável:

> **Ethogram is the open-source behavioral contract testing tool for TypeScript and Node.js AI agents.**

O mecanismo de aquisição é uma escada:

```text
problema conhecido
"how to test AI agents"
        ↓
problema específico
"test agent tool calls / catch agent regressions"
        ↓
novo modelo mental
"behavioral contracts for AI agents"
        ↓
produto nomeado
"Ethogram"
        ↓
ação
install → first Story → repeated run → GitHub star/contribution
```

SEO e GEO devem operar como um sistema único:

- **SEO** conquista descoberta, intenção e distribuição indexável;
- **GEO** torna a Ethogram uma entidade compreensível, citável e recuperável por sistemas de IA;
- **produto e evidência pública** transformam presença em confiança;
- **GitHub, npm, documentação e website** repetem a mesma entidade e a mesma verdade.

O objetivo de 12 meses não é “ranquear para tudo”. É fazer com que desenvolvedores, buscadores e assistentes associem espontaneamente:

> Ethogram → behavioral contract testing → real agent execution → expected / observed / verdict → local, code-first, open source.

---

## 2. Verdade do produto e limites de comunicação

### 2.1 O que pode ser afirmado agora

Com base no repositório, Ethogram é:

- open source sob MIT;
- local, code-first e read-only;
- voltado a agentes TypeScript/Node em Node.js 20.9+;
- estruturado em Agent, Story, execution profile, `ObservedRun` e `EvaluationResult`;
- capaz de executar o agente real;
- capaz de avaliar `tool-called` e `tool-not-called`;
- capaz de receber evidência externa verdict-free;
- capaz de recarregar alterações relevantes do projeto;
- sem persistência: conserva apenas evidência da execução corrente.

Fontes internas: [README](../README.md), [release readiness](./RELEASE-READINESS.md), [limitations](./limitations.md) e [execution evidence](./execution-evidence.md).

### 2.2 O que não pode ser vendido como capacidade atual

- Python;
- cloud ou colaboração hospedada;
- histórico persistido e comparação real entre runs;
- comentários em PR ou gates de CI;
- cobertura universal de frameworks;
- monitoramento de produção;
- compliance, governance ou enterprise assurance completos;
- matchers de ordem, cardinalidade ou argumentos ainda não implementados.

Esses itens podem aparecer como visão identificada claramente, nunca como funcionalidade disponível.

### 2.3 Bloqueadores anteriores a qualquer campanha

1. Confirmar marca, domínio, handles e colisões legais.
2. Confirmar e reservar o scope npm público.
3. Publicar uma versão instalável e verificável.
4. Tornar público o repositório canônico com identidade consistente.
5. Separar o website de marketing/documentação da UI local do produto.
6. Fixar um domínio canônico antes de gerar canonicals, sitemap, JSON-LD ou backlinks.

Sem isso, conteúdo pode gerar interesse que termina em uma jornada quebrada.

---

## 3. Diagnóstico atual

### 3.1 Forças

- Posicionamento já formulado e coerente: mudança sem quebra de comportamento crítico.
- Modelo conceitual memorável: Story como contrato comportamental.
- Diferenciação demonstrável: expectation, observation e verdict são separados.
- Wedge concreto: tool use e negative expectations.
- Adoção local sem conta ou upload.
- Código, testes de integração, documentação e design visual já produzem matéria-prima original.

### 3.2 Fraquezas de busca

- A rota `/` atual é a aplicação de desenvolvimento, não uma landing page indexável orientada à aquisição.
- Só existe metadata global básica; faltam `metadataBase`, canonical, Open Graph, Twitter Cards e política por rota.
- Não há `robots.txt`, sitemap XML, rotas editoriais, documentação web nem feed.
- Não há structured data de `WebSite`, `Organization`/`Person`, `SoftwareApplication`, `TechArticle` ou `BreadcrumbList`.
- Não há arquitetura internacional nem `hreflang`.
- Não há páginas públicas que respondam às intenções principais.
- O scope npm está confirmado, mas os pacotes ainda não foram publicados.
- O repositório tem ampla migração de nome em andamento; referências legadas reduzem consistência de entidade.
- Não há dados disponíveis de Search Console, Bing Webmaster Tools ou um painel de citações em motores de IA.

Há ainda um conflito de mensagem dentro dos ativos existentes. O plano de landing sugere sequência obrigatória, CI e comentário em PR, enquanto a alpha só comprova presença/ausência de tool calls e não possui runner headless, gate de CI ou PR bot. Antes de transformar o plano visual em website, reescrever esses trechos para capabilities presentes ou marcá-los inequivocamente como visão futura.

### 3.3 Risco de entidade: o nome “Ethogram”

“Ethogram” já é um termo acadêmico consolidado para catálogos de comportamento animal. A busca pelo nome puro será semanticamente ambígua. Isso exige consistência muito maior do que uma marca inventada:

- nunca usar apenas “Ethogram” em títulos iniciais;
- coocorrer sistematicamente com “behavioral testing for AI agents”;
- preferir “Ethogram AI agent testing” em perfis e descrições;
- manter `sameAs` preciso entre website, GitHub, npm e perfis oficiais;
- criar uma página `/about/ethogram` que explique o nome e a entidade de software;
- conquistar backlinks cuja âncora contenha marca + categoria;
- evitar tentar deslocar o significado científico; criar um novo significado claramente qualificado.

---

## 4. Mercado, competição e lacuna apropriável

### 4.1 Como os líderes enquadram o problema

| Concorrente/categoria | Centro de gravidade | Linguagem que ocupa | Espaço deixado para Ethogram |
| --- | --- | --- | --- |
| LangSmith | datasets, experiments, tracing, online/offline evals | final response, step, trajectory | contrato comportamental local e legível como código |
| Braintrust | data + task + scorers, experiment snapshots, CI | quality, scores, regressions | determinismo e ação exigida/proibida sem plataforma cloud |
| Langfuse | observabilidade, datasets, scores, tracing | evaluation loop, LLM-as-a-judge | separation of evidence from verdict |
| Promptfoo/DeepEval | harness amplo, métricas e red teaming | LLM testing, agent evals, pytest/CLI | Story como unidade semântica e não “config de scorer” |
| testes ad hoc | controle local | assertions, mocks, integration tests | vocabulário comum e evidência de execução real |
| inspeção manual de traces | diagnóstico | what happened | contrato explícito do que deveria acontecer |

As próprias documentações de [LangSmith](https://docs.langchain.com/langsmith/evaluation-approaches), [Braintrust](https://www.braintrust.dev/docs/evaluate) e [Langfuse](https://langfuse.com/docs/evaluation/core-concepts) confirmam que resposta final, passos, trajetórias, datasets e scores são objetos centrais. Ethogram deve ser compatível conceitualmente com essa demanda, sem fingir que é uma suite equivalente.

### 4.2 A janela está aberta — e fechando

Em julho de 2026, a [Red Hat publicou uma definição explícita de behavioral testing for AI agents](https://developers.redhat.com/articles/2026/07/30/behavioral-testing-for-ai-agents), contrastando comportamento real, modelo real e assertions determinísticas com evals probabilísticas. Isso valida a categoria, mas reduz o tempo disponível para Ethogram associar a categoria à marca.

Ao mesmo tempo, fornecedores e projetos estão verticalizando “agent testing”:

- [OpenAI Agents SDK for JavaScript](https://openai.github.io/openai-agents-js/guides/testing/) oferece testing determinístico e inspection de tool calls; seus próprios limites de test doubles reforçam o valor de executar o modelo real;
- [Mastra](https://mastra.ai/blog/introducing-gates-and-verdicts) usa “gates and verdicts” para checks determinísticos e scorers probabilísticos, colidindo com parte do vocabulário Ethogram;
- [LiveKit Agents](https://docs.livekit.io/agents/start/testing/) oferece testes locais/CI para mensagens, tool calls, argumentos e handoffs;
- novos produtos como [Wendell Runner](https://www.wendellai.com/), [EvalView](https://evalview.com/) e [Konsista](https://konsista.com/) usam regression testing, actions e policies em linguagem próxima.

Consequência: “behavioral testing” sozinho não é moat. A combinação defensável deve aparecer sempre junta:

> **versioned behavioral contracts + real-agent execution + verdict-free evidence + expected/observed/verdict separation + TypeScript/Node beachhead**

O moat de busca virá de especificação, corpus, exemplos, integrações e citações independentes — não da expressão isolada.

### 4.3 Lacuna semântica

O território “agent evaluation” é amplo demais. A lacuna é a interseção:

```text
contract testing
      ×
AI agent behavior
      ×
real tool execution
      ×
deterministic expectations
      ×
local code-first workflow
```

Essa interseção gera uma tese editorial própria:

> A trace is evidence. A Story is a contract. A verdict is a judgment. Reliable agent testing requires all three — kept separate.

### 4.4 Alternativas que o conteúdo deve enfrentar

Cada página de alta intenção deve responder contra a alternativa real, não apenas contra um concorrente:

1. “Vou só testar a resposta final.”
2. “Vou olhar o trace manualmente.”
3. “Vou fazer mock das tools.”
4. “Vou usar um LLM para julgar tudo.”
5. “Vou criar assertions ad hoc.”
6. “Vou adotar uma suite completa de evals.”

---

## 5. Arquitetura de demanda e keywords

Não há dados de volume no ambiente. Portanto, esta versão usa **intenção, aderência ao produto e dificuldade estratégica**, sem inventar volumes. Após a publicação, GSC e Bing devem substituir hipóteses por impressões, CTR, posição e citações reais.

### 5.1 Cluster 1 — categoria ampla

**Intenção:** aprender/comparar soluções.  
**Papel:** aquisição de topo e contexto semântico.  
**Termos:**

- AI agent testing
- AI agent evaluation
- agent evals
- LLM agent testing
- AI agent test framework
- AI agent reliability
- test tool-calling agents

**Página pilar:** `/ai-agent-testing`  
**CTA:** run your first behavioral Story.

### 5.2 Cluster 2 — problema de regressão

**Intenção:** resolver uma dor ativa.  
**Papel:** melhor fit com o trigger de adoção.  
**Termos:**

- AI agent regression testing
- catch AI agent regressions
- prompt regression testing for agents
- test agent after model change
- test agent after prompt change
- prevent tool-use regressions
- regression tests for agent workflows

**Página pilar:** `/ai-agent-regression-testing`  
**CTA:** encode one critical behavior as a Story.

### 5.3 Cluster 3 — tool use e trajetória

**Intenção:** implementação técnica.  
**Papel:** maior aderência ao produto alpha.  
**Termos:**

- test AI agent tool calls
- assert agent tool call
- agent trajectory testing
- AI agent action testing
- verify function calling behavior
- test forbidden tool calls
- tool-called / tool-not-called assertions

**Páginas:** `/guides/test-agent-tool-calls`, `/guides/test-forbidden-agent-actions`, `/concepts/trajectory-vs-behavior`.

### 5.4 Cluster 4 — modelo mental proprietário

**Intenção:** definição e educação de categoria.  
**Papel:** ownership semântico e citações GEO.  
**Termos:**

- behavioral testing for AI agents
- behavioral contracts for AI agents
- agent behavior specification
- AI agent contract testing
- agent behavior regression
- expected vs observed agent behavior

**Página canônica:** `/behavioral-contracts`  
**Definição estável:** “A behavioral contract is a versioned, executable statement of what an agent must or must not do under a defined condition.”

### 5.5 Cluster 5 — comparação e decisão

**Intenção:** avaliar ferramentas/abordagens.  
**Papel:** fundo de funil e desambiguação.  
**Páginas prioritárias:**

- `/compare/ethogram-vs-manual-trace-review`
- `/compare/behavioral-testing-vs-llm-as-a-judge`
- `/compare/agent-evals-vs-agent-observability`
- `/compare/contract-testing-vs-output-evaluation`
- somente depois de uso real e revisão factual: páginas contra produtos nomeados.

Comparações devem reconhecer quando as abordagens são complementares. Nunca montar tabelas falsas de checkmarks.

### 5.6 Cluster 6 — integração

**Intenção:** fazer funcionar agora.  
**Termos/páginas:**

- TypeScript AI agent testing → `/docs/typescript`
- Node.js agent testing → `/docs/nodejs`
- test existing AI agent → `/docs/existing-agent`
- framework-owned agent traces → `/docs/execution-evidence`
- local AI agent testing → `/docs/local-first`

Integrações nomeadas só devem existir quando houver exemplo executável, teste e política de manutenção.

### 5.7 Cluster 7 — marca

**Intenção:** navegar/validar.  
**Termos:** Ethogram, Ethogram AI, Ethogram agent testing, Ethogram docs, Ethogram GitHub, Ethogram npm.  
**Páginas:** homepage, `/docs`, `/about/ethogram`, GitHub e npm.

---

## 6. Arquitetura global de informação

### 6.1 Estrutura recomendada

```text
/
├── ai-agent-testing
├── ai-agent-regression-testing
├── behavioral-contracts
├── docs
│   ├── quickstart
│   ├── concepts
│   │   ├── stories
│   │   ├── expected-observed-verdict
│   │   ├── execution-evidence
│   │   └── negative-expectations
│   ├── guides
│   │   ├── existing-agent
│   │   ├── test-agent-tool-calls
│   │   ├── test-forbidden-agent-actions
│   │   └── change-model-without-breaking-behavior
│   ├── reference
│   └── limitations
├── examples
│   ├── access-approval-agent
│   ├── refund-agent
│   └── framework-owned-evidence
├── compare
│   ├── behavioral-testing-vs-output-evaluation
│   ├── agent-evals-vs-agent-observability
│   └── ethogram-vs-manual-trace-review
├── research
│   ├── state-of-agent-behavior-testing-2027
│   ├── benchmark
│   └── methodology
├── changelog
├── about/ethogram
└── [locale variants after validation]
```

### 6.2 Função de cada superfície

| Superfície | Função principal | Conversão |
| --- | --- | --- |
| Homepage | compreender a categoria em 10 segundos | GitHub / install |
| Category pages | capturar demanda ampla e definir o frame | docs / example |
| Docs | ativação | first successful Story |
| Guides | long-tail e resolução de problemas | copy command |
| Examples | prova executável | clone/run |
| Comparisons | decisão | try Ethogram |
| Research/benchmark | links, citações e autoridade | cite/download/contribute |
| GitHub | confiança técnica e comunidade | star/install/issue |
| npm | descoberta transacional | install |

### 6.3 Internal linking

Cada página deve ligar:

- para uma definição canônica;
- para uma prova executável;
- para o próximo passo da jornada;
- para uma página adjacente de comparação ou conceito;
- de volta ao pilar do cluster.

Exemplo:

```text
/ai-agent-regression-testing
  → /behavioral-contracts
  → /guides/change-model-without-breaking-behavior
  → /examples/access-approval-agent
  → /docs/quickstart
```

Não criar páginas órfãs nem taxonomias gigantes antes de haver conteúdo suficiente.

---

## 7. Estratégia editorial

### 7.1 Os cinco pilares

1. **Behavior under change** — por que prompts, modelos, tools e políticas geram regressões.
2. **Behavior as code** — Story, contracts, negative expectations e review no Git.
3. **Evidence integrity** — execução real, trace como fato e verdict-free evidence.
4. **Testing agent actions** — tool selection, forbidden actions e trajetória.
5. **Evaluation architecture** — quando usar checks determinísticos, LLM judges, traces e datasets.

### 7.2 Formato “answer-first” para humanos e motores

Cada página explicativa deve conter:

1. definição direta em 40–70 palavras;
2. quando usar e quando não usar;
3. exemplo mínimo executável;
4. diagrama ou tabela apenas quando esclarece relações;
5. limitações e edge cases;
6. data de revisão e versão do produto;
7. autor/revisor técnico identificável;
8. links para fonte primária e código;
9. resumo citável, não slogan vazio.

### 7.3 Backlog editorial inicial

| Prioridade | Ativo | Intenção | Prova exigida |
| --- | --- | --- | --- |
| P0 | What is behavioral testing for AI agents? | definição | Story + run real |
| P0 | How to test AI agent tool calls in TypeScript | implementação | repo executável |
| P0 | AI agent regression testing: a practical guide | problema | before/after |
| P0 | Trace vs behavioral contract vs verdict | conceito | modelo de dados real |
| P0 | How to test that an AI agent does **not** call a tool | implementação | `tool-not-called` |
| P1 | AI agent evals vs observability | decisão | matriz equilibrada |
| P1 | Deterministic checks vs LLM-as-a-judge | decisão | mesma Story avaliada de dois modos |
| P1 | Change an agent model without breaking critical behavior | trigger | experimento reproduzível |
| P1 | Why final-answer evaluation misses unsafe tool use | dor | contraprova |
| P1 | Framework-owned evidence without vendor lock-in | arquitetura | adapter real |
| P2 | Agent behavior failure taxonomy | pesquisa | corpus público |
| P2 | State of behavioral regression in AI agents | linkable asset | metodologia + dados |

### 7.4 Programa de conteúdo composto

Um experimento técnico deve gerar:

```text
1 repositório executável
→ 1 guia profundo
→ 1 página de conceito
→ 1 vídeo curto/GIF
→ 3 posts técnicos
→ 1 discussão comunitária
→ 1 entrada no benchmark
```

Isso reduz conteúdo genérico e aumenta a densidade de evidência.

### 7.5 O que não publicar

- artigos de volume sem execução ou insight original;
- glossários gerados em massa;
- páginas para cada variação de keyword;
- integrações não testadas;
- comparações difamatórias ou desatualizadas;
- estatísticas sem método e fonte;
- “best AI agent testing tools” autocentrado;
- texto produzido para parecer humano ou enganar detectores.

---

## 8. GEO: tornar Ethogram recuperável e citável

### 8.1 Princípio

GEO não é um conjunto mágico separado de SEO. O guia oficial do Google para recursos generativos afirma que boas práticas de SEO continuam fundamentais, que não existe schema especial para IA e que conteúdo útil, único, acessível e indexável continua sendo a base. A [orientação do Google](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) deve prevalecer sobre receitas especulativas.

O objetivo GEO da Ethogram é maximizar cinco condições:

1. **retrievability** — páginas públicas, indexáveis, rápidas e bem ligadas;
2. **entity clarity** — identidade consistente e desambiguada;
3. **answerability** — definições, comparações e exemplos que respondem perguntas completas;
4. **evidence density** — claims ligados a código, testes, resultados e fontes;
5. **third-party corroboration** — outras fontes confiáveis descrevem e citam a Ethogram.

### 8.2 Entity home

A homepage deve ser a “entity home” e declarar sem variação:

- Name: Ethogram;
- Alternate name: Ethogram AI agent testing;
- Category: DeveloperApplication / behavioral testing for AI agents;
- One-line description;
- canonical URL;
- logo estável;
- founder/maintainer ou organização responsável;
- GitHub, npm e perfis oficiais em `sameAs`;
- license, supported runtime e release status;
- “not animal behavior research” apenas na página de desambiguação, não como destaque de homepage.

### 8.3 Knowledge graph editorial

Criar páginas canônicas para as relações:

```text
Ethogram
  is a → developer testing tool
  tests → AI agent behavior
  uses → behavioral Stories
  observes → real agent execution
  produces → verdict-free evidence
  evaluates → required and forbidden tool calls
  runs in → TypeScript / Node.js projects
  is licensed under → MIT
```

Cada relação deve aparecer em prosa visível, metadata coerente e links internos — não apenas em JSON-LD.

### 8.4 Blocos citáveis

Em páginas importantes, incluir blocos factuais autocontidos:

- **Definition**
- **In one sentence**
- **How it works**
- **When to use it**
- **Limitations**
- **Example**
- **Compared with**
- **Last verified**

Não usar respostas artificiais repetidas. Cada bloco deve resolver uma pergunta real e poder sobreviver fora de contexto sem distorção.

### 8.5 Documentação para agentes e assistentes

- Publicar `/llms.txt` como índice conciso de documentação e `/llms-full.txt` apenas se puder ser gerado e mantido automaticamente.
- Tratar `llms.txt` como conveniência experimental, não como fator de ranking ou substituto de sitemap/internal links.
- Expor Markdown limpo ou uma versão textual das docs quando possível.
- Usar URLs estáveis, heading hierarchy e fragmentos previsíveis.
- Manter changelog, versões e limitações explícitas para reduzir respostas obsoletas.
- Fornecer exemplos completos pequenos, não snippets incompatíveis.

### 8.6 Crawler policy

No `robots.txt`:

- permitir Googlebot, Bingbot e `OAI-SearchBot` nas páginas públicas;
- tomar decisão separada sobre `GPTBot`, que se relaciona a potencial uso em treinamento, não à inclusão no ChatGPT Search;
- não bloquear assets necessários para renderização;
- apontar para sitemap absoluto;
- manter UI local, ambientes preview e páginas internas fora do índice.

A [FAQ oficial da OpenAI para publishers](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq) distingue `OAI-SearchBot` de `GPTBot` e informa que referral de ChatGPT pode ser medido por analytics.

### 8.7 Ativos que ganham citações

Prioridade maior que volume de blog:

1. **Agent Behavior Regression Benchmark** — conjunto versionado de cenários com metodologia.
2. **Failure taxonomy** — classificação aberta de regressões de tool use.
3. **Behavioral Contract Specification** — especificação curta e neutra, com exemplos.
4. **Adapter/evidence schema** — contrato público verdict-free.
5. **Reproducible model-change reports** — mesmo agente, modelos/prompts diferentes, comportamento observado.
6. **Public examples repository** — todos os claims importantes reproduzíveis.

Os ativos devem ter DOI/Zenodo quando houver maturidade, release no GitHub, licença clara, CSV/JSON e página HTML explicativa.

Adicionar `CITATION.cff` ao repositório e uma página “How to cite Ethogram”. O GitHub usa esse arquivo para exibir instruções de citação e pode gerar formatos como APA e BibTeX ([documentação](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-citation-files)). Não criar Wikidata ou Wikipedia antes de existir notabilidade comprovada por fontes independentes.

### 8.8 Corroboração fora do domínio

Sequência de autoridade:

1. GitHub e npm com descrição idêntica.
2. Issues/discussions técnicas em comunidades relevantes, sem autopromoção vazia.
3. Integrações ou exemplos revisados por mantenedores de frameworks.
4. Inclusão factual em awesome lists e diretórios técnicos.
5. Guest tutorials com exemplo executável.
6. Talks, podcasts e newsletters técnicas.
7. Papers/workshops ou benchmark citations quando os dados justificarem.

GEO não será vencido somente no domínio próprio. Modelos precisam encontrar corroboradores independentes.

---

## 9. SEO técnico

### 9.1 P0 — fundação

- Definir domínio canônico e `metadataBase`.
- Criar landing estática/SSR na raiz; mover a UI de produto para rota não indexável apropriada.
- Gerar `robots.txt` e `sitemap.xml` automaticamente.
- Definir canonical por página.
- Criar titles e descriptions únicos.
- Criar Open Graph/Twitter images leves e específicas por template.
- Garantir HTML útil antes da hidratação.
- Adicionar breadcrumbs visíveis.
- Verificar Google Search Console e Bing Webmaster Tools.
- Submeter sitemap aos dois.
- Implementar IndexNow para publicação/alteração/remoção. Bing recomenda sitemap + IndexNow para descoberta e atualização em busca com IA ([fonte](https://blogs.bing.com/webmaster/July-2025/Keeping-Content-Discoverable-with-Sitemaps-in-AI-Powered-Search)).
- Remover/noindex de labs, previews e estados internos que não são páginas de aquisição.

### 9.2 Structured data por tipo

| Template | Schema recomendado | Observação |
| --- | --- | --- |
| Homepage | `WebSite` + entidade responsável | site name e identidade |
| Produto | `SoftwareApplication` (`DeveloperApplication`) | somente propriedades visíveis e verdadeiras |
| Docs/guide | `TechArticle` ou `Article` | autor, revisão, data e headline reais |
| Hierarquia | `BreadcrumbList` | refletir breadcrumb visível |
| Benchmark/dataset | `Dataset` | distribuição, licença e versão |
| Vídeo | `VideoObject` | apenas quando houver vídeo incorporado real |

O [Google documenta `SoftwareApplication`](https://developers.google.com/search/docs/appearance/structured-data/software-app), mas structured data deve refletir o conteúdo visível e não garante rich result. Não priorizar `FAQPage`: rich results de FAQ são hoje restritos principalmente a sites governamentais e de saúde ([fonte](https://developers.google.com/search/blog/2023/08/howto-faq-changes)).

### 9.3 Performance e mobile

Metas operacionais no p75 mobile:

- LCP ≤ 2,5 s;
- INP ≤ 200 ms;
- CLS ≤ 0,1;
- HTML inicial com conteúdo principal;
- JS de marketing reduzido;
- fontes WOFF2 com subset/preload somente quando necessário;
- imagens WebP/AVIF dimensionadas e com `width`/`height`;
- animações decorativas respeitando `prefers-reduced-motion`;
- nenhum demo pesado no hero antes de interação.

### 9.4 Internacionalização

**Fase 1:** inglês global (`/` ou `/en/`) como fonte canônica de produto e docs.  
**Fase 2:** português do Brasil (`/pt-br/`) por vantagem do fundador e capacidade de revisão nativa.  
**Fase 3:** espanhol (`/es/`) após demanda comprovada.  
**Fase 4:** japonês, coreano ou alemão somente com sinais de uso/contribuição e revisão técnica nativa.

Regras:

- URLs separadas por idioma;
- `hreflang` recíproco + `x-default`;
- self-canonical por idioma, nunca canonical de tradução para inglês;
- navegação de idioma explícita, sem redirect por IP;
- código pode permanecer em inglês, explicação deve ser localizada;
- exemplos, títulos e consultas devem refletir linguagem de desenvolvedor local;
- não publicar tradução automática sem revisão técnica humana.

O Google recomenda URLs específicas por locale e `hreflang`; também desaconselha adaptação por IP porque pode impedir crawling consistente ([fonte](https://developers.google.com/search/docs/advanced/crawling/managing-multi-regional-sites)).

---

## 10. Distribuição e digital PR

### 10.1 Canais prioritários

1. **GitHub** — README, topics, releases, examples, discussions e issues.
2. **npm** — nomes, keywords e READMEs transacionais consistentes; a busca do npm usa title, description, README e keywords ([documentação npm](https://docs.npmjs.com/searching-for-and-choosing-packages-to-download/)).
3. **Framework communities** — exemplos e integrações genuínas.
4. **Hacker News / Reddit / dev communities** — lançamento ancorado em descoberta técnica, não em pitch.
5. **Technical newsletters/podcasts** — benchmark e failure taxonomy.
6. **YouTube** — demos curtas com before/after e transcript HTML.
7. **Conferências e meetups** — “behavioral contracts for agents”.

### 10.2 GitHub como motor de busca e prova

- Repository description: “Open-source behavioral contract testing for AI agents. Define critical behavior, run the real agent, and catch regressions.”
- Topics: `ai-agents`, `agent-testing`, `agent-evaluation`, `regression-testing`, `typescript`, `developer-tools`, `tool-calling`, `llm-evals`.
- README: definition → demo → install → first Story → evidence → limitations.
- Criar releases assinadas, changelog e provenance de pacote.
- Exemplos devem executar em CI; badges só quando representam checks reais.
- Issue templates devem coletar framework, runtime, expected behavior, observed behavior e evidence.

### 10.3 Campanhas linkáveis

- “100 ways tool-using agents regress after a model or prompt change.”
- “The Agent Behavior Failure Taxonomy.”
- “Behavioral Contract Week”: sete agentes reais, sete regressões, sete Stories.
- Relatório trimestral do benchmark.
- Open specification/RFC para Story e evidence schema.

---

## 11. Conversão e product-led SEO

### 11.1 Conversão primária por estágio

| Estágio | Conversão |
| --- | --- |
| Pré-publicação | join private alpha / GitHub watch |
| Alpha pública | copy install command |
| Ativação | first Story passed/failed with real evidence |
| Hábito | ≥3 Stories em ≥2 sessões/mudanças |
| Comunidade | star, issue, discussion, integration ou PR |

### 11.2 Instrumentação mínima

Eventos de website:

- `view_category_page`
- `view_doc`
- `copy_install_command`
- `click_github`
- `view_example`
- `download_benchmark`
- `change_locale`
- `ai_referral_landing`

Eventos de produto, com privacidade e opt-in adequados:

- `init_completed`
- `first_story_discovered`
- `first_real_run_completed`
- `first_verdict`
- `repeat_run_after_change`

Nunca enviar conteúdo de Story, evidence, prompts, tools ou código sem consentimento explícito.

### 11.3 Página → valor

Todo artigo técnico deve terminar no exemplo correspondente, não na homepage genérica. Toda documentação deve oferecer o comando exato aplicável ao estado atual da release.

---

## 12. Medição SEO + GEO

### 12.1 North Star de aquisição

> **Activated developers from organic discovery:** desenvolvedores provenientes de busca, respostas de IA, docs referenciadas ou menções externas que completam uma primeira Story com evidência real.

Até ser possível medir ativação, usar `copy_install_command` + GitHub/npm referrals como proxy.

### 12.2 Scorecard semanal

| Camada | Métricas |
| --- | --- |
| Indexação | URLs válidas, descobertas, excluídas, crawl errors, freshness |
| SEO | impressões non-brand, cliques, CTR, posição por cluster, landing pages |
| Marca | impressões e cliques por Ethogram + categoria, sitelinks, domínio direto |
| GEO | citações por motor, share of answers, URLs citadas, factual accuracy |
| Autoridade | referring domains relevantes, GitHub stars/forks/contributors, npm dependents/downloads |
| Conversão | install-copy rate, docs→example, organic activation proxy |
| Qualidade | content decay, claims desatualizados, broken examples, CWV |

### 12.3 Painel de GEO

Criar um conjunto fixo de 40–60 prompts, segmentado por intenção:

- “How do I test an AI agent’s tool calls?”
- “What is behavioral testing for AI agents?”
- “How do I catch agent regressions after changing models?”
- “What is the difference between agent evaluation and observability?”
- “Open-source TypeScript tools for testing AI agents.”
- “How do I verify that an agent never calls a forbidden tool?”

Rodar semanal ou quinzenalmente em superfícies disponíveis de ChatGPT Search, Google AI Mode/Overviews, Bing Copilot, Perplexity e Gemini, respeitando termos e evitando automação proibida.

Registrar:

- menção da marca;
- link/citação;
- posição/ordem quando houver;
- página citada;
- descrição factual correta/incorreta;
- concorrentes citados;
- prompt, locale, data e estado de login/personalização.

Não tratar respostas como ranking determinístico. Usar amostras repetidas e tendência de quatro semanas. O Bing Webmaster Tools anunciou em 2026 um relatório de **AI Performance** com citações e URLs referenciadas; deve ser ativado assim que o domínio estiver verificado ([fonte](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview)).

O Search Console também iniciou em junho de 2026 um rollout limitado de relatórios próprios para visibilidade em recursos generativos, com impressões, páginas, países, devices e datas. Ativar quando a propriedade for elegível e manter esse dado separado do painel de prompts controlados ([fonte](https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports)).

### 12.4 Metas de 12 meses

Sem baseline, metas devem ser relativas e por marcos:

- 100% das páginas P0 indexáveis e sem erros críticos;
- ≥80% das páginas P0 com alguma impressão non-brand em 90 dias após publicação;
- top 10 para pelo menos 5 consultas long-tail de alta aderência em 6 meses;
- crescimento mensal de referring domains técnicos relevantes;
- menção correta em ≥25% do prompt set GEO até mês 6 e ≥50% até mês 12;
- citação/link em ≥10% do prompt set até mês 6 e ≥25% até mês 12;
- ≥20% de melhoria trimestral em docs→install-copy até estabilização;
- zero claim público de feature ausente.

Metas absolutas de tráfego só devem ser definidas após 8–12 semanas de dados.

---

## 13. Roadmap 30/60/90/180/365

### Dias 0–30 — fundação e entidade

**P0**

- resolver domínio, marca, handles e npm scope;
- definir URL e repositório canônicos;
- publicar homepage de marketing separada da UI local;
- criar `/ai-agent-testing`, `/behavioral-contracts` e `/docs/quickstart`;
- implementar metadata, canonicals, robots, sitemap, OG e JSON-LD básico;
- configurar GSC, Bing Webmaster Tools, IndexNow e analytics privacy-first;
- alinhar website, GitHub, package READMEs e npm em uma frase canônica;
- produzir um exemplo real completo e reproduzível.

**Gate:** não lançar aquisição enquanto install/quickstart não funcionar end to end.

### Dias 31–60 — cobertura da intenção principal

- publicar as cinco páginas P0 editoriais;
- publicar três examples executáveis;
- criar `/about/ethogram` para desambiguação;
- adicionar changelog, limitations e authorship/review;
- publicar `llms.txt` gerado das docs;
- criar prompt set GEO e baseline manual;
- lançar alpha para comunidade técnica pequena;
- coletar consultas reais de GSC e linguagem de usuários.

### Dias 61–90 — autoridade inicial

- publicar benchmark v0 ou failure taxonomy v0 com metodologia;
- lançar 2–3 comparações de abordagem;
- abrir RFC de Behavioral Contract Specification;
- fazer outreach individual para 20 mantenedores/autores relevantes com contribuição concreta;
- submeter exemplos a comunidades/frameworks onde forem genuinamente úteis;
- localizar somente homepage, quickstart e página pilar para pt-BR;
- atualizar mapa de keywords com dados reais.

### Dias 91–180 — compounding loop

- publicar relatório trimestral do benchmark;
- transformar issues reais em exemplos e guias;
- expandir integrações somente onde houver testes de manutenção;
- consolidar clusters com impressões entre posições 8–30;
- revisar páginas com boa impressão e baixo CTR;
- iniciar espanhol se demanda e capacidade de revisão justificarem;
- obter 10–20 referring domains técnicos relevantes, priorizando qualidade;
- medir organic→activation, não só tráfego.

### Dias 181–365 — liderança de subcategoria

- benchmark v1 com parceiros externos;
- especificação versionada e governança pública;
- relatório anual “State of Agent Behavioral Testing”;
- programa de contributors/examples;
- páginas de comparação nomeada baseadas em testes reproduzíveis;
- expansão localizada baseada em uso real;
- revisão completa da categoria: manter “behavioral testing” ou evoluir para “behavioral reliability” somente se produto e mercado sustentarem.

---

## 14. Backlog priorizado

### P0 — impacto alto, dependência crítica

1. Resolver marca/domínio/npm.
2. Publicar pacote utilizável.
3. Homepage de marketing + quickstart funcional.
4. Sitemap/robots/canonical/metadata/JSON-LD.
5. GSC/Bing/IndexNow/analytics.
6. Três páginas pilares.
7. Um exemplo real executável.
8. Consistência de entidade em todas as superfícies.

### P1 — crescimento composto

9. Cinco guias de alta intenção.
10. Três examples.
11. Benchmark/taxonomy v0.
12. Comparações de abordagem.
13. Prompt set e dashboard GEO.
14. Outreach técnico baseado em contribuição.
15. pt-BR nas páginas validadas.

### P2 — depois de sinais

16. Integrações nomeadas adicionais.
17. Espanhol e novos locales.
18. Diretório de patterns/templates.
19. Comparações contra marcas específicas.
20. Relatórios recorrentes mais amplos.

### Não fazer agora

- centenas de páginas programáticas;
- compra de backlinks;
- campanhas pagas amplas;
- localization em muitos idiomas;
- Wikipedia prematura;
- schema excessivo ou propriedades invisíveis;
- promessa de GEO garantido;
- rebrand do território para “assurance” antes da capacidade.

---

## 15. Experimentos ranqueados

| # | Experimento | Hipótese | Métrica primária | Dependência |
| --- | --- | --- | --- | --- |
| 1 | Tool-not-called guide + runnable repo | dor específica converte melhor que “agent evals” | docs→install-copy | pacote público |
| 2 | Página `/behavioral-contracts` | definição proprietária ganha long-tail/citações | non-brand impressions + GEO citations | entity foundation |
| 3 | Before/after model-change demo | prova de regressão aumenta ativação | example→install | agent example |
| 4 | Benchmark/taxonomy v0 | dado original atrai links e citações | relevant referring domains | metodologia |
| 5 | Trace vs contract vs verdict | modelo mental diferencia a marca | engaged reads + assisted installs | design diagram |
| 6 | GitHub README message test | categoria explícita aumenta install intent | README→docs/install | analytics proxy |
| 7 | pt-BR quickstart | founder advantage gera comunidade inicial | localized activation | reviewer native |
| 8 | `llms.txt` + clean Markdown docs | facilita navegação por agentes | log/referral observations | docs generator |

Cada experimento deve ter baseline, janela, critério de sucesso e decisão de manter/iterar/parar. Não confundir correlação de tráfego com ativação.

---

## 16. Governança editorial e de claims

### 16.1 Contrato de publicação

Nenhuma página vai ao ar sem:

- intenção e leitor definidos;
- claim map com fonte ou prova;
- exemplo testado na release atual;
- owner e data de revisão;
- title, description, canonical e social image;
- links internos de entrada e saída;
- revisão mobile, acessibilidade e performance;
- revisão de limitações e overclaim;
- index/noindex consciente;
- atualização de sitemap.

### 16.2 Cadência

- semanal: indexação, bugs, consulta emergente e GEO sample;
- mensal: clusters, conversão, decay e links;
- trimestral: posicionamento, benchmark, concorrência e locales;
- por release: todos os comandos, examples, limitations, schema e entity facts.

### 16.3 Source of truth

- capabilities: testes e docs do repositório;
- release/install: npm + GitHub release;
- positioning: documento de GTM;
- metadata/entity: manifesto único versionado;
- metrics: GSC, Bing, analytics e painel GEO;
- claims futuros: backlog/roadmap privado ou claramente rotulado.

---

## 17. Release approval packet

### Opportunity summary

Possuir “behavioral contract testing for AI agents” como subcategoria, entrando pela demanda já existente de agent testing, tool-call verification e regression testing.

### Selected brief

Inglês global, developer-first, open-source e evidence-led. Primeira promessa: “Change your agent. Keep its critical behavior.” Descritor constante: “Open-source behavioral contract testing for AI agents.”

### Localized review status

- English: idioma canônico recomendado; revisão editorial técnica necessária.
- pt-BR: recomendado na fase 2; revisão nativa disponível como vantagem.
- demais idiomas: bloqueados até evidência de demanda e revisão humana.

### Newsletter package

Não é P0. Primeiro pacote sugerido: lançamento do benchmark/failure taxonomy, com CTA para reproduzir e contribuir — não newsletter genérica de produto.

### Lifecycle/automation package

Não implementar antes de existir opt-in e jornada de ativação. Sequência futura: welcome → first Story → existing-agent integration → repeat after a change → contribute a failure pattern.

### Asset package

Já existem marca, fonts, screenshots e plano de landing. Faltam ativos diretamente ligados a prova: before/after run, execution spine, expected/observed/verdict e social cards por cluster.

### Responsive review

Pendente para a futura landing. A UI atual não substitui a página de marketing. O hero deve carregar conteúdo estático e evitar demo pesada no mobile.

### Performance status

Não medido em produção porque domínio/landing pública não foram confirmados. Bloqueio até Lighthouse/CWV reais.

### SEO status

Estratégia definida; implementação técnica e dados de busca ainda ausentes. Estado: **not launch-ready for organic acquisition**.

### Voice match

Direta, técnica, sóbria, sem hype. Preferir “show the run” a “revolutionize AI reliability”.

### Humanity risks

- conteúdo semanticamente completo porém intercambiável;
- excesso de definições sem experiência própria;
- comparações genéricas;
- publicação em massa;
- autoridade performada sem usuários ou dados.

### Quality notes

Preservar assimetria: Ethogram não precisa ser a melhor suite de evals; precisa ser a ferramenta mais clara para transformar comportamentos críticos em contratos executáveis e inspecionáveis.

### Rewrite priorities

1. Homepage pública.
2. GitHub README após pacote confirmado.
3. Quickstart web.
4. Category pillar.
5. Behavioral contracts definition.

### Explicit blockers

- domínio canônico não consta no repositório;
- npm scope confirmado; publicação dos pacotes ainda pendente;
- pacote ainda não publicado;
- homepage atual é a UI do produto;
- não há GSC/Bing/analytics para sizing real;
- clearance de marca/handles permanece aberto.

---

## 18. Fontes externas principais

- Google Search Central — [Optimizing your website for generative AI features](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- Google Search Central — [Sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- Google Search Central — [Multilingual and multi-regional sites](https://developers.google.com/search/docs/advanced/crawling/managing-multi-regional-sites)
- Google Search Central — [SoftwareApplication structured data](https://developers.google.com/search/docs/appearance/structured-data/software-app)
- Google Search Central — [Site names and WebSite structured data](https://developers.google.com/search/docs/appearance/site-names)
- Google Search Central — [Generative AI performance reports in Search Console](https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports)
- OpenAI — [Publishers and developers FAQ](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq)
- Bing — [Sitemaps and IndexNow in AI-powered search](https://blogs.bing.com/webmaster/July-2025/Keeping-Content-Discoverable-with-Sitemaps-in-AI-Powered-Search)
- Bing — [AI Performance in Bing Webmaster Tools](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview)
- LangSmith — [Application-specific evaluation approaches](https://docs.langchain.com/langsmith/evaluation-approaches)
- Braintrust — [Evaluate systematically](https://www.braintrust.dev/docs/evaluate)
- Langfuse — [Evaluation core concepts](https://langfuse.com/docs/evaluation/core-concepts)
- Red Hat Developer — [Behavioral testing for AI agents](https://developers.redhat.com/articles/2026/07/30/behavioral-testing-for-ai-agents)
- OpenAI Agents SDK — [Testing](https://openai.github.io/openai-agents-js/guides/testing/)
- Mastra — [Gates and verdicts](https://mastra.ai/blog/introducing-gates-and-verdicts)
- npm — [How package search works](https://docs.npmjs.com/searching-for-and-choosing-packages-to-download/)

---

## 19. Próxima decisão

A sequência ótima é:

```text
clearance + domain + npm scope
→ public package and canonical GitHub
→ marketing homepage + quickstart
→ technical SEO foundation
→ 5 evidence-backed P0 pages
→ benchmark/taxonomy
→ distribution and citations
→ localization from real demand
```

O primeiro sprint não deve produzir vinte artigos. Deve produzir uma entidade inequívoca, uma instalação que funciona, três páginas extraordinariamente úteis e uma prova que nenhum concorrente possa copiar sem adotar o mesmo modelo de produto.
