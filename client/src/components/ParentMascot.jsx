import { useCallback, useEffect, useRef, useState } from "react";
import mascotImg from "../assets/general/astronaut/austronaut_parent.png";

const ParentMascot = ({ audioSrc, lines }) => {
  const [visible, setVisible] = useState(false);
  const [bubbleOpen, setBubbleOpen] = useState(false);
  const [bubbleClosing, setBubbleClosing] = useState(false);
  const [currentLine, setCurrentLine] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const audioRef = useRef(null);
  const typingIntervalRef = useRef(null);
  const timeoutIdsRef = useRef([]);

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
      timeoutIdsRef.current = timeoutIdsRef.current.filter((tid) => tid !== id);
      callback();
    }, delay);
    timeoutIdsRef.current.push(id);
    return id;
  }, []);

  const playAudio = useCallback(() => {
    if (!audioRef.current || !audioSrc) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current.src = audioSrc;
    audioRef.current.play().catch(() => {});
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
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = setInterval(() => {
        i += 1;
        setDisplayedText(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
          setIsTyping(false);
          queueTimeout(() => startTyping(lineIndex + 1), 1800);
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
    queueTimeout(() => setBubbleClosing(false), 280);
  }, [clearAllTimers, queueTimeout]);

  // Always keep ref current so the effect below never needs to re-run for it
  const openGreetingRef = useRef(openGreeting);
  openGreetingRef.current = openGreeting;

  // Use direct setTimeout (not queueTimeout) so StrictMode's cleanup→remount
  // cycle properly re-queues both timers on the second mount instead of skipping them.
  useEffect(() => {
    const slideTimer = setTimeout(() => setVisible(true), 800);
    const greetTimer = setTimeout(() => openGreetingRef.current(), 1400);
    return () => {
      clearTimeout(slideTimer);
      clearTimeout(greetTimer);
      clearAllTimers();
    };
  }, [clearAllTimers]);

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
                Got it! ✨
              </button>
            ) : null}

            <div className="bubble-tail" />
          </div>
        ) : null}

        <button
          type="button"
          className={`mascot-character ${bubbleOpen ? "mascot-bounce" : ""}`}
          onClick={() => {
            if (!bubbleOpen) openGreeting();
          }}
          aria-label="Open mascot"
        >
          <img src={mascotImg} alt="Parent Mascot" className="mascot-img" draggable={false} />
        </button>
      </div>
    </>
  );
};

export default ParentMascot;
