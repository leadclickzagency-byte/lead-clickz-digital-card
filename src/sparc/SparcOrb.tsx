import type { CSSProperties } from 'react';
import './sparc-orb.css';

export type SparcOrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

/**
 * The SPARC™ orb from Power SPARC X — spark backlight, tilted orbit rings, voice waves, particle
 * core and the ϟ bolt. `level` (0–1) is the live voice level while SPARC speaks.
 */

const PARTICLES: Array<[string, string, string, number]> = [
  ['44%', '35%', '0s', 5], ['58%', '39%', '.2s', 7], ['38%', '52%', '.5s', 4],
  ['63%', '55%', '.8s', 5], ['49%', '63%', '1.1s', 6], ['34%', '67%', '1.4s', 3],
  ['69%', '68%', '1.7s', 4], ['52%', '47%', '2s', 8], ['28%', '44%', '2.3s', 3],
  ['72%', '45%', '2.6s', 3], ['43%', '76%', '2.9s', 4], ['58%', '77%', '3.2s', 4],
  ['21%', '58%', '.35s', 3], ['79%', '61%', '.65s', 4], ['31%', '29%', '.95s', 3],
  ['66%', '27%', '1.25s', 3], ['24%', '73%', '1.55s', 4], ['76%', '75%', '1.85s', 3],
];

const REFERENCE = 286;

export function SparcOrb({ size = 56, state = 'idle', level = 0 }: { size?: number; state?: SparcOrbState; level?: number }) {
  const k = size / REFERENCE;
  const raw = Math.max(0, Math.min(1, level));
  const l = state === 'speaking' ? raw : state === 'listening' ? 0.12 : 0;
  const vars = {
    '--k': k,
    '--sv-wrap': `${size}px`,
    '--sv-core': `${Math.round(size * 0.643)}px`,
    '--sv-orbit': `${Math.round(size * 0.853)}px`,
    '--sv-bolt': `${Math.max(9, Math.round(size * 0.133))}px`,
    '--sv-core-scale': 1 + l * 0.06,
    '--sv-brightness': 1 + l * 0.22,
    '--sv-saturation': 1 + l * 0.16,
    '--sv-energy-scale': 0.92 + l * 0.55,
    '--sv-particle-opacity': 0.52 + l * 0.48,
    '--sv-particle-brightness': 1 + l * 1.2,
    '--sv-wave-opacity': 0.04 + l * 0.68,
    '--sv-wave-b-opacity': 0.025 + l * 0.46,
    '--sv-wave-c-opacity': 0.015 + l * 0.28,
    '--sv-wave-a-scale': 1 + l * 0.16,
    '--sv-wave-b-scale': 1 + l * 0.24,
    '--sv-wave-c-scale': 1 + l * 0.32,
    '--sv-halo-glow': `${(5 + l * 18) * Math.max(k, 0.4)}px`,
    '--sv-wave-glow': `${(8 + l * 20) * Math.max(k, 0.4)}px`,
    '--sv-ring-opacity': 0.72 + l * 0.24,
    '--sv-ring-brightness': 1 + l * 0.85,
  } as CSSProperties;

  return (
    <div className={`psx-sv ${state}`} style={vars} aria-hidden="true">
      <div className="psx-sv-backlight" />
      <div className="psx-sv-ring psx-sv-ring-a" />
      <div className="psx-sv-ring psx-sv-ring-b" />
      <div className="psx-sv-ring psx-sv-ring-c" />
      <div className="psx-sv-halo" />
      <div className="psx-sv-orbit" />
      <div className="psx-sv-wave psx-sv-wave-a" />
      <div className="psx-sv-wave psx-sv-wave-b" />
      <div className="psx-sv-wave psx-sv-wave-c" />
      <div className="psx-sv-core">
        <div className="psx-sv-particles">
          {PARTICLES.map(([x, y, d, s], i) => (
            <i key={i} style={{ '--x': x, '--y': y, '--d': d, '--s': `${Math.max(1.5, s * Math.max(k, 0.45)).toFixed(2)}px` } as CSSProperties} />
          ))}
        </div>
        <div className="psx-sv-energy" />
        <div className="psx-sv-bolt">ϟ</div>
      </div>
    </div>
  );
}
