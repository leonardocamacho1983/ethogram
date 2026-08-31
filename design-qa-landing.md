# Design QA — Ethogram Landing

## Resultado final

**final result: passed.** A rota `/landing` aplica a linguagem visual consolidada nos Labs 03 e 04, usa apenas claims compatíveis com a alpha e não altera a interface existente em `/`.

## Referência e intenção

- Referência principal: `docs/brand/ethogram-lab-04/screenshots/react-lab-04-handoff-top.jpg`.
- Objetivo: transformar o sistema visual experimental em uma narrativa de produto compreensível em poucos segundos.
- Desvio intencional: a página não replica o conteúdo do Lab; reutiliza sua gramática para explicar o produto.

## Ledger de correspondência

| Elemento | Referência | Implementação | Estado |
| --- | --- | --- | --- |
| Marca | lockup oficial em marfim | `lockup-horizontal.svg`, sem redesenho tipográfico | OK |
| Paleta | carbon, ivory, moss e coral de estado | tokens canônicos; moss/coral apenas em status e foco | OK |
| Tipografia | Archivo + JetBrains Mono | hierarquia expressiva + metadados monoespaçados | OK |
| Superfícies | contorno fino, canto reto, sem sombra | painéis, controles e CTAs seguem a regra | OK |
| Movimento | rápido, mecânico, sem elasticidade | palavra cinética com largura estável e suporte a reduced motion | OK |
| Dados | contrato, evidência e estado | Story/evidence/result com `tool-called` e `tool-not-called` reais | OK |
| Desktop | composição editorial assimétrica | narrativa e demonstração coexistem acima da dobra | OK |
| Mobile | composição própria | sequência vertical, índice compacto e dock de ação | OK |

## Verificações executadas

- TypeScript: aprovado.
- Build de produção: aprovado.
- Navegação em `/landing`: aprovada.
- Console do navegador: sem erros ou avisos.
- Walkthrough do starter: estados running e PASS verificados.
- Menu mobile: abertura e estado acessível verificados.
- Comando de instalação: cópia e feedback verificados.
- Comparação visual: desktop e mobile revisados contra o Lab 04.
- Claims removidos: order matcher, Compare, `ethogram run`, CI, PR e telemetria fictícia.
- Metadata e `SoftwareApplication` JSON-LD usam apenas capacidades visíveis na página.
- Controle mobile de expected/observed/result expõe seleção com `aria-pressed`.

## Observação técnica

O build mantém um aviso preexistente em `external-project-loader.server.ts` sobre dependência dinâmica. Não foi introduzido pela landing e não bloqueia a rota.
