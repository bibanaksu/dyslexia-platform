/**
 * Brain Icon - Represents specialist-designed learning
 */
export function BrainIcon({ size = 64, color = '#3D5A4C' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 32C10 20 18 10 32 10C46 10 54 20 54 32C54 44 46 54 32 54C18 54 10 44 10 32Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32 18C29 18 27 20 27 23V28C27 30 28 32 30 33M32 18C35 18 37 20 37 23V28C37 30 36 32 34 33"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 38C19 35 18 33 18 32M44 38C45 35 46 33 46 32"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="32" cy="40" r="4" fill={color} />
    </svg>
  );
}
