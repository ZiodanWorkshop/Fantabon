import { useMemo, useState } from 'react';

export default function GoalList({ goals = [], onUpdate }) {
  const [selectedId, setSelectedId] = useState(null);
  const [progressValue, setProgressValue] = useState('');

  const sortedGoals = useMemo(
    () => [...goals].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [goals]
  );

  const handleSubmit = async (goalId) => {
    if (!onUpdate) return;
    const value = Number(progressValue);

    if (!Number.isFinite(value) || value < 0) return;

    await onUpdate(goalId, value);
    setSelectedId(null);
    setProgressValue('');
  };

  if (!sortedGoals.length) {
    return (
      <section className="panel">
        <h3>Obiettivi</h3>
        <p className="muted-text">Nessun obiettivo ancora creato.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">Obiettivi</span>
          <h3>Lista obiettivi</h3>
        </div>
      </div>

      <div className="goal-list">
        {sortedGoals.map((goal) => {
          const progress = goal.progress || 0;
          const target = goal.target || 0;
          const completed = Boolean(goal.completed);
          const percent = target > 0 ? Math.min(100, Math.round((progress / target) * 100)) : 0;

          return (
            <article key={goal.id} className="goal-card">
              <div className="goal-card-top">
                <div>
                  <h4>{goal.title}</h4>
                  <p>
                    {goal.user} · {goal.category || 'Altro'}
                  </p>
                </div>
                <span className={completed ? 'status done' : 'status'}>
                  {completed ? 'Completato' : 'In corso'}
                </span>
              </div>

              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${percent}%` }} />
              </div>

              <div className="goal-meta">
                <span>
                  {progress}/{target}
                </span>
                <span>{goal.points || 0} punti</span>
              </div>

              {!completed ? (
                <div className="goal-actions">
                  {selectedId === goal.id ? (
                    <>
                      <input
                        type="number"
                        min="0"
                        max={target}
                        value={progressValue}
                        onChange={(e) => setProgressValue(e.target.value)}
                        placeholder="Nuovo progresso"
                      />
                      <button
                        type="button"
                        className="primary-btn"
                        onClick={() => handleSubmit(goal.id)}
                      >
                        Aggiorna
                      </button>
                      <button
                        type="button"
                        className="ghost-btn"
                        onClick={() => {
                          setSelectedId(null);
                          setProgressValue('');
                        }}
                      >
                        Annulla
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => setSelectedId(goal.id)}
                    >
                      Aggiorna progresso
                    </button>
                  )}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}