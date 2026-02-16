/**
 * Correct/Checkmark Icon - Represents completion and validation
 */
export function CorrectIcon({ size = 64, color = '#3D5A4C' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="32" cy="32" r="28" stroke={color} strokeWidth="2" />
      <path
        d="M22 32L29 40L44 24"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
