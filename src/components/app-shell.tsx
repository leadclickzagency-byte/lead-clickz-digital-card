import { type ReactNode } from 'react';
import type { LeadClickzProfile } from '@/data/profiles';

type AppShellProps = {
  children?: ReactNode;
  profile?: LeadClickzProfile;
};

export function AppShell({ children, profile }: AppShellProps) {
  return (
    <div
      id="app-shell"
      data-profile-slug={profile?.slug}
      data-profile-name={profile?.name}
    >
      <main id="main-content" aria-label="Application content">
        {children}
      </main>
    </div>
  );
}