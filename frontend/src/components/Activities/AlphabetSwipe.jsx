import React, { useState, useEffect, useRef, useCallback } from "react";
import "./AlphabetSwipe.css";

/* ================================================================
   DATA – original images for flashcards, colors updated
================================================================ */
const CARDS = [
  { id: 1, letter: "E", word: "Elephant",  emoji: "🐘", image: "/assets/elephant.png",  bg: "#D9F0E0", accent: "#2E7D32" },
  { id: 2, letter: "B", word: "Butterfly", emoji: "🦋", image: "/assets/butterfly.png", bg: "#F3E5F5", accent: "#8E24AA" },
  { id: 3, letter: "G", word: "Giraffe",   emoji: "🦒", image: "/assets/giraffe.png",   bg: "#FFF9C4", accent: "#F9A825" },
  { id: 4, letter: "O", word: "Owl",       emoji: "🦉", image: "/assets/owl.png",       bg: "#EFEBE9", accent: "#795548" },
  { id: 5, letter: "C", word: "Cow",       emoji: "🐮", image: "/assets/cow.png",       bg: "#FFF3E0", accent: "#F57C00" },
];

const CONFETTI_COLORS = ["#3DBFB8","#F5A623","#4CAF82","#8B6FD4","#FF6B6B","#FFD700"];

/* ================================================================
   AUDIO
================================================================ */
function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.85; u.pitch = 1.1; u.volume = 1;
  const voices = window.speechSynthesis.getVoices();
  const v = voices.find(v => v.lang.startsWith("en") && /samantha|karen|moira|female/i.test(v.name))
          || voices.find(v => v.lang.startsWith("en")) || voices[0];
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}

/* ================================================================
   ANIMAL IMAGE — with emoji fallback
================================================================ */
function AnimalImg({ src, emoji, alt, className }) {
  const [err, setErr] = useState(false);
  if (err || !src) return <span style={{ fontSize: 72, lineHeight: 1 }}>{emoji}</span>;
  return <img src={src} alt={alt} className={className} onError={() => setErr(true)} />;
}

function getMatchingImageSrc(originalSrc) {
  if (!originalSrc) return originalSrc;
  const dotIndex = originalSrc.lastIndexOf('.');
  if (dotIndex === -1) return originalSrc;
  return originalSrc.slice(0, dotIndex) + '2' + originalSrc.slice(dotIndex);
}

/* ================================================================
   WAVE BARS
================================================================ */
function WaveBars() {
  return (
    <span className="as-wave">
      {[0,1,2,3,4].map(i => <span key={i} className="as-wave-bar" style={{ animationDelay: `${i * 0.12}s` }} />)}
    </span>
  );
}

/* ================================================================
   FLASHCARD
================================================================ */
function FlashCard({ card, animClass, playing, onClick }) {
  return (
    <div className={`as-card ${animClass}`} style={{ background: card.bg }} onClick={onClick}>
      <span className="as-card-blob" style={{ background: card.accent + "25" }} />
      <div className="as-letter" style={{ color: card.accent }}>
        {card.letter}
        <span style={{ color: card.accent + "99", fontSize: "0.6em", marginLeft: 4 }}>
          {card.letter.toLowerCase()}
        </span>
      </div>
      <div className="as-animal-circle" style={{ boxShadow: `0 0 0 7px ${card.accent}30, 0 8px 28px rgba(0,0,0,0.1)` }}>
        <AnimalImg src={card.image} emoji={card.emoji} alt={card.word} className="as-animal-img" />
      </div>
      <div className="as-word" style={{ color: card.accent }}>{card.word}</div>
      <div className="as-pill" style={playing ? { background: card.accent, borderColor: card.accent, color: "#fff" } : {}}>
        <span>🔊</span>
        {playing ? <WaveBars /> : <span>{card.letter} {card.letter.toLowerCase()}… {card.word}</span>}
      </div>
    </div>
  );
}

/* ================================================================
   CONFETTI
================================================================ */
function Confetti({ active }) {
  if (!active) return null;
  return (
    <div className="as-confetti-layer">
      {Array.from({ length: 55 }, (_, i) => (
        <div key={i} className="as-confetti-piece" style={{
          left: `${Math.random() * 100}%`,
          background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          width:  6 + Math.random() * 9,
          height: 6 + Math.random() * 9,
          animationDuration: `${1.5 + Math.random() * 1.2}s`,
          animationDelay:    `${Math.random() * 1.0}s`,
        }} />
      ))}
    </div>
  );
}

/* ================================================================
   MATCHING PHASE – only shake/red flash (no toast messages)
================================================================ */
function MatchingPhase({ cards, onComplete }) {
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [matched, setMatched] = useState({});
  const [wrongAttempts, setWrongAttempts] = useState({});
  const [showFinalResults, setShowFinalResults] = useState(false);
  const [shakeAnimal, setShakeAnimal] = useState(null);
  const [redAnimal, setRedAnimal] = useState(null);
  
  const shuffledAnimals = useRef([...cards].sort(() => Math.random() - 0.5));
  const shuffledLetters = useRef([...cards].sort(() => Math.random() - 0.5));

  const handleLetterClick = (letterObj, idx) => {
    if (matched[letterObj.id]) return;
    setSelectedLetter({ letterObj, idx });
  };

  const handleAnimalClick = (animal) => {
    if (matched[animal.id]) return;
    if (!selectedLetter) return;

    const letter = selectedLetter.letterObj.letter;
    const correct = (letter === animal.letter);
    
    if (correct) {
      speak(`Good job! ${animal.letter} for ${animal.word}`);
      const newMatched = { ...matched, [animal.id]: true, [selectedLetter.letterObj.id]: true };
      setMatched(newMatched);
      setSelectedLetter(null);
      const allMatched = cards.every(c => newMatched[c.id] === true);
      if (allMatched) {
        setShowFinalResults(true);
        setTimeout(() => onComplete(), 2000);
      }
    } else {
      speak("Oops, try again!");
      setWrongAttempts(prev => ({ ...prev, [animal.id]: (prev[animal.id] || 0) + 1 }));
      setShakeAnimal(animal.id);
      setRedAnimal(animal.id);
      setSelectedLetter(null);
      setTimeout(() => setShakeAnimal(null), 400);
      setTimeout(() => setRedAnimal(null), 400);
    }
  };

  const isLetterMatched = (letterId) => matched[letterId];
  const isAnimalMatched = (animalId) => matched[animalId];

  const totalAnimals = cards.length;
  const correctCount = cards.filter(c => matched[c.id] === true).length;
  const totalWrong = Object.values(wrongAttempts).reduce((a,b) => a+b, 0);

  return (
    <div className="as-match-screen-v2">
      <div className="as-match-title-v2">Match the First Letter</div>
      <div className="as-match-sub-v2">Tap a letter, then tap the animal picture</div>

      <div className="as-animals-row">
        {shuffledAnimals.current.map((animal) => (
          <div
            key={animal.id}
            className={`as-match-animal-card 
              ${isAnimalMatched(animal.id) ? "matched" : ""} 
              ${shakeAnimal === animal.id ? "shake" : ""}
              ${redAnimal === animal.id && !isAnimalMatched(animal.id) ? "flash-red" : ""}
            `}
            onClick={() => !isAnimalMatched(animal.id) && handleAnimalClick(animal)}
          >
            <AnimalImg 
              src={getMatchingImageSrc(animal.image)} 
              emoji={animal.emoji} 
              alt={animal.word} 
              className="as-match-animal-img" 
            />
          </div>
        ))}
      </div>

      <div className="as-letters-row">
        {shuffledLetters.current.map((letterObj, idx) => (
          <button
            key={letterObj.id}
            className={`as-match-letter-btn ${isLetterMatched(letterObj.id) ? "matched" : ""} ${selectedLetter?.idx === idx && !isLetterMatched(letterObj.id) ? "selected" : ""}`}
            onClick={() => !isLetterMatched(letterObj.id) && handleLetterClick(letterObj, idx)}
            disabled={isLetterMatched(letterObj.id)}
          >
            {letterObj.letter}
          </button>
        ))}
      </div>

      {showFinalResults && (
        <div className="as-results-banner">
          <div className="as-results-text">Correct: {correctCount} / {totalAnimals} | Wrong attempts: {totalWrong}</div>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   CELEBRATION – with Home button
================================================================ */
function Celebration({ total, onRestart, onHome }) {
  const [confetti, setConfetti] = useState(true);
  useEffect(() => {
    speak("Congratulations! You are a superstar!");
    const t = setTimeout(() => setConfetti(false), 3800);
    return () => clearTimeout(t);
  }, []);
  return (
    <>
      <Confetti active={confetti} />
      <div className="as-celebrate">
        <div className="as-cel-trophy">🏆</div>
        <div className="as-cel-title">Amazing Work!</div>
        <div className="as-cel-sub">You matched all {total} letters correctly!</div>
        <div className="as-stars-row">
          {[0.1, 0.28, 0.46].map((d, i) => (
            <span key={i} className="as-star-pop" style={{ animationDelay: `${d}s` }}>⭐</span>
          ))}
        </div>
        <div className="as-celebrate-buttons">
          <button className="as-home-btn" onClick={onHome}>Home</button>
        </div>
      </div>
    </>
  );
}

/* ================================================================
   MAIN COMPONENT
================================================================ */
export default function AlphabetSwipe() {
  const [phase,   setPhase]   = useState("cards");
  const [idx,     setIdx]     = useState(0);
  const [animCls, setAnimCls] = useState("");
  const [playing, setPlaying] = useState(false);
  const busy = useRef(false);

  useEffect(() => {
    const load = () => window.speechSynthesis.getVoices();
    load();
    window.speechSynthesis.onvoiceschanged = load;
    const t = setTimeout(() => {
      speak(`${CARDS[0].letter}... ${CARDS[0].letter.toLowerCase()}... ${CARDS[0].word}`);
      setPlaying(true);
      setTimeout(() => setPlaying(false), 2400);
    }, 600);
    return () => { clearTimeout(t); window.speechSynthesis.cancel(); };
  }, []);

  const playCard = useCallback((card) => {
    speak(`${card.letter}... ${card.letter.toLowerCase()}... ${card.word}`);
    setPlaying(true);
    setTimeout(() => setPlaying(false), 2400);
  }, []);

  const go = useCallback((dir) => {
    if (busy.current) return;
    busy.current = true;
    setAnimCls(dir === "next" ? "slide-out-left" : "slide-out-right");
    setTimeout(() => {
      const next = dir === "next" ? idx + 1 : idx - 1;
      setIdx(next);
      setAnimCls(dir === "next" ? "slide-in-right" : "slide-in-left");
      busy.current = false;
      playCard(CARDS[next]);
      setTimeout(() => setAnimCls(""), 420);
    }, 260);
  }, [idx, playCard]);

  const tx = useRef(null);
  const onTS = (e) => { tx.current = e.touches[0].clientX; };
  const onTE = (e) => {
    if (tx.current === null || phase !== "cards") return;
    const dx = tx.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 48) {
      if (dx > 0) { if (idx < CARDS.length - 1) go("next"); else setPhase("match"); }
      else        { if (idx > 0) go("prev"); }
    }
    tx.current = null;
  };

  const restart = () => {
    setPhase("cards"); setIdx(0); setAnimCls("");
    setTimeout(() => playCard(CARDS[0]), 300);
  };

  const goHome = () => {
    // Navigate to parent dashboard (adjust path as needed)
    window.location.href = '/parent-dashboard';
  };

  const handleNextOrMatch = () => {
    if (idx < CARDS.length - 1) {
      go("next");
    } else {
      setPhase("match");
    }
  };

  const pct = Math.round(((idx + 1) / CARDS.length) * 100);

  return (
    <div className="as-app" onTouchStart={onTS} onTouchEnd={onTE}>
      <header className="as-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* DS Logo - only logo, no text */}
          <div style={{ 
            width: 36, 
            height: 36, 
            background: '#F5A623', 
            borderRadius: 8, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontWeight: 900, 
            fontSize: '0.8rem', 
            color: '#1E2E5C', 
            fontFamily: "'DM Serif Display', serif" 
          }}>
            DS
          </div>
          <button className="as-home-top-btn" onClick={goHome}>
            🏠 Home
          </button>
        </div>
        <div className="as-hcenter">
          <span className="as-htitle">Alphabet Swiping Adventure</span>
          <div className="as-bar-track">
            <div className="as-bar-fill" style={{ width: `${phase === "done" ? 100 : pct}%` }} />
          </div>
        </div>
        {/* No extra spacer – header uses justify-content: space-between */}
      </header>

      {phase === "cards" && (
        <>
          <div className="as-counter">Card {idx + 1} / {CARDS.length}</div>
          <div className="as-stage">
            <div className="as-card-row">
              <button className="as-arrow" disabled={idx === 0} onClick={() => go("prev")}>‹</button>
              <div className="as-card-area">
                <FlashCard card={CARDS[idx]} animClass={animCls} playing={playing} onClick={() => playCard(CARDS[idx])} />
              </div>
              <button className="as-arrow" disabled={idx === CARDS.length - 1} onClick={() => go("next")}>›</button>
            </div>
            <div className="as-bottom">
              <button className="as-next-btn" onClick={handleNextOrMatch}>
                {idx < CARDS.length - 1 ? "Next Card →" : "Start Matching ✅"}
              </button>
              <div className="as-dots">
                {CARDS.map((_, i) => (
                  <span key={i} className={`as-dot ${i === idx ? "act" : i < idx ? "done" : ""}`} />
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {phase === "match" && (
        <MatchingPhase
          cards={CARDS}
          onComplete={() => setPhase("done")}
        />
      )}

      {phase === "done" && (
        <Celebration total={CARDS.length} onRestart={restart} onHome={goHome} />
      )}
    </div>
  );
}