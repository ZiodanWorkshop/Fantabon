export default function Leaderboard({ users = [] }) {
  if (!users.length) {
    return (
      <section className="panel">
        <h3>Classifica</h3>
        <p className="muted-text">Nessun utente ancora presente.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">Classifica</span>
          <h3>Top utenti</h3>
        </div>
      </div>

      <ol className="leaderboard-list">
        {users.map((user, index) => (
          <li key={user.id || user.clerk_id || index} className="leaderboard-item">
            <div className="leaderboard-rank">{index + 1}</div>

            <div className="leaderboard-info">
              <strong>{user.name || 'Utente'}</strong>
              <span>{user.city || 'Nessuna città'}</span>
            </div>

            <div className="leaderboard-points">
              {user.points || 0} pts
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}