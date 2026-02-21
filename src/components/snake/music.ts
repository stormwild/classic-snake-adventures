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
// Octave 2
const C2=N(-33), D2=N(-31), E2=N(-29), F2=N(-28), G2=N(-26), A2=N(-24), B2=N(-22);
// Octave 3
const C3=N(-21), D3=N(-19), E3=N(-17), F3=N(-16), Fs3=N(-15), G3=N(-14), Gs3=N(-13), A3=N(-12), Bb3=N(-11), B3=N(-10);
// Octave 4
const C4=N(-9), Cs4=N(-8), D4=N(-7), Eb4=N(-6), E4=N(-5), F4=N(-4), Fs4=N(-3), G4=N(-2), Gs4=N(-1), A4=N(0), Bb4=N(1), B4=N(2);
// Octave 5
const C5=N(3), Cs5=N(4), D5=N(5), Eb5=N(4), E5=N(7), F5=N(8), Fs5=N(9), G5=N(10), Gs5=N(11), A5=N(12), Bb5=N(13), B5=N(14);
// Octave 6
const C6=N(15);
const R = 0; // rest

// ===================================================================
//  MELODY LIBRARY — classical hooks arranged as 16-step chiptune bars
// ===================================================================
const MELODIES = [
  // --- Für Elise (Beethoven) — full theme ---
  // A section phrase 1: E-D#-E-D#-E-B-D-C-A
  [E5,Eb5,E5,Eb5, E5,B4,D5,C5, A4,R,R,R, C4,E4,A4,R],
  // A section phrase 2: B answer
  [R,R,E4,Gs4, B4,R,R,R, C4,E4,A4,B4, C5,R,R,R],
  // A section repeat with resolution
  [E5,Eb5,E5,Eb5, E5,B4,D5,C5, A4,R,C4,E4, A4,R,B4,R],
  // B section — lyrical contrast
  [C5,R,D5,E5, F5,R,E5,D5, C5,R,B4,A4, Gs4,R,A4,B4],

  // --- Ode to Joy (Beethoven) — full theme ---
  // Main theme phrase 1
  [E4,E4,F4,G4, G4,F4,E4,D4, C4,C4,D4,E4, E4,R,D4,D4],
  // Main theme phrase 2
  [E4,E4,F4,G4, G4,F4,E4,D4, C4,C4,D4,E4, D4,R,C4,C4],
  // Bridge (D-D-E-C-D-EF-E-C-D-EF-E-D-C-D-G3)
  [D4,D4,E4,C4, D4,E4,F4,E4, C4,D4,E4,F4, E4,D4,C4,D4],
  // Return to main with triumphant ending
  [E4,E4,F4,G4, G4,F4,E4,D4, C4,C4,D4,E4, D4,R,C4,R],

  // --- Claire de Lune (Debussy) ---
  // Opening ascending arpeggio
  [E4,R,G4,R, C5,R,E5,R, D5,R,C5,R, G4,R,E4,R],
  // Descending answer
  [E5,R,D5,R, C5,R,G4,R, A4,R,G4,R, E4,R,C4,R],
  // Shimmering high phrase
  [G5,R,E5,R, C5,R,E5,R, G5,R,E5,R, D5,R,C5,R],
  // Gentle falling — rubato feel
  [C5,R,B4,R, A4,R,G4,R, F4,R,E4,R, D4,R,C4,R],

  // --- Chopin Nocturne Op.9 No.2 (Eb major → C adaptation) ---
  // Opening lyrical phrase
  [G4,R,C5,R, E5,R,D5,C5, B4,R,C5,R, D5,R,R,R],
  // Ornamental run
  [E5,D5,C5,D5, E5,G5,E5,C5, D5,C5,B4,C5, D5,R,R,R],
  // Yearning ascent
  [C5,R,E5,R, G5,R,A5,R, G5,R,E5,R, C5,R,R,R],
  // Tender resolution
  [A5,R,G5,R, E5,R,D5,R, C5,R,D5,R, C5,R,R,R],

  // --- Bach Invention No.1 in C (two-part) ---
  // Rising subject
  [C4,D4,E4,F4, D4,E4,C4,R, E4,F4,G4,A4, F4,G4,E4,R],
  // Answer / inversion
  [G4,F4,E4,D4, F4,E4,G4,R, E4,D4,C4,B3, D4,C4,E4,R],
  // Sequence rising
  [C5,B4,A4,G4, A4,B4,C5,D5, E5,D5,C5,B4, C5,R,R,R],

  // --- Bach Cello Suite No.1 Prelude (G major → C adaptation) ---
  // Arpeggiated figure 1
  [C4,E4,G4,C5, E5,C5,G4,E4, C4,E4,G4,C5, E5,C5,G4,E4],
  // Arpeggiated figure 2 (moving harmony)
  [D4,F4,A4,D5, F5,D5,A4,F4, E4,G4,B4,E5, G5,E5,B4,G4],
  // Arpeggiated figure 3
  [F4,A4,C5,F5, A5,F5,C5,A4, G4,B4,D5,G5, B5,G5,D5,B4],

  // --- Chopin Waltz in Db (Minute Waltz feel, C adaptation) ---
  // Spinning motif
  [E5,F5,E5,D5, C5,D5,E5,G5, F5,E5,D5,C5, D5,E5,D5,C5],
  // Whirling continuation
  [G4,A4,B4,C5, D5,E5,F5,E5, D5,C5,B4,A4, G4,R,R,R],

  // --- Playful bridges (original connecting material) ---
  [C5,D5,E5,G5, E5,D5,C5,R, A4,B4,C5,E5, D5,C5,A4,R],
  [G4,A4,B4,D5, C5,B4,A4,G4, F4,G4,A4,C5, B4,A4,G4,R],
];

// --- Bass lines (expanded) ---
const BASS_LINES = [
  // Canon in D: C-G-Am-F
  [C3,R,C3,R, G3,R,G3,R, A3,R,A3,R, F3,R,F3,R],
  // Walking bass
  [C3,R,E3,R, G3,R,E3,R, F3,R,A3,R, G3,R,E3,R],
  // Descending
  [A3,R,G3,R, F3,R,E3,R, D3,R,E3,R, C3,R,G2,R],
  // Pulsing root
  [C3,C3,R,C3, R,C3,R,R, G3,G3,R,G3, R,G3,R,R],
  // Alberti-style (Chopin/Mozart)
  [C3,G3,E3,G3, C3,G3,E3,G3, F3,C3,A3,C3, G3,D3,B2,D3],
  // Dramatic ascending
  [C3,R,D3,R, E3,R,F3,R, G3,R,A3,R, B3,R,C3,R],
  // Bach-style pedal point
  [C3,C3,C3,C3, C3,C3,C3,C3, G2,G2,G2,G2, G2,G2,G2,G2],
  // Bouncy octaves
  [C3,C2,C3,C2, G2,G3,G2,G3, A2,A3,A2,A3, F2,F3,F2,F3],
];

// Drum patterns (expanded)
const DRUM_KICKS = [
  [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,1,0],
  [1,0,0,1, 0,0,1,0, 0,0,1,0, 0,0,0,0],
  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
];
const DRUM_SNARES = [
  [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
  [0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,0,0],
];
const DRUM_HATS = [
  [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
  [1,1,1,0, 1,1,1,0, 1,1,1,0, 1,1,1,0],
  [1,0,1,1, 1,0,1,1, 1,0,1,1, 1,0,1,1],
];

let melodyIdx = 0;
let bassIdx = 0;
let kickIdx = 0;
let snareIdx = 0;
let hatIdx = 0;
let barCount = 0;

const pickNext = () => {
  if (Math.random() > 0.3) {
    melodyIdx = (melodyIdx + 1) % MELODIES.length;
  } else {
    melodyIdx = Math.floor(Math.random() * MELODIES.length);
  }
  bassIdx = (bassIdx + 1) % BASS_LINES.length;
  // Shuffle drums occasionally
  if (Math.random() > 0.5) {
    kickIdx = Math.floor(Math.random() * DRUM_KICKS.length);
    snareIdx = Math.floor(Math.random() * DRUM_SNARES.length);
    hatIdx = Math.floor(Math.random() * DRUM_HATS.length);
  }
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
    if (DRUM_KICKS[kickIdx][s]) playKick(time);
    if (DRUM_SNARES[snareIdx][s]) playSnare(time);
    if (DRUM_HATS[hatIdx][s]) playHat(time);

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
