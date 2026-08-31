'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Check, Play, Search } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import {
  BehaviorProfile,
  FAIL_PROFILE,
  LabButton,
  MASTER_PROFILE,
  PASS_PROFILE,
  profileClip,
  profilePath,
  SectionHeader,
  Specimen,
  VerdictBadge,
} from '@/components/ethogram/lab-primitives'

const AXES = [
  { name: 'sequência', description: 'a ordem dos passos se manteve' },
  { name: 'ferramentas', description: 'as chamadas esperadas ocorreram' },
  { name: 'política', description: 'regra obrigatória não foi aplicada' },
  { name: 'ancoragem', description: 'a resposta se sustenta na evidência' },
  { name: 'tom', description: 'o registro combinado foi respeitado' },
  { name: 'custo', description: 'passos e latência dentro do orçamento' },
]

const EXECUTION_ROWS = [
  { name: 'refund_policy', status: 'pass', axis: '—', since: '—', time: '1.9s', radii: PASS_PROFILE },
  { name: 'escalation_path', status: 'pass', axis: '—', since: '—', time: '2.4s', radii: [20, 18, 17, 21, 14, 16] },
  { name: 'pii_redaction', status: 'fail', axis: 'política', since: '7d2e08', time: '3.1s', radii: FAIL_PROFILE },
  { name: 'tool_order', status: 'fail', axis: 'sequência', since: 'a3f19c', time: '2.8s', radii: [9, 18, 19, 17, 16, 20] },
  { name: 'cost_ceiling', status: 'pass', axis: '—', since: '—', time: '4.0s', radii: [19, 20, 18, 19, 17, 12] },
]

const EXPANDABLE_ROWS = [
  { key: 'refund_policy', status: 'pass', detail: 'expected refund decision was preserved' },
  { key: 'pii_redaction', status: 'fail', detail: 'redact_pii was absent before emit' },
  { key: 'escalation_path', status: 'pass', detail: 'handoff triggered within policy budget' },
]

const STORY_NAMES = ['refund_policy', 'pii_redaction', 'escalation_path', 'tool_order', 'cost_ceiling', 'grounding_check', 'tone_register', 'retry_budget']
const ROTATING_WORDS = ['behaviors', 'tool calls', 'policies', 'trajectories', 'guardrails']
const TYPEWRITER_COMMAND = 'npx ethogram run --story pii_redaction'
const KINETIC_BACKGROUND_WORDS = ['EXPECTED', 'OBSERVED', 'VERDICT', 'TRAJECTORY', 'EVIDENCE', 'DIVERGENCE', 'CONTRACT']
const KINETIC_STORIES = [...STORY_NAMES, 'handoff_rules', 'schema_guard', 'citation_trace', 'timeout_path']
const COLLAPSE_LETTERS = 'ethogram'.split('').map((letter, index) => ({
  delay: index === 4 ? '0s' : `${(1.6 + index * 0.12).toFixed(2)}s`,
  divergent: index === 4,
  letter,
}))

function KineticTypeSpecimens() {
  const [tick, setTick] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReducedMotion(preference.matches)
    updatePreference()
    preference.addEventListener('change', updatePreference)
    return () => preference.removeEventListener('change', updatePreference)
  }, [])

  useEffect(() => {
    if (reducedMotion) return
    const timer = window.setInterval(() => setTick((current) => current + 1), 110)
    return () => window.clearInterval(timer)
  }, [reducedMotion])

  const rotatingWord = reducedMotion ? ROTATING_WORDS.at(-1) : ROTATING_WORDS[Math.floor(tick / 17) % ROTATING_WORDS.length]
  const typewriterCycle = tick % 62
  const typedLength = reducedMotion ? TYPEWRITER_COMMAND.length : Math.max(0, Math.min(TYPEWRITER_COMMAND.length, Math.round((typewriterCycle - 3) * 1.25)))
  const typedCommand = TYPEWRITER_COMMAND.slice(0, typedLength)
  const diffOn = reducedMotion || Math.floor(tick / 21) % 2 === 1
  const countCycle = tick % 46
  const passCount = reducedMotion ? 11 : Math.min(11, Math.max(0, countCycle - 2))
  const failCount = reducedMotion ? 1 : countCycle > 13 ? 1 : 0

  return (
    <>
      <Specimen className="eg-kinetic-lead" id="TP01" title="PALAVRA QUE TROCA" note="a frase não muda, o escopo muda. a régua embaixo da palavra fixa a largura do maior termo, então nada salta quando troca — o resto da linha fica imóvel.">
          <p className="eg-kinetic-hero">Your agents change. Their critical<br /><span className="eg-rotating-word"><span aria-hidden="true" className="eg-rotating-word-sizer">trajectories</span><span>{rotatingWord}</span></span> shouldn&apos;t.</p>
      </Specimen>
      <div className="eg-grid eg-grid--three">
        <Specimen className="eg-kinetic-cell" id="TP02" title="LETRA QUE COLAPSA" note="cada letra é um eixo. uma encurta fora de hora — a wordmark faz o que o polígono faz.">
          <div className="eg-collapse-word" aria-label="ethogram">
            {COLLAPSE_LETTERS.map(({ delay, divergent, letter }, index) => (
              <span className={divergent ? 'is-divergent' : undefined} key={`${letter}-${index}`} style={{ animationDelay: delay }}>{letter}</span>
            ))}
          </div>
        </Specimen>
        <Specimen className="eg-kinetic-cell" id="TP03" title="MÁQUINA DE ESCREVER" note="datilografia só em mono e só em comando real. em prosa, é truque.">
          <code className="eg-typewriter"><span>$ </span>{typedCommand}<i aria-hidden="true" /></code>
        </Specimen>
        <Specimen className="eg-kinetic-cell" id="TP04" title="DIFF TIPOGRÁFICO" note="a frase se corrige na frente do leitor. serve para hero e para changelog.">
          <p className="eg-text-diff">redact_pii runs{' '}{diffOn ? <><del>before</del><ins> never</ins></> : <span>before</span>}{' '}emit.</p>
        </Specimen>
        <Specimen className="eg-kinetic-cell" id="TP05" title="CONTADOR DE VEREDITO" note="números contam durante a execução e param no resultado. tabular, senão o dígito empurra a palavra.">
          <div className="eg-counts"><div><strong>{passCount}</strong><span>passed</span></div><div><strong>{failCount}</strong><span>failed</span></div></div>
        </Specimen>
        <Specimen className="eg-kinetic-cell" id="TP06" title="VARREDURA NO TEXTO" note="a mesma varredura do M03, agora dentro da letra. um cursor de medição passando pela frase.">
          <p className="eg-scan-text">under observation</p>
        </Specimen>
        <Specimen className="eg-kinetic-cell" id="TP07" title="PALAVRA QUE RESPIRA" note="tracking oscilando entre −.045 e +.015em. o mais sutil da folha e o único que eu deixaria num hero.">
          <p className="eg-breathing-word">hold</p>
        </Specimen>
      </div>

      <div className="eg-kinetic-lower">
        <Specimen className="eg-word-field" id="TP08" title="FUNDO TIPOGRÁFICO · DERIVA HORIZONTAL" note="o fundo é o vocabulário do produto em corpo grande, deslizando devagar sob um véu. textura feita de palavras reais, não de lorem — e legível o suficiente para ser lida se alguém parar.">
          <div className="eg-word-field-stage">
            <div className="eg-word-field-track">{KINETIC_BACKGROUND_WORDS.map((word, index) => <div className={`is-tone-${index % 3}`} key={word}>{`${word} · `.repeat(6)}</div>)}</div>
            <div className="eg-word-field-veil" />
            <p>Every behavior has a name. Every name has a record.</p>
          </div>
        </Specimen>
        <Specimen className="eg-run-credits" id="TP09" title="CRÉDITOS DE EXECUÇÃO" note="rolagem contínua de stories com veredito. funciona como fundo de tela de espera e como prova de volume.">
          <div className="eg-run-marquee">
            <div>{KINETIC_STORIES.concat(KINETIC_STORIES).map((story, index) => <div className={index % 7 === 3 ? 'is-fail' : undefined} key={`${story}-${index}`}><span>{story}</span><span>{index % 7 === 3 ? 'fail' : 'pass'}</span></div>)}</div>
            <div className="eg-run-marquee-veil" />
          </div>
        </Specimen>
      </div>

      <div className="eg-kinetic-verdicts">
        <p><strong>o que fica</strong> · TP01, TP07 e TP08. mudam sentido ou densidade sem chamar atenção para o truque.</p>
        <p><strong>o que é condicional</strong> · TP03 e TP04 só em contexto de comando ou changelog. TP05 só durante execução real.</p>
        <p><strong>o que eu cortaria</strong> · TP06, a varredura na letra: é a coisa mais bonita daqui e a mais parecida com landing de startup de IA.</p>
      </div>
    </>
  )
}

function Matrix({ cells = 96 }: { cells?: number }) {
  return (
    <div className="eg-matrix" aria-label="Matriz de execuções">
      {Array.from({ length: cells }, (_, index) => (
        <span className={index % 19 === 0 ? 'is-fail' : index % 7 === 0 ? 'is-muted' : 'is-pass'} key={index} />
      ))}
    </div>
  )
}

function MarkWord({ profile = MASTER_PROFILE, status }: { profile?: number[]; status?: string }) {
  return (
    <div className="eg-wordmark">
      <BehaviorProfile color="currentColor" radii={profile} size={35} strokeWidth={2.8} />
      <strong>ethogram</strong>
      {status ? <span>{status}</span> : null}
    </div>
  )
}

export function LabInterface() {
  const [copied, setCopied] = useState(false)
  const [view, setView] = useState<'expected' | 'observed'>('observed')
  const [runState, setRunState] = useState<'idle' | 'running' | 'done'>('idle')
  const [axis, setAxis] = useState(2)
  const [openRows, setOpenRows] = useState<Record<string, boolean>>({})
  const [checks, setChecks] = useState({ critical: true, skipped: false, failCi: false })
  const [notice, setNotice] = useState(false)
  const [query, setQuery] = useState('refund_')
  const copyTimer = useRef<number | undefined>(undefined)
  const runTimer = useRef<number | undefined>(undefined)
  const noticeTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => {
    window.clearTimeout(copyTimer.current)
    window.clearTimeout(runTimer.current)
    window.clearTimeout(noticeTimer.current)
  }, [])

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText('npx ethogram init')
    } catch {
      // The text feedback remains useful when clipboard permission is unavailable.
    }
    setCopied(true)
    window.clearTimeout(copyTimer.current)
    copyTimer.current = window.setTimeout(() => setCopied(false), 1600)
  }

  const run = () => {
    setRunState('running')
    window.clearTimeout(runTimer.current)
    runTimer.current = window.setTimeout(() => setRunState('done'), 1800)
  }

  const saveSelection = () => {
    setNotice(true)
    window.clearTimeout(noticeTimer.current)
    noticeTimer.current = window.setTimeout(() => setNotice(false), 2600)
  }

  const viewRadii = view === 'observed' ? FAIL_PROFILE : PASS_PROFILE
  const activeAxis = AXES[axis]

  return (
    <main className="eg-lab">
      <div className="eg-shell">
        <header className="eg-hero">
          <div className="eg-hero-topline">
            <span>ETHOGRAM · LAB 04 · INTERFACE</span>
            <Link href="/" className="eg-back-link"><ArrowLeft size={14} /> produto</Link>
          </div>
          <div className="eg-hero-grid">
            <div>
              <h1>Tudo aqui é clicável.</h1>
              <p>Botões, micro-interações e componentes de dado sob a física do Lab 03: contorno sem preenchimento, canto reto, cor só em estado, movimento sem elástico. Ainda é exploração — mas exploração que funciona no dedo.</p>
            </div>
            <div className="eg-hero-rules" aria-label="Regras principais">
              <span>micro <b>180ms · cubic-bezier(.2,.8,.2,1)</b></span>
              <span>foco <b>contorno musgo, 2px, sem glow</b></span>
              <span>alvo <b>altura mínima 36px em desktop</b></span>
            </div>
          </div>
        </header>

        <section className="eg-section" id="buttons">
          <SectionHeader index="01" title="Botões" eyebrow="passe o mouse · todos com hover, active e foco reais" />
          <div className="eg-grid eg-grid--four">
            <Specimen id="B01" title="PRIMÁRIO" note="marfim sólido, sem raio. um por tela.">
              <div className="eg-button-stack"><LabButton variant="primary">npx ethogram init</LabButton><LabButton size="small" variant="primary">pequeno</LabButton></div>
            </Specimen>
            <Specimen id="B02" title="SECUNDÁRIO" note="a borda acende, o fundo nunca preenche.">
              <div className="eg-button-stack"><LabButton>read the docs</LabButton><LabButton disabled>desabilitado</LabButton></div>
            </Specimen>
            <Specimen id="B03" title="FANTASMA E DESTRUTIVO" note="coral só em ação irreversível.">
              <div className="eg-button-stack"><LabButton variant="ghost">ver evidência</LabButton><LabButton variant="danger">descartar run</LabButton></div>
            </Specimen>
            <Specimen id="B04" title="ÍCONE E GRUPO" note="grupo dividido por 1px, nunca por gap.">
              <div className="eg-button-stack"><LabButton aria-label="Marca Ethogram" variant="icon"><Image alt="" height={17} src="/brand/ethogram/marks/mark-ivory.svg" width={17} /></LabButton><div className="eg-segmented"><button className="is-active">exp</button><button>obs</button><button>diff</button></div></div>
            </Specimen>
          </div>
        </section>

        <section className="eg-section" id="micro-interactions">
          <SectionHeader index="02" title="Micro-interações" eyebrow="clique · a resposta é sempre informação, nunca celebração" />
          <div className="eg-grid eg-grid--three">
            <Specimen id="X01" title="COPIAR" note="o rótulo troca por 1.6s. sem animação de sucesso.">
              <LabButton className="eg-copy-command" onClick={copyCommand}><code>npx ethogram init</code><span>{copied ? 'copiado' : 'copiar'}</span></LabButton>
            </Specimen>
            <Specimen id="X02" title="ALTERNAR CAMADA" note="o contrato fica de fantasma; a camada ativa troca sem fade.">
              <div className="eg-layer-toggle">
                <button aria-label={`Mostrar ${view === 'observed' ? 'expected' : 'observed'}`} aria-pressed={view === 'observed'} onClick={() => setView((current) => current === 'observed' ? 'expected' : 'observed')}><span className={view === 'observed' ? 'is-right' : ''} /></button>
                <BehaviorProfile color={view === 'observed' ? 'var(--eg-coral)' : 'var(--eg-ivory)'} ghostRadii={view === 'observed' ? PASS_PROFILE : FAIL_PROFILE} radii={viewRadii} size={88} />
                <strong>{view}</strong>
              </div>
            </Specimen>
            <Specimen id="X03" title="RODAR" note="ao terminar, a barra vira o próprio resultado.">
              <LabButton disabled={runState === 'running'} onClick={run} variant="primary"><Play size={14} /> {runState === 'running' ? 'rodando 12 stories…' : runState === 'done' ? 'rodar de novo' : 'ethogram run'}</LabButton>
              <div className={`eg-run-track is-${runState}`}><span /></div>
              <div className="eg-run-result">{runState === 'done' ? '11 passed · 1 failed' : runState === 'running' ? 'observando comportamento…' : 'pronto para executar'}</div>
            </Specimen>
            <Specimen id="X04" title="PERFIL INTERATIVO" note="a marca é a legenda. hover no eixo, sem tooltip flutuante.">
              <div className="eg-profile-interactive">
                <BehaviorProfile activeAxis={axis} color="var(--eg-ivory)" onAxisChange={setAxis} radii={MASTER_PROFILE} size={126} />
                <div><strong>{activeAxis.name}</strong><p>{activeAxis.description}</p><span>eixo {String(axis + 1).padStart(2, '0')} / 06</span></div>
              </div>
            </Specimen>
            <Specimen id="X05" title="EXPANDIR" note="abre sem animar altura; o conteúdo simplesmente entra.">
              <div className="eg-expand-list">
                {EXPANDABLE_ROWS.map((row) => <div key={row.key}><button aria-expanded={Boolean(openRows[row.key])} onClick={() => setOpenRows((current) => ({ ...current, [row.key]: !current[row.key] }))}><span>{row.key}</span><VerdictBadge tone={row.status as 'pass' | 'fail'}>{row.status}</VerdictBadge></button>{openRows[row.key] ? <p>{row.detail}</p> : null}</div>)}
              </div>
            </Specimen>
            <Specimen id="X06" title="SELEÇÃO E AVISO" note="aviso entra no fluxo, não flutua sobre a tela.">
              <div className="eg-check-list">
                {[
                  ['critical', 'stories críticas'],
                  ['skipped', 'incluir skipped'],
                  ['failCi', 'falhar CI em desvio'],
                ].map(([key, label]) => <button aria-pressed={checks[key as keyof typeof checks]} key={key} onClick={() => setChecks((current) => ({ ...current, [key]: !current[key as keyof typeof current] }))}><span className={checks[key as keyof typeof checks] ? 'is-on' : ''}>{checks[key as keyof typeof checks] ? <Check size={12} /> : null}</span>{label}</button>)}
                <LabButton onClick={saveSelection}>salvar seleção</LabButton>
                {notice ? <output className="eg-notice">seleção salva em <code>.ethogram/config.toml</code></output> : null}
              </div>
            </Specimen>
          </div>
        </section>

        <section className="eg-section" id="data-components">
          <SectionHeader index="03" title="Componentes de dado" eyebrow="onde o produto realmente vive" />
          <div className="eg-grid eg-grid--two">
            <Specimen id="D01" title="SELOS E ESTADOS">
              <div className="eg-verdict-cloud"><VerdictBadge tone="pass">pass</VerdictBadge><VerdictBadge tone="fail">fail</VerdictBadge><VerdictBadge>skipped</VerdictBadge><VerdictBadge>not run</VerdictBadge><VerdictBadge tone="critical">crítico</VerdictBadge><VerdictBadge tone="running">rodando</VerdictBadge><kbd>⌘ R</kbd></div>
            </Specimen>
            <Specimen id="D02" title="CAMPO E BUSCA">
              <label className="eg-query-field"><Search size={15} /><span>story:</span><input aria-label="Buscar Story" onChange={(event) => setQuery(event.target.value)} value={query} /></label>
              <div className="eg-code-line"><span>policy_lookup(</span><em>parêntese não fechado · linha 12</em></div>
            </Specimen>
            <Specimen className="eg-span-two" id="D03" title="TABELA DE EXECUÇÕES · PASSE O MOUSE NAS LINHAS">
              <div className="eg-data-table" role="table" aria-label="Tabela de execuções">
                <div className="eg-data-row eg-data-head" role="row"><span>STORY</span><span>PERFIL</span><span>EIXO DIVERGENTE</span><span>DESDE</span><span>TEMPO</span></div>
                {EXECUTION_ROWS.map((row) => <div className="eg-data-row" role="row" key={row.name}><strong>{row.name}</strong><span className="eg-profile-cell"><BehaviorProfile color={row.status === 'pass' ? 'var(--eg-moss)' : 'var(--eg-coral)'} radii={row.radii} size={30} strokeWidth={3.4} /><VerdictBadge tone={row.status as 'pass' | 'fail'}>{row.status}</VerdictBadge></span><span>{row.axis}</span><code>{row.since}</code><code>{row.time}</code></div>)}
              </div>
            </Specimen>
          </div>
        </section>

        <section className="eg-section" id="typography">
          <SectionHeader index="04" title="Tipografia" eyebrow="a marca fala inglês · espécimes reais, não lorem" />
          <div className="eg-grid eg-grid--two">
            <Specimen id="TY01" title="ESCALA E TRACKING ÓTICO">
              <div className="eg-type-scale"><div><span>72 / −.04</span><b>Behavior</b></div><div><span>40 / −.032</span><strong>that holds under change</strong></div><div><span>24 / −.025</span><h3>Expected behavior is not observed behavior.</h3></div><div><span>17 / −.005</span><p>Run real agents and compare what happened against what should have happened.</p></div><div><span>12.5 / 0</span><code>.ethogram/runs/0198 · 11 passed · 1 failed</code></div></div>
            </Specimen>
            <Specimen id="TY02" title="DIVISÃO DE PAPÉIS" note="sans afirma, mono comprova. nunca o contrário.">
              <div className="eg-type-roles"><span>ARCHIVO · AFIRMAÇÃO</span><p>One critical behavior changed in this pull request.</p><span>JETBRAINS MONO · EVIDÊNCIA</span><code>FAIL pii_redaction<br />expected redact_pii before emit<br />observed —</code></div>
            </Specimen>
            <Specimen id="TY03" title="TRÊS DISPLAYS" note="serifado só em capa e ensaio, nunca em produto.">
              <div className="eg-display-compare"><p className="is-archivo">Behavior that holds.</p><small>archivo 600 · atual</small><p className="is-serif">Behavior that holds.</p><small>instrument serif · editorial</small></div>
            </Specimen>
            <Specimen id="TY04" title="NUMERAIS TABULARES" note="todo número comparável vai em mono.">
              <div className="eg-number-table"><span>refund_policy</span><code>1.914s</code><span>escalation_path</span><code>12.408s</code><span>pii_redaction</span><code>3.117s</code></div>
            </Specimen>
            <Specimen id="TY05" title="CÓDIGO NA PROSA" note="código fica no fluxo; pílula fragmenta a leitura.">
              <p className="eg-prose-sample">Each Story declares an <code>.expect()</code> for every behavior you care about.</p>
            </Specimen>
            <Specimen id="TY06" title="ÊNFASE SEM ITÁLICO" note="ênfase é peso 600 ou troca para mono.">
              <p className="eg-emphasis">The regression that <strong>matters</strong> rarely breaks an assertion.</p>
            </Specimen>
            <Specimen id="TY07" title="MEDIDA E QUEBRA" note="prosa entre 34ch e 62ch.">
              <p className="eg-measure">Agents are probabilistic systems. Behavior changes when you edit a prompt, a model, a tool.</p>
            </Specimen>
            <Specimen id="TY08" title="WORDMARK EM MICRO" note="em CLI e barra de status ganha a mono caixa baixa.">
              <div className="eg-micro-wordmarks"><span>ethogram</span><code>ethogram</code><b>ETHOGRAM</b></div>
            </Specimen>
            <Specimen className="eg-span-two eg-editorial-lockup" id="TY09" title="LOCKUP EDITORIAL · CAPA">
              <p>Your agents change.<br /><strong>Their critical behaviors shouldn&apos;t.</strong></p><span>OPEN SOURCE · BEHAVIORAL TESTING FOR AI AGENTS</span>
            </Specimen>
          </div>
        </section>

        <section className="eg-section" id="kinetic-type">
          <SectionHeader index="05" title="Tipografia cinética" eyebrow="a letra como comportamento observável" />
          <KineticTypeSpecimens />
        </section>

        <section className="eg-section" id="complete-mark">
          <SectionHeader index="06" title="Marca completa" eyebrow="símbolo e palavra brincando juntos" />
          <div className="eg-grid eg-grid--three">
            <Specimen className="eg-span-three" id="L01" title="O SÍMBOLO DENTRO DA PALAVRA" note="como ponto final funciona; como letra, não."><div className="eg-mark-sentence"><strong>ethogram</strong><BehaviorProfile size={44} strokeWidth={2.6} /></div></Specimen>
            <Specimen id="L02" title="ENTRADA SEQUENCIADA"><MarkWord /></Specimen>
            <Specimen id="L03" title="MARCA COMO CURSOR" note="presença constante sem virar logo."><div className="eg-terminal-mark"><BehaviorProfile size={22} strokeWidth={4.8} /><code>ethogram run</code></div></Specimen>
            <Specimen id="L04" title="REDUÇÃO PROGRESSIVA"><div className="eg-reduction"><MarkWord /><MarkWord /><BehaviorProfile size={28} strokeWidth={4} /></div></Specimen>
            <Specimen id="L05" title="ASSINATURA DE EXECUÇÃO" note="cada execução gera o próprio lockup."><MarkWord profile={FAIL_PROFILE} status="run 0198 · fail · política" /></Specimen>
            <Specimen id="L06" title="A PALAVRA MEDIDA"><div className="eg-measured-word"><span>0</span><strong>ethogram</strong><span>8</span></div></Specimen>
            <Specimen id="L07" title="CICLO DE ESTADOS"><MarkWord profile={PASS_PROFILE} status="all behaviors holding" /></Specimen>
            <Specimen id="L08" title="MARCA RECORTANDO TEXTURA" note="só em capa."><div className="eg-texture-mark" style={{ clipPath: profileClip() }}><Image alt="Textura de evidência dentro do perfil" fill sizes="180px" src="/brand/ethogram/lab/aperture-portal.webp" /></div></Specimen>
            <Specimen className="eg-span-two" id="L09" title="LOCKUP INTERATIVO · PASSE O MOUSE NAS LETRAS"><div className="eg-letter-lockup"><div>{'ethogram'.split('').map((letter, index) => <button className={index === axis ? 'is-active' : ''} disabled={index > 5} key={`${letter}-${index}`} onFocus={() => index < 6 && setAxis(index)} onMouseEnter={() => index < 6 && setAxis(index)}>{letter}</button>)}</div><BehaviorProfile color="var(--eg-moss)" radii={MASTER_PROFILE.map((radius, index) => index === axis ? 24 : radius)} size={104} /><span>{activeAxis.name} · {activeAxis.description}</span></div></Specimen>
            <Specimen id="L10" title="FAVICON · TAMANHO REAL, 16PX"><div className="eg-favicon-list"><span><Image alt="Ethogram favicon" height={16} src="/favicon.svg" width={16} />ethogram — behavioral tes…</span><span><Image alt="Ethogram passing favicon" height={16} src="/favicon-pass.svg" width={16} />passing</span><span><Image alt="Ethogram failing favicon" height={16} src="/favicon-fail.svg" width={16} />failing</span><span><Image alt="Ethogram running favicon" height={16} src="/favicon-running.svg" width={16} />running</span></div></Specimen>
          </div>
        </section>

        <section className="eg-section" id="aperture">
          <SectionHeader index="07" title="Abertura" eyebrow="o símbolo deixa de ser desenho e passa a ser recorte" />
          <p className="eg-section-lead">Duas leituras do mesmo gesto. Dentro: o vazio do polígono guarda o que a ferramenta observou — trajetória, log, matriz. Atrás: o polígono é uma janela por onde se vê outra coisa. Em nenhum dos dois casos ele é preenchido; ele enquadra.</p>
          <div className="eg-grid eg-grid--three">
            <Specimen id="A01" title="TRAJETÓRIA DENTRO" note="o contorno vira moldura de gráfico. a medição continua fora do quadro."><div className="eg-aperture"><svg aria-label="Trajetória observada" role="img" viewBox="0 0 180 180"><path className="eg-aperture-outline" d={profilePath(MASTER_PROFILE)} transform="scale(2.8)" /><path className="eg-trajectory" d="M0 112 C35 70 58 142 91 94 S144 50 190 78" /></svg></div></Specimen>
            <Specimen id="A02" title="LOG DENTRO" note="a marca cheia de evidência rolando."><div className="eg-aperture"><div className="eg-aperture-fill eg-aperture--log" style={{ clipPath: profileClip() }}>{STORY_NAMES.concat(STORY_NAMES).map((story, index) => <code key={`${story}-${index}`}>{story} {index % 6 === 3 ? 'fail' : 'pass'}</code>)}</div><BehaviorProfile className="eg-aperture-profile" size={190} strokeWidth={1.8} /></div></Specimen>
            <Specimen id="A03" title="MATRIZ DENTRO" note="candidato a avatar de organização."><div className="eg-aperture"><div className="eg-aperture-fill eg-aperture--matrix" style={{ clipPath: profileClip() }}><Matrix /></div><BehaviorProfile className="eg-aperture-profile" size={190} strokeWidth={1.8} /></div></Specimen>
            <Specimen id="A04" title="VARREDURA DENTRO" note="substitui spinner em tela cheia."><div className="eg-aperture"><div className="eg-aperture-fill eg-aperture--scan" style={{ clipPath: profileClip() }}><span /></div><BehaviorProfile className="eg-aperture-profile" size={190} strokeWidth={1.8} /></div></Specimen>
            <Specimen id="A05" title="DIVERGÊNCIA DENTRO" note="cor entra sem colorir a marca."><div className="eg-aperture"><div className="eg-aperture-fill eg-aperture--divergence" style={{ clipPath: profileClip(FAIL_PROFILE) }}><span /></div><BehaviorProfile className="eg-aperture-profile" radii={FAIL_PROFILE} size={190} strokeWidth={1.8} /></div></Specimen>
            <Specimen id="A06" title="PERFIL DENTRO DO PERFIL" note="a silhueta se perde abaixo de 80px."><div className="eg-nested-profile"><BehaviorProfile size={160} /><BehaviorProfile color="var(--eg-moss)" radii={PASS_PROFILE} size={72} /></div></Specimen>
          </div>

          <div className="eg-portal-header"><span>07.B</span><h3>Portal</h3><p>imagem real recortada pelo perfil</p></div>
          <p className="eg-portal-lead">As aberturas abaixo são espaços reais para imagem. Sem foto, elas seguem sendo enquadramento; com foto, o polígono passa a funcionar como porta.</p>
          <div className="eg-grid eg-grid--three">
            <Specimen className="eg-span-two" id="P01" title="PORTA · CAPA DE SEÇÃO" note="a marca centralizada e grande deixa de ser logo e passa a ser vão."><div className="eg-portal eg-portal--wide" style={{ '--eg-clip': profileClip() } as CSSProperties}><div className="eg-portal-image"><Image alt="Imagem enquadrada pelo perfil Ethogram" fill priority sizes="(max-width: 760px) 100vw, 66vw" src="/brand/ethogram/lab/aperture-portal.webp" /></div><BehaviorProfile size={260} strokeWidth={1.5} /><strong>Behavior<br />under observation.</strong></div></Specimen>
            <Specimen id="P02" title="JANELA DE AGENTE" note="identidade sem círculo para agente ou organização."><div className="eg-agent-window"><div className="eg-portal-image" style={{ clipPath: profileClip(PASS_PROFILE) }}><Image alt="Janela visual do agente" fill sizes="320px" src="/brand/ethogram/lab/aperture-portal.webp" /></div><BehaviorProfile color="var(--eg-moss)" radii={PASS_PROFILE} size={180} /><strong>support_agent</strong><span>24 behaviors · holding</span></div></Specimen>
            <Specimen className="eg-span-three" id="P03" title="TRÍPTICO · POST OU DOC" note="a irregularidade da marca aparece por comparação."><div className="eg-triptych">{[MASTER_PROFILE, PASS_PROFILE, FAIL_PROFILE].map((profile, index) => <div key={index}><div style={{ clipPath: profileClip(profile) }}><Image alt="Estudo visual do perfil" fill sizes="33vw" src="/brand/ethogram/lab/aperture-portal.webp" /></div><BehaviorProfile color={index === 2 ? 'var(--eg-coral)' : index === 1 ? 'var(--eg-moss)' : 'var(--eg-ivory)'} radii={profile} size={116} /><span>{index === 1 ? 'eixo curto · o assunto' : 'perfil regular · contexto'}</span></div>)}</div></Specimen>
          </div>
          <div className="eg-portal-decisions"><p><strong>a regra que isso cria</strong> · quando o polígono enquadra, o contorno continua desenhado por cima.</p><p><strong>o que fica</strong> · A03, matriz, e P02, janela de agente, resolvem problemas reais.</p><p><strong>limite</strong> · abaixo de 80px nada pode viver dentro do perfil.</p></div>
        </section>

        <footer className="eg-lab-footer">
          <div><span>REGRAS EXTRAÍDAS</span><p>Feedback é texto. Nada flutua sobre o conteúdo. Grupos são divididos por 1px. Cor entra só quando há estado. Foco é contorno musgo de 2px.</p></div>
          <div><span>AGORA EXISTE</span><p>Uma implementação React acessível, responsiva e separada em primitives. O original continua preservado como evidência.</p></div>
          <div><span>PRÓXIMO</span><p>Aplicar os primitives aprovados às telas reais de Canvas, Runs e Compare.</p></div>
        </footer>
      </div>
    </main>
  )
}
