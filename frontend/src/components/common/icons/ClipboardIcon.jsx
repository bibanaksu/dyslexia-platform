/**
 * Clipboard Icon - Represents initial assessment with checklist
 */
export function ClipboardIcon({ size = 64, color = '#5B8DB5' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Clipboard base */}
      <rect x="14" y="12" width="36" height="42" stroke={color} strokeWidth="2" rx="3" />
      {/* Clipboard clip */}
      <rect x="22" y="8" width="20" height="8" stroke={color} strokeWidth="2" rx="2" />
      {/* Checklist items */}
      <circle cx="22" cy="24" r="2" fill={color} />
      <line x1="28" y1="22" x2="40" y2="22" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="22" cy="34" r="2" fill={color} />
      <line x1="28" y1="32" x2="40" y2="32" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="22" cy="44" r="2" fill={color} />
      <line x1="28" y1="42" x2="40" y2="42" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
