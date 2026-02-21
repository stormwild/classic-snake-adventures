/**
 * Retro arcade music with classical melody hooks — Web Audio API chiptune.
 * Draws from Claire de Lune, Für Elise, Ode to Joy, and Canon in D,
 * arranged as upbeat arcade-style chiptune.
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
let currentBPM = 140;
let stepIndex = 0;

// --- Frequencies ---
const N = (semi: number) => 440 * Math.pow(2, semi / 12);
// Octave 3
const C3=N(-21), D3=N(-19), E3=N(-17), F3=N(-16), G3=N(-14), A3=N(-12), B3=N(-10);
// Octave 4
const C4=N(-9), D4=N(-7), Eb4=N(-6), E4=N(-5), F4=N(-4), Fs4=N(-3), G4=N(-2), Gs4=N(-1), A4=N(0), Bb4=N(1), B4=N(2);
// Octave 5
const C5=N(3), D5=N(5), Eb5=N(4), E5=N(7), F5=N(8), G5=N(10), A5=N(12);
const R = 0; // rest

// --- Classical-inspired melody phrases (16 steps = 1 bar of 16th notes) ---
const MELODIES = [
  // Claire de Lune — dreamy ascending arpeggio feel (Db major → C major adaptation)
  [E4,R,G4,R, C5,R,E5,R, D5,R,C5,R, G4,R,E4,R],
  // Claire de Lune — descending answer phrase
  [E5,R,D5,R, C5,R,G4,R, A4,R,G4,R, E4,R,C4,R],
  // Für Elise hook (E-D#-E-D#-E-B-D-C)
  [E5,Eb5,E5,Eb5, E5,B4,D5,C5, A4,R,R,R, C4,E4,A4,R],
  // Ode to Joy (Beethoven) — upbeat
  [E4,E4,F4,G4, G4,F4,E4,D4, C4,C4,D4,E4, E4,R,D4,D4],
  // Ode to Joy — second phrase
  [E4,E4,F4,G4, G4,F4,E4,D4, C4,C4,D4,E4, D4,R,C4,C4],
  // Claire de Lune — shimmering high phrase
  [G5,R,E5,R, C5,R,E5,R, G5,R,E5,R, D5,R,C5,R],
  // Playful bridge (original — connecting hook)
  [C5,D5,E5,G5, E5,D5,C5,R, A4,B4,C5,E5, D5,C5,A4,R],
];

// --- Bass lines (Canon in D inspired + walking bass) ---
const BASS_LINES = [
  // Canon in D progression: C-G-Am-F (simplified)
  [C3,R,C3,R, G3,R,G3,R, A3,R,A3,R, F3,R,F3,R],
  // Walking bass — classic arcade
  [C3,R,E3,R, G3,R,E3,R, F3,R,A3,R, G3,R,E3,R],
  // Descending bass
  [A3,R,G3,R, F3,R,E3,R, D3,R,E3,R, C3,R,G3,R],
  // Pulsing root
  [C3,C3,R,C3, R,C3,R,R, G3,G3,R,G3, R,G3,R,R],
];

// Drums — 16th note grid
const DRUM_KICK  = [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,1,0];
const DRUM_SNARE = [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0];
const DRUM_HAT   = [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0];

let melodyIdx = 0;
let bassIdx = 0;
let barCount = 0;

const pickNext = () => {
  // Cycle through melodies mostly in order for musical coherence, with occasional jumps
  if (Math.random() > 0.3) {
    melodyIdx = (melodyIdx + 1) % MELODIES.length;
  } else {
    melodyIdx = Math.floor(Math.random() * MELODIES.length);
  }
  bassIdx = (bassIdx + 1) % BASS_LINES.length;
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
  // Gentle attack and release for a more musical feel
  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(vol, time + 0.01);
  gain.gain.setValueAtTime(vol, time + dur * 0.5);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
  osc.connect(gain).connect(masterGain);
  osc.start(time);
  osc.stop(time + dur + 0.01);
};

// Add a soft pad/sustain voice for dreamy feel
const playPad = (freq: number, time: number, dur: number, vol: number) => {
  if (!masterGain) return;
  const c = ctx();
  const osc = c.createOscillator();
  const osc2 = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc2.type = "sine";
  osc.frequency.setValueAtTime(freq, time);
  osc2.frequency.setValueAtTime(freq * 2.01, time); // slight shimmer
  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(vol, time + dur * 0.3);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
  osc.connect(gain);
  osc2.connect(gain);
  gain.connect(masterGain);
  osc.start(time);
  osc2.start(time);
  osc.stop(time + dur + 0.01);
  osc2.stop(time + dur + 0.01);
};

const playKick = (time: number) => {
  if (!masterGain) return;
  const c = ctx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(35, time + 0.1);
  gain.gain.setValueAtTime(0.22, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
  osc.connect(gain).connect(masterGain);
  osc.start(time);
  osc.stop(time + 0.13);
};

const playSnare = (time: number) => {
  if (!masterGain) return;
  const c = ctx();
  const bufLen = Math.floor(c.sampleRate * 0.05);
  const buf = c.createBuffer(1, bufLen, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(3500, time);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.1, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);
  src.connect(bp).connect(gain).connect(masterGain);
  src.start(time);
  src.stop(time + 0.08);
};

const playHat = (time: number) => {
  if (!masterGain) return;
  const c = ctx();
  const bufLen = Math.floor(c.sampleRate * 0.015);
  const buf = c.createBuffer(1, bufLen, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.setValueAtTime(9000, time);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.05, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.025);
  src.connect(hp).connect(gain).connect(masterGain);
  src.start(time);
  src.stop(time + 0.03);
};

// --- Look-ahead scheduler ---
const LOOK_AHEAD = 0.15;

const scheduleNotes = () => {
  if (!playing || stopRequested || !masterGain) return;
  const c = ctx();
  const sixteenth = 60 / currentBPM / 4;

  while (scheduledUntil < c.currentTime + LOOK_AHEAD) {
    const time = scheduledUntil;
    const s = stepIndex % 16;

    // Lead melody — square wave for that chiptune character
    const mel = MELODIES[melodyIdx][s];
    if (mel > 0) playTone(mel, time, sixteenth * 1.8, "square", 0.07, 4);

    // Bass — triangle wave (NES-style)
    const bass = BASS_LINES[bassIdx][s];
    if (bass > 0) playTone(bass, time, sixteenth * 2.5, "triangle", 0.1);

    // Pad chord — every 4 steps, soft sustained tone for dreamy Claire de Lune feel
    if (s % 4 === 0) {
      const padNote = MELODIES[melodyIdx][s] || C4;
      if (padNote > 0) playPad(padNote / 2, time, sixteenth * 4, 0.03);
    }

    // Drums
    if (DRUM_KICK[s]) playKick(time);
    if (DRUM_SNARE[s]) playSnare(time);
    if (DRUM_HAT[s]) playHat(time);

    scheduledUntil += sixteenth;
    stepIndex++;

    // Switch patterns every 1-2 bars
    if (stepIndex % 16 === 0) {
      barCount++;
      if (barCount % 2 === 0 || Math.random() > 0.6) {
        pickNext();
      }
    }
  }

  rafId = requestAnimationFrame(scheduleNotes);
};

export const startMusic = () => {
  if (playing) return;
  const c = ctx();
  masterGain = c.createGain();
  masterGain.gain.setValueAtTime(0.55, c.currentTime);
  masterGain.connect(c.destination);
  playing = true;
  stopRequested = false;
  stepIndex = 0;
  barCount = 0;
  scheduledUntil = c.currentTime + 0.05;
  currentBPM = 140;
  melodyIdx = 0; // Start with Claire de Lune phrase
  bassIdx = 0;
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
  currentBPM = Math.min(200, 140 + score * 2);
};

export const setMusicVolume = (vol: number) => {
  if (masterGain) {
    masterGain.gain.setValueAtTime(vol, ctx().currentTime);
  }
};

export const isMusicPlaying = () => playing;
