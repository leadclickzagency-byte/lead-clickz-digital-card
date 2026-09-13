import { useEffect, useRef, useState } from 'react';
import { PrimaryButtonPerimeter } from '@/components/primary-button-perimeter';

type CinematicExperienceProps = {
  onDiscover: () => void;
};

type CinematicStage =
  | 'choice'
  | 'cinematic'
  | 'cinematicHold'
  | 'bridge'
  | 'intro';

const CINEMATIC_MEDIA_PATH = '/video/lead-clickz-cinematic.mp4';
const SIGNAL_BRIDGE_MEDIA_PATH = '/video/lead-clickz-signal-bridge.mp4';
const CINEMATIC_FINAL_HOLD_MS = 500;
const BRIDGE_DURATION_MS = 7600;

const BRIDGE_PHASES = [
  { id: 'yesterday', copy: 'YESTERDAY...', duration: 1000 },
  { id: 'aimed', copy: 'WE AIMED.', duration: 1600 },
  { id: 'today', copy: 'TODAY...', duration: 1000 },
  { id: 'power', copy: 'WE STRIKE WITH POWER.', duration: 2300 },
  { id: 'signals', copy: 'EVERY MARKET HAS SIGNALS.', duration: 4250 },
  { id: 'question', copy: 'CAN YOU SEE THEM?', duration: BRIDGE_DURATION_MS },
] as const;

type BridgePhaseId = (typeof BRIDGE_PHASES)[number]['id'];

function BrandIntroScreen({ onDiscover }: CinematicExperienceProps) {
  return (
    <section className="brand-intro-screen" aria-label="Lead Clickz introduction">
      <div className="brand-intro-screen__content">
        <video
          className="brand-intro-screen__brand"
          src="/video/FullenergylogoMP4.mp4"
          autoPlay
          muted
          playsInline
          preload="auto"
          aria-label="Lead Clickz™ animated logo"
        />
        <p className="brand-intro-screen__statement">
          <span className="brand-intro-screen__statement-lead">
            We Don&apos;t Chase Attention.
          </span>
          <span className="brand-intro-screen__statement-payoff">
            We Activate Decisions.
          </span>
        </p>
        <button
          className="activation-screen__button activation-screen__button--enter brand-intro-screen__discover lead-clickz-primary-button"
          type="button"
          onClick={onDiscover}
        >
          <PrimaryButtonPerimeter />
          DISCOVER LEAD CLICKZ™
        </button>
      </div>
    </section>
  );
}

function SignalBridgeStage({ onComplete }: { onComplete: () => void }) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [mediaReady, setMediaReady] = useState(false);
  const phase = BRIDGE_PHASES[phaseIndex];

  useEffect(() => {
    const phaseTimer = window.setTimeout(() => {
      if (phaseIndex === BRIDGE_PHASES.length - 1) {
        onComplete();
        return;
      }

      setPhaseIndex((currentIndex) => currentIndex + 1);
    }, phase.duration);

    return () => {
      window.clearTimeout(phaseTimer);
    };
  }, [onComplete, phase.duration, phaseIndex]);

  return (
    <section
      className={[
        'brand-bridge-stage',
        `brand-bridge-stage--${phase.id satisfies BridgePhaseId}`,
      ].join(' ')}
      aria-label="Lead Clickz signal bridge"
    >
      <video
        className={[
          'brand-bridge-stage__video',
          mediaReady ? 'brand-bridge-stage__video--ready' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        src={SIGNAL_BRIDGE_MEDIA_PATH}
        autoPlay
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        onCanPlay={() => setMediaReady(true)}
      />
      <div className="brand-bridge-stage__signal-canvas" aria-hidden="true">
        <svg viewBox="0 0 1000 620" preserveAspectRatio="none">
          <g fill="none" strokeLinecap="round">
            <path
              id="signal-path-one"
              className="brand-bridge-stage__signal-path"
              d="M-30 440 C150 355 230 488 400 385 S700 190 1030 292"
            />
            <path
              id="signal-path-two"
              className="brand-bridge-stage__signal-path"
              d="M-30 260 C155 330 260 180 430 272 S735 455 1030 365"
            />
            <path
              id="signal-path-three"
              className="brand-bridge-stage__signal-path"
              d="M110 620 C255 495 360 540 505 420 S760 100 930 8"
            />
          </g>
          <g className="brand-bridge-stage__signal-line-glow">
            <path
              d="M-30 440 C150 355 230 488 400 385 S700 190 1030 292"
              pathLength="1"
            />
            <path
              d="M-30 260 C155 330 260 180 430 272 S735 455 1030 365"
              pathLength="1"
            />
            <path
              d="M110 620 C255 495 360 540 505 420 S760 100 930 8"
              pathLength="1"
            />
          </g>
          <g className="brand-bridge-stage__nodes">
            <circle className="brand-bridge-stage__node" cx="400" cy="385" r="5" />
            <circle className="brand-bridge-stage__node" cx="430" cy="272" r="4" />
            <circle className="brand-bridge-stage__node" cx="505" cy="420" r="4" />
            <circle className="brand-bridge-stage__node" cx="700" cy="190" r="3" />
            <circle className="brand-bridge-stage__node" cx="735" cy="455" r="3" />
          </g>
          <g className="brand-bridge-stage__spark brand-bridge-stage__spark--one">
            <circle className="brand-bridge-stage__spark-bloom" r="15">
              <animateMotion dur="4.8s" begin="-1.5s" repeatCount="indefinite">
                <mpath href="#signal-path-one" />
              </animateMotion>
            </circle>
            <circle className="brand-bridge-stage__spark-glow" r="8">
              <animateMotion dur="4.8s" begin="-1.5s" repeatCount="indefinite">
                <mpath href="#signal-path-one" />
              </animateMotion>
            </circle>
            <circle className="brand-bridge-stage__spark-core" r="3.2">
              <animateMotion dur="4.8s" begin="-1.5s" repeatCount="indefinite">
                <mpath href="#signal-path-one" />
              </animateMotion>
            </circle>
          </g>
          <g className="brand-bridge-stage__spark brand-bridge-stage__spark--two">
            <circle className="brand-bridge-stage__spark-bloom" r="13">
              <animateMotion dur="6.2s" begin="-3.1s" repeatCount="indefinite">
                <mpath href="#signal-path-two" />
              </animateMotion>
            </circle>
            <circle className="brand-bridge-stage__spark-glow" r="7">
              <animateMotion dur="6.2s" begin="-3.1s" repeatCount="indefinite">
                <mpath href="#signal-path-two" />
              </animateMotion>
            </circle>
            <circle className="brand-bridge-stage__spark-core" r="3">
              <animateMotion dur="6.2s" begin="-3.1s" repeatCount="indefinite">
                <mpath href="#signal-path-two" />
              </animateMotion>
            </circle>
          </g>
          <g className="brand-bridge-stage__spark brand-bridge-stage__spark--three">
            <circle className="brand-bridge-stage__spark-bloom" r="12">
              <animateMotion dur="5.5s" begin="-4.1s" repeatCount="indefinite">
                <mpath href="#signal-path-three" />
              </animateMotion>
            </circle>
            <circle className="brand-bridge-stage__spark-glow" r="6">
              <animateMotion dur="5.5s" begin="-4.1s" repeatCount="indefinite">
                <mpath href="#signal-path-three" />
              </animateMotion>
            </circle>
            <circle className="brand-bridge-stage__spark-core" r="2.8">
              <animateMotion dur="5.5s" begin="-4.1s" repeatCount="indefinite">
                <mpath href="#signal-path-three" />
              </animateMotion>
            </circle>
          </g>
        </svg>
      </div>
      {phase.id === 'signals' ? (
        <p
          className="brand-bridge-stage__message brand-bridge-stage__message--signals"
          key={phase.id}
        >
          <span className="brand-bridge-stage__signals-lead">
            EVERY MARKET HAS
          </span>
          <span className="brand-bridge-stage__signals-payoff">
            SIGNALS.
          </span>
        </p>
      ) : (
        <p className="brand-bridge-stage__message" key={phase.id}>
          {phase.copy}
        </p>
      )}
    </section>
  );
}

export function CinematicExperience({
  onDiscover,
}: CinematicExperienceProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stage, setStage] = useState<CinematicStage>('choice');
  const [cinematicMuted, setCinematicMuted] = useState(true);
  const [cinematicReady, setCinematicReady] = useState(false);

  const startCinematic = (muted: boolean) => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.currentTime = 0;
    video.muted = muted;
    video.volume = 1;
    setCinematicMuted(muted);
    setStage('cinematic');

    const playback = video.play();

    if (playback) {
      playback.catch(() => {
        video.pause();
        setStage('choice');
      });
    }
  };

  useEffect(() => {
    if (stage !== 'cinematicHold') {
      return;
    }

    const holdTimer = window.setTimeout(() => {
      setStage('bridge');
    }, CINEMATIC_FINAL_HOLD_MS);

    return () => {
      window.clearTimeout(holdTimer);
    };
  }, [stage]);

  if (stage === 'bridge') {
    return (
      <SignalBridgeStage
        onComplete={() => {
          setStage('intro');
        }}
      />
    );
  }

  if (stage === 'intro') {
    return <BrandIntroScreen onDiscover={onDiscover} />;
  }

  return (
    <section
      className={[
        'cinematic-experience',
        stage === 'choice' ? 'cinematic-experience--choice' : '',
        stage === 'cinematicHold' ? 'cinematic-experience--hold' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Lead Clickz cinematic"
    >
      {stage === 'choice' && (
        <div
          className="cinematic-sound-choice"
          aria-label="Choose opening cinematic sound"
        >
          <div className="cinematic-sound-choice__actions">
            <button
              className="activation-screen__button cinematic-sound-choice__primary lead-clickz-primary-button"
              type="button"
              onClick={() => startCinematic(false)}
            >
              <PrimaryButtonPerimeter />
              EXPERIENCE WITH SOUND
            </button>
            <button
              className="cinematic-sound-choice__secondary"
              type="button"
              onClick={() => startCinematic(true)}
            >
              CONTINUE MUTED
            </button>
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        className={[
          'cinematic-experience__video',
          cinematicReady ? 'cinematic-experience__video--ready' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        src={CINEMATIC_MEDIA_PATH}
        muted={cinematicMuted}
        playsInline
        preload="auto"
        aria-hidden="true"
        onCanPlay={() => setCinematicReady(true)}
        onError={() => {
          if (stage !== 'choice') {
            setStage('bridge');
          }
        }}
        onEnded={() => setStage('cinematicHold')}
      />
    </section>
  );
}