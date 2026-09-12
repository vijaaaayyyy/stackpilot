import type { User } from '@supabase/supabase-js';

/**
 * Resolves the user's profile photo from the auth provider metadata.
 * GitHub provides "avatar_url", Google provides "picture", and email
 * sign-ups may carry their own "avatar". Returns null when no remote
 * photo is available so callers can fall back to initials.
 */
export function getProfileAvatar(user: Pick<User, 'user_metadata'> | null | undefined): string | null {
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  const url = meta.avatar_url ?? meta.picture ?? meta.avatar;
  return typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://')) ? url : null;
}

/** Profile name from provider metadata, falling back to the email prefix. */
export function getProfileName(user: Pick<User, 'user_metadata' | 'email'> | null | undefined): string {
  if (!user) return '';
  const meta = user.user_metadata ?? {};
  const name =
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.name === 'string' && meta.name) ||
    '';
  return name || (typeof user.email === 'string' ? user.email.split('@')[0] : '');
}

/** Up to two initials for avatar fallbacks. */
export function getProfileInitials(
  user: Pick<User, 'user_metadata' | 'email'> | null | undefined,
): string {
  return getProfileName(user)
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}