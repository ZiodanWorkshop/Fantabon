import { useEffect, useState } from 'react';
import { Flame, SunMedium } from 'lucide-react';
import { api } from './lib/api';
import StatCard from './components/StatCard';
import Leaderboard from './components/Leaderboard';
import GoalList from './components/GoalList';
import UserForm from './components/UserForm';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';

function LoginSection() {
  return (
    <>
      <SignedOut>
        <section className="panel auth-panel">
          <span className="eyebrow">Accesso richiesto</span>
          <h2>Entra con Google per usare Fantabon</h2>
          <p>Accedi per creare obiettivi, accumulare punti e vedere la classifica.</p>
          <SignInButton mode="modal">
            <button className="primary-btn">Continua con Google</button>
          </SignInButton>
        </section>
      </SignedOut>

      <SignedIn>
        <div className="userbar">
          <UserButton afterSignOutUrl="/" />
        </div>
      </SignedIn>
    </>
  );
}

export default function App() {
  const [stats, setStats] = useState({ totalUsers: 0, totalGoals: 0, totalPoints: 0, completedGoals: 0 });
  const [users, setUsers] = useState([]);
  const [goals, setGoals] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData, goalsData, leaderboardData] = await Promise.all([
        api('/api/stats'),
        api('/api/users'),
        api('/api/goals'),
        api('/api/leaderboard')
      ]);
      setStats(statsData);
      setUsers(usersData);
      setGoals(goalsData);
      setLeaderboard(leaderboardData);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createUser = async (payload) => {
    try {
      await api('/api/users', { method: 'POST', body: JSON.stringify(payload) });
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const createGoal = async (payload) => {
    try {
      await api('/api/goals', { method: 'POST', body: JSON.stringify(payload) });
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const updateProgress = async (goalId, progress) => {
    try {
      await api(`/api/goals/${goalId}/progress`, { method: 'PATCH', body: JSON.stringify({ progress }) });
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <div className="brand">
            <div className="brand-mark" aria-hidden="true"><Flame size={18} /></div>
            <span>fantabon</span>
          </div>
          <h1>Obiettivi estivi, punti e classifica in una sola app.</h1>
          <p>Crea utenti, assegna missioni, aggiorna i progressi e scopri chi domina l'estate.</p>
        </div>
        <div className="hero-badge">
          <SunMedium size={18} />
          <span>Summer tracker</span>
        </div>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}

      <section className="stats-grid">
        <StatCard label="Utenti" value={stats.totalUsers} hint="Partecipanti attivi" />
        <StatCard label="Obiettivi" value={stats.totalGoals} hint="Missioni registrate" />
        <StatCard label="Punti" value={stats.totalPoints} hint="Punti assegnati" />
        <StatCard label="Completati" value={stats.completedGoals} hint="Goal chiusi" />
      </section>

      {loading ? <div className="panel">Caricamento dati...</div> : (
        <main className="dashboard-grid">
          <div className="main-column">
            <UserForm users={users} onUserCreated={createUser} onGoalCreated={createGoal} />
            <GoalList goals={goals} onUpdate={updateProgress} />
          </div>
          <aside>
            <Leaderboard users={leaderboard} />
          </aside>
        </main>
      )}
    </div>
  );
}
