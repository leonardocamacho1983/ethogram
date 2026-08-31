# Ethogram — Estratégia de geração de valor, Product Marketing, posicionamento e GTM

**Versão:** 1.0  
**Data:** 30 de agosto de 2026  
**Status:** tese estratégica para validação de mercado  
**Horizonte:** OSS alpha → colaboração hospedada → behavioral assurance empresarial

---

## 1. Resumo executivo

Ethogram deve entrar no mercado por uma promessa estreita, concreta e tecnicamente defensável:

> **Mude seu agente sem quebrar os comportamentos críticos que já funcionam.**

O produto não deve ser apresentado inicialmente como uma plataforma genérica de “AI evals”, observabilidade ou governança. Essas categorias são amplas, congestionadas e já associadas a suites de datasets, traces, experimentos, dashboards e LLM-as-a-judge. O wedge de Ethogram é diferente: transformar comportamentos críticos de agentes em **Stories versionáveis**, executar o agente real, preservar a evidência do que aconteceu e avaliar regressões sem misturar expectativa, observação e veredicto.

A unidade de valor é a **Story como contrato comportamental**. A jornada de valor é:

```text
Comportamento implícito
        ↓
Story versionável
        ↓
Execução do agente real
        ↓
Evidência observável e inspecionável
        ↓
Veredicto de regressão
        ↓
Confiança para mudar e publicar
```

O mercado inicial recomendado é formado por desenvolvedores e pequenas equipes que já possuem um agente TypeScript/Node com ferramentas e que estão alterando prompt, modelo, tools, políticas, conhecimento ou código. O trigger de compra/adoção não é “quero avaliar IA”; é:

> “Preciso mudar este agente, mas não tenho como provar que ele continuará fazendo — e evitando — as ações que importam.”

A estratégia combina seis escolas:

1. **Value Proposition Design**, para escolher jobs, pains e gains prioritários por segmento;
2. **Jobs to Be Done**, para entender o progresso desejado e o momento causal de adoção;
3. **Lean Startup/Customer Development**, para tratar ICP, mensagem e roadmap como hipóteses;
4. **Product–User Fit antes de Product–Market Fit**, para conquistar primeiro o usuário técnico;
5. **Sean Ellis/Superhuman PMF Engine**, para medir indispensabilidade e concentrar-se no segmento que realmente sente a perda;
6. **Beachhead + Product-Led Growth**, para ganhar um caso de uso estreito via OSS e expandir bottom-up para equipes e empresas.

O GTM deve ser **open-source, product-led e evidence-led**:

- aquisição por problema técnico e conteúdo demonstrável;
- ativação em até cinco minutos;
- primeiro valor quando uma Story executa o agente real e produz evidência confiável;
- hábito quando Stories entram no ritual de mudança;
- expansão por colaboração, histórico, comparação, CI/CD, políticas e governança;
- monetização do trabalho coletivo e da assurance, nunca do contrato local básico.

## 2. Base factual, hipóteses e limites

Esta estratégia distingue três níveis para impedir que visão futura seja comunicada como capacidade atual.

### 2.1 Produto existente e validado no repositório

Na preparação da versão `0.1.0-alpha.0`, Ethogram é:

- open source, MIT e code-first;
- local e read-only;
- voltado a projetos TypeScript/Node em Node.js 20.9+;
- composto por `@ethogram/core` e `@ethogram/cli` como nomes públicos pretendidos;
- operado por `ethogram init`, `ethogram init --existing` e `ethogram dev`;
- baseado em Agent, Story, execution profile, `ObservedRun`, Evaluator e `EvaluationResult`;
- capaz de avaliar `tool-called` e `tool-not-called`;
- capaz de receber evidence produzida pela instrumentação Ethogram ou fatos verdict-free traduzidos de um framework externo;
- capaz de recarregar mudanças de código e invalidar evidência antiga;
- sem persistência: mantém apenas a evidência da execução corrente.

Fontes internas: [README](../README.md), [Release Readiness](./RELEASE-READINESS.md), [Alpha limitations](./limitations.md), [Execution evidence](./execution-evidence.md).

### 2.2 Direção estratégica, não promessa atual

O brief de marca define uma expansão plausível para:

- colaboração hospedada;
- histórico e comparação;
- execução e gates em CI/CD;
- políticas e governança;
- behavioral assurance empresarial.

Essa direção dá coerência à arquitetura de marca, mas não deve aparecer como funcionalidade disponível nem como roadmap com datas antes de validação. O próprio plano de release adia cloud, CI, history, Compare, Python, novos matchers, autenticação e billing para depois da alpha.

### 2.3 Hipóteses de mercado a validar

- Desenvolvedores percebem “behavioral regression” como problema distinto de output quality, tracing e unit testing.
- A Story é uma abstração fácil de aprender e mais memorável que “dataset example” ou “eval case”.
- O maior valor inicial está em agentes que tomam ações por ferramentas, não em chatbots puramente textuais.
- A diferença entre “o tool foi chamado” e “o tool não deveria ter sido chamado” já é valiosa o suficiente para gerar adoção inicial.
- O usuário aceitará escrever três superfícies finas — Agent, Story e execution profile — em troca de controle e independência de framework.
- A equipe pagará por coordenação, histórico, gates, políticas e auditabilidade depois que o contrato local se tornar parte do workflow.

## 3. A tese de geração de valor

### 3.1 Mudança do mercado

Software tradicional é majoritariamente validado pela relação entre input e output determinístico. Agentes adicionam um plano de comportamento: escolhem ferramentas, argumentos, ordem de ações, conhecimento, políticas e caminhos intermediários. O output pode parecer aceitável mesmo quando a trajetória foi insegura, cara ou incorreta.

Ao mesmo tempo, qualquer mudança em prompt, modelo, tool schema, código, política, base de conhecimento ou configuração pode alterar essa trajetória. O novo problema não é apenas “o agente respondeu bem?”; é:

> “O comportamento crítico continuou válido depois da mudança?”

As documentações atuais de LangSmith reconhecem três objetos distintos de avaliação de agentes — resposta final, passo isolado e trajetória — e observam que uma trajetória pode ter múltiplos caminhos aceitáveis. Isso valida o problema, mas também mostra que Ethogram precisa manter o foco em contratos comportamentais declarativos, não em correspondência rígida com uma única sequência. [LangSmith: application-specific evaluation approaches](https://docs.langchain.com/langsmith/evaluation-approaches)

### 3.2 A transformação prometida

**Antes:** comportamento crítico está espalhado em prompts, comentários, tickets, testes parciais e conhecimento tácito. Alterar o agente exige inspeção manual e fé.

**Depois:** o comportamento está declarado como código versionável, a execução real produz fatos inspecionáveis e cada mudança pode ser julgada contra as mesmas expectativas.

### 3.3 Valor funcional, emocional e social

| Dimensão | Valor entregue |
| --- | --- |
| Funcional | Detectar regressões de comportamento; preservar restrições críticas; inspecionar a trajetória; reproduzir cenários; tornar expectativas executáveis. |
| Econômica | Reduzir retrabalho, incidentes, revisão manual e risco de trocar modelo/prompt; acelerar decisões de release. |
| Emocional | Trocar ansiedade e dúvida por confiança baseada em evidência; reduzir medo de tocar no sistema. |
| Social | Permitir que o engenheiro defenda uma mudança com prova; tornar critérios legíveis entre engenharia, produto, segurança e compliance. |
| Organizacional | Criar memória institucional sobre “o que este agente deve fazer” e “o que ele nunca deve fazer”. |

### 3.4 Mecanismos proprietários de valor

Os atributos que devem permanecer verdadeiros para sustentar o posicionamento são:

1. **Story como contrato:** o objeto principal descreve comportamento esperado, não um resultado gravado.
2. **Separação epistêmica:** expectativa, observação e veredicto são objetos diferentes.
3. **Execução real:** o produto não fabrica trajetórias para satisfazer a Story.
4. **Evidência verdict-free:** fatos operacionais não chegam contaminados por PASS/FAIL.
5. **Code-first e versionável:** o contrato vive com o projeto e passa por review.
6. **Provider/framework independence:** a semântica comportamental não depende do fornecedor do modelo ou agente.
7. **Local-first:** adoção inicial sem enviar código ou evidência a um serviço externo.

Esses princípios não são apenas arquitetura. Eles são o proof model da marca.

## 4. Value Proposition Design — Canvas completo

O Value Proposition Canvas da Strategyzer separa o Customer Profile — jobs, pains e gains — do Value Map — produtos/serviços, pain relievers e gain creators. A Strategyzer recomenda construir um canvas por segmento e priorizar poucos elementos realmente importantes, em vez de misturar usuários e compradores ou tentar resolver tudo. [Canvas oficial](https://www.strategyzer.com/library/the-value-proposition-canvas), [características de uma proposta forte](https://www.strategyzer.com/value-proposition), [erros comuns](https://www.strategyzer.com/library/5-common-mistakes-to-avoid-when-using-the-value-proposition-canvas)

### 4.1 Segmento primário: agent engineer / AI application developer

#### Contexto de adoção

Tem um agente funcional, com tools ou ações, e precisa mudar prompt, modelo, tool schema, código, knowledge ou política sem introduzir um comportamento perigoso ou indesejado.

#### Jobs to be done

**Funcionais**

- declarar comportamentos que precisam permanecer verdadeiros;
- testar uma mudança contra cenários críticos;
- verificar tools chamadas e proibidas;
- entender o que ocorreu na execução real;
- reproduzir falhas e regressões;
- manter os testes próximos do código;
- revisar mudanças de comportamento em pull requests;
- adaptar o teste ao framework já usado, sem reescrever o agente.

**Emocionais**

- sentir segurança ao trocar modelo, prompt ou ferramenta;
- deixar de depender de inspeção manual e intuição;
- confiar que um PASS tem evidência legítima;
- reduzir a sensação de que o agente é uma caixa-preta.

**Sociais**

- demonstrar rigor técnico à equipe;
- justificar uma mudança com evidência reproduzível;
- ser percebido como alguém que entrega agentes confiáveis, não apenas demos.

#### Pains

1. Testes tradicionais validam funções, mas não capturam a decisão probabilística do agente.
2. O resultado final pode esconder uma trajetória incorreta ou uma ação proibida.
3. Evals genéricas exigem datasets, scorers e infraestrutura antes de responder uma pergunta simples de comportamento.
4. Tracing mostra o que aconteceu, mas não necessariamente se o comportamento violou uma expectativa versionada.
5. Dashboards cloud criam fricção, credenciais e preocupação com dados antes do primeiro valor.
6. Instrumentação pode exigir reescrever o agente ou casar com um framework.
7. LLM-as-a-judge acrescenta custo, latência e um segundo sistema probabilístico ao veredicto.
8. Regressões aparecem tarde, depois de merge, deploy ou feedback de usuário.
9. As regras críticas ficam implícitas em prompts, tickets e memória humana.
10. Uma ferramenta de eval pode fabricar confiança com mock, trace sintético ou score opaco.

#### Gains

1. Escrever uma Story em minutos e executá-la localmente.
2. Ver claramente GIVEN, WHEN, EXPECTATIONS, evidence e verdict.
3. Detectar mudança de comportamento antes de produção.
4. Revisar o contrato no Git como qualquer outro artefato de engenharia.
5. Manter liberdade para trocar modelos, frameworks e tools.
6. Começar com checks determinísticos e acrescentar sofisticação apenas quando necessário.
7. Reutilizar falhas reais como contratos de regressão.
8. Ter uma linguagem compartilhada entre engenharia e stakeholders.

#### Value Map

**Produtos e serviços**

- `@ethogram/core` para Agent, Story e execution profile;
- `@ethogram/cli` para init, discovery, execution e UI local;
- matchers determinísticos de comportamento;
- normalização de evidence externa;
- documentação e exemplos de integração.

**Pain relievers**

- Story torna explícito o comportamento hoje tácito;
- execução real reduz falsos positivos de mocks;
- separação entre expected/observed/verdict torna o resultado auditável;
- local-first elimina conta e upload para o primeiro uso;
- read-only mantém o código como source of truth;
- adapter boundary reduz lock-in;
- `tool-not-called` trata ações proibidas como first-class behavior.

**Gain creators**

- feedback visual imediato sobre o comportamento atual;
- contrato legível e revisável;
- base para gates de CI futuros;
- base para histórico, Compare e colaboração futuros;
- vocabulário próprio — Story, ObservedRun e EvaluationResult — que organiza o raciocínio da equipe.

#### Fit atual

| Job/pain prioritário | Cobertura atual | Lacuna |
| --- | --- | --- |
| Detectar se um tool crítico foi ou não chamado | Forte | Ampliar argumentos, ordem, cardinalidade e condições sem perder clareza. |
| Executar o agente real | Forte, com execution profile | Reduzir tempo e complexidade da integração. |
| Inspecionar evidência | Boa para execução corrente | Falta persistência, diff e export. |
| Provar não regressão em cada mudança | Parcial | Falta comando headless e CI. |
| Trabalhar em equipe | Fraca | Falta compartilhamento, histórico e permissões. |

**Conclusão:** há fit suficiente para testar product–user fit, mas ainda não para prometer o workflow completo de release assurance.

### 4.2 Segmento secundário: tech lead / engineering manager

#### Jobs

- estabelecer uma definição compartilhada de comportamento aceitável;
- reduzir regressões e incidentes sem virar gargalo de review;
- aprovar mudanças com evidência;
- padronizar qualidade entre agentes, equipes e fornecedores;
- saber quais comportamentos estão cobertos e quais não estão.

#### Pains

- cada desenvolvedor usa um método diferente de eval;
- reviews discutem prompts sem prova de comportamento;
- demos passam, produção falha;
- modelos mudam mais rápido que processos de QA;
- observabilidade detecta o incidente, mas não impede o release;
- custo de criar e manter harnesses internos cresce silenciosamente.

#### Gains desejados

- cobertura comportamental visível;
- diff entre baseline e candidate;
- gates reproduzíveis no CI;
- ownership, aprovações e trilha de auditoria;
- menor tempo para diagnosticar regressões;
- confiança para atualizar modelos e reduzir custo/latência.

#### Fit

O líder é champion e futuro comprador, mas Ethogram alpha ainda não entrega o pacote completo que ele compra. A mensagem para esse segmento deve ser “padronize contratos comportamentais no código agora”; colaboração e assurance são expansão futura.

### 4.3 Segmento futuro: AI platform, reliability, safety e governance

#### Jobs

- impor políticas comuns a múltiplos agentes;
- verificar ações críticas antes e depois de produção;
- manter evidência auditável de mudanças;
- conectar incidentes reais à suíte de regressão;
- demonstrar controle a risco, compliance e clientes empresariais.

#### Pains

- traces em diferentes vendors não compartilham semântica;
- políticas estão em documentos, não em contratos executáveis;
- avaliações probabilísticas são difíceis de auditar;
- ownership e exceções não estão claros;
- falta uma linha de evidência entre mudança, execução e aprovação.

#### Ganhos

- policy packs, controle de acesso, retenção, auditoria e relatórios;
- provider independence;
- coverage e assurance por comportamento crítico;
- integração com CI/CD e incident management.

#### Fit

É um segmento economicamente atraente, mas prematuro para o GTM inicial. Deve orientar arquitetura e discovery, não a homepage alpha.

## 5. Jobs to Be Done e o momento de adoção

JTBD define o job como o progresso que alguém busca em uma circunstância específica, incluindo forças funcionais, emocionais e sociais. A circunstância — não a persona abstrata — é a unidade causal de inovação. [Christensen Institute](https://www.christenseninstitute.org/theory/jobs-to-be-done/)

### 5.1 Job principal

> **Quando preciso mudar um agente que já executa ações importantes, ajude-me a transformar os comportamentos que não podem regredir em contratos executáveis, para que eu possa publicar a mudança com evidência e sem depender de inspeção manual.**

### 5.2 Jobs adjacentes

- Quando um incidente revela um caminho errado, ajude-me a convertê-lo em uma Story para que não volte a acontecer.
- Quando troco de modelo ou provider, ajude-me a provar que as regras críticas ainda valem.
- Quando reviso uma PR, mostre quais comportamentos mudaram e por quê.
- Quando uma área de risco pergunta “como sabemos?”, dê-me uma trilha de evidência que engenharia confia.

### 5.3 As quatro forças de adoção

| Força | Ethogram |
| --- | --- |
| Push da situação atual | regressão recente; medo de trocar modelo; review manual; suite interna frágil; ação proibida em produção. |
| Pull da nova solução | Story simples; local-first; evidence inspecionável; Git-native; vendor-neutral. |
| Anxiety da mudança | “vai exigir reescrever meu agente”; “é outra plataforma”; “matchers são simplistas”; “vou manter mais código”. |
| Habit da solução atual | testes ad hoc; notebooks; snapshots; tracing manual; planilhas; suites genéricas já adotadas; não testar. |

O GTM precisa maximizar push/pull e reduzir anxiety/habit com uma demonstração curta de “before/after”, integração com agente existente e uma explicação honesta dos limites.

## 6. Product–market fit: escolas relevantes e como combiná-las

PMF não é uma única métrica. Para Ethogram, cada escola responde a uma pergunta diferente.

### 6.1 Andreessen/Rachleff — existe pull de um mercado importante?

A definição clássica é estar em um bom mercado com um produto capaz de satisfazê-lo. Em enterprise, sinais fortes incluem usuários evangelistas, disposição a pagar e demanda maior que a capacidade de atendimento. [a16z: Product–User Fit Comes Before Product–Market Fit](https://a16z.com/product-user-fit-comes-before-product-market-fit/)

**Aplicação:** não interpretar stars ou downloads como PMF. Procurar equipes que espontaneamente adicionam Stories, pedem CI/history e trazem colegas para o workflow.

### 6.2 Product–User Fit — o usuário técnico chega a valor recorrente?

Antes de uma compra organizacional existe um usuário que precisa adotar o produto. Isso é particularmente importante em ferramentas bottom-up e especializadas.

**Aplicação:** o primeiro objetivo é fazer o agent engineer conseguir:

1. instalar;
2. integrar seu agente real;
3. escrever uma Story crítica;
4. observar um PASS ou FAIL legítimo;
5. mudar algo e rerodar;
6. manter a Story no repositório.

Sem essa repetição, cloud e enterprise apenas amplificariam uma proposta ainda não validada.

### 6.3 Sean Ellis/Superhuman — o produto é indispensável para o segmento certo?

O teste pergunta como o usuário se sentiria se não pudesse mais usar o produto; o benchmark convencional é 40% ou mais em “muito desapontado”. Ele mede dependência, não satisfação superficial. [CRV: Product–Market Fit Survey](https://www.crv.com/content/product-market-fit-survey)

**Aplicação correta em Ethogram:** pesquisar somente usuários que executaram ao menos três Stories reais em duas ou mais sessões ou mudanças de código. Segmentar respostas por:

- agente com tools vs. sem tools;
- solo vs. equipe;
- framework;
- risco do workflow;
- uso local ocasional vs. uso em release;
- origem de aquisição.

Perguntas complementares:

1. Que tipo de pessoa mais se beneficiaria de Ethogram?
2. Qual é o principal benefício que você recebe?
3. O que poderíamos melhorar?
4. Que alternativa você usaria se Ethogram desaparecesse?

### 6.4 Lean Startup — PMF como aprendizado validado

Lean Startup trata produto e negócio como hipóteses e usa ciclos rápidos de build–measure–learn para decidir entre perseverar e pivotar. Um MVP existe para maximizar aprendizado validado com o menor esforço. [Lean Enterprise Institute](https://www.lean.org/lexicon-terms/lean-startup/), [Eric Ries sobre MVP](https://leanstartup.co/resources/articles/what-is-an-mvp/)

**Aplicação:** cada item de roadmap deve declarar qual incerteza de mercado reduz. Não construir Compare, CI ou Cloud apenas porque competidores possuem essas features.

### 6.5 Jobs to Be Done — PMF como encaixe causal

**Aplicação:** recrutar usuários por eventos reais de mudança — modelo novo, incidente, nova tool, alteração de policy — e não apenas por cargo. A entrevista deve reconstruir a última ocasião em que tentaram evitar uma regressão.

### 6.6 Beachhead / Crossing the Chasm — dominar um caso completo

Uma ferramenta horizontal corre o risco de parecer incompleta para todos. Ethogram deve dominar primeiro um fluxo reconhecível:

> **Agente TypeScript/Node com tools, comportamento de aprovação/negação/escalation e necessidade de não regressão durante mudanças.**

Esse beachhead reúne alto risco comportamental, evidence observável e matchers iniciais adequados. Exemplos: refund, access approval, purchase approval, travel approval e repository operations.

### 6.7 Product-Led Growth — o produto como principal canal

PLG usa o próprio produto como motor de aquisição, conversão e expansão, com foco no usuário final. [OpenView](https://openviewpartners.com/product-led-growth/)

**Aplicação:** OSS local é o mecanismo de aquisição e confiança. O free product precisa resolver um job verdadeiro; o pago monetiza coordenação e escala.

### 6.8 Recomendações de combinação

```text
JTBD identifica o trigger e o progresso
        ↓
VPD escolhe jobs/pains/gains prioritários
        ↓
Lean Startup transforma a tese em experimentos
        ↓
Product–User Fit valida ativação e hábito individual
        ↓
Sean Ellis identifica o segmento indispensável
        ↓
Beachhead concentra mensagem e roadmap
        ↓
PLG escala adoção e revela o caminho enterprise
```

## 7. Segmentação, ICP e beachhead

### 7.1 ICP inicial recomendado

**Equipe:** 2–20 pessoas de produto/engenharia, com 1–5 desenvolvedores trabalhando diretamente em agentes.  
**Stack:** TypeScript/Node; agente próprio ou framework que expõe tool calls/evidence.  
**Maturidade:** além de demo; agente executa ações, integra APIs ou toma decisões operacionais.  
**Trigger:** mudança frequente de prompt/model/tool/policy ou incidente recente.  
**Risco:** uma tool incorreta, omitida ou indevida produz consequência perceptível.  
**Comportamento:** já criou testes ad hoc, analisa traces manualmente ou sente que unit tests não bastam.  
**Canal:** GitHub, comunidades de agent frameworks, X/LinkedIn técnico, Hacker News, Discords e newsletters de AI engineering.

### 7.2 Anti-ICP inicial

- usuário explorando prompts sem agente funcional;
- chatbot simples cujo único critério é qualidade textual;
- equipe Python-only antes de existir adapter Python;
- empresa que exige SaaS, SSO, RBAC, SLA, retenção e audit logs no primeiro contato;
- buyer buscando benchmark de modelos genéricos;
- equipe que quer apenas observabilidade de produção;
- organização que exige catálogo amplo de métricas prontas.

### 7.3 Buying committee futuro

| Papel | Interesse | Objeção | Mensagem |
| --- | --- | --- | --- |
| Agent engineer | feedback rápido e correto | integração e manutenção | “Declare uma Story e veja o comportamento real.” |
| Tech lead | padrão e review | mais uma ferramenta | “Contratos no Git, uma semântica comum, evidence inspecionável.” |
| VP Eng/CTO | velocidade com risco controlado | ROI e cobertura | “Mude modelos e agentes com gates sobre o que não pode quebrar.” |
| AI platform/reliability | uniformidade entre stacks | adapters e escala | “Um contrato comportamental independente de provider.” |
| Security/compliance | ações proibidas e trilha | assurance incompleta | “Políticas executáveis e evidence auditável” — apenas quando o produto entregar. |

## 8. Categoria e posicionamento

### 8.1 Categoria de entrada

**Descritor recomendado:**

> **Behavioral development and testing for AI agents.**

Em português:

> **Desenvolvimento e teste comportamental para agentes de IA.**

Essa formulação conecta Ethogram a um budget/workflow conhecido — desenvolvimento e testes — e introduz “behavioral” como diferenciação. Não exige criar uma categoria do zero.

### 8.2 Categoria de expansão

> **Behavioral reliability for agentic software.**

Use somente quando o produto atravessar local development, CI e produção. “Reliability” cria expectativa de sistema contínuo; antecipá-la na alpha seria overclaim.

### 8.3 Posicionamento no método de April Dunford

Posicionamento deve começar pelas alternativas competitivas, ligar atributos únicos a valor e escolher os clientes que mais se importam com esse valor. [April Dunford: positioning](https://www.aprildunford.com/category/positioning)

#### Alternativas competitivas reais

1. Não fazer nada e revisar manualmente.
2. Escrever unit/integration tests ad hoc.
3. Inspecionar traces em uma plataforma de observabilidade.
4. Usar suites genéricas de eval/LLM testing.
5. Construir um harness interno.
6. Usar um framework/vendor específico.

#### Atributos únicos

- Story como contrato comportamental versionável;
- expected, observed e verdict separados;
- execução do agente real;
- negative expectations (`tool-not-called`) como comportamento crítico;
- local-first, code-first e read-only;
- evidence externa verdict-free;
- independência conceitual de framework/model/provider.

#### Valor desses atributos

- mais confiança no veredicto;
- menos ambiguidade entre trace e regra;
- adoção no workflow existente;
- menor lock-in;
- possibilidade de review e regressão no Git;
- linguagem compartilhada sobre comportamento.

#### Best-fit customer

Agent engineer que altera frequentemente um agente com tools e precisa preservar regras de negócio ou segurança que podem ser expressas como ações exigidas/proibidas.

#### Market frame

Developer testing tool para agentes, não dashboard de AI quality.

### 8.4 Positioning statement

> Para desenvolvedores e equipes que constroem agentes capazes de agir, Ethogram é uma ferramenta open-source de desenvolvimento e teste comportamental que transforma comportamentos críticos em Stories versionáveis, executa o agente real e detecta regressões causadas por mudanças em prompts, modelos, tools, código, políticas ou conhecimento. Diferentemente de dashboards de eval, plataformas de observabilidade e harnesses ad hoc, Ethogram separa o que deveria acontecer, o que aconteceu e o veredicto em um workflow local, code-first e inspecionável.

### 8.5 One-liners por contexto

**Homepage**  
> Change your agent. Keep its critical behavior.

**GitHub**  
> Open-source behavioral testing for AI agents.

**CLI/README**  
> Define what should happen. Run the real agent. Catch what changed.

**Founder pitch**  
> Ethogram is the contract-testing layer for agent behavior.

**Enterprise futuro**  
> Behavioral assurance across every agent change.

### 8.6 Mensagens que não usar

- “complete AI evaluation platform”;
- “observability for all LLM applications”;
- “guaranteed safe agents”;
- “eliminate hallucinations”;
- “universal framework support”;
- “enterprise-grade governance” antes de controles reais;
- “test any agent in minutes” enquanto a integração exigir um profile manual.

## 9. Panorama competitivo e diferenciação

O mercado atual converge para algumas arquiteturas de produto:

| Arquétipo | Exemplos | Centro de gravidade | Risco para Ethogram | Resposta estratégica |
| --- | --- | --- | --- | --- |
| Observability + eval platform | LangSmith, Braintrust, Phoenix | traces, datasets, experiments, scores, dashboards | incorporarem trajectory evals e CI | não competir em breadth; possuir contrato comportamental e workflow Git-native |
| OSS eval/testing | Promptfoo, DeepEval | test cases, métricas, CLI/CI, red teaming | melhor distribuição OSS e catálogo amplo | Story mais específica, TypeScript-first, evidence semantics e agent behavior |
| Provider evals | OpenAI Evals e plataformas de modelo | benchmark, graders e otimização de modelos | conveniência para stack monovendor | provider independence e agente real do usuário |
| Harness interno | scripts, Jest/Pytest, snapshots | controle total e customização | “bom o suficiente” e custo marginal invisível | reduzir plumbing e criar linguagem/review padrão |
| Observação manual | traces, logs, replay | flexibilidade | hábito e zero adoção nova | provar tempo economizado e regressão encontrada |

Evidência de mercado:

- LangSmith estrutura evals em datasets, examples, experiments, online runs e evaluators, incluindo resposta final, passo e trajetória. [Evaluation concepts](https://docs.langchain.com/langsmith/evaluation-concepts)
- Braintrust combina traces, datasets, scorers, experiment snapshots e CI com comentários em PR. [Braintrust evaluations](https://www.braintrust.dev/docs/evaluate), [CI/CD](https://www.braintrust.dev/docs/evaluate/run-evaluations)
- Phoenix se define como observabilidade e avaliação open-source, com tracing via OpenTelemetry/OpenInference, datasets, experiments e prompt management. [Phoenix docs](https://arize.com/docs/phoenix)
- Promptfoo é um CLI/library open-source para eval e red teaming, com configuração declarativa e CI/CD. [Promptfoo intro](https://www.promptfoo.dev/docs/intro/)
- DeepEval se apresenta como framework open-source e local-first, com mais de 50 métricas, pytest, trajectories e expansão cloud via Confident AI. [DeepEval introduction](https://deepeval.com/docs/introduction)
- OpenAI Evals é um framework/registry para avaliar modelos e sistemas de LLM com datasets e eval classes. [OpenAI Evals](https://github.com/openai/evals)

### 9.1 O território que Ethogram pode possuir

Não é “mais métricas” nem “mais traces”. É:

> **The behavioral contract for every agent change.**

Para ser ownable, Ethogram precisa demonstrar três diferenças:

1. A Story começa pelo comportamento crítico, não pelo dataset.
2. A evidence é fato antes de ser score.
3. O mesmo contrato acompanha a mudança do laptop ao CI e, futuramente, à governança.

### 9.2 Moat possível

O código OSS sozinho não é moat. A defensibilidade pode surgir de:

- semântica estável e adotada de contratos comportamentais;
- corpus comunitário de patterns e Stories reutilizáveis;
- integrações profundas com frameworks e tool boundaries;
- histórico longitudinal de regressões e baselines;
- workflow de review/aprovação embutido no ciclo de desenvolvimento;
- policy packs e evidence graph organizacional;
- confiança da comunidade em não fabricar evidence nem prender o usuário.

## 10. Arquitetura de mensagens

### 10.1 Message house

**Tese**  
Your agents change. Their critical behaviors shouldn't.

**Promessa**  
Change your agent without unknowingly breaking the behaviors that matter.

**Categoria**  
Behavioral development and testing for AI agents.

**Como funciona**  
Define what should happen. See what did. Catch what changed.

**Pilares de prova**

1. **Define** — Stories tornam expectativas explícitas e versionáveis.
2. **Observe** — o agente real produz evidence, não uma simulação conveniente.
3. **Evaluate** — o veredicto é aplicado separadamente e pode ser inspecionado.
4. **Change** — prompts, modelos, tools e policies podem evoluir contra o mesmo contrato.

### 10.2 Narrativa de mercado

1. Agentes agora tomam ações, não apenas geram texto.
2. O comportamento muda quando qualquer parte da stack muda.
3. Output quality e tracing não bastam para preservar regras críticas.
4. Essas regras precisam existir como contratos executáveis e versionáveis.
5. Ethogram traz desenvolvimento orientado por comportamento para agentes.

### 10.3 Objeções e respostas

| Objeção | Resposta |
| --- | --- |
| “Já uso LangSmith/Braintrust/Phoenix.” | Ethogram pode começar como a camada local de contratos. A proposta não é substituir todo o stack de observabilidade. |
| “Posso fazer isso em Jest.” | Sim; Ethogram vale quando o plumbing de execução/evidence/evaluation se repete e a equipe precisa de uma linguagem comum. |
| “Só dois matchers?” | A alpha prova o núcleo sobre ações exigidas e proibidas. Não deve fingir cobertura universal. |
| “O caminho do agente pode variar.” | O contrato deve declarar invariantes críticas, não uma trajetória única quando múltiplos caminhos são válidos. |
| “Mais uma instrumentação.” | O execution profile é uma boundary fina; evidence externa pode ser traduzida sem reexecutar tools. |
| “Por que não LLM-as-a-judge?” | Checks determinísticos são apropriados para invariantes observáveis; judges probabilísticos podem ser adicionados depois como outro evaluator, sem contaminar a evidence. |
| “É seguro?” | Ethogram não garante segurança; permite tornar comportamentos críticos explícitos, observáveis e testáveis. |

## 11. Estratégia de Product Marketing

### 11.1 Objetivos

1. Criar e ensinar a linguagem “behavioral contract / behavioral regression”.
2. Fazer a Story ser entendida antes de explicar a arquitetura completa.
3. Atrair usuários que já sentem o problema, não uma audiência genérica de IA.
4. Converter uso individual em prática repetida de equipe.
5. Alimentar produto e roadmap com evidence de mercado.

### 11.2 Pilares editoriais

**A. Agent behavior ≠ final answer**  
Mostrar casos em que a resposta parece correta, mas a tool trajectory viola uma regra.

**B. Every agent change is a behavioral change**  
Comparar prompt/model/tool/policy changes e as regressões que podem causar.

**C. Expected ≠ observed ≠ verdict**  
Ensinar a separação que sustenta confiança.

**D. Behavioral contracts in Git**  
Tratar Stories como artefatos de engenharia revisáveis.

**E. From incident to Story**  
Transformar falhas reais em prevenção de regressão.

### 11.3 Conteúdo de alta intenção

- “How to regression test tool-calling agents”;
- “How to test that an AI agent did not call a tool”;
- “Agent trajectory testing without exact path matching”;
- “Prompt change regression checklist”;
- “LangGraph/LangChain/Vercel AI SDK agent behavioral tests” quando houver integração comprovada;
- “Jest vs eval frameworks vs behavioral contracts”;
- “From production incident to versioned Story”.

### 11.4 Ativos essenciais

- README com promessa, GIF curto e quickstart;
- exemplo “approval before action” que produz PASS e FAIL;
- integração completa com um agente existente;
- página “Why Ethogram?” com alternativas competitivas honestas;
- guia de conceitos expected/observed/verdict;
- página de limitations visível;
- changelog focado em jobs desbloqueados;
- templates de issue para integration friction e missing behavior matcher;
- futuro: migration guides e compatibility matrix baseados em testes reais.

## 12. Estratégia GTM

### 12.1 Modelo

**OSS-led + product-led + founder-led learning.**

- **OSS-led:** confiança, distribuição, extensibilidade e adoção local.
- **Product-led:** time-to-value baixo e crescimento pelo uso.
- **Founder-led:** entrevistas, onboarding assistido e fechamento dos primeiros design partners.
- **Community-informed:** patterns e integrações surgem de problemas reais.
- **Sales-assisted depois:** cloud/team/enterprise exigirão compra organizacional.

### 12.2 Funil recomendado

```text
Problema reconhecido
  “meu agente pode regredir”
        ↓
Descoberta
  conteúdo, GitHub, comunidade, recomendação
        ↓
Activation 1
  instala e roda o starter
        ↓
Activation 2 — valor real
  integra o próprio agente e cria a primeira Story
        ↓
Habit
  reroda após uma mudança e mantém a Story no repo
        ↓
Team pull
  compartilha evidence / pede CI, history ou review
        ↓
Commercial expansion
  cloud, collaboration, policy, governance
```

### 12.3 Definições operacionais

**Download não é ativação.**  
Ativado = completou uma execução do próprio agente, com pelo menos uma expectativa, e recebeu um resultado legítimo.

**PASS não é necessariamente valor.**  
O strongest proof pode ser um FAIL verdadeiro que o usuário não conhecia.

**Retenção não é abrir a UI.**  
Retido = voltou após uma mudança de código/model/prompt e rerodou Stories.

**Team adoption não é convite.**  
Team adoption = duas ou mais pessoas criam, revisam ou usam a evidence do mesmo conjunto de Stories.

### 12.4 Canais prioritários

1. **GitHub:** repository SEO, examples, issues, release notes, Discussions quando houver comunidade suficiente.
2. **Search:** queries de alta intenção sobre regression testing, tool calls e agent trajectories.
3. **Framework ecosystems:** exemplos e contribuições comprovadas para stacks usadas pelos ICPs.
4. **Technical social:** demos curtas com regressão real, não thought leadership genérico.
5. **Communities:** Discords/Slacks de AI engineering, TypeScript, LangChain/LangGraph, Vercel AI SDK e OpenAI Agents.
6. **Founder onboarding:** sessões de 30 minutos com usuários qualificados durante alpha.
7. **Design partners:** 5–10 equipes com agentes em workflows consequenciais.

### 12.5 Canais a adiar

- paid acquisition ampla;
- eventos enterprise caros;
- analyst relations;
- outbound para compliance sem produto empresarial;
- marketplace de integrações antes de provar duas ou três;
- lançamento massivo antes do package scope e onboarding estarem sólidos.

## 13. Estratégia de lançamento da OSS alpha

### 13.1 Pré-condições

- ownership do scope npm e repositório confirmado;
- migração atômica de naming concluída;
- packages publicados e instaláveis de um projeto limpo;
- quickstart de cinco minutos validado externamente;
- exemplo de existing agent funcional;
- limites documentados;
- telemetria somente se explícita, mínima e consentida; na ausência dela, entrevistas e opt-in feedback.

### 13.2 Sequência de lançamento

#### Fase 0 — private alpha, 5–10 usuários

Objetivo: provar integração e primeiro valor.

- recrutar por trigger real;
- acompanhar instalação ao vivo;
- registrar tempo, pontos de abandono e linguagem usada;
- exigir um agente próprio, não apenas o starter;
- produzir 3 estudos de caso internos: regressão detectada, regra crítica preservada, integração abandonada.

Gate: pelo menos 5 usuários executam seu agente; 3 voltam após uma mudança; 2 mantêm Stories no repo.

#### Fase 1 — public alpha, comunidade técnica pequena

Objetivo: provar aquisição orgânica e repetição.

- GitHub release e npm `next`;
- launch post centrado no problema;
- demo PASS → mudança → FAIL;
- conteúdo de alta intenção;
- office hours quinzenal;
- changelog e issue response rápidos.

Gate: coorte qualificada demonstra retenção por evento de mudança e surgem pedidos repetidos do mesmo capability.

#### Fase 2 — team workflow

Objetivo: provar pull por CI, history e collaboration.

- testar primeiro `ethogram run` headless/export local;
- observar uso real em CI antes de construir PR bot sofisticado;
- prototipar history/Compare com design partners;
- medir se a evidence vira objeto de review.

Gate: equipes dependem do resultado para merge/release e aceitam pagar por coordenação.

#### Fase 3 — hosted collaboration

Objetivo: monetizar o trabalho coletivo.

- shared runs/history;
- comparison e baselines;
- CI checks;
- projetos, members e permissions;
- retenção e export de evidence;
- integrações com Git providers.

#### Fase 4 — enterprise assurance

Objetivo: transformar prática bottom-up em sistema organizacional.

- SSO/SAML, RBAC e audit logs;
- policy packs e approvals;
- deployment controls e environments;
- data residency/retention;
- coverage e reports por comportamento crítico;
- support e SLA.

## 14. Produto, packaging e monetização

### 14.1 Princípio de packaging

> **O contrato é livre; a coordenação e a assurance são pagas.**

### 14.2 Possível arquitetura de oferta

| Camada | Oferta | Valor | Modelo |
| --- | --- | --- | --- |
| OSS | core, CLI, Stories, execution local, matchers essenciais | adoção e confiança individual | MIT, gratuito |
| Team Cloud | history, Compare, shared projects, CI, PR evidence, collaboration | coordenação e velocidade | por seat + usage ou workspace + usage |
| Enterprise | SSO, RBAC, audit, policy, retention, deployment, support | assurance e controle | contrato anual |

### 14.3 Princípios de preço a validar

- não cobrar antes do usuário obter valor local;
- não precificar apenas por execução se isso desencoraja testar;
- separar compute pass-through de valor de workflow;
- usar seat quando colaboração é o valor e usage quando escala operacional gera custo;
- evitar packaging de enterprise sem capabilities enterprise reais;
- entrevistar willingness-to-pay após evidence de dependência, não no primeiro uso.

### 14.4 Hipóteses de métrica de preço

1. **Workspace + active developers + run volume:** balanceia colaboração e custo.
2. **Projects/agents cobertos:** alinha com expansão, mas pode penalizar adoção.
3. **Critical Stories sob assurance:** forte conexão de valor, porém difícil de definir e auditar.

Recomendação inicial para pesquisa: workspace base com faixas de active developers e included runs; enterprise por contrato.

## 15. Roadmap orientado a valor e evidência

O roadmap não deve ser uma cópia da categoria. Deve fechar a sequência do job principal.

### 15.1 Agora — provar o contrato local

- publicar a alpha corretamente;
- reduzir time-to-first-own-story;
- melhorar erros e troubleshooting de execution profiles;
- preservar evidence integrity;
- documentar patterns de approval, prohibition e escalation;
- validar se `tool-called`/`tool-not-called` resolvem um job real.

### 15.2 Próximo — entrar no ritual de mudança

Prioridade sugerida, condicionada a discovery:

1. comando headless `ethogram run`;
2. output estruturado e exit codes para automação;
3. múltiplas Stories/suites;
4. matchers sobre argumentos, cardinalidade e ordem flexível;
5. snapshots/baselines locais e Compare;
6. persistência local/exportável;
7. integração CI mínima.

Essas capacidades fecham o job “mude e prove antes de merge”.

### 15.3 Depois — coordenar a equipe

- run history compartilhado;
- diff de comportamento;
- PR status/comments;
- ownership e review;
- gestão de baselines;
- ingestão de falhas de produção como candidate Stories;
- framework adapters comprovados;
- Python somente quando a demanda justificar a segunda comunidade.

### 15.4 Futuro — assurance organizacional

- policies reutilizáveis;
- evidence retention e audit trail;
- ambientes e promotion gates;
- coverage de critical behaviors;
- exceções, approvals e attestations;
- integrações com governance e incident systems.

### 15.5 Regra de priorização

Cada capability deve responder:

1. Qual job e trigger atende?
2. Qual pain remove?
3. Qual usuário observado pediu ou improvisou isso?
4. Qual comportamento mensurável mudará?
5. O capability fortalece a Story como unidade de valor?
6. A versão menor testa a hipótese sem criar plataforma prematura?

## 16. Métricas e sistema de PMF

### 16.1 North Star proposta

> **Weekly Critical Behaviors Verified (WCBV): número de expectativas comportamentais únicas executadas contra agentes reais por usuários qualificados em uma semana.**

Ela mede valor entregue melhor que runs brutos, que podem ser inflados por loops ou CI.

### 16.2 Métricas de produto

| Etapa | Métrica principal | Guardrail |
| --- | --- | --- |
| Acquisition | visitantes qualificados → install | origem e ICP fit |
| Starter activation | install → starter PASS | tempo e erros |
| Real activation | install → first own-agent evidence | % que usa agente próprio |
| Aha | primeira regressão ou regra validada | evidence legítima, não mock |
| Habit | semanas com rerun após mudança | número de Stories mantidas |
| Team | repos com 2+ contribuidores de Story | shared review events |
| Expansion | uso de CI/history/Compare | dependência de workflow |
| Revenue | activated teams → paid | retention e gross margin |

### 16.3 Métricas de integridade

- taxa de execução sem evidence válida;
- taxa de evidence stale rejeitada;
- falsos PASS/FAIL confirmados;
- tempo para diagnosticar um resultado;
- percentagem de Stories que expressa invariantes em vez de paths excessivamente rígidos;
- regressões reais encontradas antes de produção.

### 16.4 PMF scorecard

Não declarar PMF com uma métrica isolada. Exigir convergência de:

- 40%+ “muito desapontado” entre usuários qualificados;
- retenção por pelo menos quatro eventos de mudança;
- crescimento orgânico por recomendação ou repo sharing;
- Stories adicionadas sem acompanhamento do fundador;
- pedidos repetidos por team workflow;
- disposição a pagar demonstrada, não hipotética;
- tempo de suporte por ativação em queda;
- casos em que Ethogram mudou uma decisão de merge/release.

## 17. Plano de discovery e experimentação

### 17.1 Perguntas de maior risco

1. O problema é frequente e urgente ou apenas intelectualmente interessante?
2. “Behavioral contract” é compreendido sem educação longa?
3. Story é a abstração certa para o usuário?
4. O usuário começa por comportamento proibido, obrigatório ou resultado final?
5. Que trigger gera instalação imediata?
6. Quanto integration work é aceitável?
7. O produto complementa ou substitui suites de eval/observability existentes?
8. Qual capability transforma uso local em workflow de equipe?

### 17.2 Entrevista JTBD

Evitar “você usaria?”. Reconstruir um evento real:

- Conte sobre a última mudança em um agente que causou medo de regressão.
- O que mudou e por que naquele momento?
- Como você testou?
- O que não conseguiu verificar?
- Quem precisou confiar no resultado?
- Qual ferramenta ou workaround usou?
- Quanto tempo levou?
- O que aconteceu depois?
- Quando percebeu que a solução atual não bastava?
- O que faria você trocar de abordagem?

### 17.3 Experimentos iniciais

| Hipótese | Experimento | Sinal de sucesso |
| --- | --- | --- |
| “No forbidden tool call” é um wedge forte | demo + onboarding com approval story | usuários adaptam o pattern ao próprio agente |
| local-first reduz anxiety | comparar onboarding sem conta vs. convite cloud conceitual | maior conclusão e confiança declarada |
| Story é memorável | teste de mensagem após 48h | usuário explica corretamente sem prompt |
| headless run é o próximo capability | concierge script com design partners | uso repetido em PR/CI antes de UI completa |
| equipe paga por evidence compartilhada | prototype de history/Compare | compromisso com piloto pago ou LOI específica |

### 17.4 Repositório de evidence de mercado

Manter uma tabela com:

- observação/quote curta;
- segmento e contexto;
- job/trigger;
- alternativa atual;
- severidade/frequência;
- feature request subjacente;
- hipótese afetada;
- decisão tomada;
- confidence level.

Não transformar um pedido isolado em roadmap.

## 18. Plano 30/60/90/180 dias

### 0–30 dias — preparar verdade e linguagem

- concluir release blockers técnicos e naming;
- instrumentar ou registrar manualmente o funil de ativação;
- criar demo de regressão real;
- recrutar 5–10 private alpha users por trigger;
- executar entrevistas JTBD;
- testar três one-liners;
- medir time-to-first-own-story.

### 31–60 dias — provar product–user fit inicial

- corrigir onboarding a partir de sessões reais;
- publicar patterns de Story;
- identificar o segmento mais retido;
- registrar regressões detectadas;
- criar integração pública apenas para o framework mais observado;
- começar survey PMF apenas com usuários qualificados.

### 61–90 dias — public alpha controlada

- publicar packages/release;
- distribuir conteúdo de alta intenção;
- operar office hours;
- medir coortes por trigger e framework;
- decidir entre aprofundar matchers, headless run ou integração com base em evidence;
- conquistar 3 champions que recomendam espontaneamente.

### 91–180 dias — testar team pull

- prototipar headless/CI com design partners;
- validar history/Compare antes de cloud completa;
- testar willingness-to-pay;
- definir packaging provisório;
- produzir 2–3 casos públicos com métricas reais;
- decidir se há base para hosted collaboration ou se o produto precisa aprofundar o wedge local.

## 19. Riscos estratégicos e mitigação

| Risco | Consequência | Mitigação |
| --- | --- | --- |
| Categoria “evals” absorve a diferença | Ethogram parece feature | possuir linguagem de contracts e evidence semantics; demonstrar integração complementar |
| Matchers iniciais são estreitos demais | baixo valor depois da demo | focar ICP de tools; expandir por invariantes observados, não catálogo genérico |
| Integration profile é fricção | abandono antes do valor | templates, adapters comprovados, erros excelentes e concierge alpha |
| Story vira trajectory snapshot rígido | falsos FAIL e manutenção alta | ensinar invariantes e múltiplos caminhos válidos |
| OSS gera interesse sem uso | vanity metrics | medir own-agent activation e rerun, não stars |
| Cloud prematura | custo e distração | exigir team pull e willingness-to-pay antes |
| Overclaim de safety/governance | perda de confiança | linguagem precisa e limitations visíveis |
| Competidor adiciona “behavior contracts” | diferenciação superficial | comunidade, workflow, semantics, integrations e trust como sistema |
| Scope/package/name indisponível | lançamento incoerente | resolver ownership antes de promoção pública |

## 20. Decisões recomendadas

1. **Escolher o beachhead:** agentes TypeScript/Node com tools e regras críticas de ação/inação.
2. **Possuir a unidade de valor:** Story como behavioral contract; não criar abstração intermediária.
3. **Posicionar como developer testing:** usar “behavioral development and testing for AI agents”.
4. **Comunicar uma transformação:** “change your agent without breaking critical behavior”.
5. **Manter OSS local completo:** monetizar colaboração, history, CI e assurance.
6. **Validar product–user fit antes de cloud:** first own-agent evidence e rerun são gates.
7. **Priorizar o workflow de mudança:** `ethogram run`, output estruturado, matchers de invariantes e Compare têm maior coerência que dashboards amplos.
8. **Adotar evidence-led GTM:** cada claim público precisa de capability ou caso real.
9. **Não declarar PMF cedo:** exigir retenção por evento, indispensabilidade segmentada e disposição a pagar.
10. **Tratar brand promise como compromisso arquitetural:** expected, observed e verdict continuam separados em todas as expansões.

## 21. Mensagem final de estratégia

Ethogram tem uma oportunidade real se evitar a tentação de competir pela amplitude da categoria de evals. Seu valor nasce de uma ideia mais nítida: agentes são sistemas comportamentais; mudanças de software alteram esse comportamento; regras críticas precisam sair do conhecimento tácito e entrar em contratos executáveis.

O produto deve conquistar primeiro o momento em que um desenvolvedor pergunta “posso fazer esta mudança sem quebrar algo importante?”. A resposta de Ethogram não é uma nota opaca nem um dashboard genérico. É uma Story versionada, uma execução real, evidence inspecionável e um veredicto cuja origem é clara.

Se esse ritual se tornar indispensável no laptop, ele pode subir naturalmente para a PR, o time e a organização. Essa é a sequência de valor e também a sequência de GTM:

> **Contract locally. Verify every change. Assure behavior at scale.**

---

## Referências principais

### Estratégia e PMF

- Strategyzer — [The Value Proposition Canvas](https://www.strategyzer.com/library/the-value-proposition-canvas)
- Strategyzer — [Value proposition: win customers & drive business growth](https://www.strategyzer.com/value-proposition)
- Strategyzer — [Common Value Proposition Canvas mistakes](https://www.strategyzer.com/library/5-common-mistakes-to-avoid-when-using-the-value-proposition-canvas)
- Christensen Institute — [Jobs to Be Done Theory](https://www.christenseninstitute.org/theory/jobs-to-be-done/)
- a16z — [Product–User Fit Comes Before Product–Market Fit](https://a16z.com/product-user-fit-comes-before-product-market-fit/)
- Lean Enterprise Institute — [Lean Startup](https://www.lean.org/lexicon-terms/lean-startup/)
- Lean Startup Co. — [What Is an MVP?](https://leanstartup.co/resources/articles/what-is-an-mvp/)
- CRV — [Product–Market Fit Survey](https://www.crv.com/content/product-market-fit-survey)
- OpenView — [Product-Led Growth](https://openviewpartners.com/product-led-growth/)
- April Dunford — [Positioning](https://www.aprildunford.com/category/positioning)

### Mercado e competição

- LangSmith — [Evaluation concepts](https://docs.langchain.com/langsmith/evaluation-concepts)
- LangSmith — [Agent evaluation approaches](https://docs.langchain.com/langsmith/evaluation-approaches)
- Braintrust — [Evaluate systematically](https://www.braintrust.dev/docs/evaluate)
- Braintrust — [Create experiments and run in CI/CD](https://www.braintrust.dev/docs/evaluate/run-evaluations)
- Arize Phoenix — [AI Observability and Evaluation](https://arize.com/docs/phoenix)
- Promptfoo — [Introduction](https://www.promptfoo.dev/docs/intro/)
- DeepEval — [Introduction](https://deepeval.com/docs/introduction)
- OpenAI — [OpenAI Evals](https://github.com/openai/evals)

### Produto Ethogram

- [Ethogram README](../README.md)
- [Release Readiness](./RELEASE-READINESS.md)
- [Alpha limitations](./limitations.md)
- [Existing agent integration](./existing-agent.md)
- [Framework-owned execution evidence](./execution-evidence.md)
