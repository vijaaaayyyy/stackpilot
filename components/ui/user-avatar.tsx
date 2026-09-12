import type { User } from '@supabase/supabase-js';
import { getProfileAvatar, getProfileInitials, getProfileName } from '@/lib/auth/profile';
import { cn } from '@/lib/utils';

/**
 * Renders the user's profile photo (from GitHub/Google/email metadata) when
 * available, otherwise a teal initials circle. Callers pass full sizing and
 * radius via className, e.g. "h-8 w-8 rounded-full text-xs".
 */
export function UserAvatar({
  user,
  className,
  title,
}: {
  user?: User | null;
  className?: string;
  title?: string;
}) {
  const avatar = getProfileAvatar(user);

  if (!avatar) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          'flex items-center justify-center bg-teal-500 font-bold text-white',
          className,
        )}
        title={title ?? getProfileName(user)}
      >
        {getProfileInitials(user)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatar}
      alt={title ?? getProfileName(user) ?? 'Profile photo'}
      referrerPolicy="no-referrer"
      className={cn('object-cover', className)}
    />
  );
}