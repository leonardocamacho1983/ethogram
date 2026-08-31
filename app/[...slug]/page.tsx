import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PublicContentPage } from '@/components/ethogram/public-site'
import { DocsHomePage, ExampleDetailPage, ExamplesHomePage, HowItWorksPage } from '@/components/ethogram/public-special-pages'
import { JsonLd } from '@/components/seo/json-ld'
import { getPublicPage, PUBLIC_PAGES } from '@/lib/public-content'
import { publicPageStructuredData } from '@/lib/seo/structured-data'
import '@/app/public-content.css'

type Props = { params: Promise<{ slug: string[] }> }

export function generateStaticParams() {
  return PUBLIC_PAGES.map((page) => ({ slug: page.path.split('/').filter(Boolean) }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = getPublicPage(`/${slug.join('/')}`)
  if (!page) return {}
  const title = `${page.title} — Ethogram`
  return {
    title: { absolute: title },
    description: page.description,
    alternates: { canonical: page.path },
    robots: page.kind === 'planned' ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: { title, description: page.description, url: page.path, siteName: 'Ethogram', type: page.kind === 'docs' || page.kind === 'guide' || page.kind === 'concept' ? 'article' : 'website', images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: title }] },
    twitter: { card: 'summary_large_image', title, description: page.description, images: ['/opengraph-image'] },
  }
}

export default async function PublicPageRoute({ params }: Props) {
  const { slug } = await params
  const page = getPublicPage(`/${slug.join('/')}`)
  if (!page) notFound()
  const content = page.path === '/how-it-works'
    ? <HowItWorksPage page={page} />
    : page.path === '/docs'
      ? <DocsHomePage page={page} />
      : page.path === '/examples'
        ? <ExamplesHomePage page={page} />
        : page.path.startsWith('/examples/')
          ? <ExampleDetailPage page={page} />
          : <PublicContentPage page={page} />
  return <><JsonLd data={publicPageStructuredData(page)} id="ethogram-page-graph" />{content}</>
}
