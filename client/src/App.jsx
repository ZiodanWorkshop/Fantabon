import { useEffect, useMemo, useState } from 'react';
import { Flame, SunMedium, Settings, Trophy, Users } from 'lucide-react';
import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  OrganizationSwitcher,
  CreateOrganization,
  useUser,
  useOrganization,
  useOrganizationList
} from '@clerk/clerk-react';
import StatCard from './components/StatCard';
import Leaderboard from './components/Leaderboard';
import GoalList from './components/GoalList';
import UserForm from './components/UserForm';
import { supabase } from './lib/supabase';

export default function App() {
  return <AppContent />;
}

function AppContent() {
  const { user, isSignedIn } = useUser();
  const { organization } = useOrganization();
  const { isLoaded: orgListLoaded, userMemberships, setActive } = useOrganizationList({
    memberships: true
  });

  const [users, setUsers] = useState([]);
  const [goals, setGoals] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateLeague, setShowCreateLeague] = useState(false);

  const currentClerkId = user?.id;
  const currentOrgId = organization?.id;
  const currentOrgName = organization?.name || 'Nessuna lega selezionata';

  const currentUser = useMemo(
    () => users.find((item) => item.clerk_id === currentClerkId),
    [users, currentClerkId]
  );

  const stats = useMemo(
    () => ({
      totalUsers: users.length,
      totalGoals: goals.length,
      totalPoints: users.reduce((sum, item) => sum + (item.points || 0), 0),
      completedGoals: goals.filter((goal) => goal.completed).length
    }),
    [users, goals]
  );

  const leaderboard = useMemo(
    () => [...users].sort((a, b) => (b.points || 0) - (a.points || 0)),
    [users]
  );

  const loadData = async () => {
    if (!isSignedIn || !currentClerkId || !currentOrgId) return;
    try {
      setLoading(true);

      const usersQuery = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', currentOrgId)
        .order('points', { ascending: false });

      const goalsQuery = await supabase
        .from('goals')
        .select('*')
        .eq('organization_id', currentOrgId)
        .order('created_at', { ascending: false });

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
    if (!isSignedIn || !user || !currentOrgId) return;

    const payload = {
      clerk_id: user.id,
      organization_id: currentOrgId,
      current_organization_id: currentOrgId,
      name: user.fullName || user.firstName || user.username || 'Utente',
      city: user.primaryEmailAddress?.emailAddress || 'Non specificata',
      points: 0
    };

    const { error } = await supabase
      .from('users')
      .upsert(payload, { onConflict: 'clerk_id' });

    if (error) throw error;
  };

  const recomputePoints = async (userId, goalsList = goals) => {
    const userGoals = goalsList.filter((goal) => goal.user_id === userId);
    const total = userGoals.reduce((sum, goal) => {
      return sum + Math.round((goal.progress / goal.target) * goal.points);
    }, 0);

    const updated = await supabase
      .from('users')
      .update({ points: total })
      .eq('id', userId);

    if (updated.error) throw updated.error;
  };

  useEffect(() => {
    (async () => {
      if (!isSignedIn || !currentOrgId) return;
      try {
        await ensureUser();
        await loadData();
      } catch (err) {
        setError(err.message || 'Errore inizializzazione');
      }
    })();
  }, [isSignedIn, currentClerkId, currentOrgId]);

  const createUser = async (payload) => {
    if (!currentUser || !currentOrgId) return;

    try {
      const updated = await supabase
        .from('users')
        .update({
          name: payload.name || currentUser.name,
          city: payload.city || currentUser.city,
          current_organization_id: currentOrgId
        })
        .eq('id', currentUser.id);

      if (updated.error) throw updated.error;
      await loadData();
    } catch (err) {
      setError(err.message || 'Errore aggiornamento utente');
    }
  };

  const createGoal = async (payload) => {
    if (!currentUser || !currentOrgId) return;

    try {
      const inserted = await supabase.from('goals').insert({
        user_id: currentUser.id,
        organization_id: currentOrgId,
        title: payload.title,
        category: payload.category || 'Altro',
        points: Number(payload.points),
        progress: 0,
        target: Number(payload.target),
        completed: false
      });

      if (inserted.error) throw inserted.error;

      await loadData();

      const nextGoals = [...goals, ...(inserted.data || [])];
      await recomputePoints(currentUser.id, nextGoals);
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

      const updated = await supabase
        .from('goals')
        .update({
          progress: nextProgress,
          completed: nextProgress >= goal.target
        })
        .eq('id', goalId);

      if (updated.error) throw updated.error;

      await recomputePoints(goal.user_id);
      await loadData();
    } catch (err) {
      setError(err.message || 'Errore aggiornamento progresso');
    }
  };

  const switchLeague = async (orgId) => {
    if (!setActive) return;
    try {
      await setActive({ organization: orgId });
    } catch (err) {
      setError(err.message || 'Errore cambio lega');
    }
  };

  const enrichedGoals = goals.map((goal) => ({
    ...goal,
    user: users.find((item) => item.id === goal.user_id)?.name || 'Utente'
  }));

  return (
    <div className="app-shell">
      <ClerkLoading>
        <div className="panel">Caricamento autenticazione...</div>
      </ClerkLoading>

      <ClerkLoaded>
        <header className="hero">
          <div>
            <div className="brand">
              <div className="brand-mark" aria-hidden="true">
                <Flame size={18} />
              </div>
              <span>fantabon</span>
            </div>
            <h1>Obiettivi estivi, punti e classifica in una sola app.</h1>
            <p>
              {isSignedIn
                ? `Bentornato ${user?.firstName || user?.username || 'utente'}!`
                : 'Accedi con Google per iniziare.'}
            </p>
          </div>

          <div className="hero-badge">
            <SunMedium size={18} />
            <span>Summer tracker</span>
          </div>
        </header>

        <nav className="navbar">
          <div className="navbar-left">
            <div className="navbar-title">Fantabon</div>
            <span className="navbar-subtitle">{currentOrgName}</span>
          </div>

          <div className="navbar-actions">
            <SignedIn>
              <button className="league-btn" onClick={() => setShowCreateLeague(true)}>
                + Crea lega
              </button>

              <OrganizationSwitcher
                afterCreateOrganizationUrl="/"
                afterSelectOrganizationUrl="/"
              />

              <div className="nav-icon">
                <Users size={18} />
              </div>

              <div className="nav-icon">
                <Settings size={18} />
              </div>

              <div className="nav-icon">
                <Trophy size={18} />
              </div>

              <UserButton afterSignOutUrl="/" />
            </SignedIn>

            <SignedOut>
              <SignInButton mode="modal">
                <button className="primary-btn">Continua con Google</button>
              </SignInButton>
            </SignedOut>
          </div>
        </nav>

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
          <section className="league-overview">
            <div className="league-card">
              <span className="eyebrow">Lega attiva</span>
              <h2>{currentOrgName}</h2>
              <p>
                {orgListLoaded
                  ? `${userMemberships?.data?.length || 0} leghe disponibili`
                  : 'Caricamento leghe...'}
              </p>
            </div>

            <div className="league-card">
              <span className="eyebrow">Stato</span>
              <h2>{currentOrgId ? 'Pronto' : 'Nessuna lega selezionata'}</h2>
              <p>Usa il selettore in navbar per cambiare lega o crearne una nuova.</p>
            </div>
          </section>

          {showCreateLeague ? (
            <section className="panel league-create-panel">
              <div className="panel-header">
                <div>
                  <span className="eyebrow">Nuova lega</span>
                  <h2>Crea una lega privata</h2>
                </div>
                <button className="ghost-btn" onClick={() => setShowCreateLeague(false)}>
                  Chiudi
                </button>
              </div>
              <CreateOrganization routing="hash" />
            </section>
          ) : null}

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
                <UserForm
                  users={currentUser ? [currentUser] : []}
                  onUserCreated={createUser}
                  onGoalCreated={createGoal}
                />
                <GoalList goals={enrichedGoals} onUpdate={updateProgress} />
              </div>
              <aside>
                <Leaderboard users={leaderboard} />
                <div className="panel" style={{ marginTop: '18px' }}>
                  <h3>Leghe disponibili</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                    {userMemberships?.data?.map((membership) => {
                      const org = membership.organization;
                      return (
                        <button
                          key={org.id}
                          className="ghost-btn"
                          onClick={() => switchLeague(org.id)}
                        >
                          {org.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </aside>
            </main>
          )}
        </SignedIn>
      </ClerkLoaded>
    </div>
  );
}