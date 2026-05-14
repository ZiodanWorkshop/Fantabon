import { Trophy, Medal } from 'lucide-react';

export default function Leaderboard({ users }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">Classifica</span>
          <h2>Utenti più attivi</h2>
        </div>
        <Trophy size={20} />
      </div>
      <div className="leaderboard-list">
        {users.map((user, index) => (
          <div className="leader-row" key={user.id}>
            <div className="leader-meta">
              <span className="leader-rank">#{index + 1}</span>
              <div>
                <strong>{user.name}</strong>
                <p>{user.city}</p>
              </div>
            </div>
            <div className="leader-score">
              {index === 0 ? <Medal size={18} /> : null}
              <span>{user.points} pt</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
