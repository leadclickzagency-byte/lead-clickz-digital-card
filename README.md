# Lead Clickz™ 3D Digital Business Card

Scan the QR on a printed card and the visitor gets a live, 3D Lead Clickz™ card:

1. **Ignite gate** — "This isn't a business card. It's a signal." One tap unlocks sound and the phone's motion sensors.
2. **Cinematic + signal story** — the Lead Clickz opening film, then *Yesterday… We aimed. Today… We strike with power. Every market has signals. Can you see them?* over a 3D field of signals (skippable; returning visitors go straight to the card).
3. **The card** — lightning strike, the card assembles from particles and spins in. Pearl Lead Clickz front, obsidian back with the brand line and *Powered by POWER SPARC X™*. Drag to spin, tap to flip, tilt the phone to see the light move.
4. **SPARC™ speaks** — the SPARC orb from Power SPARC X delivers a ~30-second pitch in his real voice, stitched from his existing recordings, with live captions. The card itself stays steady; only SPARC reacts.
5. **Save contact** → *Connection ignited* → Add to contacts. Call, text, email, website, LinkedIn and share are one tap.
6. **See it in your space (AR)** — iPhone/iPad opens AR Quick Look with a *Save Contact* button in the AR banner; ARCore Android phones place an animated card standee with WebXR; inside AR the visitor can Save, Call, Email or open LinkedIn without leaving the camera view.

Cards: `/thomas` (also `/`) and `/tiffany`. Each has its own share preview image and title.

## Develop

```bash
pnpm install
pnpm dev          # http://localhost:5173/thomas
pnpm build        # typecheck + production build into dist/
```

Handy URLs: `?intro=0` skips the intro.

## Add or edit a person

- Contact details: `src/data/profiles.ts`
- Contact file: `public/contacts/<slug>-lopez.vcf`
- SPARC's lines and captions: `src/data/sparc-lines.json`
- Share image: `public/og/<slug>.jpg` (1200 × 630)

## SPARC's voice

`public/audio/sparc-pitch.mp3` is SPARC's real voice, stitched from his recordings in the Lead Clickz site (`public/prerecordings/`) and the Power SPARC X greeting, with captions in `src/data/sparc-lines.json`.

Each card also has a personal line ("You just met Thomas Lopez…") that plays after the pitch, recorded in SPARC's Cartesia voice. To re-record after editing the script in `sparc-lines.json` (one paid call per card, only when you run it):

```bash
CARTESIA_API_KEY=… CARTESIA_VOICE_ID=1661c7a4-011a-4f03-8d05-a24dd7c3a9cc pnpm voice   # or: pnpm voice tiffany
```

## Layout

| Path | What |
| --- | --- |
| `src/three/CardStage.ts` | Three.js scene: signal field, lightning, particle assembly, PSX orbit rings, selective bloom, gestures, gyro |
| `src/three/cardArt.ts` | Paints both card faces and their glow layers |
| `src/three/cardModel.ts` | The physical card mesh and materials |
| `src/ar/ar.ts` | AR Quick Look (USDZ export) and WebXR placement |
| `src/sparc/` | SPARC orb (ported from Power SPARC X) and the speaking presence |
| `src/experience/` | Gate, cinematic, story, card screen |
| `src/sound.ts` | One Web Audio graph for music + SPARC's voice (iOS-safe) |
| `brand-source/` | Original white-background logo videos, not shipped |
