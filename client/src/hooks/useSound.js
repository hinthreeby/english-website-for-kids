import { useCallback, useRef } from "react";

const useSound = () => {
  const audioContextRef = useRef(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((frequency, duration, type = "sine", gain = 0.2) => {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gainNode.gain.value = gain;

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    oscillator.stop(ctx.currentTime + duration);
  }, [getAudioContext]);

  const playPop = useCallback(() => {
    playTone(520, 0.08, "triangle", 0.12);
  }, [playTone]);

  const playChime = useCallback(() => {
    playTone(523, 0.16, "sine", 0.16);
    setTimeout(() => playTone(659, 0.16, "sine", 0.16), 110);
    setTimeout(() => playTone(784, 0.2, "sine", 0.16), 220);
  }, [playTone]);

  const playWhoosh = useCallback(() => {
    playTone(240, 0.2, "sawtooth", 0.08);
  }, [playTone]);

  const playApplause = useCallback(() => {
    const ctx = getAudioContext();
    const dur = 2.4;
    const buf = ctx.createBuffer(2, ctx.sampleRate * dur, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < d.length; i++) {
        const t = i / ctx.sampleRate;
        // white noise modulated at ~6 claps/sec
        let s = (Math.random() * 2 - 1) * (0.45 + 0.55 * Math.abs(Math.sin(Math.PI * 6 * t)));
        // envelope: 0.12s attack, sustain to 1.6s, then decay
        s *= Math.min(t / 0.12, 1) * Math.max(0, 1 - Math.max(0, t - 1.6) / 0.8);
        d[i] = s * 0.32;
      }
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1600;
    bp.Q.value = 0.7;
    const gain = ctx.createGain();
    gain.gain.value = 0.75;
    src.connect(bp); bp.connect(gain); gain.connect(ctx.destination);
    src.start(); src.stop(ctx.currentTime + dur);
  }, [getAudioContext]);

  const speakText = useCallback((text) => {
    if (!window.speechSynthesis) {
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 1.2;
    window.speechSynthesis.speak(utterance);
  }, []);

  return {
    playPop,
    playChime,
    playWhoosh,
    playApplause,
    speakText,
  };
};

export default useSound;
