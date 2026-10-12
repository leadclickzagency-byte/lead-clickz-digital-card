import * as THREE from 'three';
import type { CardArt } from './cardArt';

export const CARD_W = 3.5;
export const CARD_H = 2.0;
export const CARD_R = 0.15;
export const CARD_DEPTH = 0.028;
const BEVEL = 0.01;

export type CardTextures = {
  front: THREE.Texture;
  frontGlow: THREE.Texture;
  frontLift: THREE.Texture;
  back: THREE.Texture;
  backGlow: THREE.Texture;
};

export type CardMesh = {
  group: THREE.Group;
  frontMaterial: THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial;
  backMaterial: THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial;
  edgeMaterial: THREE.MeshStandardMaterial;
  bodyMaterial: THREE.MeshStandardMaterial;
  materials: THREE.Material[];
};

export function makeCardTextures(art: CardArt, maxAnisotropy = 8): CardTextures {
  const make = (canvas: HTMLCanvasElement, srgb = true) => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    tex.anisotropy = maxAnisotropy;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.needsUpdate = true;
    return tex;
  };
  return {
    front: make(art.front),
    frontGlow: make(art.frontGlow),
    frontLift: make(art.frontLift),
    back: make(art.back),
    backGlow: make(art.backGlow),
  };
}

function cardShape() {
  const w = CARD_W / 2;
  const h = CARD_H / 2;
  const r = CARD_R;
  const s = new THREE.Shape();
  s.moveTo(-w + r, -h);
  s.lineTo(w - r, -h);
  s.quadraticCurveTo(w, -h, w, -h + r);
  s.lineTo(w, h - r);
  s.quadraticCurveTo(w, h, w - r, h);
  s.lineTo(-w + r, h);
  s.quadraticCurveTo(-w, h, -w, h - r);
  s.lineTo(-w, -h + r);
  s.quadraticCurveTo(-w, -h, -w + r, -h);
  return s;
}

/** A flat face whose UVs span the card rectangle 0..1 (ShapeGeometry UVs are in shape units). */
function faceGeometry(shape: THREE.Shape, mirror: boolean) {
  const geo = new THREE.ShapeGeometry(shape, 12);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) / CARD_W + 0.5;
    const v = pos.getY(i) / CARD_H + 0.5;
    uv.setXY(i, mirror ? 1 - u : u, v);
  }
  uv.needsUpdate = true;
  return geo;
}

/**
 * Builds the physical card: a bevelled body whose rim glows Lead Clickz blue, a pearl front face
 * and an obsidian back face. `forExport` uses plain standard materials, which USDZ / GLB
 * exporters translate faithfully, and keeps the card opaque.
 */
export function buildCard(textures: CardTextures, options: { forExport?: boolean } = {}): CardMesh {
  const { forExport = false } = options;
  const shape = cardShape();
  const group = new THREE.Group();
  group.name = 'LeadClickzCard';

  const body = new THREE.ExtrudeGeometry(shape, {
    depth: CARD_DEPTH,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 4,
    curveSegments: 14,
  });
  body.translate(0, 0, -CARD_DEPTH / 2);

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a0d14,
    metalness: 0.85,
    roughness: 0.35,
  });
  const edgeMaterial = new THREE.MeshStandardMaterial({
    color: 0x0b5cff,
    emissive: new THREE.Color(0x027bff),
    emissiveIntensity: forExport ? 1.2 : 2.6,
    metalness: 0.4,
    roughness: 0.25,
  });
  const bodyMesh = new THREE.Mesh(body, [bodyMaterial, edgeMaterial]);
  bodyMesh.name = 'CardBody';
  group.add(bodyMesh);

  const faceZ = CARD_DEPTH / 2 + BEVEL + 0.0015;

  const frontMaterial = forExport
    ? new THREE.MeshStandardMaterial({
        map: textures.front,
        emissiveMap: textures.frontGlow,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.6,
        roughness: 0.4,
        metalness: 0.05,
      })
    : new THREE.MeshPhysicalMaterial({
        map: textures.front,
        emissiveMap: textures.frontLift,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 1,
        roughness: 0.36,
        metalness: 0.0,
        envMapIntensity: 0.35,
        clearcoat: 0.45,
        clearcoatRoughness: 0.18,
        iridescence: 0.12,
        iridescenceIOR: 1.6,
        iridescenceThicknessRange: [180, 520],
      });

  const backMaterial = forExport
    ? new THREE.MeshStandardMaterial({
        map: textures.back,
        emissiveMap: textures.backGlow,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 1,
        roughness: 0.45,
        metalness: 0.2,
      })
    : new THREE.MeshPhysicalMaterial({
        map: textures.back,
        emissiveMap: textures.backGlow,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 1.9,
        roughness: 0.42,
        metalness: 0.35,
        clearcoat: 0.9,
        clearcoatRoughness: 0.12,
      });

  const front = new THREE.Mesh(faceGeometry(shape, false), frontMaterial);
  front.position.z = faceZ;
  front.name = 'CardFront';
  group.add(front);

  const back = new THREE.Mesh(faceGeometry(shape, false), backMaterial);
  back.position.z = -faceZ;
  back.rotation.y = Math.PI;
  back.name = 'CardBack';
  // Rotated π about Y the face looks down −Z; once the card itself flips, its local +X is
  // screen-right again, so the art needs no mirroring.
  group.add(back);

  return {
    group,
    frontMaterial,
    backMaterial,
    edgeMaterial,
    bodyMaterial,
    materials: [frontMaterial, backMaterial, edgeMaterial, bodyMaterial],
  };
}

/** Soft radial sprite used for glows and sparks. */
export function glowTexture(inner = 'rgba(255,255,255,1)', mid = 'rgba(34,211,238,0.5)', size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(0.25, mid);
  g.addColorStop(1, 'rgba(2,123,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
