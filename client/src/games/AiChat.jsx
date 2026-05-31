import { useCallback, useEffect, useRef, useState } from "react";
import api from "../lib/api";
import lunaCard from "../assets/luna_card.png";
import "./AiChat.css";

const GREETING = "Hi! I'm Luna! I'm so happy to meet you! What is your name?";
const BAR_COUNT = 28;

const AiChat = () => {
  const [status,      setStatus]      = useState("idle");
  const [caption,     setCaption]     = useState("");
  const [displayed,   setDisplayed]   = useState(""); // typewriter text
  const [interimText, setInterimText] = useState("");
  const [history,     setHistory]     = useState([{ role: "assistant", content: GREETING }]);
  const [inputText,   setInputText]   = useState("");
  const [lunaText,    setLunaText]    = useState(GREETING);
  const typewriterRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);

  // ── TTS (cross-browser: Chrome, Edge, Firefox, Safari) ───────────────────
  const speak = useCallback((text) => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    const doSpeak = () => {
      if (synth.speaking) synth.cancel();
      if (synth.paused)   synth.resume();

      const utter  = new SpeechSynthesisUtterance(text);
      utter.lang   = "en-US";
      utter.rate   = 0.85;
      utter.pitch  = 1.1;
      utter.volume = 1;
      // Không ép buộc voice cụ thể → để browser tự chọn tốt nhất

      utter.onstart = () => setStatus("speaking");
      utter.onend   = () => setStatus("idle");
      utter.onerror = (e) => {
        if (e.error !== "interrupted" && e.error !== "canceled") {
          console.warn("[TTS]", e.error);
        }
        setStatus("idle");
      };

      synth.speak(utter);
    };

    // Chờ voices load (Firefox/Safari lần đầu)
    const trySpeak = () => {
      if (synth.getVoices().length > 0) {
        doSpeak();
      } else {
        synth.addEventListener("voiceschanged", doSpeak, { once: true });
        setTimeout(doSpeak, 1500); // Safari fallback
      }
    };

    // Edge/Chrome: cần small delay sau mic để audio context reset
    setTimeout(trySpeak, 200);
  }, []);

  // Typewriter effect
  const typewrite = useCallback((text) => {
    if (typewriterRef.current) clearInterval(typewriterRef.current);
    setDisplayed("");
    let i = 0;
    typewriterRef.current = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(typewriterRef.current);
    }, 30);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      speak(GREETING);
      typewrite(GREETING);
    }, 700);
    return () => clearTimeout(t);
  }, [speak, typewrite]);

  // ── Send text to Groq ─────────────────────────────────────────────────────
  const sendMessage = useCallback(async (userText) => {
    // Hiện text user trước (typewriter nhanh)
    setCaption(`"${userText}"`);
    typewrite(`You: "${userText}"`);
    setStatus("thinking");

    const newHistory = [...history, { role: "user", content: userText }];
    setHistory(newHistory);
    try {
      const { data } = await api.post("/api/chat-game/message", { messages: newHistory });
      setHistory((h) => [...h, { role: "assistant", content: data.reply }]);
      setCaption(data.reply);
      setLunaText(data.reply);
      typewrite(data.reply); // typewriter cho câu trả lời Luna
      speak(data.reply);
    } catch {
      typewrite("Oops! Something went wrong. Try again!");
      setStatus("idle");
    }
  }, [history, speak, typewrite]);

  // ── Record audio → Groq Whisper → text ───────────────────────────────────
  const handleMic = useCallback(async () => {
    if (status !== "idle") return;
    setStatus("listening");

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      alert("Microphone access denied.\nClick the 🔒 icon in the address bar → Allow microphone.");
      setStatus("idle");
      return;
    }

    chunksRef.current = [];
    const mr = new MediaRecorder(stream);
    mediaRecorderRef.current = mr;

    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mr.onstop = async () => {
      setInterimText("");
      stream.getTracks().forEach((t) => t.stop());

      // Đợi một tick để đảm bảo ondataavailable đã xong
      await new Promise((r) => setTimeout(r, 100));

      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      console.log("[AiChat] blob size:", blob.size, "chunks:", chunksRef.current.length);
      if (blob.size < 100) { setStatus("idle"); return; }

      setStatus("thinking");
      try {
        const form = new FormData();
        form.append("audio", blob, "audio.webm");
        const { data } = await api.post("/api/transcribe", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (data.text) {
          sendMessage(data.text);
        } else {
          setCaption("Couldn't hear you. Try again!");
          setStatus("idle");
        }
      } catch {
        setCaption("Transcription failed. Try again!");
        setStatus("idle");
      }
    };

    mr.start(500); // thu chunk mỗi 500ms, đảm bảo data vào trước khi onstop
  }, [status, sendMessage]);

  const stopListening = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  // ── Text input fallback ───────────────────────────────────────────────────
  const handleTextSend = useCallback(() => {
    const text = inputText.trim();
    if (!text || status !== "idle") return;
    setInputText("");
    sendMessage(text);
  }, [inputText, status, sendMessage]);

  const statusLabel = {
    idle:      "Tap the mic and speak!",
    listening: "🔴 Listening… tap Stop when done",
    thinking:  "🟡 Luna is thinking…",
    speaking:  "🔵 Luna is speaking…",
  }[status];

  return (
    <div className="game-page-wrapper">
      <div className="game-frame">
        <section className="game-panel aichat-panel">

          {/* ── Main row: waveform | luna ── */}
          <div className="aichat-main">
            <div className="aichat-wave-side">
              <div className={`aichat-waveform aichat-waveform--${status}`}>
                {Array.from({ length: BAR_COUNT }, (_, i) => (
                  <div key={i} className="aichat-bar" style={{ "--i": i }} />
                ))}
              </div>
            </div>
            <div className="aichat-luna-side">
              <img src={lunaCard} alt="Luna" className="aichat-luna-img" />
            </div>
          </div>

          {/* Caption */}
          {status === "listening" ? (
            <p className="aichat-caption aichat-caption--interim">
              {interimText || "🎤 …"}
            </p>
          ) : displayed ? (
            <div className="aichat-caption-row">
              <p className="aichat-caption">
                {displayed}
                <span className="aichat-cursor" />
              </p>
              <button
                type="button"
                className="aichat-replay-btn"
                onClick={() => speak(lunaText)}
                title="Replay"
              >
                🔊
              </button>
            </div>
          ) : null}

          {/* Status badge */}
          <div className={`aichat-status-badge aichat-status-badge--${status}`}>
            <span className="aichat-status-dot" />
            <span>{statusLabel}</span>
          </div>

          {/* Controls */}
          <div className="aichat-controls">
            <div className="aichat-mic-group">
              <button
                type="button"
                className={`aichat-mic-btn${status === "listening" ? " aichat-mic-btn--listening" : ""}`}
                onClick={handleMic}
                disabled={status !== "idle"}
                title="Speak"
              >
                🎤
              </button>
              {status === "listening" && (
                <button type="button" className="aichat-stop-btn" onClick={stopListening}>
                  ⏹ Stop
                </button>
              )}
            </div>

            <div className="aichat-text-input">
              <input
                type="text"
                className="aichat-input"
                placeholder="Or type here…"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTextSend()}
                disabled={status !== "idle"}
              />
              <button
                type="button"
                className="aichat-send-btn"
                onClick={handleTextSend}
                disabled={status !== "idle" || !inputText.trim()}
              >
                ➤
              </button>
            </div>
          </div>

        </section>
      </div>

      <div className="game-title-bar">
        <h2 className="game-title">🧑‍🚀 Talk with Luna</h2>
      </div>
    </div>
  );
};

export default AiChat;
