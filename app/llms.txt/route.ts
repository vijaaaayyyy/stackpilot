import { siteConfig } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const base = siteConfig.url;
  const body = `# Turf DRS

> Professional decision review for local cricket.

Turf DRS is a decision review system for turf cricket, academies, and clubs. It captures every delivery from an umpire-end camera and settles close calls — LBW, run out, stumping, boundary, and caught behind — with slow-motion replay, ball tracking, and frame-by-frame evidence.

## Purpose

Turf DRS gives local matches the same review quality seen in broadcast cricket. Set up a camera at the umpire end, capture every delivery, and let the third umpire settle reviews in under 30 seconds with clear, replayable evidence.

## Homepage

- ${base}/

## Important URLs

- Homepage: ${base}/
- Browse: ${base}/browse
- Review types: ${base}/browse/categories
- Venues: ${base}/browse/providers
- Live demo: ${base}/live
- Cameras: ${base}/cameras
- FAQ: ${base}/faq
- Documentation: ${base}/docs
- Sitemap: ${base}/sitemap.xml
- robots.txt: ${base}/robots.txt

## Supported features

- Decision reviews: LBW, run out, stumping, boundary, caught behind, edge
- Live ball tracking with trajectory projection
- Instant replay with slow motion and frame stepping
- End camera and top camera views
- Match and squad management for turfs, academies and clubs
- Camera-ready venues guide

## Target audience

- Turf cricket owners and organisers
- Local league administrators
- Cricket academies and coaching staff
- Club players and captains
- Weekend and evening league match organisers

## Example questions users can ask

- "How do I set up the umpire-end camera?"
- "How does an LBW review work?"
- "Which decisions can Turf DRS settle?"
- "How do I run reviews at my academy?"
- "What is the best camera angle for reviews?"
- "How does ball tracking calculate the wicket line?"

## Contact

- GitHub: https://github.com/David-oy/get.stack
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}