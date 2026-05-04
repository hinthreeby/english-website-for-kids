import { useCallback, useEffect, useRef, useState } from "react";

const MUTED_KEY = "funenglish_music_muted";

const useBgMusic = (src) => {
  const audioRef = useRef(null);
  const [muted, setMuted] = useState(() => localStorage.getItem(MUTED_KEY) === "true");
  const [playing, setPlaying] = useState(false);

  // initialise audio element once
  useEffect(() => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0.35;
    audio.muted = localStorage.getItem(MUTED_KEY) === "true";
    audioRef.current = audio;

    const tryPlay = () => {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    };

    // attempt autoplay immediately
    tryPlay();

    // fallback: play on first user interaction if autoplay was blocked
    const onInteraction = () => {
      if (!playing) tryPlay();
      window.removeEventListener("click", onInteraction);
      window.removeEventListener("keydown", onInteraction);
    };
    window.addEventListener("click", onInteraction);
    window.addEventListener("keydown", onInteraction);

    return () => {
      audio.pause();
      audio.src = "";
      window.removeEventListener("click", onInteraction);
      window.removeEventListener("keydown", onInteraction);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const next = !muted;
    audio.muted = next;
    localStorage.setItem(MUTED_KEY, String(next));
    setMuted(next);

    // if audio wasn't playing yet, start it now
    if (!next && !playing) {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  }, [muted, playing]);

  return { muted, toggle };
};

export default useBgMusic;
