import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

const buildRoot = join(process.cwd(), '.next/server/app')

async function readGenerated(...candidates) {
  for (const candidate of candidates) {
    try {
      return await readFile(join(buildRoot, candidate), 'utf8')
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
    }
  }
  throw new Error(`Could not find generated output: ${candidates.join(', ')}`)
}

function nodeByType(graph, type) {
  const node = graph.find((item) => item['@type'] === type)
  assert.ok(node, `Missing ${type} node`)
  return node
}

function collectIdReferences(value, references = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectIdReferences(item, references)
    return references
  }
  if (!value || typeof value !== 'object') return references

  if (typeof value['@id'] === 'string' && Object.keys(value).length === 1) {
    references.push(value['@id'])
  }
  for (const child of Object.values(value)) collectIdReferences(child, references)
  return references
}

const html = await readGenerated('index.html')
const schemaMatch = html.match(
  /<script[^>]*id="ethogram-entity-graph"[^>]*>([\s\S]*?)<\/script>/,
)

assert.ok(schemaMatch, 'Homepage must render the Ethogram entity graph')
const schema = JSON.parse(schemaMatch[1])

assert.equal(schema['@context'], 'https://schema.org')
assert.ok(Array.isArray(schema['@graph']), 'Schema must use a connected @graph')
assert.equal(schema['@graph'].length, 4, 'Homepage graph must contain four top-level entities')

const graph = schema['@graph']
const ids = graph.map((node) => node['@id'])
assert.equal(new Set(ids).size, ids.length, 'Every top-level entity must have a unique @id')

for (const reference of collectIdReferences(graph)) {
  assert.ok(ids.includes(reference), `Unresolved @id reference: ${reference}`)
}

const organization = nodeByType(graph, 'Organization')
const website = nodeByType(graph, 'WebSite')
const webpage = nodeByType(graph, 'WebPage')
const software = nodeByType(graph, 'SoftwareApplication')

assert.equal(organization.name, 'Ethogram')
assert.equal(organization.url, 'https://ethogram.dev/')
assert.equal(website.publisher['@id'], organization['@id'])
assert.equal(webpage.isPartOf['@id'], website['@id'])
assert.equal(webpage.mainEntity['@id'], software['@id'])
assert.equal(webpage.about['@id'], software['@id'])
assert.equal(software.publisher['@id'], organization['@id'])
assert.equal(software.mainEntityOfPage['@id'], webpage['@id'])
assert.equal(software.applicationCategory, 'DeveloperApplication')
assert.equal(software.offers['@type'], 'Offer')
assert.equal(software.offers.price, 0)
assert.equal(software.offers.priceCurrency, 'USD')
assert.equal(software.isAccessibleForFree, true)
assert.match(software.license, /^https:\/\//)
assert.match(software.codeRepository, /^https:\/\//)
assert.deepEqual(software.featureList, [
  'Code-authored Stories',
  'tool-called expectations',
  'tool-not-called expectations',
  'Consumer-owned execution profiles',
  'Current-run execution evidence',
  'Read-only local interface',
])

assert.match(html, /<link rel="canonical" href="https:\/\/ethogram\.dev\/?"/)
assert.match(html, /<meta property="og:url" content="https:\/\/ethogram\.dev\/?"/)
assert.match(html, /<meta name="twitter:card" content="summary_large_image"/)
assert.match(html, /<h1>Change the/)
assert.doesNotMatch(html, /<meta name="robots" content="noindex/)

const appHtml = await readGenerated('app.html', 'app/index.html')
assert.match(appHtml, /<meta name="robots" content="noindex, nofollow, nocache"/)
assert.match(appHtml, /<meta name="googlebot" content="noindex, nofollow, noimageindex"/)

const labHtml = await readGenerated('lab/interface.html', 'lab/interface/index.html')
assert.match(labHtml, /<meta name="robots" content="noindex"/)

const robots = await readGenerated('robots.txt.body', 'robots.txt')
assert.match(robots, /User-Agent: OAI-SearchBot/i)
assert.match(robots, /Sitemap: https:\/\/ethogram\.dev\/sitemap\.xml/i)

const sitemap = await readGenerated('sitemap.xml.body', 'sitemap.xml')
assert.match(sitemap, /<loc>https:\/\/ethogram\.dev\/<\/loc>/)
assert.doesNotMatch(sitemap, /\/(app|lab|landing)(\/|<)/)

async function htmlFiles(directory = buildRoot) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return htmlFiles(path)
    return entry.name.endsWith('.html') ? [path] : []
  }))
  return nested.flat()
}

const ignoredPages = new Set(['index', 'app', 'landing', 'lab/interface', '_not-found', '_global-error'])
const plannedPrefixes = ['integrations/', 'research']
const generatedPages = (await htmlFiles())
  .map((file) => file.slice(buildRoot.length + 1, -'.html'.length))
  .filter((route) => !ignoredPages.has(route))

assert.ok(generatedPages.length >= 50, 'Expected the complete public content architecture to be generated')

for (const route of generatedPages) {
  const pageHtml = await readGenerated(`${route}.html`)
  const path = `/${route}`
  const planned = plannedPrefixes.some((prefix) => route === prefix || route.startsWith(prefix))
  assert.match(pageHtml, /<h1[^>]*>/, `${path} must contain one visible H1`)
  assert.match(pageHtml, new RegExp(`<link rel="canonical" href="https://ethogram\\.dev${path.replaceAll('/', '\\/')}"`), `${path} must have a canonical URL`)
  assert.match(pageHtml, /id="ethogram-page-graph"/, `${path} must contain a page schema graph`)
  assert.match(pageHtml, /"@type":"BreadcrumbList"/, `${path} must contain BreadcrumbList schema`)
  if (planned) {
    assert.match(pageHtml, /<meta name="robots" content="noindex, follow"/, `${path} must remain noindex until evidence exists`)
    assert.doesNotMatch(sitemap, new RegExp(`<loc>https://ethogram\\.dev${path.replaceAll('/', '\\/')}</loc>`), `${path} must not be in the sitemap`)
  } else {
    assert.doesNotMatch(pageHtml, /<meta name="robots" content="noindex/, `${path} must be indexable`)
    assert.match(sitemap, new RegExp(`<loc>https://ethogram\\.dev${path.replaceAll('/', '\\/')}</loc>`), `${path} must be in the sitemap`)
  }
}

const faqHtml = await readGenerated('faq.html')
assert.match(faqHtml, /"@type":"FAQPage"/)
assert.match(faqHtml, /"@type":"Question"/)
assert.match(faqHtml, /"@type":"Answer"/)

const glossaryHtml = await readGenerated('glossary.html')
assert.match(glossaryHtml, /"@type":"DefinedTermSet"/)
assert.match(glossaryHtml, /"@type":"DefinedTerm"/)

const docsHtml = await readGenerated('docs/quickstart.html')
assert.match(docsHtml, /"@type":"TechArticle"/)

const exampleHtml = await readGenerated('examples/access-request-agent.html')
assert.match(exampleHtml, /"@type":"SoftwareSourceCode"/)

const howItWorksHtml = await readGenerated('how-it-works.html')
assert.match(howItWorksHtml, /"@type":"FAQPage"/)
assert.match(howItWorksHtml, /Common questions \/ direct answers/i)
assert.match(howItWorksHtml, /Do I need to write code\?/)

console.log(`SEO schema validation passed: homepage entity graph plus ${generatedPages.length} content pages, metadata, specialized schemas, canonicals, robots, sitemap, and private-route rules.`)
