const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const cors = require('cors');

const PORT = process.env.PORT || 3001;
const app = express();
const server = http.createServer(app);
const questionsData = JSON.parse(fs.readFileSync('questions.json', 'utf8'));

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(server, {
  cors: { origin: clientUrl, methods: ['GET', 'POST'] }
});

app.get('/api/categories', cors({ origin: clientUrl }), (req, res) => {
  const categoryList = questionsData.categories.map(cat => ({
    nom: cat.nom,
    description: cat.description
  }));
  res.json(categoryList);
});

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const games = {};

io.on('connection', (socket) => {
  console.log(`Connexion: ${socket.id}`);

  socket.on('createRoom', ({ pseudo, categoryName }) => {
    const roomCode = generateRoomCode();
    socket.join(roomCode);
    const category = questionsData.categories.find(c => c.nom === categoryName);
    if (!category) return socket.emit('error', 'Catégorie non trouvée.');
    games[roomCode] = {
      roomCode,
      categoryName: category.nom,
      categoryType: category.type,
      players: [{ id: socket.id, pseudo, score: 0, isReady: false }],
      currentAnswers: []
    };
    io.to(roomCode).emit('roomUpdate', games[roomCode]);
    console.log(`Salle ${roomCode} créée par ${pseudo}`);
  });

  socket.on('joinRoom', ({ pseudo, roomCode }) => {
    if (!games[roomCode]) return socket.emit('error', "Cette salle n'existe pas.");
    if (games[roomCode].players.length >= 2) return socket.emit('error', 'Cette salle est déjà pleine.');
    socket.join(roomCode);
    games[roomCode].players.push({ id: socket.id, pseudo, score: 0, isReady: false });
    console.log(`${pseudo} a rejoint ${roomCode}`);
    io.to(roomCode).emit('roomUpdate', games[roomCode]);
  });

  socket.on('playerReady', ({ roomCode }) => {
    const game = games[roomCode];
    if (!game) return;
    const player = game.players.find(p => p.id === socket.id);
    if (player) player.isReady = true;
    io.to(roomCode).emit('roomUpdate', game);

    const allReady = game.players.length === 2 && game.players.every(p => p.isReady);
    if (allReady) {
      console.log(`Partie ${roomCode} démarre !`);
      const category = questionsData.categories.find(c => c.nom === game.categoryName);
      game.questions = shuffleArray(category.questions).slice(0, 10);
      game.currentQuestionIndex = 0;
      io.to(roomCode).emit('roomUpdate', game);
      io.to(roomCode).emit('gameStarted');
      io.to(roomCode).emit('newQuestion', {
        question: game.questions[0],
        questionIndex: 0
      });
    }
  });

  socket.on('submitAnswer', ({ roomCode, answer }) => {
    const game = games[roomCode];
    if (!game) return;

    // Éviter les doublons (si le joueur a déjà répondu)
    const alreadyAnswered = game.currentAnswers.some(a => a.playerId === socket.id);
    if (alreadyAnswered) return;

    game.currentAnswers.push({ playerId: socket.id, answer });

    if (game.currentAnswers.length === game.players.length) {
      let roundResult;

      switch (game.categoryType) {
        case 'devinette': {
          const answererIndex = game.currentQuestionIndex % 2;
          const guesserIndex = (game.currentQuestionIndex + 1) % 2;
          const answerer = game.players[answererIndex];
          const guesser = game.players[guesserIndex];
          const answererAnswer = game.currentAnswers.find(a => a.playerId === answerer.id)?.answer;
          const guesserAnswer  = game.currentAnswers.find(a => a.playerId === guesser.id)?.answer;
          // Pas de point si timeout
          const wasMatch = answererAnswer === guesserAnswer
            && answererAnswer !== '__timeout__'
            && guesserAnswer !== '__timeout__';
          let winnerOfRound = null;
          if (wasMatch) { guesser.score += 1; winnerOfRound = guesser.pseudo; }
          roundResult = {
            wasMatch, winnerOfRound,
            answers: { [answerer.pseudo]: answererAnswer, [guesser.pseudo]: guesserAnswer },
            scores: game.players.map(p => ({ pseudo: p.pseudo, score: p.score }))
          };
          break;
        }
        case 'classique': {
          const currentQuestion = game.questions[game.currentQuestionIndex];
          const correctAnswer = currentQuestion.bonneReponse;
          const winners = [];
          game.currentAnswers.forEach(sub => {
            if (sub.answer === correctAnswer) {
              const p = game.players.find(pl => pl.id === sub.playerId);
              if (p) { p.score += 1; winners.push(p.pseudo); }
            }
          });
          const submittedAnswers = {};
          game.currentAnswers.forEach(sub => {
            const p = game.players.find(pl => pl.id === sub.playerId);
            if (p) submittedAnswers[p.pseudo] = sub.answer;
          });
          roundResult = {
            winners, correctAnswer,
            answers: submittedAnswers,
            scores: game.players.map(p => ({ pseudo: p.pseudo, score: p.score }))
          };
          break;
        }
      }

      io.to(roomCode).emit('roundResult', roundResult);
      game.currentQuestionIndex++;
      game.currentAnswers = [];

      if (game.currentQuestionIndex >= game.questions.length) {
        console.log(`Partie ${roomCode} terminée.`);
        setTimeout(() => io.to(roomCode).emit('gameOver', game), 6000);
      } else {
        setTimeout(() => {
          io.to(roomCode).emit('newQuestion', {
            question: game.questions[game.currentQuestionIndex],
            questionIndex: game.currentQuestionIndex
          });
        }, 6000);
      }
    }
  });

  socket.on('replayGame', ({ roomCode }) => {
    const game = games[roomCode];
    if (!game) return;
    game.players.forEach(p => { p.score = 0; p.isReady = false; });
    delete game.questions;
    delete game.currentQuestionIndex;
    game.currentAnswers = [];
    console.log(`Salle ${roomCode} réinitialisée.`);
    io.to(roomCode).emit('roomUpdate', game);
  });

  socket.on('disconnect', () => {
    console.log(`Déconnexion: ${socket.id}`);
    for (const roomCode in games) {
      const game = games[roomCode];
      const leavingPlayer = game.players.find(p => p.id === socket.id);
      if (leavingPlayer) {
        socket.to(roomCode).emit('playerDisconnected', {
          message: `${leavingPlayer.pseudo} a quitté la partie.`
        });
        delete games[roomCode];
        console.log(`Salle ${roomCode} supprimée.`);
        break;
      }
    }
  });
});

server.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
