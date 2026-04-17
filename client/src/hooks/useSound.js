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
    speakText,
  };
};

export default useSound;
