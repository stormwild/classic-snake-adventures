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

/** Sad descending boink-boink-boink game over jingle with reverb */
export const playGameOverSound = () => {
  if (muted) return;
  const c = ctx();

  // Create convolution reverb from noise impulse
  const reverbLen = 2.0;
  const sampleRate = c.sampleRate;
  const impulse = c.createBuffer(2, sampleRate * reverbLen, sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2.5);
    }
  }
  const reverb = c.createConvolver();
  reverb.buffer = impulse;

  const dry = c.createGain();
  const wet = c.createGain();
  dry.gain.setValueAtTime(0.7, c.currentTime);
  wet.gain.setValueAtTime(0.5, c.currentTime);
  reverb.connect(wet).connect(c.destination);

  // More boinks — longer, sadder descent
  const boinks = [
    { freq: 440, time: 0.0 },
    { freq: 380, time: 0.16 },
    { freq: 320, time: 0.32 },
    { freq: 270, time: 0.50 },
    { freq: 220, time: 0.68 },
    { freq: 170, time: 0.88 },
    { freq: 130, time: 1.10 },
    { freq: 90,  time: 1.35 },
  ];

  boinks.forEach(({ freq, time }) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, c.currentTime + time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.4, c.currentTime + time + 0.2);
    gain.gain.setValueAtTime(0.28, c.currentTime + time);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + time + 0.25);
    osc.connect(gain);
    gain.connect(dry).connect(c.destination);
    gain.connect(reverb);
    osc.start(c.currentTime + time);
    osc.stop(c.currentTime + time + 0.28);

    // Echo ghost — quieter repeat
    const echo = c.createOscillator();
    const echoGain = c.createGain();
    const echoDelay = 0.12;
    echo.type = "sine";
    echo.frequency.setValueAtTime(freq * 0.98, c.currentTime + time + echoDelay);
    echo.frequency.exponentialRampToValueAtTime(freq * 0.35, c.currentTime + time + echoDelay + 0.2);
    echoGain.gain.setValueAtTime(0.12, c.currentTime + time + echoDelay);
    echoGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + time + echoDelay + 0.22);
    echo.connect(echoGain);
    echoGain.connect(reverb);
    echoGain.connect(dry);
    echo.start(c.currentTime + time + echoDelay);
    echo.stop(c.currentTime + time + echoDelay + 0.25);
  });

  // Final long sad low drone with shimmer
  const drone = c.createOscillator();
  const drone2 = c.createOscillator();
  const droneGain = c.createGain();
  drone.type = "triangle";
  drone2.type = "sine";
  drone.frequency.setValueAtTime(70, c.currentTime + 1.6);
  drone.frequency.exponentialRampToValueAtTime(30, c.currentTime + 2.8);
  drone2.frequency.setValueAtTime(73, c.currentTime + 1.6);
  drone2.frequency.exponentialRampToValueAtTime(31, c.currentTime + 2.8);
  droneGain.gain.setValueAtTime(0.18, c.currentTime + 1.6);
  droneGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 2.9);
  drone.connect(droneGain);
  drone2.connect(droneGain);
  droneGain.connect(reverb);
  droneGain.connect(dry);
  drone.start(c.currentTime + 1.6);
  drone2.start(c.currentTime + 1.6);
  drone.stop(c.currentTime + 2.9);
  drone2.stop(c.currentTime + 2.9);
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
