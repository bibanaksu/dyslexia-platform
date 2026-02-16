import './StepCard.css';

export function StepCard({ number, title, description, isLast }) {
  return (
    <div className="StepCard">
      <div className="StepCard__number">{number}</div>
      <div className="StepCard__content">
        <h3 className="StepCard__title">{title}</h3>
        <p className="StepCard__description">{description}</p>
      </div>
      {!isLast && <div className="StepCard__arrow"></div>}
    </div>
  );
}
