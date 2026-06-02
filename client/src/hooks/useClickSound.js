import { useEffect, useRef } from "react";

const CLICK_SOUND_VOLUME = 0.55;
const CLICK_SOUND_COOLDOWN_MS = 70;

const useClickSound = (src) => {
  const audioRef = useRef(null);
  const lastPlayedAtRef = useRef(0);

  useEffect(() => {
    const audio = new Audio(src);
    audio.preload = "auto";
    audio.volume = CLICK_SOUND_VOLUME;
    audio.load();
    audioRef.current = audio;

    const playClickSound = (event) => {
      const target = event.target;

      if (target?.closest?.("[data-no-click-sound]")) {
        return;
      }

      const now = Date.now();
      if (now - lastPlayedAtRef.current < CLICK_SOUND_COOLDOWN_MS) {
        return;
      }
      lastPlayedAtRef.current = now;

      const clickAudio = audio.cloneNode();
      clickAudio.volume = CLICK_SOUND_VOLUME;
      clickAudio.play().catch(() => {
        // Browser may block audio until the first trusted user interaction.
      });
    };

    document.addEventListener("click", playClickSound, true);

    return () => {
      document.removeEventListener("click", playClickSound, true);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [src]);
};

export default useClickSound;
