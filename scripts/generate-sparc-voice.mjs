#!/usr/bin/env node
/**
 * Renders SPARC's personal line for each card in SPARC's own voice (Cartesia, the same provider
 * SPARC uses in Power SPARC X) and wires it into src/data/sparc-lines.json.
 *
 *   CARTESIA_API_KEY=... CARTESIA_VOICE_ID=... pnpm voice            # all profiles
 *   CARTESIA_API_KEY=... CARTESIA_VOICE_ID=... pnpm voice tiffany    # one profile
 *
 * Each run is one paid synthesis per profile, so it only runs when you start it.
 * Edit the "script" text in sparc-lines.json first; captions are re-timed to the new audio.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const linesPath = path.join(root, 'src/data/sparc-lines.json');
const outDir = path.join(root, 'public/audio');

const apiKey = process.env.CARTESIA_API_KEY;
const voiceId = process.env.CARTESIA_VOICE_ID;
const model = process.env.CARTESIA_MODEL ?? 'sonic-3';
if (!apiKey || !voiceId) {
  console.error('Set CARTESIA_API_KEY and CARTESIA_VOICE_ID (SPARC voice) first.');
  process.exit(1);
}

const lines = JSON.parse(readFileSync(linesPath, 'utf8'));
const only = process.argv[2];
mkdirSync(outDir, { recursive: true });

function duration(file) {
  try {
    return Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim());
  } catch {
    return null;
  }
}

/** Spread caption start times across the audio in proportion to their text length. */
function retime(captions, seconds) {
  const total = captions.reduce((n, c) => n + c.text.length, 0);
  const speech = seconds * 0.92;
  let at = 0;
  return captions.map((c) => {
    const next = { at: Math.round(at * 100) / 100, text: c.text };
    at += (c.text.length / total) * speech;
    return next;
  });
}

for (const [slug, line] of Object.entries(lines.profiles)) {
  if (only && only !== slug) continue;
  console.log(`SPARC → ${slug}: "${line.script}"`);
  const res = await fetch('https://api.cartesia.ai/tts/bytes', {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      'Cartesia-Version': '2025-04-16',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model_id: model,
      transcript: line.script,
      voice: { mode: 'id', id: voiceId },
      language: 'en',
      output_format: { container: 'mp3', sample_rate: 44100, bit_rate: 128000 },
    }),
  });
  if (!res.ok) {
    console.error(`  failed: ${res.status} ${await res.text()}`);
    process.exitCode = 1;
    continue;
  }
  const file = path.join(outDir, `sparc-${slug}.mp3`);
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  const secs = duration(file);
  if (secs) line.captions = retime(line.captions, secs);
  line.audio = `/audio/sparc-${slug}.mp3`;
  console.log(`  wrote ${path.relative(root, file)}${secs ? ` (${secs.toFixed(1)}s)` : ''}`);
}

writeFileSync(linesPath, `${JSON.stringify(lines, null, 2)}\n`);
console.log('Updated src/data/sparc-lines.json — rebuild and deploy to hear it.');
