// frontend/src/components/ParentDashboard/SpellingBagGame.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./SpellingBagGame.css";

function shuffleArray(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
}

function generateLetterBank(wordLetters) {
    const distractorsPool = ["B","D","F","G","H","K","L","M","P","R","S","T","W","Y"];
    const needed = [...wordLetters];
    const extraCount = Math.min(3, 8 - needed.length);
    const available = distractorsPool.filter(l => !needed.includes(l));
    const extras = shuffleArray(available).slice(0, extraCount);
    return shuffleArray([...needed, ...extras]);
}

export default function SpellingBagGame() {
    const navigate = useNavigate();
    const [words, setWords] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [slots, setSlots] = useState([]);
    const [letterBank, setLetterBank] = useState([]);
    const [usedLetters, setUsedLetters] = useState([]);
    const [stars, setStars] = useState(0);
    const [feedback, setFeedback] = useState(null);
    const [correctMessage, setCorrectMessage] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [completedAll, setCompletedAll] = useState(false);
    const [confetti, setConfetti] = useState([]);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [showInstructionsModal, setShowInstructionsModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [wrongWords, setWrongWords] = useState([]);

    const feedbackTimeout = useRef(null);
    const currentWord = words[currentIdx];
    const wordLength = currentWord?.letters.length || 0;

    const getChildIdFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        return params.get('childId');
    };

    // Fetch words
    useEffect(() => {
        const fetchWords = async () => {
            try {
                const response = await fetch('/api/spelling/words');
                const data = await response.json();
                if (data.success) {
                    setWords(data.words);
                } else {
                    setError('Failed to load words');
                }
            } catch (err) {
                console.error(err);
                setError('Network error loading words');
            } finally {
                setLoading(false);
            }
        };
        fetchWords();
    }, []);

    // Save final score (called after game finishes)
    const saveFinalScore = useCallback(async (finalStars, wrongWordsArray) => {
        const childId = getChildIdFromUrl();
        if (!childId) return;
        const childSessionId = localStorage.getItem('child_session_id');
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/spelling/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    childId,
                    score: finalStars,
                    totalWords: words.length,
                    wrongWords: wrongWordsArray,
                    childSessionId: childSessionId || null
                })
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Failed to save result:', errorData);
            } else {
                console.log('Result saved successfully');
            }
        } catch (err) {
            console.error('Error saving result:', err);
        }
    }, [words.length]);

    // Audio helpers
    const playSound = useCallback((text) => {
        if (!soundEnabled) return;
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.8;
            utterance.pitch = 1.1;
            window.speechSynthesis.speak(utterance);
        }
    }, [soundEnabled]);

    const playErrorSound = useCallback(() => {
        if (!soundEnabled) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = "sawtooth";
            osc.frequency.value = 220;
            gain.gain.value = 0.15;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
            osc.stop(ctx.currentTime + 0.3);
        } catch(e) {}
    }, [soundEnabled]);

    const launchConfetti = () => {
        const colors = ["#FFB84D", "#3D5A4C", "#FF6B6B", "#4ECDC4", "#FFE66D"];
        const pieces = Array.from({ length: 40 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            color: colors[i % colors.length],
            delay: Math.random() * 0.5,
            size: 6 + Math.random() * 10,
        }));
        setConfetti(pieces);
        setTimeout(() => setConfetti([]), 2500);
    };

    const initWord = useCallback(() => {
        if (!currentWord) return;
        const newBank = generateLetterBank(currentWord.letters);
        setLetterBank(newBank);
        setSlots(Array(wordLength).fill(null));
        setUsedLetters([]);
        setFeedback(null);
        setCorrectMessage(false);
        if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    }, [currentWord, wordLength]);

    useEffect(() => {
        if (words.length > 0) {
            initWord();
        }
    }, [currentIdx, words, initWord]);

    useEffect(() => {
        return () => {
            if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
        };
    }, []);

    const handleLetterClick = (letter, idx) => {
        if (correctMessage) return;
        if (usedLetters.includes(idx)) return;
        const firstEmpty = slots.findIndex(s => s === null);
        if (firstEmpty === -1) return;
        const newSlots = [...slots];
        newSlots[firstEmpty] = letter;
        setSlots(newSlots);
        setUsedLetters([...usedLetters, idx]);
        playSound(letter);
    };

    const handleSlotClick = (slotIdx) => {
        if (correctMessage) return;
        const letter = slots[slotIdx];
        if (!letter) return;
        const usedIdx = usedLetters.find(i => letterBank[i] === letter);
        if (usedIdx !== undefined) {
            setUsedLetters(usedLetters.filter(i => i !== usedIdx));
        }
        const newSlots = [...slots];
        newSlots[slotIdx] = null;
        setSlots(newSlots);
    };

    const checkSpelling = () => {
        if (correctMessage) return;
        const formed = slots.join("");
        if (formed === currentWord.name) {
            setFeedback("correct");
            setCorrectMessage(true);
            const newStars = stars + 10;
            setStars(newStars);
            launchConfetti();
            playSound(currentWord.name + "! Excellent!");

            if (currentIdx + 1 >= words.length) {
                setTimeout(() => {
                    setShowCelebration(true);
                    setCompletedAll(true);
                    saveFinalScore(newStars, wrongWords);
                }, 600);
            } else {
                setTimeout(() => {
                    setFeedback(null);
                    goToNextWord();
                }, 1500);
            }
        } else {
            setFeedback("incorrect");
            playErrorSound();
            if (!wrongWords.includes(currentWord.name)) {
                setWrongWords(prev => [...prev, currentWord.name]);
            }
            if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
            feedbackTimeout.current = setTimeout(() => setFeedback(null), 800);
        }
    };

    const goToNextWord = () => {
        if (currentIdx + 1 < words.length) {
            setCurrentIdx(prev => prev + 1);
        }
    };

    const resetCurrentWord = () => {
        if (correctMessage) return;
        initWord();
    };

    const playWordSound = () => {
        playSound(currentWord.name);
    };

    const toggleSound = () => {
        setSoundEnabled(prev => !prev);
        if (window.speechSynthesis) window.speechSynthesis.cancel();
    };

    const showInstructions = () => {
        setShowInstructionsModal(true);
        setTimeout(() => setShowInstructionsModal(false), 5000);
    };

    const finishGame = () => {
        setShowCelebration(false);
        navigate('/parent-dashboard');
    };

    const allSlotsFilled = slots.every(s => s !== null);

    if (loading) {
        return <div className="loading-state"><div className="spinner"></div><div>Loading game...</div></div>;
    }
    if (error) {
        return <div className="error-state">{error}</div>;
    }
    if (words.length === 0) {
        return <div className="error-state">No words found. Please contact support.</div>;
    }
    if (completedAll && showCelebration) {
        return (
            <div className="spelling-game-container">
                <div className="task-bg" />
                <div className="dark-overlay" />
                <div className="celebration-overlay-final">
                    <div className="celebration-box-final">
                        <div className="celebrate-emoji-final">🏆🎉</div>
                        <h2 className="celebrate-title-final">Amazing Speller!</h2>
                        <p>You spelled all {words.length} words correctly!</p>
                        <p className="final-score">⭐ {stars} stars earned</p>
                        <button className="btn-final-finish" onClick={finishGame}>
                            Go Back to Dashboard 🚀
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="spelling-game-container">
            <div className="task-bg" />
            <div className="dark-overlay" />

            {confetti.map(p => (
                <div key={p.id} className="spelling-confetti" style={{
                    left: `${p.x}%`,
                    backgroundColor: p.color,
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    animationDelay: `${p.delay}s`,
                }} />
            ))}

            <div className="spelling-top-bar">
                <div className="nav-left-group">
                    <button className="spelling-icon-btn home-btn" onClick={() => navigate('/parent-dashboard')} title="Exit Game">🏠</button>
                    <button className="spelling-icon-btn reset-btn" onClick={resetCurrentWord} title="Reset current word">↻</button>
                </div>
                <div className="nav-center-group">
                    <div className="spelling-progress">
                        <span className="progress-label">Word</span>
                        <span className="progress-current">{currentIdx + 1}</span>
                        <span className="progress-sep">/</span>
                        <span className="progress-total">{words.length}</span>
                    </div>
                </div>
                <div className="nav-right-group">
                    <button className="spelling-icon-btn sound-toggle-btn" onClick={toggleSound} title={soundEnabled ? "Mute" : "Unmute"}>
                        {soundEnabled ? "🔊" : "🔇"}
                    </button>
                    <button className="spelling-icon-btn help-btn" onClick={showInstructions} title="How to play">❓</button>
                    <div className="spelling-stars">
                        <span className="star-icon">⭐</span>
                        <span className="stars-count">{stars}</span>
                    </div>
                </div>
            </div>

            {showInstructionsModal && (
                <div className="instructions-tooltip">
                    <div className="tooltip-content">
                        📖 1. Look at the picture<br/>
                        🔊 2. Tap the speaker to hear the word<br/>
                        🟡 3. Tap letters in order to spell the word<br/>
                        ✅ 4. Press CHECK WORD when done
                    </div>
                </div>
            )}

            <div className="spelling-image-area">
                <div className={`spelling-image-card ${feedback === "correct" ? "feedback-correct" : ""} ${feedback === "incorrect" ? "feedback-incorrect" : ""}`}>
                    <img 
                        src={currentWord.image} 
                        alt={currentWord.name}
                        className="spelling-picture"
                        onError={(e) => { e.target.src = "https://placehold.co/400x300?text=🐾"; }}
                    />
                    <div className="picture-hint">🔊 Tap on speaker to hear the word</div>
                    <button className="picture-sound-btn" onClick={playWordSound}>🔊</button>
                </div>
            </div>

            <div className="spelling-slots-area">
                <div className="slots-label">📝 Spell the word</div>
                <div className="slots-row">
                    {slots.map((letter, idx) => (
                        <div
                            key={idx}
                            className={`spelling-slot ${letter ? "slot-filled" : ""}`}
                            onClick={() => handleSlotClick(idx)}
                        >
                            {letter && <span className="slot-letter">{letter}</span>}
                        </div>
                    ))}
                </div>
            </div>

            <div className="spelling-letters-area">
                <div className="letters-label">✨ Choose letters ✨</div>
                <div className="letters-grid">
                    {letterBank.map((letter, idx) => {
                        const isUsed = usedLetters.includes(idx);
                        return (
                            <div
                                key={idx}
                                className={`spelling-ball ${isUsed ? "ball-used" : ""}`}
                                onClick={() => !isUsed && handleLetterClick(letter, idx)}
                            >
                                <span className="ball-letter-text">{letter}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="spelling-check-area">
                <button
                    className={`spelling-check-btn ${allSlotsFilled && !correctMessage ? "check-active" : ""}`}
                    onClick={checkSpelling}
                    disabled={!allSlotsFilled || correctMessage}
                >
                    ✅ CHECK WORD
                </button>
            </div>

            <div className="spelling-monkey">
                <div className="monkey-face">🐵</div>
                <div className="monkey-bubble">
                    {feedback === "correct" ? "🎉 Great job!" : feedback === "incorrect" ? "😅 Try again!" : "Tap the letters to spell!"}
                </div>
            </div>
        </div>
    );
}