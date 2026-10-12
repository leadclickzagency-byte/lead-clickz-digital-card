/**
 * One audio graph for the whole experience. iOS only lets audio start inside a user gesture and
 * ignores HTMLMediaElement.volume, so every element is primed during the first tap and routed
 * through Web Audio gain nodes; SPARC's voice also feeds an analyser that drives the orb.
 */

import { asset } from '@/asset';

const MUSIC_SRC = asset('/audio/lead-clickz-theme.mp3');

type Graph = {
  ctx: AudioContext;
  master: GainNode;
  musicGain: GainNode;
  voiceGain: GainNode;
  analyser: AnalyserNode;
  music: HTMLAudioElement;
  voice: HTMLAudioElement;
};

let graph: Graph | null = null;
let enabled = false;
let currentVoice = '';
const levelBuffer = new Uint8Array(512);

function createElement(src?: string) {
  const el = new Audio();
  el.preload = 'auto';
  el.crossOrigin = 'anonymous';
  el.setAttribute('playsinline', '');
  if (src) el.src = asset(src);
  return el;
}

function prime(el: HTMLAudioElement) {
  const wasMuted = el.muted;
  el.muted = true;
  const p = el.play();
  if (p) {
    p.then(() => {
      el.pause();
      el.currentTime = 0;
      el.muted = wasMuted;
    }).catch(() => {
      el.muted = wasMuted;
    });
  }
}

/** Call synchronously inside a click/tap handler. */
export function unlockSound(firstVoiceSrc?: string) {
  if (!graph) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const master = ctx.createGain();
    master.connect(ctx.destination);
    const musicGain = ctx.createGain();
    musicGain.gain.value = 0;
    musicGain.connect(master);
    const voiceGain = ctx.createGain();
    voiceGain.gain.value = 1;
    voiceGain.connect(master);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.6;
    analyser.connect(voiceGain);

    const music = createElement(MUSIC_SRC);
    music.loop = true;
    ctx.createMediaElementSource(music).connect(musicGain);
    const voice = createElement(firstVoiceSrc);
    currentVoice = firstVoiceSrc ?? '';
    ctx.createMediaElementSource(voice).connect(analyser);
    graph = { ctx, master, musicGain, voiceGain, analyser, music, voice };
    prime(voice);
  }
  void graph.ctx.resume();
  enabled = true;
  graph.master.gain.value = 1;
}

export function soundEnabled() {
  return enabled && !!graph;
}

export function setSoundEnabled(on: boolean) {
  if (!graph) return;
  enabled = on;
  const now = graph.ctx.currentTime;
  graph.master.gain.cancelScheduledValues(now);
  graph.master.gain.setTargetAtTime(on ? 1 : 0, now, 0.15);
  if (on) {
    void graph.ctx.resume();
    if (graph.music.paused && musicWanted) void graph.music.play().catch(() => undefined);
  }
}

let musicWanted = false;

export function startMusic(level = 0.16) {
  musicWanted = true;
  if (!graph || !enabled) return;
  if (graph.music.paused) void graph.music.play().catch(() => undefined);
  setMusicLevel(level, 2.2);
}

export function setMusicLevel(level: number, seconds = 1.2) {
  if (!graph) return;
  const now = graph.ctx.currentTime;
  graph.musicGain.gain.cancelScheduledValues(now);
  graph.musicGain.gain.setTargetAtTime(level, now, seconds / 3);
}

/** Plays a SPARC line. Resolves when it ends (or immediately if sound is off/unavailable). */
export function playVoice(src: string): Promise<boolean> {
  if (!graph || !enabled) return Promise.resolve(false);
  const g = graph;
  return new Promise((resolve) => {
    const voice = g.voice;
    const done = (ok: boolean) => {
      voice.removeEventListener('ended', onEnded);
      voice.removeEventListener('error', onError);
      resolve(ok);
    };
    const onEnded = () => done(true);
    const onError = () => done(false);
    voice.addEventListener('ended', onEnded);
    voice.addEventListener('error', onError);
    if (currentVoice !== src) {
      voice.src = asset(src);
      currentVoice = src;
    }
    voice.currentTime = 0;
    voice.play().catch(() => done(false));
  });
}

export function voiceTime() {
  return graph?.voice.currentTime ?? 0;
}

export function voiceLevel() {
  if (!graph || !enabled || graph.voice.paused) return 0;
  graph.analyser.getByteTimeDomainData(levelBuffer);
  let sum = 0;
  for (let i = 0; i < levelBuffer.length; i++) {
    const v = (levelBuffer[i] - 128) / 128;
    sum += v * v;
  }
  return Math.min(1, Math.sqrt(sum / levelBuffer.length) * 4.2);
}

export function stopVoice() {
  if (!graph) return;
  graph.voice.pause();
}
