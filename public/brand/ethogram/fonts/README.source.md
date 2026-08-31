# Fontes

Três famílias, todas com licença SIL Open Font License 1.1 — livres para uso comercial,
web e produto, inclusive redistribuídas dentro do seu bundle. A licença de cada uma está
na respectiva pasta e deve viajar com os arquivos.

| família | papel | arquivos |
| --- | --- | --- |
| **Archivo** (Omnibus-Type) | afirmação: títulos, prosa, UI | variável `.ttf` (658 KB, peso + largura) e woff2 estáticos 400/500/600 (~52 KB cada) |
| **JetBrains Mono** | evidência: código, log, número, rótulo em caps | variável `.woff2` (114 KB, pesos 100–800) e estáticos 400/500 |
| **Instrument Serif** | só capa e ensaio | woff2 regular e itálico (~28 KB cada) |

## Uso

```html
<link rel="stylesheet" href="/fonts.css">
```

`fonts.css` declara os `@font-face` e as variáveis `--eg-sans`, `--eg-mono`, `--eg-serif`.

## Qual variante servir

Para web, o par mais leve é **Archivo estático 400/500/600 em woff2** (156 KB nos três) mais
**JetBrains Mono variável** (114 KB). O Archivo variável só compensa se você usar largura
(`font-stretch`) ou mais de quatro pesos — ele vem em `.ttf` porque o repositório oficial não
publica woff2 variável; comprima para woff2 antes de produção se for por esse caminho.

Subsetting: a marca comunica em inglês, então `unicode-range` latin básico corta bem mais da
metade de cada arquivo. Vale fazer no build.

## Pesos permitidos

Archivo 400, 500 e 600. Não usar 700 — o desenho fecha e a contraforma some nos títulos grandes.
Ênfase é peso 600 ou troca para mono; Archivo não tem itálico real e o oblíquo sintético aparece.
