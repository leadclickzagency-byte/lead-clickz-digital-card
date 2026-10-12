import { useCallback, useEffect, useRef, useState } from 'react';
import type { SparcLine } from '@/data/profiles';
import { playVoice, setMusicLevel, soundEnabled, stopVoice, voiceLevel, voiceTime } from '@/sound';
import { SparcOrb, type SparcOrbState } from './SparcOrb';

type Props = {
  lines: SparcLine[];
  active: boolean;
  /** Extra one-off line (e.g. after a contact is saved). Changing `key` replays it. */
  interjection?: { key: number; text: string } | null;
  onLevel?: (level: number) => void;
};

const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

function captionAt(line: SparcLine, t: number) {
  let current = '';
  for (const c of line.captions) if (t >= c.at) current = c.text;
  return current;
}

function lineDuration(line: SparcLine) {
  const last = line.captions[line.captions.length - 1];
  return (last?.at ?? 0) + Math.max(1.6, (last?.text.length ?? 10) * 0.06);
}

/** SPARC™ speaks over the card: orb + live captions, voice-reactive when sound is on. */
export function SparcPresence({ lines, active, interjection, onLevel }: Props) {
  const [state, setState] = useState<SparcOrbState>('idle');
  const [caption, setCaption] = useState('');
  const [level, setLevel] = useState(0);
  const [done, setDone] = useState(false);
  const runId = useRef(0);
  const started = useRef(false);

  const speak = useCallback(
    async (sequence: SparcLine[]) => {
      const id = ++runId.current;
      const alive = () => id === runId.current;
      setDone(false);
      setState('thinking');
      await wait(450);
      for (const line of sequence) {
        if (!alive()) return;
        setState('speaking');
        const useAudio = !!line.audio && soundEnabled();
        if (useAudio) setMusicLevel(0.05, 0.5);
        const voice = useAudio ? playVoice(line.audio!) : null;
        const t0 = performance.now();
        const duration = lineDuration(line);
        let finished = false;
        voice?.then((ok) => {
          if (!ok) return; // fall back to the timer below
          finished = true;
        });
        await new Promise<void>((resolve) => {
          const tick = () => {
            if (!alive()) return resolve();
            const elapsed = useAudio ? voiceTime() : (performance.now() - t0) / 1000;
            setCaption(captionAt(line, elapsed));
            let l = useAudio ? voiceLevel() : 0;
            if (!useAudio || l === 0) {
              // Muted: animate a believable speech envelope so SPARC still "talks".
              const s = (performance.now() - t0) / 1000;
              l = 0.28 + 0.22 * Math.abs(Math.sin(s * 9.1)) * Math.abs(Math.sin(s * 3.3 + 1));
            }
            setLevel(l);
            onLevel?.(l);
            const timeUp = (performance.now() - t0) / 1000 > duration + (useAudio ? 2.5 : 0);
            if (finished || (!useAudio && timeUp) || (useAudio && timeUp)) return resolve();
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
        if (useAudio) setMusicLevel(0.14, 1.5);
        setLevel(0);
        onLevel?.(0);
        if (!alive()) return;
        setState('listening');
        await wait(420);
      }
      if (!alive()) return;
      setState('idle');
      await wait(2600);
      if (!alive()) return;
      setDone(true);
    },
    [onLevel],
  );

  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;
    void speak(lines);
  }, [active, lines, speak]);

  useEffect(() => {
    if (!interjection) return;
    stopVoice();
    void speak([{ captions: [{ at: 0, text: interjection.text }] }]);
  }, [interjection, speak]);

  useEffect(
    () => () => {
      runId.current++;
      stopVoice();
    },
    [],
  );

  if (!active) return null;

  return (
    <button
      type="button"
      className={`sparc ${done ? 'sparc--rest' : 'sparc--live'}`}
      onClick={() => {
        stopVoice();
        void speak(lines);
      }}
      aria-label={done ? 'Replay SPARC' : `SPARC says: ${caption}`}
    >
      <SparcOrb size={done ? 34 : 52} state={state} level={level} />
      <span className="sparc__text">
        <span className="sparc__label">
          SPARC<sup>™</sup>
          <em>{done ? 'Tap to hear again' : state === 'speaking' ? 'speaking' : 'online'}</em>
        </span>
        {!done && (
          <span className="sparc__caption" aria-live="polite">
            {caption || ' '}
          </span>
        )}
      </span>
    </button>
  );
}
