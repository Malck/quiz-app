import React, { useState, useEffect, useRef } from 'react';
 
const TIMER_DURATION = 20;
const LETTERS = ['A', 'B', 'C', 'D'];
 
function TimerRing({ timeLeft, total }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / total;
  const offset = circumference * (1 - progress);
 
  let color = 'var(--cyan)';
  if (progress < 0.5) color = 'var(--yellow)';
  if (progress < 0.25) color = 'var(--pink)';
 
  return (
    <div className="timer-ring">
      <svg width="54" height="54" viewBox="0 0 54 54">
        <circle className="timer-ring-bg" cx="27" cy="27" r={radius} />
        <circle
          className="timer-ring-fill"
          cx="27" cy="27" r={radius}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="timer-number">{timeLeft}</div>
    </div>
  );
}
 
function QuizScreen({ question, roundResult, onSubmitAnswer, gameState, currentPlayerPseudo }) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
 
  // ✅ State local pour les scores — initialisé depuis gameState
  const [scores, setScores] = useState(
    gameState?.players.map(p => ({ pseudo: p.pseudo, score: p.score })) || []
  );
 
  const timerRef = useRef(null);
 
  // ✅ Mise à jour des scores à chaque résultat de round
  useEffect(() => {
    if (roundResult?.scores) setScores(roundResult.scores);
  }, [roundResult]);
 
  // Reset à chaque nouvelle question
  useEffect(() => {
    setSelectedAnswer(null);
    setIsWaiting(false);
    setTimeLeft(TIMER_DURATION);
  }, [question]);
 
  // Timer countdown
  useEffect(() => {
    if (!question || roundResult || isWaiting) {
      clearInterval(timerRef.current);
      return;
    }
 
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (!isWaiting) {
            setIsWaiting(true);
            onSubmitAnswer('__timeout__');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
 
    return () => clearInterval(timerRef.current);
  }, [question, roundResult, isWaiting, onSubmitAnswer]);
 
  const handleAnswerClick = (answer) => {
    if (isWaiting || roundResult) return;
    clearInterval(timerRef.current);
    setSelectedAnswer(answer);
    setIsWaiting(true);
    onSubmitAnswer(answer);
  };
 
  const totalQuestions = gameState?.questions?.length || 10;
  const currentIndex = gameState?.currentQuestionIndex ?? 0;
  const progressPercent = (currentIndex / totalQuestions) * 100;
 
  const renderDevinetteHeader = () => {
    const answererIndex = currentIndex % 2;
    const guesserIndex = (currentIndex + 1) % 2;
    const answerer = gameState.players[answererIndex];
    const guesser = gameState.players[guesserIndex];
 
    if (guesser.pseudo === currentPlayerPseudo) {
      return (
        <div className="guesser-info">
          🔮 Devinez la réponse de <strong>{answerer.pseudo}</strong>
        </div>
      );
    }
    return (
      <div className="guesser-info">
        👁️ <strong>{guesser.pseudo}</strong> devine votre réponse...
      </div>
    );
  };
 
  // ── VUE RÉSULTAT ──
  if (roundResult) {
    const renderBadge = () => {
      if (gameState.categoryType === 'devinette') {
        if (roundResult.wasMatch) {
          const isWinner = roundResult.winnerOfRound === currentPlayerPseudo;
          return isWinner
            ? <span className="result-badge win">🎉 +1 Point !</span>
            : <span className="result-badge neutral">Bonne devinette !</span>;
        }
        return <span className="result-badge lose">Pas de match</span>;
      }
      if (gameState.categoryType === 'classique') {
        const iWon = roundResult.winners?.includes(currentPlayerPseudo);
        if (iWon) return <span className="result-badge win">🎉 +1 Point !</span>;
        if (roundResult.winners?.length > 0) return <span className="result-badge lose">Raté !</span>;
        return <span className="result-badge neutral">Personne n'a trouvé</span>;
      }
    };
 
    const renderResult = () => {
      if (gameState.categoryType === 'devinette') {
        return (
          <div className="result-title">
            {roundResult.wasMatch ? 'Même réponse !' : 'Pas pareil !'}
          </div>
        );
      }
      if (gameState.categoryType === 'classique') {
        return (
          <>
            <div className="result-title" style={{ fontSize: '1.1rem', fontFamily: 'var(--font-body)', marginBottom: '0.25rem' }}>
              Bonne réponse :
            </div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.5rem', color: 'var(--green)', letterSpacing: '1px' }}>
              {roundResult.correctAnswer}
            </div>
          </>
        );
      }
    };
 
    return (
      <div className="quiz-container result-view">
        {renderBadge()}
        {renderResult()}
 
        <div className="answers-recap">
          {Object.entries(roundResult.answers).map(([p, answer]) => (
            answer !== '__timeout__' && (
              <div className="recap-row" key={p}>
                <strong>{p}</strong>
                <span className="recap-answer">{answer}</span>
              </div>
            )
          ))}
        </div>
 
        {/* ✅ Scores depuis le state local — toujours à jour */}
        <div className="scores-bar">
          {scores.map(p => (
            <div key={p.pseudo} className={`score-chip ${p.pseudo === currentPlayerPseudo ? 'me' : ''}`}>
              <div className="score-chip-name">{p.pseudo}</div>
              <div className="score-chip-value">{p.score}</div>
            </div>
          ))}
        </div>
 
        <p className="next-label">⏭ Prochaine question...</p>
      </div>
    );
  }
 
  if (!question) return <div>Chargement...</div>;
 
  // ── VUE QUESTION ──
  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <span className="question-counter">Question {currentIndex + 1} / {totalQuestions}</span>
        <span className="question-counter">{gameState.categoryName}</span>
      </div>
      <div className="progress-bar-wrap">
        <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
      </div>
 
      {/* ✅ Scores depuis le state local — mis à jour après chaque round */}
      <div className="scores-bar">
        {scores.map(p => (
          <div key={p.pseudo} className={`score-chip ${p.pseudo === currentPlayerPseudo ? 'me' : ''}`}>
            <div className="score-chip-name">{p.pseudo}</div>
            <div className="score-chip-value">{p.score}</div>
          </div>
        ))}
      </div>
 
      {gameState.categoryType === 'devinette' && renderDevinetteHeader()}
 
      <div className="timer-wrap">
        <TimerRing timeLeft={timeLeft} total={TIMER_DURATION} />
      </div>
 
      <p className="question-text">{question.question}</p>
 
      <div className="answers-grid">
        {question.reponses.map((reponse, index) => (
          <button
            key={index}
            className={`answer-btn ${selectedAnswer === reponse ? 'selected' : ''}`}
            onClick={() => handleAnswerClick(reponse)}
            disabled={isWaiting}
          >
            <span className="answer-letter">{LETTERS[index]}</span>
            <span>{reponse}</span>
          </button>
        ))}
      </div>
 
      {isWaiting && (
        <p className="waiting-message">
          En attente de l'autre joueur
          <span className="dots"><span /><span /><span /></span>
        </p>
      )}
    </div>
  );
}
 
export default QuizScreen;