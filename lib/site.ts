export type SiteConfig = {
  name: string;
  shortName: string;
  version: string;
  url: string;
  title: string;
  description: string;
  keywords: string[];
  creator: string;
  publisher: string;
  authors: { name: string; url?: string }[];
  category: string;
  twitterHandle: string;
  github: string;
  themeColor: { light: string; dark: string };
  openGraph: { type: 'website'; siteName: string; locale: string };
};

function productionUrl(): string {
  // On Vercel builds VERCEL_PROJECT_PRODUCTION_URL is injected with the real
  // deployment domain, so canonical/OG URLS stay correct without hardcoding.
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return 'https://www.stack2set.me';
}

export const siteConfig: SiteConfig = {
  name: 'Turf DRS',
  shortName: 'Turf DRS',
  version: '4.4.4',
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? productionUrl()).replace(/\/+$/, ''),
  title: 'Turf DRS — Bring the third umpire to your turf.',
  description:
    'Turf DRS brings third-umpire reviews to local cricket — LBW, run-out and stumping checks, ball tracking and slow-mo footage for turf, academy and club matches.',
  keywords: [
    'Turf DRS',
    'cricket',
    'DRS',
    'third umpire',
    'cricket review',
    'LBW review',
    'run out review',
    'stumping review',
    'boundary check',
    'live match',
    'turf cricket',
    'local cricket',
    'academy cricket',
    'club cricket',
    'match decisions',
    'cricket tech',
  ],
  creator: 'vijay peddenti',
  publisher: 'Turf DRS',
  authors: [{ name: 'vijay peddenti' }],
  category: 'Sports',
  twitterHandle: '@vijayyyyy_7',
  github: 'https://github.com/David-oy/get.stack',
  themeColor: {
    light: '#f6f5fb',
    dark: '#06060a',
  },
  openGraph: {
    type: 'website',
    siteName: 'Turf DRS',
    locale: 'en_US',
  },
};

export function absoluteUrl(path: string): string {
  const base = siteConfig.url.replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}
