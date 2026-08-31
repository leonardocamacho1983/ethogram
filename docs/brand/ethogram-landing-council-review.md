# Conselho de revisão — Ethogram Landing

Data: 30 de agosto de 2026  
Superfície auditada: `/landing`  
Escopo: UX, UI, direção de arte, ilustração, copy, posicionamento, conversão, funil, SEO e GEO.

## Veredito executivo

**A página está forte como protótipo visual e ainda não está pronta como página pública de aquisição.**

Ela finalmente parece Ethogram: a marca oficial está presente, a gramática dos Labs 03 e 04 é reconhecível, a composição é autoral e a separação entre expected, observed e verdict tem força proprietária. O problema principal não é estético. É a distância entre a promessa apresentada, a prova simulada, a capacidade real da alpha e a ação que o visitante consegue executar.

Hoje a página vende order matching, comparação, runner, CI, pull request, histórico e telemetria que não existem. Para uma ferramenta cujo produto é confiança, esse overclaim é um bloqueador.

## O que já funciona

- Identidade visual distinta, consistente e memorável.
- Lockup oficial usado corretamente.
- Tipografia, grid, linhas, superfícies e estados coerentes com o Design System.
- “A Story is the contract.” é uma formulação simples e proprietária.
- “Expected is not observed. Observed is not the verdict.” é um princípio técnico forte.
- A demonstração comunica um mecanismo, não apenas uma lista de features.
- Desktop e mobile receberam composições diferentes.
- Navegação mobile, tabs, estado de execução, evidence disclosure e feedback de cópia são interativos.
- Movimento tipográfico mantém a largura da frase e respeita reduced motion.

## Teste de compreensão em cinco segundos

O visitante entende que agentes mudam e que Ethogram tenta detectar comportamento quebrado. Ele ainda não entende com precisão:

- que a ferramenta é para agentes TypeScript/Node;
- que é local, code-first e read-only;
- que a alpha verifica apenas `tool-called` e `tool-not-called`;
- por que isso é diferente de trace, unit test ou output eval;
- se já pode instalar;
- se o próximo passo é abrir a UI, instalar, ler docs ou entrar na alpha.

O H1 cinético é visualmente bom, mas semanticamente errado. Frases como “Their critical model shouldn’t” e “Their critical code shouldn’t” dizem que aquilo que naturalmente muda não deveria mudar. A tese correta é: **o agente pode mudar; o comportamento crítico deve continuar válido**.

## P0 — bloqueadores

| Problema | Por que importa | Correção recomendada |
| --- | --- | --- |
| Claims de order/sequence | A alpha não possui matcher de ordem | Demonstrar `tool-called` e `tool-not-called` reais |
| `npx ethogram run` e `ethogram check` | Os comandos apresentados não correspondem ao fluxo atual | Mostrar `npx ethogram dev` e a execução real suportada |
| CI, exit code e pull request | Apresentam roadmap como funcionalidade existente | Remover ou marcar explicitamente como visão futura fora da prova principal |
| IDs, commits, versões e tempos fictícios | Parecem evidência autêntica e simulam maturidade | Usar fixture reproduzível com proveniência ou remover esses detalhes |
| CTA “Open Ethogram” | Leva à interface interna e comunica produto pronto | Usar `Join the alpha`, `Read the alpha scope` ou destino público realmente acessível |
| Comando copiável | Resolvido: os pacotes foram publicados e o fluxo passou no smoke test do registro | Exibir apenas o comando validado para a alpha atual |
| GitHub e “OPEN SOURCE · MIT” | Resolvido: source público e licença MIT disponíveis | Manter os destinos públicos consistentes com a release |
| Homepage em `/landing` | Divide a entidade pública da aplicação em `/` | Transformar `/` na entity home e isolar a UI local como `/app`, `/lab` ou implantação separada/noindex |

## P1 — melhora estrutural

### 1. Reescrever o hero

Proposta factual:

> **BEHAVIORAL TESTING FOR TYPESCRIPT AI AGENTS**
>
> # Change your agent without breaking its critical behavior.
>
> Ethogram runs your real agent locally and checks whether required tools were called — and forbidden tools were not. Stories live as code in your repository.
>
> **Join the alpha** · Inspect a real Story
>
> Local · code-first · read-only · current-run evidence

Alternativa mais direta para seção de problema:

> Verify what your agent does — not only what it says.

### 2. Trocar pseudo-prova por prova real

A prova acima da dobra seguinte deve usar um exemplo real e curto:

```text
MUST      check_access_policy
MUST NOT  grant_admin_access
MUST      request_access_approval

OBSERVED — CURRENT RUN
check_access_policy
grant_admin_access

EVALUATION RESULT
FAIL · grant_admin_access was called but must not be
```

Ao lado, mostrar o trecho TypeScript verdadeiro com os matchers da alpha. Para developer tools, código é evidência, não ornamento.

### 3. Reduzir repetição

A mesma comparação aparece no hero e na seção 04; a mesma falha reaparece nas seções 05 e 06. Isso alonga a página sem criar novas razões para acreditar. Cada dobra deve ter uma função exclusiva.

### 4. Explicitar limites

Adicionar um bloco “Narrow by design. Useful today.” com:

- local execution;
- read-only UI;
- current-run evidence;
- TypeScript/Node;
- `tool-called` e `tool-not-called`;
- sem cloud, Python, CI, history, Compare ou PR comments na alpha atual.

Para uma ferramenta de confiança, precisão radical converte melhor que aparência de completude.

## Story arc recomendado

1. **Valor:** Change your agent without breaking its critical behavior.
2. **Ponto cego:** uma resposta plausível ainda pode executar uma ação proibida.
3. **Mecanismo:** uma Story declara o que deve e não deve acontecer.
4. **Funcionamento atual:** define a Story → executa em `ethogram dev` → inspeciona evidence e evaluation result.
5. **Prova:** fixture real de `tool-called` e `tool-not-called`.
6. **Posicionamento:** unit tests, output evals, traces e Ethogram respondem perguntas diferentes.
7. **Escopo e objeções:** capacidades e limitações explícitas.
8. **Próximo passo:** entrar na alpha ou seguir o quickstart quando publicável.

## Direção de arte e assets

### O que manter

- Carbon, ivory e cores de estado restritas.
- Archivo para afirmações e JetBrains Mono para evidência.
- Composição assimétrica, cantos retos, contornos e ausência de sombra.
- Marca como assinatura, não como textura decorativa.
- Motion mecânico e curto.

### O que melhorar

- A primeira dobra em desktop não mostra lead nem CTA em 1024 × 768; a prova ocupa a viewport antes de existir um próximo passo claro.
- A tabela do hero tem texto pequeno e truncado. `receive_r…` e `issue_ref…` retiram exatamente a precisão que a prova deveria demonstrar.
- O ritmo de todas as seções é excessivamente uniforme: título grande, linha, grid e painel. A página tem coerência, mas pouca modulação dramática.
- O mobile cria uma boa narrativa própria, porém o dock fixo cobre parte do conteúdo visível e oferece duas ações ainda inválidas.
- O menu aberto ocupa quase toda a primeira dobra e não apresenta botão/ícone de fechamento inequívoco além do próprio “index”.

### Assets novos recomendados

1. **Contract card real:** Story TypeScript condensada em `MUST`/`MUST NOT`.
2. **Evidence ledger:** sequência factual de tool calls, sem alegar matcher de ordem.
3. **Evaluation split:** duas micro-histórias PASS/FAIL baseadas nos matchers existentes.
4. **Entity diagram:** Agent → Story → Run → Evidence → EvaluationResult, usando linhas e o aperture mark.
5. **Scope strip:** capacidades atuais e limitações, com linguagem de especificação.
6. **Reproduction card:** fixture, comando, versão, ambiente, source e data da verificação.

Como extensão dos Labs: TP08 pode funcionar como divisor editorial, L03 como cursor de execução e os profiles pass/fail como dado. TP05 só deve aparecer com métricas reais; TP06 deve continuar fora conforme a própria decisão do Lab.

Evitar fotografia genérica, ilustração 3D e imagens de “IA”. O produto já possui matéria visual própria: contrato, evento, diferença, evidência e verdict.

## UI, UX e acessibilidade

### Riscos observáveis

- Texto `faint` usa 38% de ivory sobre carbon e aparece em tamanhos de 9–10,5 px; o contraste estimado é cerca de 3,33:1, abaixo de 4,5:1 para texto normal.
- Links da navegação desktop têm altura mínima de 36 px, abaixo do alvo confortável de 44 px.
- A mudança automática do H1 é escondida da árvore acessível, o que evita anúncio repetitivo; porém o texto semântico inicial não contém a definição completa do produto.
- Os controles segmented são um `role=group`, mas não expressam semanticamente seleção como tabs ou botões pressionados.
- A página mantém versões desktop e mobile da comparação no DOM, duplicando conteúdo e controles para tecnologia assistiva e busca.
- O componente inteiro é client-side. O texto chega no HTML, mas há hidratação desnecessária de conteúdo estático.
- A landing importa o CSS completo do Lab 04; extrair tokens e primitives compartilhados reduz acoplamento e peso sem alterar a linguagem visual.
- Dois botões da evidence list aparentam expansão, mas não executam ação; isso cria affordance falsa.
- Não há teste completo de teclado, screen reader, zoom 200%, contraste calculado ou Core Web Vitals nesta revisão.

### Correções

- Elevar contraste e/ou tamanho dos metadados importantes.
- Usar tabs com `aria-selected`/`aria-controls` ou botões com `aria-pressed`.
- Manter uma única estrutura semântica de comparação e adaptar sua apresentação com CSS.
- Separar conteúdo estático em Server Components; deixar menu, tabs, copy e demo como ilhas.
- Remover affordances sem ação.
- Garantir que o dock mobile não cubra conteúdo focado e respeite safe-area.

## Conversão e funil

### Funil recomendado

```text
entity home
→ caso de uso ou conceito
→ exemplo reproduzível
→ quickstart
→ alpha/instalação
→ primeira Story executada
```

Enquanto a ativação no CLI não estiver conectada de maneira opt-in, medir:

- `click_join_alpha`;
- `click_quickstart`;
- `view_example`;
- `view_evidence`;
- `view_limitations`;
- `click_github`;
- futuramente, `copy_install_command` e `click_npm`.

Parâmetros: `page_path`, `cta_surface`, `example_id`, `doc_id`, `source_category` e `referrer_host`.

## Revisão do relatório SEO/GEO

O relatório fornecido acerta a direção de entity home, documentação ativadora e evidência técnica. Duas correções são necessárias:

1. A landing já entrega seu texto no HTML. O problema não é invisibilidade para crawlers; é a hidratação integral e o DOM duplicado desktop/mobile.
2. As keywords são hipóteses. Sem GSC, pesquisa de demanda ou dados de concorrência, não se deve afirmar que uma página “captura demanda existente”.

### Arquitetura inicial enxuta

```text
/
├── /ai-agent-testing
├── /behavioral-contracts
├── /docs
│   ├── /quickstart
│   ├── /concepts/stories
│   ├── /concepts/execution-evidence
│   ├── /guides/test-agent-tool-calls
│   ├── /guides/test-forbidden-agent-actions
│   └── /limitations
├── /examples/access-request-agent
├── /evidence
│   ├── /tool-called
│   ├── /tool-not-called
│   └── /external-agent
└── /about/ethogram
```

Adiar `/ai-agent-regression-testing` e páginas comparativas até existir capacidade e evidência suficientes. Muitas páginas próximas agora criariam risco de conteúdo fino e canibalização.

### Entity definition

> Ethogram is a local, code-first behavioral testing tool for TypeScript and Node.js AI agents.

> It runs your agent through a consumer-owned execution profile and checks whether required tools were called — or forbidden tools were not called.

### Metadata sugerida após publicação

```text
Title: Ethogram — Behavioral Testing for TypeScript AI Agents
Description: Local, code-first behavioral testing for TypeScript and Node.js AI agents. Run the real agent and verify required or forbidden tool calls.
```

### Fundação técnica

- confirmar domínio e `metadataBase`;
- mover a entity home para `/`;
- implementar canonical, sitemap, robots e Open Graph;
- usar `WebSite` e, apenas com fatos públicos verificáveis, `SoftwareApplication`;
- usar `TechArticle`, `BreadcrumbList` e `SoftwareSourceCode` nas rotas adequadas;
- criar links diretos para Quickstart, Limitations, Evidence e source;
- deixar `llms.txt` para depois da fundação HTML.

### Evidência citável para GEO

Cada claim pública deve ter uma página HTML canônica com:

```text
Claim
Method
Fixture
Command
Observed evidence
Evaluator result
Reproduce it
Limitations
Version / commit / reviewed date
```

Os primeiros ativos devem ser os dois matchers reais e uma integração externa verificável. Benchmark só depois de metodologia, corpus e repetibilidade.

## Backlog priorizado

### P0 — antes de aquisição pública

1. Congelar uma matriz de claims baseada na alpha real.
2. Remover order, Compare, runner, CI, PR e telemetria fictícia.
3. Definir CTA e destino realmente disponíveis.
4. Publicar source/pacote ou retirar instalação e open-source verificável.
5. Confirmar domínio canônico.
6. Substituir o hero proof por `tool-called`/`tool-not-called` reproduzível.

### P1 — primeira entity home publicável

1. Reescrever hero e barra de escopo da alpha.
2. Reduzir a landing para oito dobras com papéis distintos.
3. Publicar Quickstart, Limitations, um exemplo e duas páginas de evidence.
4. Transformar conteúdo estático em Server Components.
5. Corrigir contraste, semântica de tabs e targets.
6. Implementar metadata, canonical, sitemap, robots, Open Graph e eventos.

### P2 — autoridade

1. Taxonomia de falhas baseada em evidência.
2. Changelog indexável.
3. Página conceitual de behavioral contracts.
4. Comparações apenas quando úteis e verificáveis.
5. Estudos reproduzíveis e outreach técnico.
6. Monitoramento GEO com conjunto fixo de perguntas, URLs citadas e precisão das claims.

## Passos auditados

| Passo | Estado | Observação |
| --- | --- | --- |
| 01 · Hero desktop | Atenção | Marca forte; definição, CTA e prova real ainda fracos |
| 02 · Fluxo pronto | Bloqueado por claim | Boa composição; comando e quatro etapas não representam a alpha |
| 03 · Resultado FAIL | Bloqueado por claim | Estado é claro, mas demonstra matcher inexistente |
| 04 · Conversão final | Bloqueado | CTA/comando não estão disponíveis publicamente |
| 05 · Hero mobile | Atenção | Composição própria funciona; dock oferece ações inadequadas |
| 06 · Comparação mobile | Atenção | Boa legibilidade estrutural; conteúdo duplicado e prova incorreta |
| 07 · Menu mobile | Bom com ajustes | Navegação abre e recebe foco; falta fechamento mais explícito |

## Evidências capturadas

- `audit/landing-2026-08-30/01-desktop-hero.png`
- `audit/landing-2026-08-30/02-desktop-run-ready.png`
- `audit/landing-2026-08-30/03-desktop-run-fail.png`
- `audit/landing-2026-08-30/04-desktop-conversion.png`
- `audit/landing-2026-08-30/05-mobile-hero.png`
- `audit/landing-2026-08-30/06-mobile-comparison.png`
- `audit/landing-2026-08-30/07-mobile-menu.png`

## Decisão do conselho

**Aprovar a direção visual. Reprovar a publicação atual.**

O próximo ciclo deve preservar a linguagem dos Labs e reconstruir a narrativa sobre verdade operacional: categoria clara, matcher real, evidence real, limitações explícitas e CTA disponível. A Ethogram não precisa parecer maior. Precisa parecer precisa.
