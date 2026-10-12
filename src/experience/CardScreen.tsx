import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import type { LeadClickzProfile } from '@/data/profiles';
import { profileUrl } from '@/data/profiles';
import type { CardFace, CardStage } from '@/three/CardStage';
import type { CardTextures } from '@/three/cardModel';
import type { ArMode, WebXrHandle } from '@/ar/ar';

const loadAr = () => import('@/ar/ar');
import { setSoundEnabled, soundEnabled, unlockSound, startMusic } from '@/sound';
import { SparcPresence } from '@/sparc/SparcPresence';
import {
  BoltMark,
  IconClose,
  IconCube,
  IconFlip,
  IconGlobe,
  IconLinkedIn,
  IconMail,
  IconPhone,
  IconReplay,
  IconSave,
  IconShare,
  IconSound,
  IconText,
} from './Icons';

type Props = {
  profile: LeadClickzProfile;
  stage: CardStage | null;
  textures: CardTextures | null;
  revealed: boolean;
  face: CardFace;
  highlightAr: boolean;
  onReplayIntro: () => void;
  dockRef: React.RefObject<HTMLDivElement | null>;
};

const tel = (n: string) => `tel:+1${n.replace(/\D/g, '')}`;
const sms = (n: string) => `sms:+1${n.replace(/\D/g, '')}`;

export function CardScreen({ profile, stage, textures, revealed, face, highlightAr, onReplayIntro, dockRef }: Props) {
  const [soundOn, setSoundOn] = useState(soundEnabled());
  const [ignited, setIgnited] = useState(false);
  const [interjection, setInterjection] = useState<{ key: number; text: string } | null>(null);
  const [toast, setToast] = useState('');
  const [arMode, setArMode] = useState<ArMode | null>(null);
  const [arSheet, setArSheet] = useState(false);
  const [arQr, setArQr] = useState('');
  const [arBusy, setArBusy] = useState(false);
  const [xrStatus, setXrStatus] = useState<'off' | 'scanning' | 'placed'>('off');
  const [hintGone, setHintGone] = useState(false);
  const xrOverlay = useRef<HTMLDivElement>(null);
  const xrHandle = useRef<WebXrHandle | null>(null);

  useEffect(() => {
    void loadAr().then((ar) => ar.detectArMode()).then(setArMode);
  }, []);

  // Pre-build the USDZ so Quick Look opens instantly on tap.
  useEffect(() => {
    if (!revealed || arMode !== 'quicklook' || !textures) return;
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 600));
    idle(() => void loadAr().then((ar) => ar.prepareQuickLook(profile.slug, textures)).catch(() => undefined));
  }, [revealed, arMode, textures, profile.slug]);

  useEffect(() => {
    if (face === 'back') setHintGone(true);
  }, [face]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  const toggleSound = () => {
    if (!soundEnabled() && !soundOn) {
      unlockSound(profile.sparc[0]?.audio);
      startMusic(0.14);
      setSoundOn(true);
      return;
    }
    setSoundEnabled(!soundOn);
    setSoundOn(!soundOn);
  };

  const saveContact = () => {
    stage?.ignite();
    navigator.vibrate?.([18, 40, 28]);
    setIgnited(true);
    setInterjection({ key: Date.now(), text: `Connection ignited. ${profile.firstName} is one tap from your contacts.` });
  };

  const share = async () => {
    const url = profileUrl(profile);
    const data = { title: `${profile.name} · Lead Clickz™`, text: `${profile.name}, ${profile.title} at Lead Clickz™`, url };
    if (navigator.share) {
      try {
        await navigator.share(data);
      } catch {
        /* dismissed */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setToast('Card link copied');
    } catch {
      setToast(url);
    }
  };

  const openAr = async () => {
    if (!textures || arBusy) return;
    const { openQuickLook, prepareQuickLook, startWebXr } = await loadAr();
    if (arMode === 'quicklook') {
      setArBusy(true);
      try {
        const url = await prepareQuickLook(profile.slug, textures);
        openQuickLook(
          url,
          { title: profile.name, subtitle: `${profile.title} · Lead Clickz™`, action: 'Save Contact' },
          () => {
            window.location.href = profile.vcfPath;
          },
        );
      } catch {
        setToast('AR could not start on this device');
      } finally {
        setArBusy(false);
      }
      return;
    }
    if (arMode === 'webxr' && xrOverlay.current) {
      setArBusy(true);
      try {
        stage?.setPaused(true);
        setXrStatus('scanning');
        xrHandle.current = await startWebXr({
          textures,
          overlay: xrOverlay.current,
          onStatus: setXrStatus,
          onEnd: () => {
            setXrStatus('off');
            xrHandle.current = null;
            stage?.setPaused(false);
          },
        });
      } catch {
        setXrStatus('off');
        stage?.setPaused(false);
        setToast('AR could not start on this device');
      } finally {
        setArBusy(false);
      }
      return;
    }
    const url = `${profileUrl(profile)}?ar=1`;
    setArSheet(true);
    setArQr(await QRCode.toDataURL(url, { margin: 1, width: 360, color: { dark: '#04060b', light: '#ffffff' }, errorCorrectionLevel: 'M' }).catch(() => ''));
  };

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.userAgent));

  return (
    <>
      <header className={`topbar ${revealed ? 'is-in' : ''}`}>
        <div className="topbar__brand">
          <BoltMark size={26} />
          <img src="/brand/leadclickz-wordmark-dark.png" alt="Lead Clickz™" />
        </div>
        <div className="topbar__tools">
          <button type="button" className="icon-btn" onClick={toggleSound} aria-label={soundOn ? 'Mute sound' : 'Turn sound on'}>
            <IconSound on={soundOn} size={19} />
          </button>
          <button type="button" className="icon-btn" onClick={onReplayIntro} aria-label="Replay intro">
            <IconReplay size={19} />
          </button>
        </div>
      </header>

      <div className={`dock ${revealed ? 'is-in' : ''}`} ref={dockRef}>
        <div className="dock__meta">
          <div className="face-dots">
            <button type="button" className={face === 'front' ? 'is-on' : ''} onClick={() => stage?.showFace('front')} aria-label="Show front of card" />
            <button type="button" className={face === 'back' ? 'is-on' : ''} onClick={() => stage?.showFace('back')} aria-label="Show back of card" />
          </div>
          <span className={`card-hint ${hintGone ? 'is-gone' : ''}`}>
            <IconFlip size={15} /> Tap the card to flip · drag to spin
          </span>
        </div>
        <SparcPresence lines={profile.sparc} active={revealed} interjection={interjection} onLevel={(l) => stage?.setVoiceLevel(l)} />

        <div className="dock__panel">
          <h1 className="sr-only">
            {profile.name}, {profile.title}, Lead Clickz™
          </h1>
          <button type="button" className="btn btn--primary btn--block" onClick={saveContact}>
            <span className="btn__sheen" />
            <IconSave size={19} /> Save contact
          </button>

          <nav className="actions" aria-label="Contact actions">
            <a className="action" href={tel(profile.mobilePhone)}>
              <IconPhone /> <span>Call</span>
            </a>
            <a className="action" href={sms(profile.mobilePhone)}>
              <IconText /> <span>Text</span>
            </a>
            <a className="action" href={`mailto:${profile.email}`}>
              <IconMail /> <span>Email</span>
            </a>
            <a className="action" href={profile.website} target="_blank" rel="noreferrer">
              <IconGlobe /> <span>Website</span>
            </a>
            <a className="action" href={profile.linkedInUrl} target="_blank" rel="noreferrer">
              <IconLinkedIn /> <span>LinkedIn</span>
            </a>
            <button type="button" className="action" onClick={share}>
              <IconShare /> <span>Share</span>
            </button>
          </nav>

          <button type="button" className={`btn btn--ar btn--block ${highlightAr ? 'is-pulsing' : ''}`} onClick={openAr} disabled={arBusy}>
            <IconCube size={19} />
            <span>{arBusy ? 'Opening AR…' : 'See it in your space'}</span>
            <em>AR</em>
          </button>

          <p className="dock__powered">
            Powered by <span className="psx-word">POWER <b>SPARC X</b></span>™ · SPARC™ intelligence
          </p>
        </div>
      </div>

      {ignited && (
        <div className="ignited" role="dialog" aria-modal="true" aria-label="Connection ignited">
          <div className="ignited__panel">
            <BoltMark size={64} glow />
            <h2>Connection ignited.</h2>
            <p>You’re connected with {profile.firstName} at Lead Clickz™.</p>
            <a className="btn btn--primary btn--block" href={profile.vcfPath} download type="text/vcard">
              <span className="btn__sheen" />
              <IconSave size={19} /> Add {profile.firstName} to contacts
            </a>
            <button type="button" className="btn btn--ghost btn--block" onClick={() => setIgnited(false)}>
              Back to card
            </button>
          </div>
        </div>
      )}

      {arSheet && (
        <div className="sheet" role="dialog" aria-modal="true" aria-label="View in augmented reality" onClick={() => setArSheet(false)}>
          <div className="sheet__panel" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="icon-btn sheet__close" onClick={() => setArSheet(false)} aria-label="Close">
              <IconClose />
            </button>
            <IconCube size={30} />
            {isMobile ? (
              <>
                <h2>AR isn’t available in this browser</h2>
                <p>Open this card in Safari on iPhone or iPad, or Chrome on an ARCore Android phone, to place it on your desk.</p>
              </>
            ) : (
              <>
                <h2>See the card in your space</h2>
                <p>Scan with your phone’s camera. The card opens ready to drop onto your desk in augmented reality.</p>
                {arQr && <img className="sheet__qr" src={arQr} alt="QR code that opens this card in AR on your phone" />}
              </>
            )}
          </div>
        </div>
      )}

      <div ref={xrOverlay} className={`xr-overlay ${xrStatus !== 'off' ? 'is-on' : ''}`}>
        {xrStatus !== 'off' && (
          <>
            <div className="xr-overlay__top">
              <span className="xr-overlay__brand">
                <BoltMark size={20} /> Lead Clickz™ AR
              </span>
              <button type="button" className="icon-btn" onClick={() => xrHandle.current?.end()} aria-label="Exit AR">
                <IconClose />
              </button>
            </div>
            <p className="xr-overlay__hint">
              {xrStatus === 'scanning' ? 'Move your phone slowly to find a surface, then tap to place the card.' : 'Walk around it. Tap again to move it.'}
            </p>
          </>
        )}
      </div>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}
