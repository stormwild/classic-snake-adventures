/**
 * Procedural chiptune background music using Web Audio API.
 * Generates a looping sequence of bass + melody + percussion
 * that speeds up with score.
 */

let playing = false;
let stopRequested = false;
let currentTimeout: ReturnType<typeof setTimeout> | null = null;

const ctx = () => {
  if (!(window as any).__snakeAudioCtx) {
    (window as any).__snakeAudioCtx = new AudioContext();
  }
  const c = (window as any).__snakeAudioCtx as AudioContext;
  if (c.state === "suspended") c.resume();
  return c;
};

// Pentatonic scale notes (fun, can't sound "wrong")
const SCALE = [130.81, 146.83, 164.81, 196.0, 220.0]; // C3 pentatonic
const MELODY_SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25]; // C4-C5 pentatonic+

// Patterns — indices into SCALE / MELODY_SCALE
const BASS_PATTERNS = [
  [0, 0, 2, 3, 0, 0, 4, 3],
  [0, 2, 3, 4, 3, 2, 0, 0],
  [3, 3, 0, 0, 2, 4, 3, 2],
  [0, 4, 3, 2, 0, 2, 3, 4],
];

const MELODY_PATTERNS = [
  [0, 2, 4, 5, 7, 5, 4, 2],
  [7, 5, 4, 2, 0, 2, 4, 5],
  [0, 4, 2, 5, 7, 4, 5, 0],
  [4, 5, 7, 5, 4, 2, 0, 2],
  [2, 4, 5, 7, 5, 4, 2, 0],
];

// Kick pattern (1 = kick, 0 = silent)
const KICK_PATTERNS = [
  [1, 0, 0, 1, 0, 0, 1, 0],
  [1, 0, 1, 0, 0, 1, 0, 0],
  [1, 0, 0, 0, 1, 0, 0, 1],
];

// Hi-hat pattern
const HAT_PATTERNS = [
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 1, 1, 1, 0, 1, 1],
  [0, 1, 1, 0, 1, 1, 0, 1],
];

let masterGain: GainNode | null = null;
let currentBPM = 140;
let patternIndex = 0;
let stepIndex = 0;
let barCount = 0;

const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

let currentBass: number[];
let currentMelody: number[];
let currentKick: number[];
let currentHat: number[];

const newPatterns = () => {
  currentBass = pickRandom(BASS_PATTERNS);
  currentMelody = pickRandom(MELODY_PATTERNS);
  currentKick = pickRandom(KICK_PATTERNS);
  currentHat = pickRandom(HAT_PATTERNS);
};

const playNote = (freq: number, type: OscillatorType, vol: number, dur: number, detune = 0) => {
  const c = ctx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  if (detune) osc.detune.setValueAtTime(detune, c.currentTime);
  gain.gain.setValueAtTime(vol, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  osc.connect(gain).connect(masterGain!);
  osc.start();
  osc.stop(c.currentTime + dur);
};

const playKick = () => {
  const c = ctx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(150, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(30, c.currentTime + 0.12);
  gain.gain.setValueAtTime(0.18, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
  osc.connect(gain).connect(masterGain!);
  osc.start();
  osc.stop(c.currentTime + 0.15);
};

const playHat = () => {
  const c = ctx();
  const bufferSize = c.sampleRate * 0.03;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.setValueAtTime(8000, c.currentTime);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.06, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.04);
  src.connect(hp).connect(gain).connect(masterGain!);
  src.start();
  src.stop(c.currentTime + 0.04);
};

const step = () => {
  if (stopRequested || !playing) return;

  const stepDur = 60 / currentBPM / 2; // eighth notes

  // Bass
  const bassNote = SCALE[currentBass[stepIndex % 8]];
  playNote(bassNote, "square", 0.06, stepDur * 0.8);

  // Melody (every other step or all steps randomly)
  if (stepIndex % 2 === 0 || Math.random() > 0.4) {
    const melodyNote = MELODY_SCALE[currentMelody[stepIndex % 8]];
    playNote(melodyNote, "square", 0.035, stepDur * 0.5, Math.random() * 10 - 5);
  }

  // Kick
  if (currentKick[stepIndex % 8]) playKick();

  // Hi-hat
  if (currentHat[stepIndex % 8]) playHat();

  stepIndex++;

  // Every 8 steps = 1 bar, every 2-4 bars pick new patterns
  if (stepIndex % 8 === 0) {
    barCount++;
    if (barCount % (2 + Math.floor(Math.random() * 3)) === 0) {
      newPatterns();
    }
  }

  currentTimeout = setTimeout(step, stepDur * 1000);
};

export const startMusic = () => {
  if (playing) return;
  const c = ctx();
  masterGain = c.createGain();
  masterGain.gain.setValueAtTime(0.5, c.currentTime);
  masterGain.connect(c.destination);
  playing = true;
  stopRequested = false;
  stepIndex = 0;
  barCount = 0;
  currentBPM = 140;
  newPatterns();
  step();
};

export const stopMusic = () => {
  stopRequested = true;
  playing = false;
  if (currentTimeout) {
    clearTimeout(currentTimeout);
    currentTimeout = null;
  }
  masterGain = null;
};

export const updateMusicBPM = (score: number) => {
  currentBPM = Math.min(200, 140 + score * 2);
};

export const setMusicVolume = (vol: number) => {
  if (masterGain) {
    masterGain.gain.setValueAtTime(vol, ctx().currentTime);
  }
};

export const isMusicPlaying = () => playing;
