/**
 * Trending Up Icon - Represents continuous progress tracking
 */
export function TrendingUpIcon({ size = 64, color = '#B39DBD' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Chart background box */}
      <rect x="10" y="12" width="44" height="40" stroke={color} strokeWidth="2" rx="3" />
      {/* Chart axes */}
      <line x1="10" y1="48" x2="54" y2="48" stroke={color} strokeWidth="2" />
      <line x1="14" y1="12" x2="14" y2="48" stroke={color} strokeWidth="2" />
      {/* Trending line going up */}
      <path
        d="M18 42L28 30L38 35L50 18"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Data points */}
      <circle cx="18" cy="42" r="2.5" fill={color} />
      <circle cx="28" cy="30" r="2.5" fill={color} />
      <circle cx="38" cy="35" r="2.5" fill={color} />
      <circle cx="50" cy="18" r="2.5" fill={color} />
      {/* Arrow showing upward trend */}
      <path
        d="M50 10L50 18L58 18"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
