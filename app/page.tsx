import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/json-ld'
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME } from '@/lib/seo/site'
import { homePageStructuredData } from '@/lib/seo/structured-data'
import { EthogramLandingPage } from './landing/landing-page'
import './lab/interface/lab-interface.css'
import './landing/landing.css'

const title = 'Ethogram — Behavioral Testing for TypeScript AI Agents'

export const metadata: Metadata = {
  title: { absolute: title },
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    title,
    description: SITE_DESCRIPTION,
    url: '/',
    siteName: SITE_NAME,
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description: SITE_DESCRIPTION,
    images: ['/opengraph-image'],
  },
}

export default function HomePage() {
  return (
    <>
      <JsonLd data={homePageStructuredData} id="ethogram-entity-graph" />
      <EthogramLandingPage />
    </>
  )
}
