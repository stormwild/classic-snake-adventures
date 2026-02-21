let muted = false;

export const isMuted = () => muted;
export const setMuted = (val: boolean) => {
  muted = val;
  if (muted && engineGain) {
    engineGain.gain.setValueAtTime(0, ctx().currentTime);
  } else if (!muted && engineGain && engineOsc) {
    engineGain.gain.setValueAtTime(0.04, ctx().currentTime);
  }
};

const ctx = () => {
  if (!(window as any).__snakeAudioCtx) {
    (window as any).__snakeAudioCtx = new AudioContext();
  }
  const c = (window as any).__snakeAudioCtx as AudioContext;
  if (c.state === "suspended") c.resume();
  return c;
};

/** Short blip when eating food */
export const playEatSound = () => {
  if (muted) return;
  const c = ctx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(600, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, c.currentTime + 0.08);
  gain.gain.setValueAtTime(0.15, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
  osc.connect(gain).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + 0.15);
};

/** Low thud when hitting a wall */
export const playWallHitSound = () => {
  if (muted) return;
  const c = ctx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(150, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, c.currentTime + 0.3);
  gain.gain.setValueAtTime(0.25, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35);
  osc.connect(gain).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + 0.35);
};

/** Crunchy buzz when hitting yourself */
export const playSelfHitSound = () => {
  if (muted) return;
  const c = ctx();
  const osc = c.createOscillator();
  const osc2 = c.createOscillator();
  const gain = c.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(80, c.currentTime);
  osc2.type = "sawtooth";
  osc2.frequency.setValueAtTime(90, c.currentTime);
  gain.gain.setValueAtTime(0.2, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4);
  osc.connect(gain);
  osc2.connect(gain);
  gain.connect(c.destination);
  osc.start();
  osc2.start();
  osc.stop(c.currentTime + 0.4);
  osc2.stop(c.currentTime + 0.4);
};

/** Sad descending boink-boink-boink game over jingle */
export const playGameOverSound = () => {
  if (muted) return;
  const c = ctx();
  // Series of descending "boinks" — each lower and sadder than the last
  const boinks = [
    { freq: 400, time: 0.0 },
    { freq: 320, time: 0.18 },
    { freq: 250, time: 0.36 },
    { freq: 180, time: 0.56 },
    { freq: 120, time: 0.78 },
  ];

  boinks.forEach(({ freq, time }) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    // Quick pitch drop on each boink for that rubbery sadness
    osc.frequency.setValueAtTime(freq, c.currentTime + time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, c.currentTime + time + 0.15);
    gain.gain.setValueAtTime(0.25, c.currentTime + time);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + time + 0.18);
    osc.connect(gain).connect(c.destination);
    osc.start(c.currentTime + time);
    osc.stop(c.currentTime + time + 0.2);
  });

  // Final long sad low drone
  const drone = c.createOscillator();
  const droneGain = c.createGain();
  drone.type = "triangle";
  drone.frequency.setValueAtTime(80, c.currentTime + 1.0);
  drone.frequency.exponentialRampToValueAtTime(40, c.currentTime + 1.6);
  droneGain.gain.setValueAtTime(0.15, c.currentTime + 1.0);
  droneGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.7);
  drone.connect(droneGain).connect(c.destination);
  drone.start(c.currentTime + 1.0);
  drone.stop(c.currentTime + 1.7);
};

/** Subtle tick on each movement step — duration shortens with score */
export const playMoveSound = (score: number) => {
  if (muted) return;
  const c = ctx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  const freq = 220 + score * 6;
  const dur = Math.max(0.02, 0.06 - score * 0.002);
  osc.frequency.setValueAtTime(Math.min(freq, 500), c.currentTime);
  gain.gain.setValueAtTime(0.04, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  osc.connect(gain).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + dur);
};

/** Continuous engine hum that rises in pitch with speed */
let engineOsc: OscillatorNode | null = null;
let engineGain: GainNode | null = null;

export const startEngine = () => {
  if (muted) return;
  const c = ctx();
  if (engineOsc) stopEngine();
  engineOsc = c.createOscillator();
  engineGain = c.createGain();
  engineOsc.type = "triangle";
  engineOsc.frequency.setValueAtTime(60, c.currentTime);
  engineGain.gain.setValueAtTime(0.04, c.currentTime);
  engineOsc.connect(engineGain).connect(c.destination);
  engineOsc.start();
};

export const updateEngine = (score: number) => {
  if (!engineOsc || muted) return;
  const c = ctx();
  const freq = 60 + score * 8;
  engineOsc.frequency.setTargetAtTime(Math.min(freq, 400), c.currentTime, 0.1);
  if (engineGain) {
    const vol = 0.04 + Math.min(score * 0.005, 0.1);
    engineGain.gain.setTargetAtTime(vol, c.currentTime, 0.1);
  }
};

export const stopEngine = () => {
  try { engineOsc?.stop(); } catch {}
  engineOsc = null;
  engineGain = null;
};
