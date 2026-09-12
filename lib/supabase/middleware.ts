import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

const APP_PREFIXES = [
  '/dashboard',
  '/matches',
  '/teams',
  '/players',
  '/analytics',
  '/settings',
  '/account',
  '/create-match',
  '/reviews',
];

const AUTH_PAGES = ['/login', '/signup', '/forgot-password'];

/* Old Stack2Set catalog routes — never shown again to signed-in users. */
const LEGACY_PREFIXES = [
  '/workspace',
  '/explore',
  '/browse',
  '/stack',
  '/compare',
  '/category',
  '/api-reference',
  '/search',
  '/results',
];

function startsWithAny(path: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export async function updateSession(request: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (user) {
    if (AUTH_PAGES.includes(path) || startsWithAny(path, LEGACY_PREFIXES)) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      url.search = '';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  if (startsWithAny(path, APP_PREFIXES)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
