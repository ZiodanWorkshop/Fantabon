import { useState } from 'react';

export default function UserForm({ users = [], onUserCreated, onGoalCreated, disabled = false }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({
    name: '',
    city: ''
  });
  const [goal, setGoal] = useState({
    title: '',
    category: 'Altro',
    target: '',
    points: ''
  });
  const [error, setError] = useState('');

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!profile.name.trim()) {
      setError('Inserisci un nome profilo.');
      return;
    }

    if (!onUserCreated) return;

    try {
      await onUserCreated({
        name: profile.name.trim(),
        city: profile.city.trim()
      });

      setProfile({ name: '', city: '' });
      setActiveTab('goal');
    } catch (err) {
      setError(err?.message || 'Errore creazione profilo');
    }
  };

  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!goal.title.trim()) {
      setError('Inserisci un titolo obiettivo.');
      return;
    }

    if (!goal.target || Number(goal.target) <= 0) {
      setError('Inserisci un target valido.');
      return;
    }

    if (!goal.points || Number(goal.points) <= 0) {
      setError('Inserisci punti validi.');
      return;
    }

    if (!onGoalCreated) return;

    try {
      await onGoalCreated({
        title: goal.title.trim(),
        category: goal.category.trim(),
        target: Number(goal.target),
        points: Number(goal.points)
      });

      setGoal({
        title: '',
        category: 'Altro',
        target: '',
        points: ''
      });
    } catch (err) {
      setError(err?.message || 'Errore creazione obiettivo');
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">Gestione</span>
          <h2>Crea profilo e obiettivo</h2>
        </div>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      <div className="tab-row" style={{ marginBottom: 16 }}>
        <button
          type="button"
          className={activeTab === 'profile' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('profile')}
          disabled={disabled}
        >
          Crea profilo
        </button>
        <button
          type="button"
          className={activeTab === 'goal' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('goal')}
          disabled={disabled || users.length === 0}
        >
          Crea obiettivo
        </button>
      </div>

      {disabled ? (
        <div className="muted-box">
          Seleziona prima una lega attiva per abilitare i pulsanti.
        </div>
      ) : null}

      {activeTab === 'profile' ? (
        <form onSubmit={handleProfileSubmit} className="form-grid">
          <label>
            Nome
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              placeholder="Nome del profilo"
              disabled={disabled}
            />
          </label>

          <label>
            Città / email
            <input
              type="text"
              value={profile.city}
              onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
              placeholder="Milano, ecc."
              disabled={disabled}
            />
          </label>

          <button type="submit" className="primary-btn" disabled={disabled}>
            Salva profilo
          </button>
        </form>
      ) : (
        <form onSubmit={handleGoalSubmit} className="form-grid">
          <label>
            Titolo obiettivo
            <input
              type="text"
              value={goal.title}
              onChange={(e) => setGoal((g) => ({ ...g, title: e.target.value }))}
              placeholder="Es. Fare 5 km"
              disabled={disabled || users.length === 0}
            />
          </label>

          <label>
            Categoria
            <input
              type="text"
              value={goal.category}
              onChange={(e) => setGoal((g) => ({ ...g, category: e.target.value }))}
              placeholder="Sport, Studio, Musica..."
              disabled={disabled || users.length === 0}
            />
          </label>

          <div className="two-col">
            <label>
              Target
              <input
                type="number"
                min="1"
                value={goal.target}
                onChange={(e) => setGoal((g) => ({ ...g, target: e.target.value }))}
                placeholder="10"
                disabled={disabled || users.length === 0}
              />
            </label>

            <label>
              Punti
              <input
                type="number"
                min="1"
                value={goal.points}
                onChange={(e) => setGoal((g) => ({ ...g, points: e.target.value }))}
                placeholder="20"
                disabled={disabled || users.length === 0}
              />
            </label>
          </div>

          <button type="submit" className="primary-btn" disabled={disabled || users.length === 0}>
            Salva obiettivo
          </button>

          {users.length === 0 ? (
            <div className="muted-box">
              Prima crea almeno un profilo per poter aggiungere obiettivi.
            </div>
          ) : null}
        </form>
      )}
    </section>
  );
}