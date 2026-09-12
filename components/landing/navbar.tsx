'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, Sparkles, UserRound, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/landing/theme-switcher';
import { TurfLogo } from '@/components/landing/brand-logo';
import { useAuth } from '@/lib/auth/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type NavLink = {
  label: string;
  href: string;
  /** Pattern used to determine the active state. A trailing "/*" matches the base path and all nested routes. */
  pattern: string;
};

const publicNavLinks: NavLink[] = [
  { label: 'Home', href: '/', pattern: '/' },
  { label: 'Explore', href: '/explore', pattern: '/explore' },
  { label: 'Browse', href: '/browse/categories', pattern: '/browse/*' },
  { label: 'Pricing', href: '/pricing', pattern: '/pricing' },
];

const appNavLinks: NavLink[] = [
  { label: 'Dashboard', href: '/dashboard', pattern: '/dashboard' },
  { label: 'Matches', href: '/matches', pattern: '/matches' },
  { label: 'Live', href: '/live', pattern: '/live' },
  { label: 'Reviews', href: '/reviews', pattern: '/reviews' },
  { label: 'Analytics', href: '/analytics', pattern: '/analytics' },
];

function matchesPath(pathname: string, pattern: string): boolean {
  if (pattern.endsWith('/*')) {
    const base = pattern.slice(0, -1);
    return pathname === base || pathname.startsWith(base + '/');
  }
  return pathname === pattern;
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isSignedIn = !loading && user;
  const navLinks = isSignedIn ? appNavLinks : publicNavLinks;
  const activeLabel = navLinks.find((link) => matchesPath(pathname, link.pattern))?.label ?? null;

  const mobileLinks = isSignedIn
    ? [
        ...appNavLinks,
        { label: 'Teams', href: '/teams', pattern: '/teams' },
        { label: 'Players', href: '/players', pattern: '/players' },
        { label: 'Cameras', href: '/cameras', pattern: '/cameras' },
        { label: 'Settings', href: '/settings', pattern: '/settings' },
      ]
    : publicNavLinks;

  const displayName =
    user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'Account';

  const avatar = (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500 text-xs font-bold text-white">
      {displayName.charAt(0).toUpperCase()}
    </span>
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (link: NavLink): boolean => activeLabel === link.label;

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled || mobileOpen
          ? 'glass border-b border-foreground/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)]'
          : 'border-b border-transparent',
      )}
    >
      <nav
        className={cn(
          'relative mx-auto flex max-w-7xl items-center justify-between px-4 transition-[height] duration-300 sm:px-6',
          scrolled ? 'h-14' : 'h-16',
        )}
      >
        <div className="flex items-center gap-3 sm:gap-5">
          <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500">
              <TurfLogo className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              Turf <span className="gradient-text">DRS</span>
            </span>
          </Link>
        </div>

        <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              aria-current={isActive(link) ? 'page' : undefined}
              className={cn(
                'relative rounded-lg px-3 py-2 text-sm transition-colors',
                isActive(link)
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {isActive(link) && (
                <span className="absolute inset-0 rounded-lg bg-foreground/5" aria-hidden="true" />
              )}
              <span className="relative">{link.label}</span>
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeSwitcher />
          {!loading && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Account menu"
                className="flex items-center gap-2 rounded-full border border-foreground/5 p-1 pr-2 transition-colors hover:border-teal-500/25"
              >
                {avatar}
                <span className="max-w-[120px] truncate text-sm text-foreground">
                  {displayName}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="gap-2">
                    <Sparkles className="h-4 w-4" /> Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/matches" className="gap-2">
                    <Sparkles className="h-4 w-4" /> Matches
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/teams" className="gap-2">
                    <Sparkles className="h-4 w-4" /> Teams
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/players" className="gap-2">
                    <Sparkles className="h-4 w-4" /> Players
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/cameras" className="gap-2">
                    <Sparkles className="h-4 w-4" /> Cameras
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="gap-2">
                    <Settings2 className="h-4 w-4" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account" className="gap-2">
                    <UserRound className="h-4 w-4" /> Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={async () => {
                    await signOut();
                    router.push('/');
                    router.refresh();
                  }}
                  className="gap-2 text-rose-300 focus:bg-rose-500/10 focus:text-rose-200"
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" className="text-sm text-muted-foreground hover:text-foreground">
                <Link href="/login">Login</Link>
              </Button>
              <Button
                asChild
                className="bg-teal-500 text-sm text-white shadow-lg shadow-teal-500/20 transition-all hover:bg-teal-600 hover:shadow-teal-500/30"
              >
                <Link href="/signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="text-foreground md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="glass border-t border-foreground/5 md:hidden">
          <div className="flex flex-col gap-1 px-4 py-4 sm:px-6">
            <div className="mb-2 self-start">
              <ThemeSwitcher />
            </div>
            {mobileLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                aria-current={isActive(link) ? 'page' : undefined}
                className={cn(
                  'rounded-lg px-3 py-2.5 text-sm transition-colors',
                  isActive(link)
                    ? 'bg-foreground/5 font-medium text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-3 border-t border-foreground/5 pt-3">
              {!loading && user ? (
                <>
                  <div className="flex items-center gap-2 px-1">
                    {avatar}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Button asChild variant="outline" className="border-foreground/10 text-foreground">
                    <Link href="/account">
                      <UserRound className="h-4 w-4" /> Account
                    </Link>
                  </Button>
                  <Button
                    onClick={async () => {
                      await signOut();
                      router.push('/');
                      router.refresh();
                    }}
                    variant="outline"
                    className="border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="outline" className="border-foreground/10 text-foreground">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild className="bg-teal-500 text-white">
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
