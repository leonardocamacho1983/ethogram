import type { JsonLdNode } from '@/components/seo/json-ld'
import {
  absoluteUrl,
  GITHUB_URL,
  LICENSE_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
} from '@/lib/seo/site'
import type { PublicPage } from '@/lib/public-content'

const homeUrl = absoluteUrl('/')
const organizationId = `${homeUrl}#organization`
const websiteId = `${homeUrl}#website`
const webpageId = `${homeUrl}#webpage`
const softwareId = `${homeUrl}#software`

export const homePageStructuredData: JsonLdNode = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': organizationId,
      name: SITE_NAME,
      url: homeUrl,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/icon-512.png'),
        width: 512,
        height: 512,
      },
      sameAs: [GITHUB_URL],
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      url: homeUrl,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: 'en',
      publisher: { '@id': organizationId },
    },
    {
      '@type': 'WebPage',
      '@id': webpageId,
      url: homeUrl,
      name: 'Ethogram — Behavioral Testing for TypeScript AI Agents',
      description: SITE_DESCRIPTION,
      inLanguage: 'en',
      isPartOf: { '@id': websiteId },
      about: { '@id': softwareId },
      mainEntity: { '@id': softwareId },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': softwareId,
      name: SITE_NAME,
      url: homeUrl,
      description: SITE_DESCRIPTION,
      applicationCategory: 'DeveloperApplication',
      applicationSubCategory: 'AI agent behavioral testing',
      operatingSystem: 'Node.js',
      softwareRequirements: 'Node.js 20.9 or newer',
      softwareVersion: '0.1.0-alpha.2',
      isAccessibleForFree: true,
      license: LICENSE_URL,
      codeRepository: GITHUB_URL,
      featureList: [
        'Code-authored Stories',
        'tool-called expectations',
        'tool-not-called expectations',
        'Consumer-owned execution profiles',
        'Current-run execution evidence',
        'Read-only local interface',
        'Optional local MCP server',
      ],
      audience: {
        '@type': 'Audience',
        audienceType: 'TypeScript and Node.js AI agent developers',
      },
      offers: {
        '@type': 'Offer',
        price: 0,
        priceCurrency: 'USD',
        availability: 'https://schema.org/OnlineOnly',
        url: homeUrl,
      },
      publisher: { '@id': organizationId },
      mainEntityOfPage: { '@id': webpageId },
    },
  ],
}

export function publicPageStructuredData(page: PublicPage): JsonLdNode {
  const url = absoluteUrl(page.path)
  const pageId = `${url}#webpage`
  const websiteId = `${homeUrl}#website`
  const softwareId = `${homeUrl}#software`
  const segments = page.path.split('/').filter(Boolean)
  const breadcrumbs = [
    { '@type': 'ListItem', position: 1, name: 'Ethogram', item: homeUrl },
    ...segments.map((segment, index) => ({
      '@type': 'ListItem',
      position: index + 2,
      name: index === segments.length - 1 ? page.title : segment.replaceAll('-', ' '),
      item: absoluteUrl(`/${segments.slice(0, index + 1).join('/')}`),
    })),
  ]

  const isArticle = ['concept', 'docs', 'guide', 'evidence'].includes(page.kind)
  const mainType = page.kind === 'faq'
    ? 'FAQPage'
    : page.kind === 'glossary'
      ? 'DefinedTermSet'
      : isArticle
        ? 'TechArticle'
        : page.kind === 'example'
          ? 'SoftwareSourceCode'
          : 'WebPage'

  const main: JsonLdNode = {
    '@type': mainType,
    '@id': pageId,
    url,
    name: page.title,
    description: page.description,
    inLanguage: 'en',
    isPartOf: { '@id': websiteId },
    about: { '@id': softwareId },
    dateModified: page.updated ?? '2026-08-30',
  }

  if (isArticle) {
    main.headline = page.title
    main.proficiencyLevel = page.kind === 'docs' ? 'Intermediate' : 'Beginner'
  }
  if (page.kind === 'faq') {
    main.mainEntity = page.sections.map((section) => ({
      '@type': 'Question',
      name: section.title,
      acceptedAnswer: { '@type': 'Answer', text: section.body.join(' ') },
    }))
  }
  if (page.kind === 'glossary') {
    main.hasDefinedTerm = page.sections.map((section) => ({
      '@type': 'DefinedTerm',
      name: section.title,
      description: section.body.join(' '),
      inDefinedTermSet: { '@id': pageId },
    }))
  }
  if (page.kind === 'example') {
    main.codeSampleType = 'full solution'
    main.programmingLanguage = 'TypeScript'
    main.targetProduct = { '@id': softwareId }
  }

  const contextualFaqs = page.sections.flatMap((section) => section.faqs ?? [])
  if (contextualFaqs.length) main.hasPart = { '@id': `${url}#faq` }

  const graph: JsonLdNode[] = [
    main,
    {
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: breadcrumbs,
    },
  ]
  if (contextualFaqs.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      url: `${url}#questions`,
      name: `${page.title}: common questions`,
      isPartOf: { '@id': pageId },
      mainEntity: contextualFaqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    })
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  }
}
