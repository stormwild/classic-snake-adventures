/**
 * Retro arcade background music — Web Audio API chiptune generator.
 * Inspired by classic NES/Game Boy soundtracks.
 */

let playing = false;
let stopRequested = false;
let scheduledUntil = 0;
let rafId: number | null = null;

const ctx = () => {
  if (!(window as any).__snakeAudioCtx) {
    (window as any).__snakeAudioCtx = new AudioContext();
  }
  const c = (window as any).__snakeAudioCtx as AudioContext;
  if (c.state === "suspended") c.resume();
  return c;
};

let masterGain: GainNode | null = null;
let currentBPM = 150;
let stepIndex = 0;

// --- Note helpers ---
const NOTE = (semitone: number) => 440 * Math.pow(2, semitone / 12);

// Notes relative to A4=440
const C4 = NOTE(-9), D4 = NOTE(-7), E4 = NOTE(-5), F4 = NOTE(-4), G4 = NOTE(-2);
const A4 = NOTE(0), B4 = NOTE(2);
const C5 = NOTE(3), D5 = NOTE(5), E5 = NOTE(7), F5 = NOTE(8), G5 = NOTE(10);
const A3 = NOTE(-12), C3 = NOTE(-21), D3 = NOTE(-19), E3 = NOTE(-17), F3 = NOTE(-16), G3 = NOTE(-14);

// --- Melody phrases (Mario/Pac-Man/DK inspired) ---
const MELODIES = [
  // Upbeat bouncy (Mario-ish)
  [E5, E5, 0, E5, 0, C5, E5, 0, G5, 0, 0, 0, G4, 0, 0, 0],
  // Pac-Man chase vibe
  [C5, 0, C5, D5, E5, 0, C5, 0, A4, 0, A4, 0, 0, 0, 0, 0],
  // DK stomp
  [G4, 0, A4, B4, D5, 0, B4, 0, A4, 0, G4, 0, E4, 0, 0, 0],
  // Descending run
  [G5, F5, E5, D5, C5, 0, E5, 0, G5, 0, C5, 0, E5, 0, 0, 0],
  // Playful bounce
  [C5, E5, G5, E5, C5, 0, D5, F5, A4, F5, D5, 0, C5, 0, 0, 0],
];

const BASS_LINES = [
  [C3, 0, C3, 0, G3, 0, G3, 0, A3, 0, A3, 0, F3, 0, F3, 0],
  [C3, 0, 0, C3, E3, 0, 0, E3, F3, 0, 0, F3, G3, 0, 0, G3],
  [A3, 0, A3, 0, F3, 0, F3, 0, G3, 0, G3, 0, C3, 0, C3, 0],
];

// Kick on beats 1 & 3, snare on 2 & 4 (16th note grid)
const DRUM_KICK = [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0];
const DRUM_SNARE= [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0];
const DRUM_HAT  = [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0];

let melodyIdx = 0;
let bassIdx = 0;

const pickNext = () => {
  melodyIdx = Math.floor(Math.random() * MELODIES.length);
  bassIdx = Math.floor(Math.random() * BASS_LINES.length);
};

// --- Synth voices ---
const playTone = (freq: number, time: number, dur: number, type: OscillatorType, vol: number, detune = 0) => {
  if (!masterGain) return;
  const c = ctx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, time);
  if (detune) osc.detune.setValueAtTime(detune, time);
  gain.gain.setValueAtTime(vol, time);
  gain.gain.setValueAtTime(vol, time + dur * 0.6);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
  osc.connect(gain).connect(masterGain);
  osc.start(time);
  osc.stop(time + dur + 0.01);
};

const playKick = (time: number) => {
  if (!masterGain) return;
  const c = ctx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(160, time);
  osc.frequency.exponentialRampToValueAtTime(35, time + 0.1);
  gain.gain.setValueAtTime(0.28, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
  osc.connect(gain).connect(masterGain);
  osc.start(time);
  osc.stop(time + 0.13);
};

const playSnare = (time: number) => {
  if (!masterGain) return;
  const c = ctx();
  // Noise burst
  const bufLen = Math.floor(c.sampleRate * 0.06);
  const buf = c.createBuffer(1, bufLen, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(3000, time);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.12, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
  src.connect(bp).connect(gain).connect(masterGain);
  src.start(time);
  src.stop(time + 0.09);
};

const playHat = (time: number) => {
  if (!masterGain) return;
  const c = ctx();
  const bufLen = Math.floor(c.sampleRate * 0.02);
  const buf = c.createBuffer(1, bufLen, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.setValueAtTime(9000, time);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.07, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
  src.connect(hp).connect(gain).connect(masterGain);
  src.start(time);
  src.stop(time + 0.04);
};

// --- Scheduler (look-ahead pattern for glitch-free timing) ---
const LOOK_AHEAD = 0.15; // schedule 150ms ahead

const scheduleNotes = () => {
  if (!playing || stopRequested || !masterGain) return;
  const c = ctx();
  const sixteenth = 60 / currentBPM / 4;

  while (scheduledUntil < c.currentTime + LOOK_AHEAD) {
    const time = scheduledUntil;
    const s = stepIndex % 16;

    // Melody
    const mel = MELODIES[melodyIdx][s];
    if (mel > 0) playTone(mel, time, sixteenth * 1.5, "square", 0.08, 5);

    // Bass
    const bass = BASS_LINES[bassIdx][s];
    if (bass > 0) playTone(bass, time, sixteenth * 2, "triangle", 0.12);

    // Drums
    if (DRUM_KICK[s]) playKick(time);
    if (DRUM_SNARE[s]) playSnare(time);
    if (DRUM_HAT[s]) playHat(time);

    scheduledUntil += sixteenth;
    stepIndex++;

    // Every 16 steps (1 bar), maybe switch patterns
    if (stepIndex % 16 === 0 && Math.random() > 0.4) {
      pickNext();
    }
  }

  rafId = requestAnimationFrame(scheduleNotes);
};

export const startMusic = () => {
  if (playing) return;
  const c = ctx();
  masterGain = c.createGain();
  masterGain.gain.setValueAtTime(0.6, c.currentTime);
  masterGain.connect(c.destination);
  playing = true;
  stopRequested = false;
  stepIndex = 0;
  scheduledUntil = c.currentTime + 0.05;
  currentBPM = 150;
  pickNext();
  scheduleNotes();
};

export const stopMusic = () => {
  stopRequested = true;
  playing = false;
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  masterGain = null;
};

export const updateMusicBPM = (score: number) => {
  currentBPM = Math.min(210, 150 + score * 2);
};

export const setMusicVolume = (vol: number) => {
  if (masterGain) {
    masterGain.gain.setValueAtTime(vol, ctx().currentTime);
  }
};

export const isMusicPlaying = () => playing;
