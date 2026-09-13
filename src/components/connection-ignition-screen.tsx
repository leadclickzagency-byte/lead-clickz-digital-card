import { useEffect, useState } from 'react';
import { ConnectionOutroCanvas } from '@/components/connection-outro-canvas';

type IgnitionPhase =
  | 'symbol'
  | 'transition'
  | 'logo'
  | 'headline'
  | 'supporting'
  | 'outro'
  | 'finished';

const ELECTRICAL_SYMBOL_MEDIA_PATH = '/video/energy-spark-signal.mp4';
const ANIMATED_LOGO_MEDIA_PATH = '/video/FullenergylogoMP4.mp4';
const SYMBOL_CROSSFADE_START_SECONDS = 6;
const SYMBOL_FADE_DURATION_MS = 700;
const LOGO_FADE_DURATION_MS = 800;
const SYMBOL_TO_LOGO_CROSSFADE_MS = Math.max(
  SYMBOL_FADE_DURATION_MS,
  LOGO_FADE_DURATION_MS,
);
const LOGO_ONLY_HOLD_MS = 900;
const HEADLINE_FADE_DURATION_MS = 700;
const HEADLINE_HOLD_MS = 1100;
const SUPPORTING_FADE_DURATION_MS = 700;
const COMPLETE_HOLD_MS = 2500;
const OUTRO_DURATION_MS = 2000;

export function ConnectionIgnitionScreen() {
  const [phase, setPhase] = useState<IgnitionPhase>('symbol');

  useEffect(() => {
    if (phase === 'symbol' || phase === 'finished') {
      return;
    }

    const phaseDuration =
      phase === 'transition'
        ? SYMBOL_TO_LOGO_CROSSFADE_MS
        : phase === 'logo'
          ? LOGO_ONLY_HOLD_MS
          : phase === 'headline'
            ? HEADLINE_FADE_DURATION_MS + HEADLINE_HOLD_MS
            : phase === 'supporting'
              ? SUPPORTING_FADE_DURATION_MS + COMPLETE_HOLD_MS
              : OUTRO_DURATION_MS;

    const timer = window.setTimeout(
      () => {
        if (phase === 'transition') {
          setPhase('logo');
          return;
        }

        if (phase === 'logo') {
          setPhase('headline');
          return;
        }

        if (phase === 'headline') {
          setPhase('supporting');
          return;
        }

        if (phase === 'supporting') {
          setPhase('outro');
          return;
        }

        setPhase('finished');
      },
      phaseDuration,
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [phase]);

  return (
    <section
      className={[
        'connection-ignition-screen',
        phase === 'outro' ? 'connection-ignition-screen--outro' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Lead Clickz connection ignition"
    >
      <video
        className={[
          'connection-ignition-screen__video',
          phase === 'symbol'
            ? 'connection-ignition-screen__video--active'
            : 'connection-ignition-screen__video--fading',
        ].join(' ')}
        src={ELECTRICAL_SYMBOL_MEDIA_PATH}
        autoPlay
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        onEnded={() => {
          if (phase === 'symbol') {
            setPhase('transition');
          }
        }}
        onTimeUpdate={(event) => {
          if (
            phase === 'symbol' &&
            event.currentTarget.currentTime >= SYMBOL_CROSSFADE_START_SECONDS
          ) {
            setPhase('transition');
          }
        }}
        onError={() => {
          if (phase === 'symbol') {
            setPhase('transition');
          }
        }}
      />
      {(phase === 'transition' ||
        phase === 'logo' ||
        phase === 'headline' ||
        phase === 'supporting') && (
        <div className="connection-ignition-screen__reveal">
          <video
            className="connection-ignition-screen__logo"
            src={ANIMATED_LOGO_MEDIA_PATH}
            autoPlay
            muted
            playsInline
            preload="auto"
            aria-label="Lead Clickz™ animated logo"
          />
          {(phase === 'headline' || phase === 'supporting') && (
            <div className="connection-ignition-screen__copy">
              <p className="connection-ignition-screen__headline">
                CONNECTION IGNITED.
              </p>
              {phase === 'supporting' && (
                <span className="connection-ignition-screen__supporting">
                  You’re connected with Lead Clickz™.
                </span>
              )}
            </div>
          )}
        </div>
      )}
      {phase === 'outro' && <ConnectionOutroCanvas />}
    </section>
  );
}