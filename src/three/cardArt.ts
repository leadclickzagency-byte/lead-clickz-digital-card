import type { LeadClickzProfile } from '@/data/profiles';
import { asset } from '@/asset';

/**
 * Paints both faces of the card into canvases. Each face has a colour layer (map) and a glow
 * layer (emissiveMap) holding only the parts that should light up and bloom: the bolt, the
 * energy lines, the PSX orbit arcs. Art is drawn at 2048 × 1170 (3.5 × 2 card ratio).
 */

export const ART_W = 2048;
export const ART_H = 1170;

export const BRAND = {
  blue: '#027bff',
  blueDeep: '#0052ad',
  cyan: '#22d3ee',
  ice: '#cffcff',
  ink: '#2a2a2a',
  charcoal: '#433e3f',
  gray: '#615f63',
  obsidian: '#04060b',
};

export type CardArt = {
  front: HTMLCanvasElement;
  frontGlow: HTMLCanvasElement;
  /** Self-illumination for the pearl face: a dim copy of the art plus the glow layer. */
  frontLift: HTMLCanvasElement;
  back: HTMLCanvasElement;
  backGlow: HTMLCanvasElement;
};

const FONT_DISPLAY = "'Sora', 'Inter', system-ui, sans-serif";
const FONT_BODY = "'Inter', system-ui, sans-serif";
const FONT_PSX = "'Spaced', 'Sora', system-ui, sans-serif";

function canvas() {
  const c = document.createElement('canvas');
  c.width = ART_W;
  c.height = ART_H;
  return c;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

export async function ensureFonts() {
  if (!('fonts' in document)) return;
  await Promise.allSettled([
    document.fonts.load(`600 100px ${FONT_DISPLAY}`),
    document.fonts.load(`300 100px ${FONT_DISPLAY}`),
    document.fonts.load(`500 40px ${FONT_BODY}`),
    document.fonts.load(`600 40px ${FONT_BODY}`),
    document.fonts.load(`400 40px ${FONT_PSX}`),
  ]);
}

/* ── Vector brand marks ────────────────────────────────────────────── */

/** The Lead Clickz bolt, centred on (cx, cy), `h` tall. */
export function boltPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, h: number) {
  const pts: Array<[number, number]> = [
    [0.07, -0.5],
    [-0.15, 0.06],
    [0.0, 0.03],
    [-0.07, 0.5],
    [0.15, -0.07],
    [0.0, -0.04],
  ];
  ctx.beginPath();
  pts.forEach(([x, y], i) => {
    const px = cx + x * h;
    const py = cy + y * h;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
}

/** Open ring around the bolt, broken at top and bottom where the bolt passes through. */
export function ringPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const gap = 0.36;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2 + gap, Math.PI / 2 - gap);
  ctx.moveTo(cx + Math.cos(Math.PI / 2 + gap) * r, cy + Math.sin(Math.PI / 2 + gap) * r);
  ctx.arc(cx, cy, r, Math.PI / 2 + gap, (Math.PI * 3) / 2 - gap);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, tracking: number) {
  // canvas letterSpacing is not everywhere yet; draw glyph by glyph.
  let cursor = x;
  for (const ch of text) {
    ctx.fillText(ch, cursor, y);
    cursor += ctx.measureText(ch).width + tracking;
  }
  return cursor - tracking;
}

function spacedWidth(ctx: CanvasRenderingContext2D, text: string, tracking: number) {
  let w = 0;
  for (const ch of text) w += ctx.measureText(ch).width + tracking;
  return w - tracking;
}

/* ── Small line icons for the contact rows ─────────────────────────── */

function icon(ctx: CanvasRenderingContext2D, kind: 'phone' | 'office' | 'mail' | 'web', x: number, y: number, s: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = s * 0.09;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  if (kind === 'phone') {
    roundRect(ctx, -s * 0.24, -s * 0.42, s * 0.48, s * 0.84, s * 0.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-s * 0.06, s * 0.28);
    ctx.lineTo(s * 0.06, s * 0.28);
  } else if (kind === 'office') {
    ctx.moveTo(-s * 0.38, s * 0.4);
    ctx.lineTo(-s * 0.38, -s * 0.2);
    ctx.lineTo(0, -s * 0.42);
    ctx.lineTo(s * 0.38, -s * 0.2);
    ctx.lineTo(s * 0.38, s * 0.4);
    ctx.closePath();
    ctx.moveTo(-s * 0.1, s * 0.4);
    ctx.lineTo(-s * 0.1, s * 0.1);
    ctx.lineTo(s * 0.1, s * 0.1);
    ctx.lineTo(s * 0.1, s * 0.4);
  } else if (kind === 'mail') {
    roundRect(ctx, -s * 0.42, -s * 0.3, s * 0.84, s * 0.6, s * 0.08);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-s * 0.36, -s * 0.22);
    ctx.lineTo(0, s * 0.06);
    ctx.lineTo(s * 0.36, -s * 0.22);
  } else {
    ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2);
    ctx.moveTo(-s * 0.4, 0);
    ctx.lineTo(s * 0.4, 0);
    ctx.moveTo(0, -s * 0.4);
    ctx.ellipse(0, 0, s * 0.17, s * 0.4, 0, -Math.PI / 2, Math.PI * 1.5);
  }
  ctx.stroke();
  ctx.restore();
}

/* ── Faces ─────────────────────────────────────────────────────────── */

function paintFront(profile: LeadClickzProfile, wordmark: HTMLImageElement) {
  const c = canvas();
  const g = canvas();
  const ctx = c.getContext('2d')!;
  const gl = g.getContext('2d')!;
  gl.fillStyle = '#000';
  gl.fillRect(0, 0, ART_W, ART_H);

  // Pearl base
  const base = ctx.createLinearGradient(0, 0, ART_W, ART_H);
  base.addColorStop(0, '#ffffff');
  base.addColorStop(0.55, '#f6f9fd');
  base.addColorStop(1, '#e9f1fb');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, ART_W, ART_H);

  // Ice wash in the top right corner
  const wash = ctx.createRadialGradient(ART_W * 0.92, ART_H * 0.05, 0, ART_W * 0.92, ART_H * 0.05, ART_W * 0.62);
  wash.addColorStop(0, 'rgba(34,211,238,0.16)');
  wash.addColorStop(0.45, 'rgba(2,123,255,0.06)');
  wash.addColorStop(1, 'rgba(2,123,255,0)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, ART_W, ART_H);

  // Fine signal grid
  ctx.fillStyle = 'rgba(2,82,173,0.07)';
  for (let y = 40; y < ART_H; y += 44) {
    for (let x = 40; x < ART_W; x += 44) {
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Watermark ring + bolt, right side
  ctx.save();
  ctx.strokeStyle = 'rgba(2,123,255,0.07)';
  ctx.lineWidth = 46;
  ctx.lineCap = 'round';
  ringPath(ctx, ART_W * 0.86, ART_H * 0.62, 330);
  ctx.stroke();
  ctx.fillStyle = 'rgba(2,123,255,0.08)';
  boltPath(ctx, ART_W * 0.86, ART_H * 0.62, 900);
  ctx.fill();
  ctx.restore();

  // Wordmark
  const wmW = 760;
  const wmH = (wordmark.height / wordmark.width) * wmW;
  ctx.drawImage(wordmark, 140, 132, wmW, wmH);

  // Bolt in the wordmark glows: the bolt sits over the "i" at ~58.7% of the mark's width
  gl.save();
  gl.shadowColor = BRAND.cyan;
  gl.shadowBlur = 30;
  gl.fillStyle = BRAND.cyan;
  boltPath(gl, 140 + wmW * 0.587, 132 + wmH * 0.5, wmH * 0.92);
  gl.fill();
  gl.restore();

  ctx.fillStyle = BRAND.gray;
  ctx.font = `500 30px ${FONT_BODY}`;
  spaced(ctx, 'WE ACTIVATE DECISIONS', 146, 132 + wmH + 62, 7);

  // Name + title
  ctx.fillStyle = BRAND.ink;
  ctx.font = `600 122px ${FONT_DISPLAY}`;
  ctx.fillText(profile.name, 136, 690);

  ctx.fillStyle = BRAND.blue;
  ctx.font = `600 38px ${FONT_BODY}`;
  const titleEnd = spaced(ctx, profile.title.toUpperCase(), 142, 768, 9);
  ctx.fillStyle = BRAND.gray;
  ctx.font = `500 38px ${FONT_BODY}`;
  spaced(ctx, '  ·  LEAD CLICKZ™', titleEnd, 768, 6);

  // Energy divider
  const div = ctx.createLinearGradient(142, 0, 1160, 0);
  div.addColorStop(0, BRAND.blue);
  div.addColorStop(0.6, BRAND.cyan);
  div.addColorStop(1, 'rgba(34,211,238,0)');
  ctx.fillStyle = div;
  ctx.fillRect(142, 818, 1018, 5);
  gl.fillStyle = div;
  gl.fillRect(142, 818, 1018, 5);

  // Contact rows (two columns)
  const rows: Array<[Parameters<typeof icon>[1], string, string]> = [
    ['phone', 'MOBILE', profile.mobilePhone],
    ['office', 'OFFICE', profile.officePhone],
    ['mail', 'EMAIL', profile.email],
    ['web', 'WEB', profile.website.replace(/^https?:\/\//, '')],
  ];
  rows.forEach(([kind, label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 142 + col * 860;
    const y = 908 + row * 104;
    ctx.strokeStyle = BRAND.blue;
    icon(ctx, kind, x + 26, y - 14, 50);
    ctx.fillStyle = BRAND.gray;
    ctx.font = `600 22px ${FONT_BODY}`;
    spaced(ctx, label, x + 80, y - 26, 4);
    ctx.fillStyle = BRAND.charcoal;
    ctx.font = `500 40px ${FONT_BODY}`;
    ctx.fillText(value, x + 80, y + 18);
  });

  // Bottom energy edge
  const edge = ctx.createLinearGradient(0, 0, ART_W, 0);
  edge.addColorStop(0, BRAND.blueDeep);
  edge.addColorStop(0.5, BRAND.blue);
  edge.addColorStop(1, BRAND.cyan);
  ctx.fillStyle = edge;
  ctx.fillRect(0, ART_H - 18, ART_W, 18);
  gl.fillStyle = edge;
  gl.fillRect(0, ART_H - 18, ART_W, 18);

  return { color: c, glow: g };
}

function paintBack(profile: LeadClickzProfile) {
  const c = canvas();
  const g = canvas();
  const ctx = c.getContext('2d')!;
  const gl = g.getContext('2d')!;
  gl.fillStyle = '#000';
  gl.fillRect(0, 0, ART_W, ART_H);

  ctx.fillStyle = BRAND.obsidian;
  ctx.fillRect(0, 0, ART_W, ART_H);

  const cx = 560;
  const cy = 500;

  // Deep blue bloom behind the symbol
  const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, 760);
  bloom.addColorStop(0, 'rgba(2,123,255,0.42)');
  bloom.addColorStop(0.4, 'rgba(0,82,173,0.16)');
  bloom.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, ART_W, ART_H);

  // Dot grid
  ctx.fillStyle = 'rgba(127,239,255,0.07)';
  for (let y = 30; y < ART_H; y += 40) {
    for (let x = 30; x < ART_W; x += 40) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // PSX orbit arcs around the symbol (a nod to the Power SPARC X mark)
  const orbits = (target: CanvasRenderingContext2D, alpha: number) => {
    target.save();
    target.translate(cx, cy);
    target.lineWidth = 3;
    target.strokeStyle = `rgba(34,211,238,${0.55 * alpha})`;
    target.beginPath();
    target.ellipse(0, 0, 400, 170, -0.32, Math.PI * 1.05, Math.PI * 1.95);
    target.stroke();
    target.strokeStyle = `rgba(2,123,255,${0.7 * alpha})`;
    target.beginPath();
    target.ellipse(0, 0, 360, 360, 0, -0.3, 1.5);
    target.stroke();
    const sparks: Array<[number, number, number]> = [
      [Math.cos(-0.3) * 360, Math.sin(-0.3) * 360, 12],
      [Math.cos(1.5) * 360, Math.sin(1.5) * 360, 9],
      [-330, -60, 8],
    ];
    target.fillStyle = `rgba(207,252,255,${alpha})`;
    target.shadowColor = BRAND.cyan;
    target.shadowBlur = 26;
    sparks.forEach(([x, y, r]) => {
      target.beginPath();
      target.arc(x, y, r, 0, Math.PI * 2);
      target.fill();
    });
    target.restore();
  };
  orbits(ctx, 1);
  orbits(gl, 1);

  // Ring + bolt symbol
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 34;
  ringPath(ctx, cx, cy, 230);
  ctx.stroke();
  const boltFill = ctx.createLinearGradient(cx, cy - 300, cx, cy + 300);
  boltFill.addColorStop(0, BRAND.ice);
  boltFill.addColorStop(0.35, BRAND.cyan);
  boltFill.addColorStop(1, BRAND.blue);
  ctx.fillStyle = boltFill;
  boltPath(ctx, cx, cy, 620);
  ctx.fill();
  ctx.restore();

  gl.save();
  gl.lineCap = 'round';
  gl.strokeStyle = 'rgba(160,190,230,0.35)';
  gl.lineWidth = 34;
  ringPath(gl, cx, cy, 230);
  gl.stroke();
  gl.shadowColor = BRAND.cyan;
  gl.shadowBlur = 60;
  gl.fillStyle = boltFill;
  boltPath(gl, cx, cy, 620);
  gl.fill();
  gl.restore();

  // Tagline — the Lead Clickz promise, big
  const tx = 1060;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(255,255,255,0.94)';
  ctx.font = `300 98px ${FONT_DISPLAY}`;
  ctx.fillText('We don’t chase', tx, 330);
  ctx.fillText('attention.', tx, 446);
  ctx.font = `600 98px ${FONT_DISPLAY}`;
  ctx.fillStyle = BRAND.blue;
  ctx.fillText('We activate', tx, 594);
  ctx.fillText('decisions.', tx, 710);
  gl.font = ctx.font;
  gl.fillStyle = 'rgba(2,123,255,0.65)';
  gl.fillText('We activate', tx, 594);
  gl.fillText('decisions.', tx, 710);

  ctx.fillStyle = 'rgba(207,252,255,0.66)';
  ctx.font = `500 30px ${FONT_BODY}`;
  spaced(ctx, `${profile.name.toUpperCase()}  ·  ${profile.title.toUpperCase()}`, tx + 4, 820, 6);

  // Powered-by line: PSX + SPARC
  const lineY = ART_H - 150;
  const rule = ctx.createLinearGradient(140, 0, ART_W - 140, 0);
  rule.addColorStop(0, 'rgba(34,211,238,0)');
  rule.addColorStop(0.2, 'rgba(34,211,238,0.5)');
  rule.addColorStop(0.8, 'rgba(2,123,255,0.5)');
  rule.addColorStop(1, 'rgba(2,123,255,0)');
  ctx.fillStyle = rule;
  ctx.fillRect(140, lineY, ART_W - 280, 2);
  gl.fillStyle = rule;
  gl.fillRect(140, lineY, ART_W - 280, 2);

  ctx.font = `500 24px ${FONT_BODY}`;
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  let x = spaced(ctx, 'POWERED BY', 140, lineY + 78, 6) + 30;
  ctx.font = `400 46px ${FONT_PSX}`;
  ctx.fillStyle = '#ffffff';
  x = spaced(ctx, 'POWER', x, lineY + 82, 10) + 22;
  ctx.fillStyle = BRAND.blue;
  x = spaced(ctx, 'SPARC X', x, lineY + 82, 10);
  gl.font = ctx.font;
  gl.fillStyle = 'rgba(2,123,255,0.8)';
  spaced(gl, 'SPARC X', x - spacedWidth(ctx, 'SPARC X', 10), lineY + 82, 10);
  ctx.font = `500 22px ${FONT_BODY}`;
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('™', x + 6, lineY + 56);

  ctx.font = `500 24px ${FONT_BODY}`;
  ctx.fillStyle = 'rgba(207,252,255,0.6)';
  const right = 'THE MARKETING INTELLIGENCE ECOSYSTEM';
  spaced(ctx, right, ART_W - 140 - spacedWidth(ctx, right, 6), lineY + 78, 6);

  return { color: c, glow: g };
}

let wordmarkPromise: Promise<HTMLImageElement> | null = null;

export async function paintCardArt(profile: LeadClickzProfile): Promise<CardArt> {
  wordmarkPromise ??= loadImage(asset('/brand/leadclickz-wordmark-light.png'));
  const [wordmark] = await Promise.all([wordmarkPromise, ensureFonts()]);
  const front = paintFront(profile, wordmark);
  const back = paintBack(profile);
  const lift = canvas();
  const lctx = lift.getContext('2d')!;
  lctx.fillStyle = '#000';
  lctx.fillRect(0, 0, ART_W, ART_H);
  lctx.globalAlpha = 0.34;
  lctx.drawImage(front.color, 0, 0);
  lctx.globalAlpha = 1;
  lctx.globalCompositeOperation = 'lighter';
  lctx.drawImage(front.glow, 0, 0);
  return { front: front.color, frontGlow: front.glow, frontLift: lift, back: back.color, backGlow: back.glow };
}
