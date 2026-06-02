import confetti from "canvas-confetti";

const correctSound = "/sounds/count-learn/correct.mp3";
const errorSound = "/sounds/count-learn/error.mp3";
const ERROR_SOUND_START_AT = 0.5;
const ERROR_SOUND_VOLUME = 2.5;
const preloadedSounds = new Map();
const decodedSoundBuffers = new Map();

const getPreloadedSound = (src) => {
  if (!preloadedSounds.has(src)) {
    const audio = new Audio(src);
    audio.preload = "auto";
    audio.load();
    preloadedSounds.set(src, audio);
  }

  return preloadedSounds.get(src);
};

if (typeof Audio !== "undefined") {
  getPreloadedSound(correctSound);
  getPreloadedSound(errorSound);
}

export const playGameEffectSound = (src, volume = 1, startAt = 0) => {
  const baseAudio = getPreloadedSound(src);
  const audio = baseAudio.cloneNode();
  audio.volume = Math.max(0, Math.min(1, volume));

  if (startAt > 0) {
    try {
      audio.currentTime = startAt;
    } catch {
      audio.addEventListener(
        "loadedmetadata",
        () => {
          audio.currentTime = startAt;
        },
        { once: true },
      );
    }
  }

  audio.play().catch(() => {
    // Browser may block audio if the user gesture window has expired.
  });
};

const getDecodedSoundBuffer = (src, audioContext) => {
  if (!decodedSoundBuffers.has(src)) {
    decodedSoundBuffers.set(
      src,
      fetch(src)
        .then((response) => response.arrayBuffer())
        .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer)),
    );
  }

  return decodedSoundBuffers.get(src);
};

const playBoostedSound = async (src, gainValue, startAt = 0) => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    playGameEffectSound(src, 1, startAt);
    return;
  }

  try {
    const audioContext = new AudioContextClass();
    await audioContext.resume();

    const buffer = await getDecodedSoundBuffer(src, audioContext);
    const source = audioContext.createBufferSource();
    const gain = audioContext.createGain();

    source.buffer = buffer;
    gain.gain.value = gainValue;
    source.connect(gain);
    gain.connect(audioContext.destination);
    source.start(0, Math.min(startAt, buffer.duration));
    source.onended = () => {
      audioContext.close().catch(() => {});
    };
  } catch {
    playGameEffectSound(src, 1, startAt);
  }
};

export const playCorrectEffect = () => {
  playGameEffectSound(correctSound, 1);
  confetti({
    particleCount: 120,
    spread: 72,
    origin: { y: 0.66 },
    colors: ["#34d399", "#bbf7d0", "#ffd700", "#b2ebf2", "#c9b8ff"],
  });
};

export const playErrorEffect = () => {
  playBoostedSound(errorSound, ERROR_SOUND_VOLUME, ERROR_SOUND_START_AT);
};
