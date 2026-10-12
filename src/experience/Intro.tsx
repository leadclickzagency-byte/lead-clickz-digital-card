import { useEffect, useRef, useState } from 'react';
import type { LeadClickzProfile } from '@/data/profiles';
import { BoltMark } from './Icons';
import { asset } from '@/asset';

/* ── Ignite gate: the first tap unlocks sound and motion sensors ───── */

export function IgniteGate({ profile, onStart }: { profile: LeadClickzProfile; onStart: (sound: boolean) => void }) {
  return (
    <section className="gate" aria-label="Start the Lead Clickz experience">
      <div className="gate__mark">
        <span className="gate__pulse" />
        <span className="gate__pulse gate__pulse--late" />
        <BoltMark size={112} glow />
      </div>
      <p className="gate__eyebrow">
        <img src={asset('/brand/leadclickz-wordmark-dark.png')} alt="Lead Clickz" className="gate__wordmark" />
      </p>
      <h1 className="gate__title">
        This isn’t a business card.
        <span>It’s a signal.</span>
      </h1>
      <p className="gate__sub">
        <span className="gate__chip">
          {profile.name} <i /> {profile.role}, Lead Clickz™
        </span>
      </p>
      <div className="gate__actions">
        <button type="button" className="btn btn--primary btn--xl" onClick={() => onStart(true)}>
          <span className="btn__sheen" />
          Ignite the signal
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => onStart(false)}>
          Enter silently
        </button>
      </div>
      <p className="gate__foot">
        <span className="psx-word">
          POWER <b>SPARC X</b>
        </span>
        <span>™ inside</span>
      </p>
    </section>
  );
}

/* ── Opening cinematic ─────────────────────────────────────────────── */

export function Cinematic({ sound, onDone }: { sound: boolean; onDone: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = !sound;
    v.currentTime = 0;
    const p = v.play();
    p?.catch(() => {
      // Autoplay with sound refused: retry muted, else skip ahead.
      v.muted = true;
      v.play().catch(onDone);
    });
  }, [sound, onDone]);

  return (
    <section className="cinematic" aria-label="Lead Clickz opening">
      <video
        ref={ref}
        className={`cinematic__video ${ready ? 'is-ready' : ''}`}
        src={asset('/video/lead-clickz-cinematic.mp4')}
        playsInline
        preload="auto"
        onCanPlay={() => setReady(true)}
        onEnded={onDone}
        onError={onDone}
        aria-hidden="true"
      />
      <button type="button" className="skip" onClick={onDone}>
        Skip intro
      </button>
    </section>
  );
}

/* ── Signal bridge: the brand story over the 3D signal field ───────── */

const BRIDGE = [
  { id: 'yesterday', lines: ['Yesterday…'], ms: 1100 },
  { id: 'aimed', lines: ['We aimed.'], ms: 1300 },
  { id: 'today', lines: ['Today…'], ms: 1000 },
  { id: 'power', lines: ['We strike', 'with power.'], ms: 1700, warp: true },
  { id: 'signals', lines: ['Every market', 'has signals.'], ms: 2100 },
  { id: 'question', lines: ['Can you', 'see them?'], ms: 1700 },
] as const;

export function SignalBridge({ onWarp, onDone }: { onWarp: (on: boolean) => void; onDone: () => void }) {
  const [i, setI] = useState(0);
  const phase = BRIDGE[i];

  useEffect(() => {
    onWarp('warp' in phase && phase.warp === true);
    const t = window.setTimeout(() => {
      if (i === BRIDGE.length - 1) onDone();
      else setI(i + 1);
    }, phase.ms);
    return () => window.clearTimeout(t);
  }, [i, phase, onWarp, onDone]);

  return (
    <section className={`bridge bridge--${phase.id}`} aria-label="Lead Clickz story" aria-live="polite">
      <p className="bridge__line" key={phase.id}>
        {phase.lines.map((l, n) => (
          <span key={l} className={n === phase.lines.length - 1 && phase.lines.length > 1 ? 'is-payoff' : ''}>
            {l}
          </span>
        ))}
      </p>
      <button type="button" className="skip" onClick={onDone}>
        Skip
      </button>
    </section>
  );
}
