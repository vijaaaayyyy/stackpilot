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

export const siteConfig: SiteConfig = {
  name: 'Turf DRS',
  shortName: 'Turf DRS',
  version: '4.4.4',
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.stack2set.me').replace(/\/+$/, ''),
  title: 'Turf DRS — Bring the third umpire to your turf.',
  description:
    'Turf DRS delivers professional-style cricket reviews for local matches, turf cricket, academies and clubs — decisions you can trust.',
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
