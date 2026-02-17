import './FeatureCard.css';

export function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="FeatureCard">
      <div className="FeatureCard__icon">
        <Icon size={48} color="#3D5A4C" />
      </div>
      <h3 className="FeatureCard__title">{title}</h3>
      <p className="FeatureCard__description">{description}</p>
    </div>
  );
}