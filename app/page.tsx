import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { HowItWorks } from '@/components/landing/how-it-works';
import { FloatingBadges } from '@/components/landing/floating-badges';
import { Features } from '@/components/landing/features';
import { Audience } from '@/components/landing/audience';
import { FaqSection } from '@/components/landing/faq-section';
import { DocsSection } from '@/components/landing/docs-section';
import { CTA } from '@/components/landing/cta';
import { Footer } from '@/components/landing/footer';
import { ScrollLightField, LightReveal, SectionGlow } from '@/components/cinematic/scroll-lighting';
import { CanvasParticles } from '@/components/ui/canvas-particles';
import { siteConfig, absoluteUrl } from '@/lib/site';
import {
  organizationSchema,
  websiteSchema,
  webApplicationSchema,
  softwareApplicationSchema,
  serializeJsonLd,
} from '@/lib/jsonld';

export const metadata: Metadata = {
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.openGraph.siteName,
    locale: siteConfig.openGraph.locale,
    images: [{ url: absoluteUrl('/og.png'), width: 1200, height: 630, alt: siteConfig.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.title,
    description: siteConfig.description,
    images: [absoluteUrl('/og.png')],
  },
};

const jsonLd = [
  organizationSchema(),
  websiteSchema(),
  webApplicationSchema(),
  softwareApplicationSchema(),
];

const particleColors = [
  'rgba(34, 211, 238, 0.7)',
  'rgba(99, 102, 241, 0.7)',
  'rgba(168, 85, 247, 0.7)',
  'rgba(244, 114, 182, 0.7)',
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden pb-28">
      {jsonLd.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
        />
      ))}
      {/* One continuous full-page background: travelling light + star field behind every section */}
      <ScrollLightField />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <CanvasParticles colors={particleColors} className="h-full w-full opacity-45" />
      </div>
      <Navbar />
      <Hero />
      <LightReveal className="relative">
        <SectionGlow glow="purple" />
        <HowItWorks />
      </LightReveal>
      <FloatingBadges />
      <LightReveal className="relative">
        <SectionGlow glow="indigo" />
        <Features />
      </LightReveal>
      <LightReveal className="relative">
        <SectionGlow glow="indigo" />
        <Audience />
      </LightReveal>
      <FaqSection />
      <DocsSection />
      <LightReveal className="relative">
        <SectionGlow glow="pink" />
        <CTA />
      </LightReveal>
      <Footer />
    </main>
  );
}
