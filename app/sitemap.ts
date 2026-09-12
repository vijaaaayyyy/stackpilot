import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';
import { allDocs } from '@/lib/docs';
import { DRS_REVIEW_TYPES, DRS_VENUES } from '@/lib/drs/browse';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const reviewTypePages: MetadataRoute.Sitemap = DRS_REVIEW_TYPES.map((item) => ({
    url: absoluteUrl(`/browse/categories/${item.slug}`),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const venuePages: MetadataRoute.Sitemap = DRS_VENUES.map((venue) => ({
    url: absoluteUrl(`/browse/providers/${venue.slug}`),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const docPages: MetadataRoute.Sitemap = allDocs.map((doc) => ({
    url: absoluteUrl(`/docs/${doc.slug}`),
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const staticPages: MetadataRoute.Sitemap = [
    '/features',
    '/explore',
    '/browse/providers',
    '/browse/categories',
    '/cameras',
    '/live',
    '/reviews',
    '/pricing',
    '/changelog',
    '/api-reference',
    '/blog',
    '/community',
    '/status',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
  ].map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  return [
    {
      url: absoluteUrl('/'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    ...reviewTypePages,
    ...venuePages,
    {
      url: absoluteUrl('/faq'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: absoluteUrl('/docs'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    ...docPages,
    ...staticPages,
  ];
}