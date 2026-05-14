import { useEffect, useState } from 'react';

export default function UserForm({ users = [], onUserCreated, onGoalCreated }) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [points, setPoints] = useState('');
  const [target, setTarget] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    if (!selectedUserId && users.length > 0) {
      setSelectedUserId(users[0].id);
    }
  }, [users, selectedUserId]);

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    await onUserCreated?.({
      name: name.trim(),
      city: city.trim()
    });

    setName('');
    setCity('');
  };

  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !selectedUserId) return;

    await onGoalCreated?.({
      user_id: selectedUserId,
      title: title.trim(),
      category: category.trim(),
      points: Number(points),
      target: Number(target)
    });

    setTitle('');
    setCategory('');
    setPoints('');
    setTarget('');
  };

  return (
    <div className="panel">
      <h2>Profilo e obiettivi</h2>

      <form onSubmit={handleUserSubmit} className="form-stack">
        <input
          type="text"
          placeholder="Nome utente"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Città"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button type="submit" className="primary-btn">Salva profilo</button>
      </form>

      <form onSubmit={handleGoalSubmit} className="form-stack" style={{ marginTop: '18px' }}>
        <select
          value={selectedUserId || ''}
          onChange={(e) => setSelectedUserId(e.target.value || '')}
        >
          <option value="">Seleziona un utente</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Titolo obiettivo"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="Categoria"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <input
          type="number"
          placeholder="Punti"
          value={points}
          onChange={(e) => setPoints(e.target.value)}
        />
        <input
          type="number"
          placeholder="Target"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />

        <button type="submit" className="primary-btn">
          Crea obiettivo
        </button>
      </form>
    </div>
  );
}