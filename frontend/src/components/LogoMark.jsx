export default function LogoMark({ className = 'w-10 h-10' }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="logoGold" x1="8" y1="4" x2="40" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F0D78C" />
          <stop offset="0.45" stopColor="#D4AF37" />
          <stop offset="1" stopColor="#8B6914" />
        </linearGradient>
      </defs>
      <path
        d="M22 6c-2.5 0-4.5 2-4.5 4.5v22c0 3.5-2.2 6.2-5.5 7-1.8.4-3.2 2-3.2 4 0 2.3 1.9 4.2 4.2 4.2 5.2 0 9.5-4.6 9.5-10.3V12.5c0-1 1-1.8 2.2-1.8 2.8 0 5.1 2.6 5.1 5.8v3.2c0 1.2 1 2.2 2.2 2.2 1.4 0 2.5-1.2 2.5-2.7v-3c0-5.5-4.5-10-10-10-1.2 0-2.3.2-3.3.6"
        stroke="url(#logoGold)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M30 8v6M34 6v10" stroke="url(#logoGold)" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
      <circle cx="34" cy="20" r="1.6" fill="url(#logoGold)" opacity="0.9" />
    </svg>
  );
}
