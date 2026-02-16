import './StatCard.css';

export function StatCard({ value, label }) {
  return (
    <div className="StatCard">
      <div className="StatCard__value">{value}</div>
      <div className="StatCard__label">{label}</div>
    </div>
  );
}
