# 🎮 Quiz App (Multijoueur temps réel)

Une application web de quiz multijoueur permettant à plusieurs joueurs de participer simultanément avec synchronisation en temps réel.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)

## ✨ Fonctionnalités

- 🎮 Quiz multijoueur en temps réel
- ⚡ Synchronisation instantanée des questions et réponses
- 🧑‍🤝‍🧑 Gestion des connexions joueurs
- 📊 Score en direct
- 🎬 Animations fluides avec Framer Motion
- 📱 Interface interactive et responsive



## 🛠 Stack technique

| Technologie | Usage |
|---|---|
| React | Interface utilisateur |
| Vite | Build tool frontend|
| Socket.IO | WebSocket temps réel |
| Socket.IO (client)| Communication temps réel (frontend)|
| Framer Motion | Animations UI |
| Node.js | Runtime backend |
| Express | API serveur |
| CORS | Gestion des requêtes cross-origin |

## 🚀 Lancer le projet en local

### Prérequis
- Node.js 18+

### Installation
```bash
git clone https://github.com/Malck/quiz-app.git
cd quiz-app
npm install
```

### Backend
```bash
cd server
npm install
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

### Accès

Ouvre [http://localhost:5173](http://localhost:5173) 

## 📁 Structure du projet
```
quiz-app/
├── client/        # Frontend React
│   ├── src/
│   └── ...
├── server/        # Backend Node / Express
│   ├── server.js
│   └── ...
```

## 🌐 Démo

👉 [https://quiz-app-mc.netlify.app/](https://quiz-app-mc.netlify.app/)   
