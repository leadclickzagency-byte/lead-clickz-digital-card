import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...rest,
  };
}

export const IconPhone = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
  </svg>
);
export const IconText = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
    <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" strokeWidth={2.4} />
  </svg>
);
export const IconMail = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);
export const IconGlobe = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
  </svg>
);
export const IconLinkedIn = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="18" height="18" rx="3.5" />
    <path d="M8 10.5V16M8 7.5v.01M12 16v-3.2a2.3 2.3 0 0 1 4.6 0V16M12 10.5V16" />
  </svg>
);
export const IconShare = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" />
    <path d="M5 12v6.5A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V12" />
  </svg>
);
export const IconSave = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="10" cy="8" r="3.6" />
    <path d="M3.5 20a6.5 6.5 0 0 1 11.2-4.5M18 14v6M15 17h6" />
  </svg>
);
export const IconCube = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m12 2.8 8 4.5v9.4l-8 4.5-8-4.5V7.3l8-4.5Z" />
    <path d="m4 7.3 8 4.6 8-4.6M12 11.9v9.3" />
  </svg>
);
export const IconSound = ({ on, ...p }: IconProps & { on: boolean }) => (
  <svg {...base(p)}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
    {on ? <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /> : <path d="m16 9.5 5 5M21 9.5l-5 5" />}
  </svg>
);
export const IconReplay = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v4.3h4.3" />
  </svg>
);
export const IconClose = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const IconFlip = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 7h10a4 4 0 0 1 0 8H9" />
    <path d="m11 11-4 4 4 4" />
  </svg>
);

/** Lead Clickz ring + bolt mark. */
export function BoltMark({ size = 40, glow = false }: { size?: number; glow?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100" aria-hidden="true" className={glow ? 'bolt-mark bolt-mark--glow' : 'bolt-mark'}>
      <path d="M 14.7 -32.9 A 36 36 0 0 1 14.7 32.9 M -14.7 32.9 A 36 36 0 0 1 -14.7 -32.9" fill="none" stroke="currentColor" strokeWidth="6.5" strokeLinecap="round" className="bolt-mark__ring" />
      <path d="M 6.3 -45 L -13.5 5.4 L 0 2.7 L -6.3 45 L 13.5 -6.3 L 0 -3.6 Z" className="bolt-mark__bolt" />
    </svg>
  );
}
