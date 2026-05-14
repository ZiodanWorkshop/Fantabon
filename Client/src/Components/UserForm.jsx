import { useState } from 'react';

export default function UserForm({ users, onUserCreated, onGoalCreated }) {
  const [userForm, setUserForm] = useState({ name: '', city: '' });
  const [goalForm, setGoalForm] = useState({ userId: '', title: '', category: '', points: '', target: '' });

  return (
    <div className="forms-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Nuovo utente</span>
            <h2>Aggiungi partecipante</h2>
          </div>
        </div>
        <form onSubmit={(e) => {
          e.preventDefault();
          onUserCreated(userForm);
          setUserForm({ name: '', city: '' });
        }} className="stack-form">
          <input placeholder="Nome" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />
          <input placeholder="Città" value={userForm.city} onChange={(e) => setUserForm({ ...userForm, city: e.target.value })} />
          <button type="submit" className="primary-btn">Crea utente</button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Nuovo obiettivo</span>
            <h2>Assegna missione estiva</h2>
          </div>
        </div>
        <form onSubmit={(e) => {
          e.preventDefault();
          onGoalCreated(goalForm);
          setGoalForm({ userId: '', title: '', category: '', points: '', target: '' });
        }} className="stack-form">
          <select value={goalForm.userId} onChange={(e) => setGoalForm({ ...goalForm, userId: e.target.value })}>
            <option value="">Seleziona utente</option>
            {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
          </select>
          <input placeholder="Titolo obiettivo" value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} />
          <input placeholder="Categoria" value={goalForm.category} onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value })} />
          <input placeholder="Punti premio" type="number" value={goalForm.points} onChange={(e) => setGoalForm({ ...goalForm, points: e.target.value })} />
          <input placeholder="Target" type="number" value={goalForm.target} onChange={(e) => setGoalForm({ ...goalForm, target: e.target.value })} />
          <button type="submit" className="primary-btn">Crea obiettivo</button>
        </form>
      </section>
    </div>
  );
}
