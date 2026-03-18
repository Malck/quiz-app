import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import HomeScreen from './components/HomeScreen';
import LobbyScreen from './components/LobbyScreen';
import QuizScreen from './components/QuizScreen';
import EndScreen from './components/EndScreen';
import './App.css';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
const socket = io(SERVER_URL);

const slideVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -12, transition: { duration: 0.2 } },
};

function App() {
  const [screen, setScreen] = useState('home');
  const [pseudo, setPseudo] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [gameState, setGameState] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [roundResult, setRoundResult] = useState(null);

  const resetToHome = useCallback(() => {
    setScreen('home');
    setGameState(null);
    setRoomCode('');
    setCurrentQuestion(null);
    setRoundResult(null);
  }, []);

  useEffect(() => {
    socket.on('roomUpdate', (newGameState) => {
      setGameState(newGameState);
      setRoomCode(newGameState.roomCode);
      setScreen(prev => {
        if (prev === 'end') return 'lobby';
        if (prev !== 'lobby' && prev !== 'quiz') return 'lobby';
        return prev;
      });
    });

    socket.on('gameStarted', () => setScreen('quiz'));

    socket.on('newQuestion', (payload) => {
      setRoundResult(null);
      setCurrentQuestion(payload.question);
      setGameState(prev => prev ? { ...prev, currentQuestionIndex: payload.questionIndex } : prev);
    });

    socket.on('roundResult', (result) => setRoundResult(result));

    socket.on('gameOver', (finalGameState) => {
      setGameState(finalGameState);
      setScreen('end');
    });

    socket.on('error', (message) => alert(message));

    socket.on('playerDisconnected', (data) => {
      alert(data.message);
      resetToHome();
    });

    return () => {
      socket.off('roomUpdate');
      socket.off('gameStarted');
      socket.off('newQuestion');
      socket.off('roundResult');
      socket.off('gameOver');
      socket.off('error');
      socket.off('playerDisconnected');
    };
  }, [resetToHome]);

  const handleCreateRoom = (data) => { setPseudo(data.pseudo); socket.emit('createRoom', data); };
  const handleJoinRoom   = (data) => { setPseudo(data.pseudo); socket.emit('joinRoom', data); };
  const handleReady      = () => socket.emit('playerReady', { roomCode });
  const handleSubmitAnswer = (answer) => socket.emit('submitAnswer', { roomCode, answer });
  const handleReplay     = () => {
    setCurrentQuestion(null);
    setRoundResult(null);
    socket.emit('replayGame', { roomCode });
  };

  const screens = { home: 'home', lobby: 'lobby', quiz: 'quiz', end: 'end' };

  return (
    <div className="App-container">
      <AnimatePresence mode="wait">
        {screen === screens.home && (
          <motion.div key="home" variants={slideVariants} initial="initial" animate="animate" exit="exit">
            <HomeScreen onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />
          </motion.div>
        )}
        {screen === screens.lobby && (
          <motion.div key="lobby" variants={slideVariants} initial="initial" animate="animate" exit="exit">
            <LobbyScreen roomCode={roomCode} gameState={gameState} currentPlayerPseudo={pseudo} onReady={handleReady} />
          </motion.div>
        )}
        {screen === screens.quiz && (
          <motion.div key="quiz" variants={slideVariants} initial="initial" animate="animate" exit="exit">
            <QuizScreen
              question={currentQuestion}
              roundResult={roundResult}
              onSubmitAnswer={handleSubmitAnswer}
              gameState={gameState}
              currentPlayerPseudo={pseudo}
            />
          </motion.div>
        )}
        {screen === screens.end && (
          <motion.div key="end" variants={slideVariants} initial="initial" animate="animate" exit="exit">
            <EndScreen gameState={gameState} onReplay={handleReplay} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
