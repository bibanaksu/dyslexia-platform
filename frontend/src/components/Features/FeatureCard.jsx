import './FeatureCard.css';

export function FeatureCard({ icon: Icon, title, description, accentColor = 'var(--forest-green)' }) {
  return (
    <div className="FeatureCard" style={{ '--card-accent': accentColor }}>
      <div className="FeatureCard__icon">
        <Icon size={48} color={accentColor} />
      </div>
      <h3 className="FeatureCard__title">{title}</h3>
      <p className="FeatureCard__description">{description}</p>
    </div>
  );
}
