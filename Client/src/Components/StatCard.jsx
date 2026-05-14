export default function StatCard({ label, value, hint }) {
  return (
    <article className="card stat-card">
      <span className="eyebrow">{label}</span>
      <h3>{value}</h3>
      <p>{hint}</p>
    </article>
  );
}
