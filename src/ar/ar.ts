import * as THREE from 'three';
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildCard, CARD_H, glowTexture, type CardTextures } from '@/three/cardModel';
import { boltPath, ringPath } from '@/three/cardArt';

export type ArMode = 'quicklook' | 'webxr' | 'none';

/** Real-world width of the card in AR, in metres (a desk-sized standee). */
const AR_CARD_WIDTH = 0.42;
const AR_SCALE = AR_CARD_WIDTH / 3.5;

export async function detectArMode(): Promise<ArMode> {
  const a = document.createElement('a');
  if (a.relList?.supports?.('ar')) return 'quicklook';
  const xr = (navigator as Navigator & { xr?: XRSystem }).xr;
  if (xr?.isSessionSupported) {
    try {
      if (await xr.isSessionSupported('immersive-ar')) return 'webxr';
    } catch {
      /* not supported */
    }
  }
  return 'none';
}

/* ── Shared AR model: the card standing on a glowing Lead Clickz base ── */

function baseTexture() {
  const size = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#05070c';
  ctx.fillRect(0, 0, size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(2,123,255,0.55)');
  g.addColorStop(0.6, 'rgba(2,82,173,0.15)');
  g.addColorStop(1, 'rgba(2,82,173,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = 'rgba(34,211,238,0.9)';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.46, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 26;
  ringPath(ctx, size / 2, size / 2, size * 0.2);
  ctx.stroke();
  ctx.fillStyle = '#22d3ee';
  boltPath(ctx, size / 2, size / 2, size * 0.55);
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildArModel(textures: CardTextures) {
  const root = new THREE.Group();
  root.name = 'LeadClickzAR';

  const card = buildCard(textures, { forExport: true });
  card.group.scale.setScalar(AR_SCALE);
  const lift = 0.024;
  card.group.position.y = lift + (CARD_H * AR_SCALE) / 2;
  card.group.rotation.x = -0.08; // a slight lean back, like a desk standee
  root.add(card.group);

  const baseTex = baseTexture();
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: baseTex,
    emissiveMap: baseTex,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.7,
    metalness: 0.6,
    roughness: 0.3,
  });
  const sideMat = new THREE.MeshStandardMaterial({ color: 0x0b5cff, emissive: new THREE.Color(0x027bff), emissiveIntensity: 1, metalness: 0.4, roughness: 0.3 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.16, lift, 64), [sideMat, baseMat, sideMat]);
  base.position.y = lift / 2;
  base.name = 'Base';
  root.add(base);

  return { root, card, base };
}

/* ── iOS: AR Quick Look ─────────────────────────────────────────────── */

let usdzCache: { key: string; url: string } | null = null;

export async function prepareQuickLook(key: string, textures: CardTextures) {
  if (usdzCache?.key === key) return usdzCache.url;
  const { root } = buildArModel(textures);
  const scene = new THREE.Scene();
  scene.add(root);
  scene.updateMatrixWorld(true);
  const exporter = new USDZExporter();
  const data = await exporter.parseAsync(scene, {
    maxTextureSize: 2048,
    quickLookCompatible: true,
    ar: { anchoring: { type: 'plane' }, planeAnchoring: { alignment: 'horizontal' } },
  });
  const url = URL.createObjectURL(new Blob([data], { type: 'model/vnd.usdz+zip' }));
  if (usdzCache) URL.revokeObjectURL(usdzCache.url);
  usdzCache = { key, url };
  return url;
}

export function openQuickLook(
  usdzUrl: string,
  banner: { title: string; subtitle: string; action: string },
  onAction: () => void,
) {
  const a = document.createElement('a');
  a.rel = 'ar';
  const params = new URLSearchParams({
    callToAction: banner.action,
    checkoutTitle: banner.title,
    checkoutSubtitle: banner.subtitle,
    allowsContentScaling: '1',
  });
  // Quick Look reads its options from the fragment; %20 rather than + for spaces.
  a.href = `${usdzUrl}#${params.toString().replace(/\+/g, '%20')}`;
  a.setAttribute('download', 'lead-clickz-card.usdz');
  a.appendChild(document.createElement('img'));
  const handler = (event: Event) => {
    if ((event as MessageEvent).data === '_apple_ar_quicklook_button_tapped') onAction();
  };
  a.addEventListener('message', handler, false);
  document.body.appendChild(a);
  a.click();
  window.setTimeout(() => a.remove(), 60_000);
}

/* ── Android: WebXR immersive AR with hit-test placement ────────────── */

export type WebXrHandle = { end: () => void };

export async function startWebXr(opts: {
  textures: CardTextures;
  overlay: HTMLElement;
  onStatus: (status: 'scanning' | 'placed') => void;
  onEnd: () => void;
}): Promise<WebXrHandle> {
  const xr = (navigator as Navigator & { xr?: XRSystem }).xr;
  if (!xr) throw new Error('WebXR unavailable');

  const canvas = document.createElement('canvas');
  canvas.className = 'ar-canvas';
  opts.overlay.prepend(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.xr.enabled = true;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x223355, 1.2));
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(0.5, 2, 1);
  scene.add(sun);

  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 40);

  // Reticle
  const reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.07, 0.085, 48).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.9 }),
  );
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  // Model with a floating halo and sparks
  const { root, card } = buildArModel(opts.textures);
  const spark = glowTexture();
  const halo = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.3, 0.0025, 8, 128),
    new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.7 }),
  );
  ring.rotation.x = Math.PI / 2 - 0.25;
  halo.add(ring);
  const sparks = [0, 1, 2].map((i) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: spark, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.scale.setScalar(i === 0 ? 0.06 : 0.04);
    halo.add(s);
    return s;
  });
  halo.position.y = 0.16;
  root.add(halo);
  root.visible = false;
  scene.add(root);

  let session: XRSession;
  try {
    session = await xr.requestSession('immersive-ar', {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay', 'local-floor'],
      domOverlay: { root: opts.overlay },
    } as XRSessionInit);
  } catch (err) {
    renderer.dispose();
    canvas.remove();
    throw err;
  }

  renderer.xr.setReferenceSpaceType('local');
  await renderer.xr.setSession(session);

  const viewerSpace = await session.requestReferenceSpace('viewer');
  const hitSource = await session.requestHitTestSource?.({ space: viewerSpace });
  let placed = false;
  opts.onStatus('scanning');

  session.addEventListener('select', () => {
    if (!reticle.visible) return;
    root.visible = true;
    root.position.setFromMatrixPosition(reticle.matrix);
    // Face the viewer
    const camPos = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld);
    root.rotation.y = Math.atan2(camPos.x - root.position.x, camPos.z - root.position.z);
    placed = true;
    opts.onStatus('placed');
  });

  const clock = new THREE.Timer();
  const baseCardY = card.group.position.y;
  renderer.setAnimationLoop((_time, frame) => {
    clock.update();
    const t = clock.getElapsed();
    if (frame && hitSource) {
      const refSpace = renderer.xr.getReferenceSpace();
      const hits = frame.getHitTestResults(hitSource);
      if (hits.length && refSpace) {
        const pose = hits[0].getPose(refSpace);
        if (pose) {
          reticle.visible = true;
          reticle.matrix.fromArray(pose.transform.matrix);
        }
      } else {
        reticle.visible = false;
      }
    }
    if (placed) reticle.visible = false;
    card.group.position.y = baseCardY + 0.012 + Math.sin(t * 1.4) * 0.008;
    card.group.rotation.y = Math.sin(t * 0.6) * 0.25;
    card.edgeMaterial.emissiveIntensity = 1.4 + Math.sin(t * 3) * 0.6;
    ring.rotation.z = t * 0.6;
    sparks.forEach((s, i) => {
      const a = t * (0.9 + i * 0.3) + (i * Math.PI * 2) / 3;
      s.position.set(Math.cos(a) * 0.3, Math.sin(a * 0.5) * 0.05, Math.sin(a) * 0.3);
    });
    renderer.render(scene, camera);
  });

  const cleanup = () => {
    renderer.setAnimationLoop(null);
    hitSource?.cancel();
    renderer.dispose();
    canvas.remove();
    opts.onEnd();
  };
  session.addEventListener('end', cleanup, { once: true });

  return {
    end: () => {
      session.end().catch(cleanup);
    },
  };
}
