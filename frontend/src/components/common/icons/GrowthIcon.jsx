/**
 * Growth/Trending Icon - Represents upward progress
 */
export function GrowthIcon({ size = 64, color = '#3D5A4C' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14 48L24 35L34 42L50 20"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M42 20L50 20L50 28"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="10" y="12" width="44" height="44" stroke={color} strokeWidth="1.5" rx="2" />
    </svg>
  );
}
