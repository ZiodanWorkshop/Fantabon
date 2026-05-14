import { useEffect, useMemo, useState } from 'react';
import { Flame, SunMedium } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react';
import StatCard from './components/StatCard';
import Leaderboard from './components/Leaderboard';
import GoalList from './components/GoalList';
import UserForm from './components/UserForm';
import { supabase } from './lib/supabase';

export default function App() {
  const { user, isSignedIn } = useUser();
  const [users, setUsers] = useState([]);
  const [goals, setGoals] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const currentClerkId = user?.id;
  const currentUser = useMemo(
    () => users.find((item) => item.clerk_id === currentClerkId),
    [users, currentClerkId]
  );

  const stats = useMemo(() => ({
    totalUsers: users.length,
    totalGoals: goals.length,
    totalPoints: users.reduce((sum, item) => sum + (item.points || 0), 0),
    completedGoals: goals.filter((goal) => goal.completed).length
  }), [users, goals]);

  const leaderboard = useMemo(
    () => [...users].sort((a, b) => (b.points || 0) - (a.points || 0)),
    [users]
  );

  const loadData = async () => {
    if (!isSignedIn || !currentClerkId) return;
    try {
      setLoading(true);
      const usersQuery = await supabase.from('users').select('*').order('points', { ascending: false });
      const goalsQuery = await supabase.from('goals').select('*').order('created_at', { ascending: false });
      if (usersQuery.error) throw usersQuery.error;
      if (goalsQuery.error) throw goalsQuery.error;
      setUsers(usersQuery.data || []);
      setGoals(goalsQuery.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Errore database');
    } finally {
      setLoading(false);
    }
  };

  const ensureUser = async () => {
    if (!isSignedIn || !user) return;
    const payload = {
      clerk_id: user.id,
      name: user.fullName || user.firstName || user.username || 'Utente',
      city: user.primaryEmailAddress?.emailAddress || 'Non specificata'
    };

    const existing = await supabase.from('users').select('*').eq('clerk_id', user.id).maybeSingle();
    if (existing.error && existing.error.code !== 'PGRST116') throw existing.error;

    if (!existing.data) {
      const inserted = await supabase.from('users').insert(payload).select().single();
      if (inserted.error) throw inserted.error;
    }
  };

  useEffect(() => {
    (async () => {
      if (!isSignedIn) return;
      try {
        await ensureUser();
        await loadData();
      } catch (err) {
        setError(err.message || 'Errore inizializzazione');
      }
    })();
  }, [isSignedIn, currentClerkId]);

  const createUser = async (payload) => {
    if (!currentUser) return;
    try {
      const updated = await supabase
        .from('users')
        .update({ name: payload.name || currentUser.name, city: payload.city || currentUser.city })
        .eq('id', currentUser.id);
      if (updated.error) throw updated.error;
      await loadData();
    } catch (err) {
      setError(err.message || 'Errore aggiornamento utente');
    }
  };

  const recomputePoints = async (userId) => {
    const userGoals = goals.filter((goal) => goal.user_id === userId);
    const total = userGoals.reduce((sum, goal) => sum + Math.round((goal.progress / goal.target) * goal.points), 0);
    const updated = await supabase.from('users').update({ points: total }).eq('id', userId);
    if (updated.error) throw updated.error;
  };

  const createGoal = async (payload) => {
    if (!currentUser) return;
    try {
      const inserted = await supabase.from('goals').insert({
        user_id: currentUser.id,
        title: payload.title,
        category: payload.category || 'Altro',
        points: Number(payload.points),
        progress: 0,
        target: Number(payload.target),
        completed: false
      });
      if (inserted.error) throw inserted.error;
      await recomputePoints(currentUser.id);
      await loadData();
    } catch (err) {
      setError(err.message || 'Errore creazione obiettivo');
    }
  };

  const updateProgress = async (goalId, progress) => {
    try {
      const goal = goals.find((item) => item.id === goalId);
      if (!goal) return;
      const nextProgress = Math.min(progress, goal.target);
      const updated = await supabase.from('goals').update({
        progress: nextProgress,
        completed: nextProgress >= goal.target
      }).eq('id', goalId);
      if (updated.error) throw updated.error;
      await recomputePoints(goal.user_id);
      await loadData();
    } catch (err) {
      setError(err.message || 'Errore aggiornamento progresso');
    }
  };

  const enrichedGoals = goals.map((goal) => ({
    ...goal,
    user: users.find((item) => item.id === goal.user_id)?.name || 'Utente'
  }));

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <div className="brand">
            <div className="brand-mark" aria-hidden="true"><Flame size={18} /></div>
            <span>fantabon</span>
          </div>
          <h1>Obiettivi estivi, punti e classifica in una sola app.</h1>
          <p>{isSignedIn ? `Bentornato ${user?.firstName || user?.username || 'utente'}!` : 'Accedi con Google per iniziare.'}</p>
        </div>
        <div className="hero-badge">
          <SunMedium size={18} />
          <span>Summer tracker</span>
        </div>
      </header>

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

        {error ? <div className="error-banner">{error}</div> : null}

        <section className="stats-grid">
          <StatCard label="Utenti" value={stats.totalUsers} hint="Partecipanti attivi" />
          <StatCard label="Obiettivi" value={stats.totalGoals} hint="Missioni registrate" />
          <StatCard label="Punti" value={stats.totalPoints} hint="Punti assegnati" />
          <StatCard label="Completati" value={stats.completedGoals} hint="Goal chiusi" />
        </section>

        {loading ? (
          <div className="panel">Caricamento dati...</div>
        ) : (
          <main className="dashboard-grid">
            <div className="main-column">
              <UserForm users={currentUser ? [currentUser] : []} onUserCreated={createUser} onGoalCreated={createGoal} />
              <GoalList goals={enrichedGoals} onUpdate={updateProgress} />
            </div>
            <aside>
              <Leaderboard users={leaderboard} />
            </aside>
          </main>
        )}
      </SignedIn>
    </div>
  );
}