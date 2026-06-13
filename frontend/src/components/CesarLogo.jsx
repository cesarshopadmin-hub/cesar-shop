export default function CesarLogo({ className = "w-8 h-8" }) {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke="#00D1FF"
        strokeWidth="2"
        filter="url(#glow)"
      />
      <text
        x="50"
        y="55"
        fontFamily="Cairo, sans-serif"
        fontWeight="bold"
        fontSize="20"
        fill="#00D1FF"
        textAnchor="middle"
        filter="url(#glow)"
      >
        CESAR
      </text>
      <path
        d="M30 70 L50 85 L70 70"
        fill="none"
        stroke="#00D1FF"
        strokeWidth="2"
        strokeLinecap="round"
        filter="url(#glow)"
      />
    </svg>
  );
}
