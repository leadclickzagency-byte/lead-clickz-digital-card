import { useCallback, useEffect, useRef, useState } from 'react';
import type { LeadClickzProfile } from '@/data/profiles';
import { CardStage, type CardFace } from '@/three/CardStage';
import { paintCardArt, type CardArt } from '@/three/cardArt';
import { makeCardTextures, type CardTextures } from '@/three/cardModel';
import { setMusicLevel, startMusic, unlockSound } from '@/sound';
import { Cinematic, IgniteGate, SignalBridge } from './Intro';
import { CardScreen } from './CardScreen';

type Phase = 'gate' | 'cinematic' | 'bridge' | 'card';

type OrientationCtor = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<'granted' | 'denied'> };

export function Experience({ profile }: { profile: LeadClickzProfile }) {
  const params = new URLSearchParams(window.location.search);
  const arDeepLink = params.get('ar') === '1';
  const skipIntro = arDeepLink || params.get('intro') === '0';

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<CardStage | null>(null);
  const [textures, setTextures] = useState<CardTextures | null>(null);
  const [art, setArt] = useState<CardArt | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);
  const [phase, setPhase] = useState<Phase>(skipIntro ? 'card' : 'gate');
  const [sound, setSound] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [face, setFace] = useState<CardFace>('front');
  const [fallbackFlipped, setFallbackFlipped] = useState(false);
  const revealStarted = useRef(false);
  const gyroBound = useRef(false);

  // 3D stage
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let s: CardStage;
    try {
      s = new CardStage(canvas);
    } catch {
      setWebglFailed(true);
      return;
    }
    s.onFaceChange = setFace;
    s.onRevealed = () => setRevealed(true);
    setStage(s);
    (window as unknown as { __lcStage?: CardStage }).__lcStage = s;
    return () => {
      s.dispose();
      setStage(null);
    };
  }, []);

  // Paint the card art once fonts are ready
  useEffect(() => {
    let cancelled = false;
    void paintCardArt(profile).then((a) => {
      if (!cancelled) setArt(a);
    });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  useEffect(() => {
    if (!stage || !art) return;
    const t = makeCardTextures(art, stage.renderer.capabilities.getMaxAnisotropy());
    stage.setCard(t);
    setTextures(t);
  }, [stage, art]);

  // Stage mode per phase
  useEffect(() => {
    if (!stage) return;
    if (phase === 'gate' || phase === 'cinematic') stage.setMode('ambient');
  }, [stage, phase]);

  // Reveal once the card is ready
  useEffect(() => {
    if (phase !== 'card') return;
    if (webglFailed && art) {
      setRevealed(true);
      return;
    }
    if (!stage || !textures || revealStarted.current) return;
    revealStarted.current = true;
    // Let the bridge's last line clear before the strike
    const t = window.setTimeout(() => stage.reveal(), skipIntro ? 250 : 120);
    return () => window.clearTimeout(t);
  }, [phase, stage, textures, webglFailed, art, skipIntro]);

  // Keep the card clear of the top bar and the dock
  useEffect(() => {
    if (!stage) return;
    const update = () => {
      const dockHeight = dockRef.current?.offsetHeight ?? 0;
      const bottom = phase === 'card' ? dockHeight : 0;
      stage.setInsets({ top: phase === 'card' ? 64 : 0, bottom });
    };
    update();
    const ro = new ResizeObserver(update);
    if (dockRef.current) ro.observe(dockRef.current);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [stage, phase, revealed]);

  const bindGyro = useCallback(() => {
    if (gyroBound.current || !stage) return;
    gyroBound.current = true;
    const listen = () =>
      window.addEventListener('deviceorientation', (e) => stage.setGyro(e.beta, e.gamma), { passive: true });
    const Ctor = window.DeviceOrientationEvent as OrientationCtor | undefined;
    if (Ctor?.requestPermission) {
      Ctor.requestPermission()
        .then((r) => r === 'granted' && listen())
        .catch(() => undefined);
    } else if (Ctor) {
      listen();
    }
  }, [stage]);

  // Visitors who skip the gate grant motion on their first touch
  useEffect(() => {
    if (phase !== 'card') return;
    const onFirst = () => bindGyro();
    window.addEventListener('pointerdown', onFirst, { once: true });
    return () => window.removeEventListener('pointerdown', onFirst);
  }, [phase, bindGyro]);

  const start = (withSound: boolean) => {
    setSound(withSound);
    if (withSound) unlockSound(profile.sparc[0]?.audio);
    bindGyro();
    setPhase('cinematic');
  };

  const endCinematic = useCallback(() => {
    if (sound) startMusic(0.16);
    setPhase('bridge');
  }, [sound]);

  const endBridge = useCallback(() => {
    stage?.setMode('ambient');
    if (sound) setMusicLevel(0.14);
    setPhase('card');
  }, [stage, sound]);

  const onWarp = useCallback((on: boolean) => stage?.setMode(on ? 'warp' : 'ambient'), [stage]);

  const replayIntro = () => {
    revealStarted.current = false;
    setRevealed(false);
    stage?.reset();
    setFace('front');
    setPhase('gate');
  };

  return (
    <div className={`experience experience--${phase}`}>
      <canvas ref={canvasRef} className="stage-canvas" aria-label={`3D business card for ${profile.name}. Tap to flip, drag to spin.`} role="img" />

      {webglFailed && art && phase === 'card' && (
        <button type="button" className={`card-2d ${fallbackFlipped ? 'is-flipped' : ''}`} onClick={() => setFallbackFlipped((f) => !f)} aria-label="Flip card">
          <img src={art.front.toDataURL('image/png')} alt={`${profile.name} business card, front`} className="card-2d__front" />
          <img src={art.back.toDataURL('image/png')} alt={`${profile.name} business card, back`} className="card-2d__back" />
        </button>
      )}

      {phase === 'gate' && <IgniteGate profile={profile} onStart={start} />}
      {phase === 'cinematic' && <Cinematic sound={sound} onDone={endCinematic} />}
      {phase === 'bridge' && <SignalBridge onWarp={onWarp} onDone={endBridge} />}
      {phase === 'card' && (
        <CardScreen
          profile={profile}
          stage={stage}
          textures={textures}
          revealed={revealed}
          face={face}
          highlightAr={arDeepLink}
          onReplayIntro={replayIntro}
          dockRef={dockRef}
        />
      )}
    </div>
  );
}
