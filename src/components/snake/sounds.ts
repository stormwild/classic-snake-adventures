const ctx = () => {
  if (!(window as any).__snakeAudioCtx) {
    (window as any).__snakeAudioCtx = new AudioContext();
  }
  return (window as any).__snakeAudioCtx as AudioContext;
};

/** Short blip when eating food */
export const playEatSound = () => {
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
  const c = ctx();
  // Distorted buzz
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

/** Continuous engine hum that rises in pitch with speed. Call updateEngine each tick. */
let engineOsc: OscillatorNode | null = null;
let engineGain: GainNode | null = null;

export const startEngine = () => {
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

/** Update engine pitch based on current score */
export const updateEngine = (score: number) => {
  if (!engineOsc) return;
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
