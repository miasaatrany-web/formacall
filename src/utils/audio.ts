// Web Audio API helper to synthesize telephone sounds dynamically
let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// Play a keypad DTMF touch tone
export function playDtmfTone(key: string) {
  try {
    const ctx = getAudioContext();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // DTMF frequencies
    const dtmfFreqs: { [key: string]: [number, number] } = {
      "1": [697, 1209], "2": [697, 1336], "3": [697, 1477],
      "4": [770, 1209], "5": [770, 1336], "6": [770, 1477],
      "7": [852, 1209], "8": [852, 1336], "9": [852, 1477],
      "*": [941, 1209], "0": [941, 1336], "#": [941, 1477]
    };

    const freqs = dtmfFreqs[key];
    if (!freqs) return;

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(freqs[0], ctx.currentTime);
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(freqs[1], ctx.currentTime);

    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.15);
  } catch (error) {
    console.warn("Audio error:", error);
  }
}

// Continuous dial tone (off-hook)
let dialToneOscs: { osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode } | null = null;
export function startDialTone() {
  try {
    const ctx = getAudioContext();
    if (dialToneOscs) return;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.frequency.setValueAtTime(350, ctx.currentTime);
    osc2.frequency.setValueAtTime(440, ctx.currentTime);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();

    dialToneOscs = { osc1, osc2, gain };
  } catch (error) {
    console.warn("Audio error:", error);
  }
}

export function stopDialTone() {
  if (dialToneOscs) {
    try {
      dialToneOscs.osc1.stop();
      dialToneOscs.osc2.stop();
      dialToneOscs.osc1.disconnect();
      dialToneOscs.osc2.disconnect();
      dialToneOscs.gain.disconnect();
    } catch (e) {}
    dialToneOscs = null;
  }
}

// Ringback tone (when calling someone)
let ringbackOscs: { osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode }[] = [];
let ringInterval: NodeJS.Timeout | null = null;

export function startRingbackTone() {
  try {
    const ctx = getAudioContext();
    if (ringbackOscs.length > 0) return;

    const playRing = () => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.setValueAtTime(440, ctx.currentTime);
      osc2.frequency.setValueAtTime(480, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();

      // Ring for 1.5 seconds, then stop
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5);

      setTimeout(() => {
        try {
          osc1.stop();
          osc2.stop();
          osc1.disconnect();
          osc2.disconnect();
          gain.disconnect();
        } catch (e) {}
      }, 1600);
    };

    playRing();
    ringInterval = setInterval(playRing, 4000);
  } catch (error) {
    console.warn("Audio error:", error);
  }
}

export function stopRingbackTone() {
  if (ringInterval) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
  ringbackOscs = [];
}

// Busy/Disconnect beep tone
export function playDisconnectTone() {
  try {
    const ctx = getAudioContext();
    const playBeep = (delay: number) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.setValueAtTime(480, ctx.currentTime + delay);
      osc2.frequency.setValueAtTime(620, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0.06, ctx.currentTime + delay);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime + delay);
      gain.gain.setValueAtTime(0.06, ctx.currentTime + delay + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.3);

      setTimeout(() => {
        try {
          osc1.stop();
          osc2.stop();
          osc1.disconnect();
          osc2.disconnect();
          gain.disconnect();
        } catch (e) {}
      }, (delay + 0.4) * 1000);
    };

    playBeep(0);
    playBeep(0.4);
    playBeep(0.8);
  } catch (error) {
    console.warn("Audio error:", error);
  }
}
