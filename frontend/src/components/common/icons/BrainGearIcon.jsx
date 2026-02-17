/**
 * Brain + Gear Icon - Represents specialist analysis and planning
 */
export function BrainGearIcon({ size = 64, color = '#DB8860' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Brain outline */}
      <path
        d="M14 34C14 22 20 14 28 14C32 14 35 16 36 20M14 34C14 46 20 54 28 54C32 54 35 52 36 48"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Brain lobes */}
      <path
        d="M24 22C22 22 21 24 21 26C21 28 22 30 24 30"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M32 22C34 22 35 24 35 26C35 28 34 30 32 30"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Gear on right side */}
      <g>
        {/* Gear outer circle with teeth */}
        <circle cx="48" cy="32" r="12" stroke={color} strokeWidth="2" fill="none" />
        {/* Gear teeth */}
        <line x1="48" y1="18" x2="48" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="57" y1="23" x2="60" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="60" y1="32" x2="64" y2="32" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="57" y1="41" x2="60" y2="44" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="48" y1="46" x2="48" y2="50" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="39" y1="41" x2="36" y2="44" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="36" y1="32" x2="32" y2="32" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="39" y1="23" x2="36" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
        {/* Gear center */}
        <circle cx="48" cy="32" r="4" fill={color} />
      </g>
    </svg>
  );
}
