# Lead Clickz™ 3D Digital Business Card

Scan the QR on a printed card and the visitor gets a live, 3D Lead Clickz™ card:

1. **Ignite gate** — "This isn't a business card. It's a signal." One tap unlocks sound and the phone's motion sensors.
2. **Cinematic + signal story** — the Lead Clickz opening film, then *Yesterday… We aimed. Today… We strike with power. Every market has signals. Can you see them?* over a 3D field of signals (skippable; returning visitors go straight to the card).
3. **The card** — lightning strike, the card assembles from particles and spins in. Pearl Lead Clickz front, obsidian back with the brand line, a scan-to-connect QR and *Powered by POWER SPARC X™*. Drag to spin, tap to flip, tilt the phone to see the light move.
4. **SPARC™ speaks** — the SPARC orb from Power SPARC X speaks over the card with live captions ("SPARC active. Every click, search and mention is a signal." then a personal line for each card). The card's edge glows with SPARC's voice.
5. **Save contact** → *Connection ignited* → Add to contacts. Call, text, email, website, LinkedIn and share are one tap.
6. **See it in your space (AR)** — iPhone/iPad opens AR Quick Look with a *Save Contact* button in the AR banner; ARCore Android phones place an animated card standee with WebXR; desktops show a QR that opens the card in AR on a phone.

Cards: `/thomas` (also `/`) and `/tiffany`. Each has its own share preview image and title.

## Develop

```bash
pnpm install
pnpm dev          # http://localhost:5173/thomas
pnpm build        # typecheck + production build into dist/
```

Handy URLs: `?intro=0` skips the intro, `?ar=1` opens straight to the card with the AR button highlighted (what the desktop QR links to).

## Add or edit a person

- Contact details: `src/data/profiles.ts`
- Contact file: `public/contacts/<slug>-lopez.vcf`
- SPARC's lines and captions: `src/data/sparc-lines.json`
- Share image: `public/og/<slug>.jpg` (1200 × 630)

## SPARC's personal line in SPARC's voice

The shared "SPARC active" line is SPARC's real voice from Power SPARC X. The personal lines currently show as captions with the orb animating. To voice them with SPARC's Cartesia voice (one paid synthesis per card, only when you run it):

```bash
CARTESIA_API_KEY=… CARTESIA_VOICE_ID=… pnpm voice          # or: pnpm voice tiffany
```

It writes `public/audio/sparc-<slug>.mp3`, re-times the captions, and links the audio in `sparc-lines.json`.

## Layout

| Path | What |
| --- | --- |
| `src/three/CardStage.ts` | Three.js scene: signal field, lightning, particle assembly, PSX orbit rings, selective bloom, gestures, gyro |
| `src/three/cardArt.ts` | Paints both card faces (and their glow layers) and the QR |
| `src/three/cardModel.ts` | The physical card mesh and materials |
| `src/ar/ar.ts` | AR Quick Look (USDZ export) and WebXR placement |
| `src/sparc/` | SPARC orb (ported from Power SPARC X) and the speaking presence |
| `src/experience/` | Gate, cinematic, story, card screen |
| `src/sound.ts` | One Web Audio graph for music + SPARC's voice (iOS-safe) |
| `brand-source/` | Original white-background logo videos, not shipped |
