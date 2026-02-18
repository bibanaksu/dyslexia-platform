import './FeatureCard.css';

export function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="FeatureCard">
      <div className="FeatureCard__shine"></div>
      <div className="FeatureCard__icon-wrapper">
        <div className="FeatureCard__icon-bg"></div>
        <div className="FeatureCard__icon">
          <Icon />
        </div>
      </div>
      <h3 className="FeatureCard__title">{title}</h3>
      <p className="FeatureCard__description">{description}</p>
    </div>
  );
}