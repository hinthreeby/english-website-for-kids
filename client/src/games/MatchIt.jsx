import { useEffect, useMemo, useState } from "react";
import useSound from "../hooks/useSound";

const pairPool = [
  { id: "apple", emoji: "🍎", word: "Apple" },
  { id: "cat", emoji: "🐱", word: "Cat" },
  { id: "sun", emoji: "☀️", word: "Sun" },
  { id: "car", emoji: "🚗", word: "Car" },
  { id: "fish", emoji: "🐟", word: "Fish" },
  { id: "ball", emoji: "⚽", word: "Ball" },
  { id: "book", emoji: "📘", word: "Book" },
  { id: "moon", emoji: "🌙", word: "Moon" },
  { id: "tree", emoji: "🌳", word: "Tree" },
  { id: "cake", emoji: "🎂", word: "Cake" },
  { id: "star", emoji: "⭐", word: "Star" },
  { id: "duck", emoji: "🦆", word: "Duck" },
];

const shuffled = (array) => [...array].sort(() => Math.random() - 0.5);
const TOTAL_QUESTIONS = 8;

const MatchIt = ({ onComplete }) => {
  const { playPop, playChime, playWhoosh, speakText } = useSound();
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [locked, setLocked] = useState(false);
  const [hintPair, setHintPair] = useState("");
  const [interactionTick, setInteractionTick] = useState(0);

  const cards = useMemo(() => {
    const chosen = shuffled(pairPool).slice(0, TOTAL_QUESTIONS);
    const mapped = chosen.flatMap((pair) => [
      { id: `${pair.id}-emoji`, pairId: pair.id, text: pair.emoji, type: "emoji" },
      { id: `${pair.id}-word`, pairId: pair.id, text: pair.word, type: "word" },
    ]);
    return shuffled(mapped);
  }, []);

  useEffect(() => {
    speakText("Match each emoji with its word.");
  }, [speakText]);

  useEffect(() => {
    if (matched.size === TOTAL_QUESTIONS) {
      const stars = mistakes === 0 ? 3 : mistakes === 1 ? 2 : 1;
      onComplete({ stars, mistakes });
    }
  }, [matched, mistakes, onComplete]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const remainingCard = cards.find((card) => !matched.has(card.pairId));
      setHintPair(remainingCard?.pairId || "");
    }, 30000);
    return () => clearTimeout(timeout);
  }, [cards, interactionTick, matched]);

  const onCardClick = (card) => {
    if (locked || matched.has(card.pairId) || flipped.some((item) => item.id === card.id)) {
      return;
    }

    playPop();
    setHintPair("");
    setInteractionTick((n) => n + 1);

    if (flipped.length === 0) {
      setFlipped([card]);
      return;
    }

    const firstCard = flipped[0];
    const nextFlipped = [firstCard, card];
    setFlipped(nextFlipped);
    setLocked(true);

    if (firstCard.pairId === card.pairId && firstCard.type !== card.type) {
      playChime();
      setTimeout(() => {
        setMatched((prev) => new Set([...prev, card.pairId]));
        setFlipped([]);
        setLocked(false);
      }, 450);
      return;
    }

    playWhoosh();
    speakText("Try again! 💪");
    setMistakes((m) => m + 1);
    setTimeout(() => {
      setFlipped([]);
      setLocked(false);
    }, 700);
  };

  return (
    <div className="game-page-wrapper">
      <div className="game-frame">
        <section className="game-panel">
          <p className="round">Find all {TOTAL_QUESTIONS} pairs</p>
          <div className="match-grid">
        {cards.map((card) => {
          const isOpen = flipped.some((item) => item.id === card.id) || matched.has(card.pairId);
          const isHinted = hintPair === card.pairId && !matched.has(card.pairId);

          return (
            <button
              key={card.id}
              type="button"
              className={[
                "kid-btn match-card",
                isOpen ? "open" : "",
                isHinted ? "wiggle" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onCardClick(card)}
            >
              <span style={{ fontSize: "0.5em", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
                {isOpen ? card.text : "⭐"}
              </span>
            </button>
          );
        })}
          </div>
        </section>
      </div>

      <div className="game-title-bar">
        <h2 className="game-title">🧩 Match It</h2>
      </div>
    </div>
  );
};

export default MatchIt;
