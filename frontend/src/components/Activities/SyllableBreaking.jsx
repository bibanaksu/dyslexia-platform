import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom"; // add this for navigation
import "./SyllableBreaking.css";

/* ================================================================
   DATA – each word has an image path (place images in public/assets/)
================================================================ */
const WORDS = [
  { id: 1, name: "Banana",   syllables: ["ba","na","na"], letters: ["b","a","n","a","n","a"], bg: "#FFF9C4", accent: "#F9A825", imagePath: "/assets/banana.png" },
  { id: 2, name: "Apple",    syllables: ["ap","ple"],     letters: ["a","p","p","l","e"],    bg: "#FFEBEE", accent: "#E53935", imagePath: "/assets/apple.png" },
  { id: 3, name: "Tiger",    syllables: ["ti","ger"],     letters: ["t","i","g","e","r"],    bg: "#FFF3E0", accent: "#F57C00", imagePath: "/assets/tiger.png" },
  { id: 4, name: "Robot",    syllables: ["ro","bot"],     letters: ["r","o","b","o","t"],    bg: "#E3F2FD", accent: "#1E88E5", imagePath: "/assets/robot.png" },
  { id: 5, name: "Elephant", syllables: ["el","e","phant"], letters: ["e","l","e","p","h","a","n","t"], bg: "#E8F5E9", accent: "#43A047", imagePath: "/assets/elephant.png" },
];

// Map written syllables to how they should be spoken (blended sounds)
const SYLLABLE_SPOKEN = {
  "ple": "pul", "ger": "gur", "phant": "fant", "bot": "baht", "na": "nah",
  "ba": "bah", "ti": "tee", "ro": "roh", "el": "ell", "ap": "ap"
};

function getSpokenSyllable(syl) {
  return SYLLABLE_SPOKEN[syl] || syl;
}

const CONFETTI_COLORS = ["#3DBFB8","#F5A623","#4CAF82","#8B6FD4","#FF6B6B","#FFD700"];

/* ================================================================
   SPEECH – auto-enabled on mount
================================================================ */
let speechReady = false;

function unlockSpeech() {
  if (speechReady) return;
  speechReady = true;
  const dummy = new SpeechSynthesisUtterance(" ");
  window.speechSynthesis.speak(dummy);
}

function speakText(text, rate = 0.85, pitch = 1.0) {
  if (!speechReady || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = 1;
  const voices = window.speechSynthesis.getVoices();
  const friendly = voices.find(v => v.lang.startsWith("en") && (v.name.includes("Samantha") || v.name.includes("Google") || v.name.includes("Karen"))) || voices.find(v => v.lang.startsWith("en"));
  if (friendly) utterance.voice = friendly;
  window.speechSynthesis.speak(utterance);
}

function speakWordAndSyllables(wordObj) {
  if (!speechReady) return;
  speakText(wordObj.name, 0.85, 1.05);
  setTimeout(() => {
    wordObj.syllables.forEach((syl, idx) => {
      setTimeout(() => {
        const spoken = getSpokenSyllable(syl);
        speakText(spoken, 0.8, 1.0);
      }, idx * 750);
    });
  }, 900);
}

function speakSingleSyllable(syl) {
  if (!speechReady) return;
  const spoken = getSpokenSyllable(syl);
  speakText(spoken, 0.8, 1.0);
}

/* ================================================================
   SOUND EFFECTS – only for completion reward
================================================================ */
const playCompletionBeep = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.2);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
    ctx.resume();
  } catch(e) {}
};

/* ================================================================
   WAVE BARS
================================================================ */
function WaveBars() {
  return (
    <span className="sy-wave">
      {[0,1,2,3,4].map(i => (
        <span key={i} className="sy-wave-bar" style={{ animationDelay: `${i * 0.12}s` }} />
      ))}
    </span>
  );
}

/* ================================================================
   CONFETTI
================================================================ */
function Confetti({ active }) {
  if (!active) return null;
  return (
    <div className="sy-confetti-layer">
      {Array.from({ length: 55 }, (_, i) => {
        const size = 6 + Math.random() * 9;
        return (
          <div key={i} className="sy-confetti-piece" style={{
            left: `${Math.random() * 100}%`,
            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            width: size,
            height: size,
            animationDuration: `${1.5 + Math.random() * 1.2}s`,
            animationDelay: `${Math.random()}s`,
          }} />
        );
      })}
    </div>
  );
}

/* ================================================================
   FLASHCARD
================================================================ */
function FlashCard({ word, animClass, playing, onCardClick, onSyllableClick, isLastCard, onBuildClick }) {
  return (
    <div className={`sy-card ${animClass}`} style={{ background: word.bg }} onClick={onCardClick}>
      <div className="sy-card-blob" style={{ background: `radial-gradient(circle, ${word.accent}22 0%, transparent 70%)` }} />
      <div className="sy-word" style={{ color: word.accent }}>{word.name}</div>
      <div className="sy-image-circle" style={{ boxShadow: `0 0 0 7px ${word.accent}30, 0 8px 28px rgba(0,0,0,0.09)` }}>
        <img src={word.imagePath} alt={word.name} className="sy-picture-img" />
      </div>
      <div className={`sy-audio-pill${playing ? " playing" : ""}`} style={playing ? { background: word.accent, borderColor: word.accent, color: "#fff" } : {}} onClick={e => { e.stopPropagation(); onCardClick(); }}>
        <span>🔊</span>
        {playing ? <WaveBars /> : <span>Hear word &amp; syllables</span>}
      </div>
      <div className="sy-syllables-row">
        {word.syllables.map((syl, idx) => (
          <button key={idx} className="sy-syllable-btn" style={{ background: word.accent + "22", borderColor: word.accent }} onClick={e => { e.stopPropagation(); onSyllableClick(syl); }}>
            {syl}
          </button>
        ))}
      </div>
      {isLastCard && (
        <button className="sy-build-under-btn" style={{ background: word.accent }} onClick={e => { e.stopPropagation(); onBuildClick(); }}>
          🧩 Start Word Building Challenge →
        </button>
      )}
    </div>
  );
}

/* ================================================================
   WORD BUILDER – VERY BIG IMAGE (280px) & NO SOUND ON LETTER CLICKS
================================================================ */
function WordBuilder({ word, onWordComplete }) {
  const targetSlots = word.syllables.map(syl => syl.split(""));
  const [slots, setSlots] = useState(() => targetSlots.map(() => []));
  const [availableLetters, setAvailableLetters] = useState(() => [...word.letters].sort(() => Math.random() - 0.5));
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
  const [shakeLetter, setShakeLetter] = useState(null);
  const [errorFlash, setErrorFlash] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [errorCount, setErrorCount] = useState(0);

  const allGroupsFilled = () => slots.every((group, idx) => group.length === targetSlots[idx].length);

  useEffect(() => {
    if (!completed && allGroupsFilled()) {
      setCompleted(true);
      setToastMsg("🎉 Word complete! Great building! 🎉");
      playCompletionBeep();
      if (speechReady) speakText(`Excellent! You built ${word.name}!`, 0.85, 1.1);
      setTimeout(() => {
        onWordComplete({ wordId: word.id, success: true, errors: errorCount });
      }, 1200);
    }
  }, [slots, completed, allGroupsFilled, word, errorCount, onWordComplete]);

  const handleLetterClick = (letter, idx) => {
    if (completed) return;
    const currentTarget = targetSlots[currentSlotIndex];
    const currentFilled = slots[currentSlotIndex];
    const neededLetter = currentTarget[currentFilled.length];
    if (letter === neededLetter) {
      // CORRECT – only visual, no sound
      const newSlots = [...slots];
      newSlots[currentSlotIndex] = [...currentFilled, letter];
      setSlots(newSlots);
      const newAvail = [...availableLetters];
      newAvail.splice(idx, 1);
      setAvailableLetters(newAvail);
      
      const syllableFinished = newSlots[currentSlotIndex].length === currentTarget.length;
      if (syllableFinished) {
        const builtSyllable = word.syllables[currentSlotIndex];
        if (speechReady) speakText(getSpokenSyllable(builtSyllable), 0.8, 1.0);
        setToastMsg(`✓ Syllable "${builtSyllable}" built!`);
        setTimeout(() => setToastMsg(""), 1200);
        if (currentSlotIndex + 1 < targetSlots.length) {
          setCurrentSlotIndex(currentSlotIndex + 1);
        }
      }
    } else {
      // WRONG – visual feedback + gentle speech (no beep)
      setErrorCount(prev => prev + 1);
      setShakeLetter(letter);
      setErrorFlash(true);
      if (speechReady) speakText("Almost! Try again!", 0.9, 1.0);
      setTimeout(() => setShakeLetter(null), 420);
      setTimeout(() => setErrorFlash(false), 420);
    }
  };

  const isSlotComplete = (slotIdx) => slots[slotIdx]?.length === targetSlots[slotIdx]?.length;

  return (
    <div className="sy-building-screen">
      <div className="sy-building-header">
        {/* SUPER BIG IMAGE – 280px */}
        <div style={{ marginBottom: 16 }}>
          <img 
            src={word.imagePath} 
            alt={word.name} 
            style={{ 
              width: "280px", 
              height: "280px", 
              objectFit: "contain", 
              borderRadius: "50%", 
              background: "white", 
              padding: "20px",
              boxShadow: "0 16px 32px rgba(0,0,0,0.2)",
              border: `8px solid ${word.accent}`
            }} 
          />
        </div>
        <button className="sy-audio-pill" onClick={() => { if (speechReady) speakText(word.name, 0.85, 1.05); }} style={{ marginTop: 8, fontSize: 16, background: "#E0F7F6" }}>
          🔊 Listen to the word
        </button>
      </div>

      <div className="sy-slots-container">
        {targetSlots.map((target, sIdx) => {
          const filled = slots[sIdx] || [];
          const isActive = sIdx === currentSlotIndex && !completed;
          const isDone = isSlotComplete(sIdx);
          return (
            <div key={sIdx} className={`sy-slot-group ${isActive ? "active-slot" : ""} ${isDone ? "done-slot" : ""}`}>
              <div className="sy-slot-label" style={{ fontSize: 18, opacity: 0.7 }}>
                {isDone ? "✓" : `Part ${sIdx+1}`}
              </div>
              <div className="sy-slot-letters">
                {target.map((_, i) => (
                  <div key={i} className="sy-slot-letter-box" style={{ background: filled[i] ? `${word.accent}40` : "#f0f0f0" }}>
                    {filled[i] ? (
                      <span className="sy-slot-letter" style={{ color: word.accent }}>{filled[i]}</span>
                    ) : (
                      <span className="sy-slot-blank">❓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="sy-letters-bank">
        {availableLetters.map((letter, idx) => {
          const isShaking = shakeLetter === letter;
          return (
            <button key={idx} className={`sy-letter-tile ${isShaking ? "shake" : ""} ${isShaking && errorFlash ? "flash-red" : ""}`} style={{ background: `${word.accent}22`, borderColor: word.accent, color: word.accent }} onClick={() => handleLetterClick(letter, idx)}>
              {letter}
            </button>
          );
        })}
      </div>

      {toastMsg && <div className="sy-complete-toast">{toastMsg}</div>}
      {completed && <Confetti active={true} />}
    </div>
  );
}

/* ================================================================
   ALL WORDS CHALLENGE
================================================================ */
function AllWordsChallenge({ words, onCompleteAll }) {
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [results, setResults] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);

  const currentWord = words[currentWordIdx];
  const isLast = currentWordIdx === words.length - 1;

  const handleWordComplete = (stats) => {
    setResults(prev => [...prev, { ...stats, wordName: currentWord.name }]);
    if (isLast) {
      setShowCelebration(true);
      setTimeout(() => {
        const totalCorrect = results.length + 1;
        const totalErrors = [...results, stats].reduce((sum, r) => sum + (r.errors || 0), 0);
        const totalWords = words.length;
        const accuracy = totalWords > 0 ? Math.round(((totalCorrect - (totalErrors > 0 ? 1 : 0)) / totalWords) * 100) : 100;
        onCompleteAll({ totalWords, totalCorrect, totalErrors, accuracy, details: [...results, stats] });
      }, 800);
    } else {
      setCurrentWordIdx(prev => prev + 1);
    }
  };

  if (showCelebration) {
    return (
      <div className="sy-celebrate" style={{ flex: 1, justifyContent: "center" }}>
        <div className="sy-cel-trophy">🏆✨</div>
        <div className="sy-cel-title">Challenge Complete!</div>
        <div style={{ fontSize: 22, marginTop: 12 }}>Moving to your rewards...</div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className="sy-counter" style={{ marginTop: 8 }}>
        Building word {currentWordIdx+1} of {words.length}
      </div>
      <WordBuilder key={currentWord.id} word={currentWord} onWordComplete={handleWordComplete} />
    </div>
  );
}

/* ================================================================
   FINAL SUMMARY
================================================================ */
function FinalSummary({ stats, wordsCount, onRestart }) {
  const { totalCorrect, totalErrors, accuracy } = stats;
  const starsEarned = Math.min(5, Math.floor(accuracy / 20) + (totalErrors === 0 ? 1 : 0));
  return (
    <div className="sy-celebrate">
      <Confetti active={true} />
      <div className="sy-cel-trophy">🏅🏅🏅</div>
      <div className="sy-cel-title">You're a syllable master!</div>
      <div className="sy-cel-sub">Word Building Champion</div>
      <div style={{ marginTop: 16, background: "#FDF8E7", padding: "16px 28px", borderRadius: 48, width: "80%", maxWidth: 400 }}>
        <div>✅ Words completed: {totalCorrect} / {wordsCount}</div>
        <div>🎯 Accuracy: {accuracy}%</div>
        <div>⭐ Stars earned: {"⭐".repeat(starsEarned)}</div>
        <div>💪 Total learning attempts: {totalErrors + totalCorrect}</div>
      </div>
      <div className="sy-celebrate-buttons">
        <button className="sy-replay-btn" onClick={onRestart}>Play Again</button>
      </div>
    </div>
  );
}

/* ================================================================
   MAIN COMPONENT – no welcome screen, auto-start speech, home navigates to parent dashboard
================================================================ */
export default function SpellingBagGame() {
  const navigate = useNavigate(); // React Router navigation
  const [phase, setPhase] = useState("cards");
  const [idx, setIdx] = useState(0);
  const [animCls, setAnimCls] = useState("");
  const [playing, setPlaying] = useState(false);
  const [stars, setStars] = useState(0);
  const [challengeStats, setChallengeStats] = useState(null);
  const busy = useRef(false);
  const speechUnlocked = useRef(false);

  const currentWord = WORDS[idx];
  const isLastCard = idx === WORDS.length - 1;
  const pct = Math.round(((idx + 1) / WORDS.length) * 100);

  // Auto-enable speech on component mount (browser may still require user interaction, but we try)
  useEffect(() => {
    if (!speechUnlocked.current) {
      speechUnlocked.current = true;
      unlockSpeech();
      // Small delay to let voices load, then auto-play first word audio
      setTimeout(() => {
        speakWordAndSyllables(WORDS[0]);
        setPlaying(true);
        setTimeout(() => setPlaying(false), 3800);
      }, 500);
    }
  }, []);

  const playCardAudio = () => {
    speakWordAndSyllables(currentWord);
    setPlaying(true);
    setTimeout(() => setPlaying(false), 3800);
  };

  const go = (dir) => {
    if (busy.current) return;
    busy.current = true;
    setAnimCls(dir === "next" ? "slide-out-left" : "slide-out-right");
    setTimeout(() => {
      const next = dir === "next" ? idx + 1 : idx - 1;
      setIdx(next);
      setAnimCls(dir === "next" ? "slide-in-right" : "slide-in-left");
      speakWordAndSyllables(WORDS[next]);
      setPlaying(true);
      setTimeout(() => setPlaying(false), 3800);
      setTimeout(() => { setAnimCls(""); busy.current = false; }, 400);
    }, 240);
  };

  const startFullWordChallenge = () => {
    setPhase("challenge");
  };

  const handleAllWordsFinished = (finalStats) => {
    setChallengeStats(finalStats);
    setPhase("summary");
    const finalStars = Math.min(10, Math.floor(finalStats.accuracy / 10));
    setStars(finalStars);
  };

  const restartGame = () => {
    setPhase("cards");
    setIdx(0);
    setAnimCls("");
    setStars(0);
    setChallengeStats(null);
    // re-speak first word after restart
    setTimeout(() => {
      speakWordAndSyllables(WORDS[0]);
      setPlaying(true);
      setTimeout(() => setPlaying(false), 3800);
    }, 300);
  };

  const goToParentDashboard = () => {
    navigate("/parent-dashboard"); // adjust route as needed
  };

  return (
    <div className="sy-app">
      <header className="sy-header">
        <button className="sy-home-top-btn" onClick={goToParentDashboard}>🏠 Home</button>
        <div className="sy-hcenter">
          <span className="sy-htitle">Syllable Breaking Adventure</span>
          <div className="sy-bar-track">
            <div className="sy-bar-fill" style={{ width: `${phase === "summary" ? 100 : phase === "challenge" ? 100 : pct}%` }} />
          </div>
        </div>
       
      </header>

      {phase === "cards" && (
        <>
          <div className="sy-counter">Word {idx + 1} / {WORDS.length}</div>
          <div className="sy-stage">
            <button className="sy-arrow" disabled={idx === 0} onClick={() => go("prev")}>‹</button>
            <div className="sy-card-area">
              <FlashCard
                word={currentWord}
                animClass={animCls}
                playing={playing}
                onCardClick={playCardAudio}
                onSyllableClick={(syl) => speakSingleSyllable(syl)}
                isLastCard={isLastCard}
                onBuildClick={startFullWordChallenge}
              />
            </div>
            <button className="sy-arrow" disabled={isLastCard} onClick={() => go("next")}>›</button>
          </div>
          <div className="sy-bottom">
            <div className="sy-dots">
              {WORDS.map((_, i) => (
                <span key={i} className={`sy-dot${i === idx ? " act" : i < idx ? " done" : ""}`} />
              ))}
            </div>
          </div>
        </>
      )}

      {phase === "challenge" && (
        <AllWordsChallenge words={WORDS} onCompleteAll={handleAllWordsFinished} />
      )}

      {phase === "summary" && challengeStats && (
        <FinalSummary stats={challengeStats} wordsCount={WORDS.length} onRestart={restartGame} />
      )}
    </div>
  );
}