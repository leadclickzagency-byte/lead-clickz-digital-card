import { useEffect, useRef, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { ContactCardSection } from '@/components/contact-card-section';
import { CinematicExperience } from '@/components/cinematic-experience';
import { ConnectionIgnitionScreen } from '@/components/connection-ignition-screen';
import type { LeadClickzProfile } from '@/data/profiles';

type ProfileExperienceProps = {
  profile: LeadClickzProfile;
};

type MusicStage = 'silent' | 'bridge' | 'discover' | 'card' | 'ignition';

const BACKGROUND_MUSIC_PATH =
  '/video/after-the-apocalypse_main-full.wav';
const MUSIC_FADE_DURATION_MS = 1800;
const MUSIC_VOLUME_BY_STAGE: Record<MusicStage, number> = {
  silent: 0,
  bridge: 0.12,
  discover: 0.105,
  card: 0.09,
  ignition: 0.08,
};

export function ProfileExperience({ profile }: ProfileExperienceProps) {
  const [stage, setStage] = useState<ExperienceStage>('cinematic');
  const [musicStage, setMusicStage] = useState<MusicStage>('silent');
  const [musicMuted, setMusicMuted] = useState(true);
  const musicRef = useRef<HTMLAudioElement>(null);
  const musicEnabledRef = useRef(false);
  const musicFadeFrameRef = useRef<number | null>(null);
  const isCardStage = stage === 'contactCard';
  const shouldRenderCard = stage !== 'cinematic';

  useEffect(() => {
    const music = musicRef.current;

    if (music) {
      music.volume = 0;
      music.muted = true;
    }
  }, []);

  useEffect(() => {
    const music = musicRef.current;

    if (!music || !musicEnabledRef.current) {
      return;
    }

    if (musicFadeFrameRef.current !== null) {
      window.cancelAnimationFrame(musicFadeFrameRef.current);
    }

    const initialVolume = music.volume;
    const targetVolume = MUSIC_VOLUME_BY_STAGE[musicStage];
    const startedAt = performance.now();

    const fade = (timestamp: number) => {
      const progress = Math.min(
        (timestamp - startedAt) / MUSIC_FADE_DURATION_MS,
        1,
      );
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      music.volume =
        initialVolume + (targetVolume - initialVolume) * easedProgress;

      if (progress < 1) {
        musicFadeFrameRef.current = window.requestAnimationFrame(fade);
      } else {
        musicFadeFrameRef.current = null;
      }
    };

    musicFadeFrameRef.current = window.requestAnimationFrame(fade);

    return () => {
      if (musicFadeFrameRef.current !== null) {
        window.cancelAnimationFrame(musicFadeFrameRef.current);
        musicFadeFrameRef.current = null;
      }
    };
  }, [musicStage]);

  const handleSoundChoice = (soundEnabled: boolean) => {
    const music = musicRef.current;

    if (!music) {
      return;
    }

    musicEnabledRef.current = soundEnabled;
    setMusicMuted(!soundEnabled);
    music.muted = !soundEnabled;
    music.volume = 0;
    music.currentTime = 0;

    if (!soundEnabled) {
      music.pause();
      return;
    }

    void music.play().catch(() => {
      musicEnabledRef.current = false;
      music.pause();
      music.currentTime = 0;
    });
  };

  const handleMusicStageChange = (nextStage: 'bridge' | 'discover') => {
    const music = musicRef.current;

    if (nextStage === 'bridge' && music && musicEnabledRef.current) {
      music.currentTime = 0;

      if (music.paused) {
        void music.play();
      }
    }

    setMusicStage(nextStage);
  };

  return (
    <AppShell profile={profile}>
      <audio
        ref={musicRef}
        src={BACKGROUND_MUSIC_PATH}
        preload="auto"
        loop
        muted={musicMuted}
        aria-hidden="true"
      />
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
                setMusicStage('card');
                setStage('contactCard');
              }}
              onSoundChoice={handleSoundChoice}
              onMusicStageChange={handleMusicStageChange}
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
                setMusicStage('ignition');
                setStage('connectionIgnition');
              }}
            />
          </div>
        )}
        {stage === 'connectionIgnition' && (
          <ConnectionIgnitionScreen vcfPath={profile.vcfPath} />
        )}
      </div>
    </AppShell>
  );
}

type ExperienceStage =
  | 'cinematic'
  | 'contactCard'
  | 'connectionIgnition';