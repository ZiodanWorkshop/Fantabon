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
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const { userMemberships, isLoaded: orgListLoaded, setActive } = useOrganizationList({ memberships: true });

  const [users, setUsers] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateLeague, setShowCreateLeague] = useState(false);

  const currentOrgId = organization?.id ?? null;
  const currentOrgName = organization?.name ?? 'Nessuna lega attiva';
  const currentUser = useMemo(
    () => users.find((u) => u.clerk_id === user?.id) || null,
    [users, user?.id]
  );

  const stats = useMemo(
    () => ({
      totalUsers: users.length,
      totalGoals: goals.length,
      totalPoints: users.reduce((sum, u) => sum + (u.points || 0), 0),
      completedGoals: goals.filter((g) => g.completed).length
    }),
    [users, goals]
  );

  const leaderboard = useMemo(
    () => [...users].sort((a, b) => (b.points || 0) - (a.points || 0)),
    [users]
  );

  const loadData = async (orgId) => {
    if (!orgId) return;
    setLoading(true);
    setError('');

    const [usersRes, goalsRes] = await Promise.all([
      supabase.from('users').select('*').eq('organization_id', orgId).order('points', { ascending: false }),
      supabase.from('goals').select('*').eq('organization_id', orgId).order('created_at', { ascending: false })
    ]);

    if (usersRes.error) {
      setError(usersRes.error.message);
      setLoading(false);
      return;
    }

    if (goalsRes.error) {
      setError(goalsRes.error.message);
      setLoading(false);
      return;
    }

    setUsers(usersRes.data || []);
    setGoals(goalsRes.data || []);
    setLoading(false);
  };

  const ensureUser = async () => {
    if (!isSignedIn || !user) return;

    const payload = {
      clerk_id: user.id,
      name: user.fullName || user.firstName || user.username || 'Utente',
      city: user.primaryEmailAddress?.emailAddress || 'Non specificata',
      points: 0
    };

    const { error: upsertError } = await supabase
      .from('users')
      .upsert(payload, { onConflict: 'clerk_id' });

    if (upsertError) throw upsertError;
  };

  const attachOrgToUser = async (orgId) => {
    if (!currentUser || !orgId) return;

    const { error: updateError } = await supabase
      .from('users')
      .update({ organization_id: orgId })
      .eq('id', currentUser.id);

    if (updateError) throw updateError;
  };

  const createUser = async (payload) => {
    if (!currentUser || !currentOrgId) return;

    const { error } = await supabase
      .from('users')
      .update({
        name: payload.name || currentUser.name,
        city: payload.city || currentUser.city,
        organization_id: currentOrgId
      })
      .eq('id', currentUser.id);

    if (error) {
      setError(error.message);
      return;
    }

    await loadData(currentOrgId);
  };

  const createGoal = async (payload) => {
    if (!currentUser || !currentOrgId) return;

    const { error } = await supabase.from('goals').insert({
      user_id: currentUser.id,
      organization_id: currentOrgId,
      title: payload.title,
      category: payload.category || 'Altro',
      points: Number(payload.points),
      progress: 0,
      target: Number(payload.target),
      completed: false
    });

    if (error) {
      setError(error.message);
      return;
    }

    await loadData(currentOrgId);
  };

  const updateProgress = async (goalId, progress) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    const nextProgress = Math.min(progress, goal.target);

    const { error } = await supabase
      .from('goals')
      .update({
        progress: nextProgress,
        completed: nextProgress >= goal.target
      })
      .eq('id', goalId);

    if (error) {
      setError(error.message);
      return;
    }

    await loadData(currentOrgId);
  };

  const switchLeague = async (orgId) => {
    const { error } = await setActive({ organization: orgId });
    if (error) setError(error.message);
  };

  useEffect(() => {
    (async () => {
      try {
        await ensureUser();
      } catch (err) {
        setError(err.message || 'Errore inizializzazione utente');
      }
    })();
  }, [isSignedIn, user?.id]);

  useEffect(() => {
    (async () => {
      try {
        if (!isSignedIn || !currentOrgId) return;
        await attachOrgToUser(currentOrgId);
        await loadData(currentOrgId);
      } catch (err) {
        setError(err.message || 'Errore caricamento dati');
      }
    })();
  }, [isSignedIn, currentOrgId]);

  const enrichedGoals = goals.map((goal) => ({
    ...goal,
    user: users.find((u) => u.id === goal.user_id)?.name || 'Utente'
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
            <h1>Obiettivi, punti e classifica in una sola app.</h1>
            <p>{isSignedIn ? `Bentornato ${user?.firstName || user?.username || 'utente'}!` : 'Accedi per iniziare.'}</p>
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

              <OrganizationSwitcher afterSelectOrganizationUrl="/" afterCreateOrganizationUrl="/" />

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
          {!orgLoaded ? (
            <div className="panel">Caricamento lega...</div>
          ) : !currentOrgId ? (
            <section className="panel">
              <h2>Nessuna lega attiva</h2>
              <p>Seleziona una lega dal selettore oppure creane una nuova.</p>
            </section>
          ) : (
            <>
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

              <section className="league-overview">
                <div className="league-card">
                  <span className="eyebrow">Lega attiva</span>
                  <h2>{currentOrgName}</h2>
                  <p>{orgListLoaded ? `${userMemberships?.data?.length || 0} leghe disponibili` : 'Caricamento leghe...'}</p>
                </div>

                <div className="league-card">
                  <span className="eyebrow">Stato</span>
                  <h2>Pronto</h2>
                  <p>Usa il selettore in navbar per cambiare lega.</p>
                </div>
              </section>

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
                    <UserForm users={users} onUserCreated={createUser} onGoalCreated={createGoal} disabled={!currentOrgId}/>
                    <GoalList goals={enrichedGoals} onUpdate={updateProgress} />
                  </div>

                  <aside>
                    <Leaderboard users={leaderboard} />
                    <div className="panel" style={{ marginTop: '18px' }}>
                      <h3>Leghe disponibili</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                        {userMemberships?.data?.map((membership) => (
                          <button
                            key={membership.organization.id}
                            className="ghost-btn"
                            onClick={() => switchLeague(membership.organization.id)}
                          >
                            {membership.organization.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </aside>
                </main>
              )}
            </>
          )}
        </SignedIn>
      </ClerkLoaded>
    </div>
  );
}