/**
 * Target Icon - Represents guided intervention with specific goals
 */
export function TargetIcon({ size = 64, color = '#6FA399' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer circle */}
      <circle cx="32" cy="32" r="26" stroke={color} strokeWidth="2" />
      {/* Middle circle */}
      <circle cx="32" cy="32" r="18" stroke={color} strokeWidth="2" />
      {/* Inner circle */}
      <circle cx="32" cy="32" r="10" stroke={color} strokeWidth="2" />
      {/* Center bullseye */}
      <circle cx="32" cy="32" r="4" fill={color} />
      {/* Crosshair lines */}
      <line x1="32" y1="8" x2="32" y2="4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="60" x2="32" y2="64" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="32" x2="4" y2="32" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="60" y1="32" x2="64" y2="32" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
