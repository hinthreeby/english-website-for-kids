import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import mascotImg from "../assets/welcome_character.png";
import hiAudio from "../assets/hi.mp3";
import welcomeBackAudio from "../assets/welcomeback.mp3";

const GREETING_KEY = "mascot_greeted";
const LOGIN_KEY = "mascot_just_logged_in";

const GUEST_LINES = [
  "Hi little explorer! 👋 Welcome to FUN ENGLISH! 🚀",
  "Let's learn English with fun games!",
  "Choose a game to start! 🎮",
];

const USER_LINES = (username) => [
  `Welcome back, ${username}! 👋`,
  "Let's keep learning English! ⭐",
  "Choose a game and play! 🎮",
];

const hasGreetedThisSession = () => sessionStorage.getItem(GREETING_KEY) === "true";

const markGreeted = () => {
  sessionStorage.setItem(GREETING_KEY, "true");
};

const consumeJustLoggedIn = () => {
  const value = sessionStorage.getItem(LOGIN_KEY) === "true";
  sessionStorage.removeItem(LOGIN_KEY);
  return value;
};

export default function MascotGreeting({ user, isAuthLoading }) {
  const [visible, setVisible] = useState(false);
  const [bubbleOpen, setBubbleOpen] = useState(false);
  const [bubbleClosing, setBubbleClosing] = useState(false);
  const [currentLine, setCurrentLine] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const audioRef = useRef(null);
  const hasAutoGreeted = useRef(false);
  const hasSlideIn = useRef(false);
  const typingIntervalRef = useRef(null);
  const timeoutIdsRef = useRef([]);

  const username = user?.username || "Explorer";
  const lines = useMemo(() => (user ? USER_LINES(username) : GUEST_LINES), [user, username]);
  const audioSrc = user ? welcomeBackAudio : hiAudio;

  const clearAllTimers = useCallback(() => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }

    timeoutIdsRef.current.forEach((id) => clearTimeout(id));
    timeoutIdsRef.current = [];
  }, []);

  const queueTimeout = useCallback((callback, delay) => {
    const id = setTimeout(() => {
      timeoutIdsRef.current = timeoutIdsRef.current.filter((timeoutId) => timeoutId !== id);
      callback();
    }, delay);

    timeoutIdsRef.current.push(id);
    return id;
  }, []);

  const playAudio = useCallback(() => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current.src = audioSrc;
    audioRef.current.play().catch(() => {
      // Ignore autoplay restrictions.
    });
  }, [audioSrc]);

  const startTyping = useCallback(
    (lineIndex) => {
      if (lineIndex >= lines.length) {
        setIsTyping(false);
        setIsDone(true);
        return;
      }

      setCurrentLine(lineIndex);
      setDisplayedText("");
      setIsTyping(true);

      const text = lines[lineIndex];
      let i = 0;

      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }

      typingIntervalRef.current = setInterval(() => {
        i += 1;
        setDisplayedText(text.slice(0, i));

        if (i >= text.length) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
          setIsTyping(false);

          queueTimeout(() => {
            startTyping(lineIndex + 1);
          }, 1800);
        }
      }, 38);
    },
    [lines, queueTimeout],
  );

  const openGreeting = useCallback(() => {
    clearAllTimers();
    setBubbleClosing(false);
    setBubbleOpen(true);
    setCurrentLine(0);
    setDisplayedText("");
    setIsDone(false);
    setIsTyping(false);
    playAudio();
    startTyping(0);
  }, [clearAllTimers, playAudio, startTyping]);

  const handleClose = useCallback(() => {
    clearAllTimers();
    setIsTyping(false);
    setBubbleOpen(false);
    setBubbleClosing(true);

    queueTimeout(() => {
      setBubbleClosing(false);
    }, 280);
  }, [clearAllTimers, queueTimeout]);

  // Trigger greeting flow only after auth status is known.
  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!hasSlideIn.current) {
      hasSlideIn.current = true;
      queueTimeout(() => {
        setVisible(true);
      }, 800);
    }

    if (hasAutoGreeted.current) {
      return;
    }

    const justLoggedIn = consumeJustLoggedIn();
    const alreadyGreeted = hasGreetedThisSession();
    const shouldGreet = justLoggedIn || (!user && !alreadyGreeted);

    if (!shouldGreet) {
      return;
    }

    hasAutoGreeted.current = true;
    markGreeted();

    const bubbleTimeout = queueTimeout(() => {
      openGreeting();
    }, 1400);

    return () => {
      clearTimeout(bubbleTimeout);
      clearAllTimers();
    };
  }, [clearAllTimers, isAuthLoading, openGreeting, queueTimeout, user]);

  const shouldShowBubble = bubbleOpen || bubbleClosing;

  return (
    <>
      <audio ref={audioRef} preload="auto" />

      <div className={`mascot-wrapper ${visible ? "mascot-visible" : ""}`}>
        {shouldShowBubble ? (
          <div
            className={`mascot-bubble ${bubbleOpen ? "bubble-open" : ""} ${
              bubbleClosing ? "bubble-closing" : ""
            }`}
          >
            <button className="bubble-close" type="button" onClick={handleClose}>
              ✕
            </button>

            {lines.slice(0, currentLine).map((line, index) => (
              <p key={`${line}-${index}`} className="bubble-line bubble-line-done">
                {line}
              </p>
            ))}

            <p className="bubble-line bubble-line-active">
              {displayedText}
              {isTyping ? <span className="cursor">|</span> : null}
            </p>

            {!isDone ? (
              <div className="bubble-dots">
                {lines.map((_, index) => {
                  const dotClass =
                    index === currentLine ? "dot-active" : index < currentLine ? "dot-done" : "";

                  return <span key={index} className={`bubble-dot ${dotClass}`} />;
                })}
              </div>
            ) : null}

            {isDone ? (
              <button className="bubble-dismiss" type="button" onClick={handleClose}>
                Let's go! 🚀
              </button>
            ) : null}

            <div className="bubble-tail" />
          </div>
        ) : null}

        <button
          type="button"
          className={`mascot-character ${bubbleOpen ? "mascot-bounce" : ""}`}
          onClick={() => {
            if (!bubbleOpen) {
              openGreeting();
            }
          }}
          aria-label="Open mascot greeting"
        >
          <img src={mascotImg} alt="Mascot" className="mascot-img" draggable={false} />
        </button>
      </div>
    </>
  );
}
