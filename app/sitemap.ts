import type { MetadataRoute } from 'next'
import { absoluteUrl, SITE_LAST_UPDATED } from '@/lib/seo/site'
import { INDEXABLE_PAGES } from '@/lib/public-content'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteUrl('/'),
      lastModified: new Date(SITE_LAST_UPDATED),
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...INDEXABLE_PAGES.map((page) => ({
      url: absoluteUrl(page.path),
      lastModified: new Date(page.updated ?? SITE_LAST_UPDATED),
      changeFrequency: page.kind === 'docs' || page.kind === 'trust' ? 'monthly' as const : 'weekly' as const,
      priority: page.path === '/docs' || page.path === '/behavioral-testing' ? 0.9 : 0.7,
    })),
  ]
}
