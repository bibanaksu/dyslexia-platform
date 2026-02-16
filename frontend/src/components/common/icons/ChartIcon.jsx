/**
 * Chart/Growth Icon - Represents progress tracking
 */
export function ChartIcon({ size = 64, color = '#3D5A4C' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="10" y="10" width="44" height="44" stroke={color} strokeWidth="2" rx="4" />
      <line x1="10" y1="48" x2="54" y2="48" stroke={color} strokeWidth="2" />
      <line x1="16" y1="10" x2="16" y2="48" stroke={color} strokeWidth="2" />
      <path
        d="M22 40L28 28L35 35L48 18"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="48" cy="18" r="2" fill={color} />
    </svg>
  );
}
