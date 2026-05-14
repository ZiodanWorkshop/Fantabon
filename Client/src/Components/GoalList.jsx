export default function GoalList({ goals, onUpdate }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">Obiettivi</span>
          <h2>Progressi estate</h2>
        </div>
      </div>
      <div className="goal-list">
        {goals.map((goal) => {
          const percent = Math.min(100, Math.round((goal.progress / goal.target) * 100));
          return (
            <article className="goal-card" key={goal.id}>
              <div className="goal-top">
                <div>
                  <h3>{goal.title}</h3>
                  <p>{goal.user} · {goal.category}</p>
                </div>
                <span className="badge">{goal.points} pt</span>
              </div>
              <div className="progress-meta">
                <span>{goal.progress}/{goal.target}</span>
                <span>{percent}%</span>
              </div>
              <div className="progress-bar">
                <span style={{ width: `${percent}%` }} />
              </div>
              <input
                type="range"
                min="0"
                max={goal.target}
                value={goal.progress}
                onChange={(e) => onUpdate(goal.id, Number(e.target.value))}
              />
            </article>
          );
        })}
      </div>
    </section>
  );
}
