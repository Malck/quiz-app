import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

function HomeScreen({ onCreateRoom, onJoinRoom }) {
  const [categories, setCategories] = useState([]);
  const [pseudo, setPseudo] = useState('');
  const [action, setAction] = useState('join');
  const [categoryName, setCategoryName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/categories`)
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        if (data.length > 0) setCategoryName(data[0].nom);
      })
      .catch(err => console.error('Erreur chargement catégories:', err));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!pseudo.trim()) return alert('Merci de choisir un pseudo !');
    if (action === 'create') {
      if (!categoryName) return alert('Les catégories sont en cours de chargement...');
      onCreateRoom({ pseudo: pseudo.trim(), categoryName });
    } else {
      if (!roomCode.trim()) return alert('Merci de saisir un code de salle !');
      onJoinRoom({ pseudo: pseudo.trim(), roomCode: roomCode.trim() });
    }
  };

  const selectedCategory = categories.find(c => c.nom === categoryName);

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      <div style={{ textAlign: 'center' }}>
        <h1 className="app-title">QUIZZ</h1>
        <p className="app-subtitle">Multijoueur · 2 joueurs</p>
      </div>

      <div className="input-group">
        <label htmlFor="pseudo">Votre pseudo</label>
        <input
          type="text"
          id="pseudo"
          value={pseudo}
          onChange={e => setPseudo(e.target.value)}
          placeholder="Entrez votre pseudo"
          maxLength={20}
        />
      </div>

      <div className="tabs">
        <button type="button" className={action === 'join' ? 'active' : ''} onClick={() => setAction('join')}>
          Rejoindre
        </button>
        <button type="button" className={action === 'create' ? 'active' : ''} onClick={() => setAction('create')}>
          Créer
        </button>
      </div>

      {action === 'create' ? (
        <div className="input-group">
          <label htmlFor="category">Catégorie</label>
          <select
            id="category"
            value={categoryName}
            onChange={e => setCategoryName(e.target.value)}
            disabled={categories.length === 0}
          >
            {categories.length === 0
              ? <option>Chargement...</option>
              : categories.map(cat => (
                  <option key={cat.nom} value={cat.nom}>{cat.nom}</option>
                ))
            }
          </select>
          {selectedCategory && (
            <p className="category-description">{selectedCategory.description}</p>
          )}
        </div>
      ) : (
        <div className="input-group">
          <label htmlFor="roomCode">Code de la salle</label>
          <input
            type="text"
            id="roomCode"
            value={roomCode}
            onChange={e => setRoomCode(e.target.value.toUpperCase())}
            placeholder="ex: AB12"
            maxLength={6}
          />
        </div>
      )}

      <button type="submit" className="btn-submit">
        {action === 'create' ? 'Créer la partie' : 'Rejoindre la partie'}
      </button>
    </form>
  );
}

export default HomeScreen;
