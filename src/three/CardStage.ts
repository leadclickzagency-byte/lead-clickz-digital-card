import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { buildCard, CARD_H, CARD_W, glowTexture, type CardMesh, type CardTextures } from './cardModel';

export type StageMode = 'ambient' | 'warp' | 'card';
export type CardFace = 'front' | 'back';

type Insets = { top: number; bottom: number };

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const damp = (current: number, target: number, lambda: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt));

/* ── Signal field: drifting points of light, the "market signals" ──── */

function createSignalField(count: number) {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 26;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
    positions[i * 3 + 2] = -22 + Math.random() * 26;
    seeds[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uTravel: { value: 0 },
      uPixelRatio: { value: 1 },
      uOpacity: { value: 0 },
      uWarp: { value: 0 },
    },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime;
      uniform float uTravel;
      uniform float uPixelRatio;
      uniform float uWarp;
      varying float vSeed;
      varying float vFade;
      void main() {
        vec3 p = position;
        p.z = mod(p.z + 22.0 + uTravel * (0.6 + aSeed), 26.0) - 22.0;
        p.x += sin(uTime * 0.2 + aSeed * 40.0) * 0.25;
        p.y += cos(uTime * 0.17 + aSeed * 30.0) * 0.25;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float size = mix(1.4, 4.4, aSeed * aSeed) * (1.0 + uWarp * 1.6);
        gl_PointSize = size * uPixelRatio * (14.0 / -mv.z);
        vSeed = aSeed;
        vFade = smoothstep(-22.0, -14.0, p.z) * (1.0 - smoothstep(1.0, 4.0, p.z));
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uOpacity;
      varying float vSeed;
      varying float vFade;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        float a = smoothstep(0.5, 0.0, d);
        a = pow(a, 1.6);
        float twinkle = 0.55 + 0.45 * sin(uTime * (1.2 + vSeed * 3.0) + vSeed * 50.0);
        vec3 blue = vec3(0.008, 0.48, 1.0);
        vec3 cyan = vec3(0.13, 0.83, 0.93);
        vec3 ice = vec3(0.81, 0.99, 1.0);
        vec3 col = mix(blue, cyan, smoothstep(0.3, 0.8, vSeed));
        col = mix(col, ice, step(0.94, vSeed));
        gl_FragColor = vec4(col * 1.6, a * twinkle * vFade * uOpacity);
      }
    `,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return { points, material: mat };
}

/* ── Card assembly particles: converge from space onto the card ─────── */

function createAssembly(count: number) {
  const start = new Float32Array(count * 3);
  const target = new Float32Array(count * 3);
  const delay = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const dir = new THREE.Vector3().randomDirection().multiplyScalar(4 + Math.random() * 7);
    start.set([dir.x, dir.y * 0.7, dir.z * 0.6 + 2], i * 3);
    // Bias targets towards the card's perimeter so the outline draws first
    const edge = Math.random() < 0.45;
    let x = (Math.random() - 0.5) * CARD_W;
    let y = (Math.random() - 0.5) * CARD_H;
    if (edge) {
      if (Math.random() < 0.5) x = Math.sign(x || 1) * CARD_W * 0.5;
      else y = Math.sign(y || 1) * CARD_H * 0.5;
    }
    target.set([x, y, (Math.random() - 0.5) * 0.06], i * 3);
    delay[i] = Math.random() * 0.45 + (edge ? 0 : 0.15);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(target, 3));
  geo.setAttribute('aStart', new THREE.BufferAttribute(start, 3));
  geo.setAttribute('aDelay', new THREE.BufferAttribute(delay, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uProgress: { value: 0 },
      uBurst: { value: 0 },
      uPixelRatio: { value: 1 },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aStart;
      attribute float aDelay;
      uniform float uProgress;
      uniform float uBurst;
      uniform float uPixelRatio;
      varying float vAlpha;
      void main() {
        float t = clamp((uProgress - aDelay) / 0.55, 0.0, 1.0);
        t = 1.0 - pow(1.0 - t, 3.0);
        vec3 p = mix(aStart, position, t);
        vec3 out_dir = normalize(position + vec3(0.0, 0.0, 1.2) + 0.001);
        p += out_dir * uBurst * (2.0 + aDelay * 6.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (2.0 + 3.0 * (1.0 - t)) * uPixelRatio * (12.0 / -mv.z);
        vAlpha = smoothstep(0.0, 0.15, uProgress - aDelay) * (1.0 - uBurst);
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vec3(0.55, 0.95, 1.0) * 2.2, a * vAlpha);
      }
    `,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return { points, material: mat };
}

/* ── Lightning ─────────────────────────────────────────────────────── */

class Lightning {
  readonly group = new THREE.Group();
  private core: THREE.Mesh;
  private halo: THREE.Mesh;
  private from = new THREE.Vector3();
  private to = new THREE.Vector3();
  private life = 0;
  private duration = 0;
  private reshapeTimer = 0;

  constructor() {
    const coreMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(2.4, 3.2, 3.6),
      transparent: true,
      toneMapped: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const haloMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0.1, 0.6, 2.2),
      transparent: true,
      opacity: 0.35,
      toneMapped: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.core = new THREE.Mesh(new THREE.BufferGeometry(), coreMat);
    this.halo = new THREE.Mesh(new THREE.BufferGeometry(), haloMat);
    this.group.add(this.halo, this.core);
    this.group.visible = false;
  }

  strike(from: THREE.Vector3, to: THREE.Vector3, duration: number) {
    this.from.copy(from);
    this.to.copy(to);
    this.life = 0;
    this.duration = duration;
    this.group.visible = true;
    this.reshape();
  }

  private reshape() {
    const pts: THREE.Vector3[] = [this.from.clone(), this.to.clone()];
    let jitter = this.from.distanceTo(this.to) * 0.18;
    for (let pass = 0; pass < 5; pass++) {
      const next: THREE.Vector3[] = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        const mid = a.clone().lerp(b, 0.5);
        mid.x += (Math.random() - 0.5) * jitter;
        mid.y += (Math.random() - 0.5) * jitter * 0.4;
        mid.z += (Math.random() - 0.5) * jitter * 0.5;
        next.push(a, mid);
      }
      next.push(pts[pts.length - 1]);
      pts.splice(0, pts.length, ...next);
      jitter *= 0.55;
    }
    const path = new THREE.CurvePath<THREE.Vector3>();
    for (let i = 0; i < pts.length - 1; i++) path.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
    this.core.geometry.dispose();
    this.halo.geometry.dispose();
    this.core.geometry = new THREE.TubeGeometry(path, pts.length * 2, 0.012, 4, false);
    this.halo.geometry = new THREE.TubeGeometry(path, pts.length, 0.05, 5, false);
  }

  update(dt: number) {
    if (!this.group.visible) return;
    this.life += dt;
    this.reshapeTimer += dt;
    if (this.reshapeTimer > 0.055) {
      this.reshapeTimer = 0;
      this.reshape();
    }
    const t = this.life / this.duration;
    const flicker = 0.6 + Math.random() * 0.4;
    const fade = t < 0.15 ? t / 0.15 : 1 - easeOutCubic((t - 0.15) / 0.85);
    (this.core.material as THREE.MeshBasicMaterial).opacity = fade * flicker;
    (this.halo.material as THREE.MeshBasicMaterial).opacity = 0.35 * fade * flicker;
    if (t >= 1) this.group.visible = false;
  }
}

/* ── PSX orbit rings ───────────────────────────────────────────────── */

function createOrbits(sparkTex: THREE.Texture) {
  const group = new THREE.Group();
  const rings: Array<{ curve: THREE.EllipseCurve; holder: THREE.Group; sparks: THREE.Sprite[]; speed: number; offset: number }> = [];
  const defs = [
    { rx: 2.75, ry: 1.25, tilt: [1.18, 0, -0.22], speed: 0.09, color: 0x22d3ee, opacity: 0.5 },
    { rx: 2.45, ry: 1.55, tilt: [1.32, 0.35, 0.42], speed: -0.065, color: 0x027bff, opacity: 0.45 },
  ] as const;
  for (const def of defs) {
    const holder = new THREE.Group();
    holder.rotation.set(def.tilt[0], def.tilt[1], def.tilt[2]);
    const curve = new THREE.EllipseCurve(0, 0, def.rx, def.ry, 0, Math.PI * 2, false, 0);
    const pts = curve.getPoints(160).map((p) => new THREE.Vector3(p.x, p.y, 0));
    const line = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: def.color, transparent: true, opacity: def.opacity, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    holder.add(line);
    const sparks: THREE.Sprite[] = [];
    for (let i = 0; i < 2; i++) {
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: sparkTex, color: new THREE.Color(1.6, 2.2, 2.4), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
      );
      s.scale.setScalar(i === 0 ? 0.32 : 0.2);
      holder.add(s);
      sparks.push(s);
    }
    group.add(holder);
    rings.push({ curve, holder, sparks, speed: def.speed, offset: Math.random() });
  }
  return { group, rings };
}

/* ── The stage ─────────────────────────────────────────────────────── */

export class CardStage {
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  private composer: EffectComposer;
  private bloomComposer: EffectComposer;
  private bloom: UnrealBloomPass;
  /** Selective bloom: what each object looks like in the glow pass (null = hidden). */
  private bloomLook = new Map<THREE.Object3D, THREE.Material | THREE.Material[] | null>();
  private savedLook = new Map<THREE.Object3D, THREE.Material | THREE.Material[]>();
  private hiddenForBloom: THREE.Object3D[] = [];
  private blackMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  private clock = new THREE.Timer();
  private frame = 0;
  private disposed = false;
  private paused = false;

  private field = createSignalField(1600);
  private assembly = createAssembly(2600);
  private lightning = [new Lightning(), new Lightning(), new Lightning(), new Lightning()];
  private sparkTex = glowTexture();
  private orbits = createOrbits(this.sparkTex);
  private backGlow: THREE.Sprite;
  private flash: THREE.Sprite;
  private shock: THREE.Mesh;

  private pivot = new THREE.Group(); // gestures + idle
  private tiltRig = new THREE.Group(); // gyro / pointer parallax
  private card: CardMesh | null = null;
  private cardGlowFront: THREE.MeshBasicMaterial | null = null;
  private cardGlowBack: THREE.MeshBasicMaterial | null = null;
  private cardGlowEdge: THREE.MeshBasicMaterial | null = null;

  private mode: StageMode = 'ambient';
  private insets: Insets = { top: 0, bottom: 0 };
  private width = 1;
  private height = 1;
  private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Motion state
  private time = 0;
  private travel = 0;
  private travelSpeed = 0.6;
  private warp = 0;
  private fieldOpacity = 0;
  private revealT = -1;
  private igniteT = -1;
  private shockT = -1;
  private flashLevel = 0;
  private voiceLevel = 0;
  private rotY = 0;
  private rotX = 0;
  private targetRotY = 0;
  private targetRotX = 0;
  private tiltX = 0;
  private tiltY = 0;
  private gyroX = 0;
  private gyroY = 0;
  private hoverX = 0;
  private hoverY = 0;
  private cardPresence = 0;
  private face: CardFace = 'front';

  // Gesture state
  private dragging = false;
  private dragMoved = 0;
  private dragStart = 0;
  private lastX = 0;
  private lastY = 0;
  private velocity = 0;
  private activePointer: number | null = null;

  onFaceChange?: (face: CardFace) => void;
  onRevealed?: () => void;

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.setClearColor(0x020409, 1);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.scene.environmentIntensity = 0.7;
    this.scene.background = new THREE.Color(0x020409);
    this.scene.fog = new THREE.Fog(0x020409, 24, 44);

    this.camera.position.set(0, 0, 12);

    // Lights
    this.scene.add(new THREE.AmbientLight(0xeef4ff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 0.75);
    key.position.set(-3, 4, 6);
    this.scene.add(key);
    const rimL = new THREE.PointLight(0x027bff, 18, 12, 2);
    rimL.position.set(-4.5, 1.2, -1.5);
    const rimR = new THREE.PointLight(0x22d3ee, 14, 12, 2);
    rimR.position.set(4.5, -1.4, -1.2);
    this.scene.add(rimL, rimR);

    // Backdrop glow
    this.backGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: glowTexture('rgba(34,211,238,0.55)', 'rgba(2,123,255,0.22)', 256), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }),
    );
    this.backGlow.scale.set(11, 7, 1);
    this.backGlow.position.z = -2.4;
    this.scene.add(this.backGlow);

    this.flash = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: glowTexture('rgba(255,255,255,1)', 'rgba(127,239,255,0.6)', 256), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, toneMapped: false }),
    );
    this.flash.scale.set(7, 7, 1);
    this.flash.position.z = 0.6;
    this.scene.add(this.flash);

    this.shock = new THREE.Mesh(
      new THREE.RingGeometry(0.96, 1, 96),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 1.6, 2.2), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide }),
    );
    this.scene.add(this.shock);

    this.scene.add(this.field.points);
    this.lightning.forEach((l) => this.scene.add(l.group));

    this.tiltRig.add(this.pivot);
    this.scene.add(this.tiltRig);
    this.pivot.add(this.assembly.points);
    this.assembly.points.visible = false;

    this.orbits.group.visible = false;
    this.tiltRig.add(this.orbits.group);

    // Post-processing
    // Selective bloom: a glow-only render (emissive art, edges, lightning, sparks) is blurred and
    // added over the normal render, so the pearl face stays crisp while the energy glows.
    const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    const glowTarget = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType });
    this.bloomComposer = new EffectComposer(this.renderer, glowTarget);
    this.bloomComposer.renderToScreen = false;
    this.bloomComposer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 1.1, 0.5, 0);
    this.bloomComposer.addPass(this.bloom);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    const mix = new ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: { baseTexture: { value: null }, bloomTexture: { value: this.bloomComposer.renderTarget2.texture } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'uniform sampler2D baseTexture; uniform sampler2D bloomTexture; varying vec2 vUv; void main(){ gl_FragColor = texture2D(baseTexture, vUv) + vec4(texture2D(bloomTexture, vUv).rgb, 0.0); }',
      }),
      'baseTexture',
    );
    mix.needsSwap = true;
    this.composer.addPass(mix);
    this.composer.addPass(new OutputPass());
    this.bloomLook.set(this.backGlow, null);
    this.bloomLook.set(this.flash, null);

    this.bindInput();
    this.resize();
    this.loop();
  }

  /* ── Public API ─────────────────────────────────────────────────── */

  setCard(textures: CardTextures) {
    if (this.card) {
      this.pivot.remove(this.card.group);
      this.card.materials.forEach((m) => m.dispose());
    }
    this.card = buildCard(textures);
    const [body, front, back] = this.card.group.children as THREE.Mesh[];
    const glowFace = (map: THREE.Texture, k: number) =>
      new THREE.MeshBasicMaterial({ map, color: new THREE.Color(k, k, k), transparent: true });
    this.cardGlowFront = glowFace(textures.frontGlow, 0.9);
    this.cardGlowBack = glowFace(textures.backGlow, 1.15);
    this.cardGlowEdge = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.05, 0.55, 2.4), transparent: true });
    this.bloomLook.set(body, [this.blackMaterial, this.cardGlowEdge]);
    this.bloomLook.set(front, this.cardGlowFront);
    this.bloomLook.set(back, this.cardGlowBack);
    this.card.group.visible = this.mode === 'card' && this.revealT < 0;
    this.pivot.add(this.card.group);
  }

  /** Hide the card again (e.g. before replaying the intro). */
  reset() {
    this.mode = 'ambient';
    this.revealT = -1;
    this.cardPresence = 0;
    this.targetRotY = this.rotY = 0;
    this.face = 'front';
    if (this.card) this.card.group.visible = false;
    this.assembly.points.visible = false;
  }

  setMode(mode: StageMode) {
    this.mode = mode;
  }

  setInsets(insets: Insets) {
    this.insets = insets;
    this.resize();
  }

  setVoiceLevel(level: number) {
    this.voiceLevel = clamp(level, 0, 1);
  }

  setPaused(paused: boolean) {
    this.paused = paused;
    if (!paused) this.clock.reset?.();
  }

  /** Lightning strike, particle assembly and spin-in. */
  reveal() {
    if (!this.card) return;
    this.mode = 'card';
    if (this.reducedMotion) {
      this.card.group.visible = true;
      this.cardPresence = 1;
      this.setCardOpacity(1);
      this.orbits.group.visible = true;
      this.onRevealed?.();
      return;
    }
    this.revealT = 0;
    this.card.group.visible = false;
    this.cardPresence = 0;
    this.rotY = -Math.PI * 2.5;
    this.targetRotY = 0;
    this.face = 'front';
    this.assembly.points.visible = true;
    this.assembly.material.uniforms.uProgress.value = 0;
    this.assembly.material.uniforms.uBurst.value = 0;
    this.lightning[0].strike(new THREE.Vector3(0.6, 9, -1), new THREE.Vector3(0.05, 0.1, 0.3), 0.55);
    this.lightning[1].strike(new THREE.Vector3(-0.8, 8, -2), new THREE.Vector3(-0.2, 0.0, 0.2), 0.42);
    this.flashLevel = 1;
    this.shockT = 0;
  }

  flip() {
    this.targetRotY += Math.PI;
    this.updateFace();
  }

  showFace(face: CardFace) {
    const k = Math.round(this.targetRotY / Math.PI);
    const isBack = Math.abs(k % 2) === 1;
    if ((face === 'back') !== isBack) this.flip();
  }

  /** Celebration when a contact is saved: arcs leap off the card's corners. */
  ignite() {
    this.igniteT = 0;
    this.flashLevel = 0.9;
    this.shockT = 0;
    const corners = [
      [-CARD_W / 2, CARD_H / 2],
      [CARD_W / 2, CARD_H / 2],
      [CARD_W / 2, -CARD_H / 2],
      [-CARD_W / 2, -CARD_H / 2],
    ];
    corners.forEach(([x, y], i) => {
      const from = new THREE.Vector3(x, y, 0).applyMatrix4(this.pivot.matrixWorld);
      const to = new THREE.Vector3(x * 2.3, y * 3.2, (Math.random() - 0.5) * 2);
      this.lightning[i].strike(from, to, 0.7 + Math.random() * 0.3);
    });
  }

  setGyro(beta: number | null, gamma: number | null) {
    if (beta == null || gamma == null) return;
    // Phones are usually held ~45° from vertical; treat that as neutral.
    this.gyroX = clamp(((beta - 45) / 45) * 0.28, -0.32, 0.32);
    this.gyroY = clamp((gamma / 45) * 0.36, -0.4, 0.4);
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.width = w;
    this.height = h;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.bloomComposer.setSize(w, h);
    this.bloom.resolution.set(w / 2, h / 2);
    const pr = this.renderer.getPixelRatio();
    this.field.material.uniforms.uPixelRatio.value = pr;
    this.assembly.material.uniforms.uPixelRatio.value = pr;

    const aspect = w / h;
    this.camera.aspect = aspect;
    const tan = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const avail = Math.max(120, h - this.insets.top - this.insets.bottom);
    const availFrac = avail / h;
    const widthFill = aspect < 0.8 ? 0.9 : 0.62;
    const dW = CARD_W / widthFill / (2 * tan * aspect);
    const dH = CARD_H / 0.7 / (2 * tan * availFrac);
    this.camera.position.z = Math.max(dW, dH);
    this.camera.setViewOffset(w, h, 0, (this.insets.bottom - this.insets.top) / 2, w, h);
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.unbindInput();
    this.composer.dispose();
    this.bloomComposer.dispose();
    this.renderer.dispose();
  }

  /* ── Input ──────────────────────────────────────────────────────── */

  private onPointerDown = (e: PointerEvent) => {
    if (this.mode !== 'card' || this.revealT >= 0) return;
    this.activePointer = e.pointerId;
    this.dragging = true;
    this.dragMoved = 0;
    this.dragStart = performance.now();
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.velocity = 0;
    this.canvas.setPointerCapture?.(e.pointerId);
  };

  private onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && !this.dragging) {
      this.hoverX = (e.clientY / this.height - 0.5) * 0.3;
      this.hoverY = (e.clientX / this.width - 0.5) * 0.4;
    }
    if (!this.dragging || e.pointerId !== this.activePointer) return;
    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.dragMoved += Math.abs(dx) + Math.abs(dy);
    const k = 7.5 / Math.max(this.width, 320);
    this.targetRotY += dx * k;
    this.rotY += dx * k;
    this.targetRotX = clamp(this.targetRotX + dy * k * 0.6, -0.55, 0.55);
    this.velocity = dx * k;
  };

  private onPointerUp = (e: PointerEvent) => {
    if (!this.dragging || e.pointerId !== this.activePointer) return;
    this.dragging = false;
    this.activePointer = null;
    const quick = performance.now() - this.dragStart < 320;
    if (this.dragMoved < 8 && quick) {
      this.flip();
    } else {
      const projected = this.targetRotY + this.velocity * 9;
      this.targetRotY = Math.round(projected / Math.PI) * Math.PI;
      this.updateFace();
    }
    this.targetRotX = 0;
  };

  private onPointerLeave = () => {
    this.hoverX = 0;
    this.hoverY = 0;
  };

  private onVisibility = () => {
    this.setPaused(document.hidden);
  };

  private onResize = () => this.resize();

  private bindInput() {
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
    this.canvas.addEventListener('pointerleave', this.onPointerLeave);
    document.addEventListener('visibilitychange', this.onVisibility);
    window.addEventListener('resize', this.onResize);
  }

  private unbindInput() {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
    this.canvas.removeEventListener('pointerleave', this.onPointerLeave);
    document.removeEventListener('visibilitychange', this.onVisibility);
    window.removeEventListener('resize', this.onResize);
  }

  private updateFace() {
    const k = Math.round(this.targetRotY / Math.PI);
    const face: CardFace = Math.abs(k % 2) === 1 ? 'back' : 'front';
    if (face !== this.face) {
      this.face = face;
      this.onFaceChange?.(face);
    }
  }

  private setCardOpacity(o: number) {
    if (!this.card) return;
    for (const m of this.card.materials) {
      const transparent = o < 0.999;
      if (m.transparent !== transparent) {
        m.transparent = transparent;
        m.needsUpdate = true;
      }
      m.opacity = o;
    }
    for (const g of [this.cardGlowFront, this.cardGlowBack, this.cardGlowEdge]) if (g) g.opacity = o;
  }

  private renderBloom() {
    const bg = this.scene.background;
    this.scene.background = null;
    this.scene.traverseVisible((obj) => {
      if (!this.bloomLook.has(obj)) return;
      const look = this.bloomLook.get(obj);
      if (look === null) {
        this.hiddenForBloom.push(obj);
        return;
      }
      const o = obj as THREE.Mesh;
      this.savedLook.set(o, o.material);
      o.material = look!;
    });
    this.hiddenForBloom.forEach((o) => (o.visible = false));
    this.renderer.setClearColor(0x000000, 1);
    this.bloomComposer.render();
    this.renderer.setClearColor(0x020409, 1);
    this.hiddenForBloom.forEach((o) => (o.visible = true));
    this.hiddenForBloom.length = 0;
    this.savedLook.forEach((m, o) => ((o as THREE.Mesh).material = m));
    this.savedLook.clear();
    this.scene.background = bg;
  }

  /* ── Frame loop ─────────────────────────────────────────────────── */

  private loop = () => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.loop);
    if (this.paused) return;
    this.clock.update();
    const dt = Math.min(this.clock.getDelta(), 0.1);
    this.time += dt;
    this.update(dt);
    this.renderBloom();
    this.composer.render(dt);
  };

  private update(dt: number) {
    const t = this.time;
    const inCard = this.mode === 'card';

    // Signal field
    const warpTarget = this.mode === 'warp' ? 1 : 0;
    this.warp = damp(this.warp, warpTarget, 2.2, dt);
    const speedTarget = this.mode === 'warp' ? 9 : inCard ? 0.35 : 0.9;
    this.travelSpeed = damp(this.travelSpeed, speedTarget, 1.6, dt);
    this.travel += this.travelSpeed * dt;
    this.fieldOpacity = damp(this.fieldOpacity, inCard ? 0.75 : 1, 1.5, dt);
    const fu = this.field.material.uniforms;
    fu.uTime.value = t;
    fu.uTravel.value = this.travel;
    fu.uWarp.value = this.warp;
    fu.uOpacity.value = this.fieldOpacity;

    // Reveal timeline
    if (this.revealT >= 0 && this.card) {
      this.revealT += dt;
      const r = this.revealT;
      this.assembly.material.uniforms.uProgress.value = clamp(r / 1.35, 0, 1.1);
      this.assembly.material.uniforms.uBurst.value = easeOutCubic(clamp((r - 1.45) / 0.9, 0, 1));
      const presence = easeInOutCubic(clamp((r - 1.05) / 0.6, 0, 1));
      this.cardPresence = presence;
      this.card.group.visible = presence > 0.001;
      this.setCardOpacity(presence);
      this.rotY = damp(this.rotY, this.targetRotY, 2.6, dt);
      if (r > 1.0 && r - dt <= 1.0) {
        this.lightning[2].strike(new THREE.Vector3(-0.4, 7, -1), new THREE.Vector3(0, 0, 0.2), 0.38);
        this.flashLevel = Math.max(this.flashLevel, 0.8);
        this.shockT = 0;
        this.orbits.group.visible = true;
      }
      if (r > 2.6) {
        this.revealT = -1;
        this.assembly.points.visible = false;
        this.setCardOpacity(1);
        this.onRevealed?.();
      }
    }

    // Ignite celebration
    let igniteBoost = 0;
    if (this.igniteT >= 0) {
      this.igniteT += dt;
      igniteBoost = Math.max(0, 1 - this.igniteT / 1.6);
      if (this.igniteT > 0.35 && this.igniteT - dt <= 0.35) {
        this.lightning[0].strike(new THREE.Vector3(1.75, 1, 0), new THREE.Vector3(3.9, 3.2, -1), 0.6);
        this.lightning[1].strike(new THREE.Vector3(-1.75, -1, 0), new THREE.Vector3(-4, -3.1, -1), 0.6);
      }
      if (this.igniteT > 1.6) this.igniteT = -1;
    }

    this.lightning.forEach((l) => l.update(dt));

    // Card motion
    const idle = this.reducedMotion ? 0 : 1;
    if (this.revealT < 0) {
      this.rotY = damp(this.rotY, this.targetRotY, this.dragging ? 30 : 5.5, dt);
    }
    this.rotX = damp(this.rotX, this.targetRotX, 6, dt);
    this.tiltX = damp(this.tiltX, this.gyroX + this.hoverX, 4, dt);
    this.tiltY = damp(this.tiltY, this.gyroY + this.hoverY, 4, dt);
    this.pivot.rotation.set(this.rotX + Math.sin(t * 0.7) * 0.045 * idle, this.rotY + Math.sin(t * 0.45) * 0.07 * idle, Math.sin(t * 0.33) * 0.012 * idle);
    this.pivot.position.y = Math.sin(t * 0.9) * 0.05 * idle;
    this.tiltRig.rotation.set(this.tiltX, this.tiltY, 0);
    const scale = inCard ? 0.82 + 0.18 * easeOutCubic(this.cardPresence) : 0.82;
    this.pivot.scale.setScalar(scale + igniteBoost * 0.05);

    // The card holds a steady edge glow; only the save-contact burst brightens it.
    // (SPARC is the one who speaks, so the card never reacts to his voice.)
    if (this.card) {
      this.card.edgeMaterial.emissiveIntensity = 1.8 + igniteBoost * 6;
      const e = 0.95 + igniteBoost * 4;
      this.cardGlowEdge?.color.setRGB(0.04 * e, 0.45 * e, 2 * e);
    }

    // Orbits
    this.orbits.group.rotation.z = Math.sin(t * 0.1) * 0.1;
    const orbitSpeed = 1 + igniteBoost * 6;
    for (const ring of this.orbits.rings) {
      ring.offset += ring.speed * dt * orbitSpeed;
      ring.sparks.forEach((s, i) => {
        const u = (((ring.offset + i * 0.5) % 1) + 1) % 1;
        const p = ring.curve.getPoint(u);
        s.position.set(p.x, p.y, 0);
      });
    }
    const orbitTarget = inCard ? 1 : 0;
    this.orbits.group.scale.setScalar(damp(this.orbits.group.scale.x || 0.001, orbitTarget * (1 + igniteBoost * 0.12), 3, dt) || 0.001);

    // Backdrop + flash + shockwave
    const glowMat = this.backGlow.material as THREE.SpriteMaterial;
    glowMat.opacity = damp(glowMat.opacity, inCard ? 0.5 + igniteBoost * 0.5 : 0.18, 3, dt);
    this.flashLevel = Math.max(0, this.flashLevel - dt * 3.2);
    (this.flash.material as THREE.SpriteMaterial).opacity = this.flashLevel * 0.55;
    this.bloom.strength = 1.1 + this.flashLevel * 1.2;

    if (this.shockT >= 0) {
      this.shockT += dt;
      const s = easeOutCubic(clamp(this.shockT / 1.1, 0, 1));
      this.shock.scale.setScalar(0.3 + s * 6);
      (this.shock.material as THREE.MeshBasicMaterial).opacity = (1 - s) * 0.8;
      if (this.shockT > 1.1) {
        this.shockT = -1;
        (this.shock.material as THREE.MeshBasicMaterial).opacity = 0;
      }
    }
  }
}
