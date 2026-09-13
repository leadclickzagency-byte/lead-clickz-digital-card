import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { ContactCardSection } from '@/components/contact-card-section';
import { CinematicExperience } from '@/components/cinematic-experience';
import { ConnectionIgnitionScreen } from '@/components/connection-ignition-screen';
import type { LeadClickzProfile } from '@/data/profiles';

type ProfileExperienceProps = {
  profile: LeadClickzProfile;
};

export function ProfileExperience({ profile }: ProfileExperienceProps) {
  const [stage, setStage] = useState<ExperienceStage>('cinematic');
  const isCardStage = stage === 'contactCard';
  const shouldRenderCard = stage !== 'cinematic';

  return (
    <AppShell profile={profile}>
      <div
        className={[
          'profile-experience',
          `profile-experience--${stage}`,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {!isCardStage && stage !== 'connectionIgnition' && (
          <div className="profile-experience__stage">
            <CinematicExperience
              onDiscover={() => {
                setStage('contactCard');
              }}
            />
          </div>
        )}
        {shouldRenderCard && (
          <div
            className={[
              'profile-experience__card',
              stage === 'connectionIgnition'
                ? 'profile-experience__card--prepared'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-hidden={stage === 'connectionIgnition'}
          >
            <ContactCardSection
              profile={profile}
              onSaveContact={() => {
                setStage('connectionIgnition');
              }}
            />
          </div>
        )}
        {stage === 'connectionIgnition' && (
          <ConnectionIgnitionScreen />
        )}
      </div>
    </AppShell>
  );
}

type ExperienceStage =
  | 'cinematic'
  | 'contactCard'
  | 'connectionIgnition';