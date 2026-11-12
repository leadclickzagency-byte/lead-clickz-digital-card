import type { LeadClickzProfile } from '@/data/profiles';
import { asset } from '@/asset';

/**
 * Loads both faces of the card. The art is the printed card design (2.25 × 3.75 in, portrait),
 * exported to /public/cards as `<slug>-front.jpg` / `<slug>-back.jpg`, plus a glow layer for each
 * face (`<slug>-front-glow.png`, `<slug>-back-glow.png`) holding only the parts that should light
 * up and bloom: the bolt marks and the blue rule. Art is 1229 × 2048 (the card's 0.6 ratio).
 */

export const ART_W = 1229;
export const ART_H = 2048;

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
  backLift: HTMLCanvasElement;
};

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

function toCanvas(img: HTMLImageElement) {
  const c = canvas();
  c.getContext('2d')!.drawImage(img, 0, 0, ART_W, ART_H);
  return c;
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

/** Lifts only the white paper so it reads luminous under the scene lights; text and photos keep full contrast. */
function liftLayer(color: HTMLCanvasElement, glow: HTMLCanvasElement) {
  const lift = canvas();
  const lctx = lift.getContext('2d')!;
  const src = color.getContext('2d')!.getImageData(0, 0, ART_W, ART_H);
  const out = lctx.createImageData(ART_W, ART_H);
  const d = src.data;
  const o = out.data;
  for (let i = 0; i < d.length; i += 4) {
    const lum = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
    const k = lum > 0.86 ? ((lum - 0.86) / 0.14) * 0.42 : 0;
    o[i] = d[i] * k;
    o[i + 1] = d[i + 1] * k;
    o[i + 2] = d[i + 2] * k;
    o[i + 3] = 255;
  }
  lctx.putImageData(out, 0, 0);
  lctx.globalCompositeOperation = 'lighter';
  lctx.drawImage(glow, 0, 0);
  return lift;
}

export async function paintCardArt(profile: LeadClickzProfile): Promise<CardArt> {
  const base = asset(`/cards/${profile.slug}`);
  const [front, frontGlow, back, backGlow] = (
    await Promise.all([`${base}-front.jpg`, `${base}-front-glow.png`, `${base}-back.jpg`, `${base}-back-glow.png`].map(loadImage))
  ).map(toCanvas);
  return {
    front,
    frontGlow,
    frontLift: liftLayer(front, frontGlow),
    back,
    backGlow,
    backLift: liftLayer(back, backGlow),
  };
}
