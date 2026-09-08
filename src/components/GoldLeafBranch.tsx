export default function GoldLeafBranch({ className = "", flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      className={className}
      style={flip ? { transform: "scaleX(-1)" } : undefined}
      viewBox="0 0 120 200"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <defs>
        <linearGradient id="leafGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E0C27A" />
          <stop offset="100%" stopColor="#8a6a3a" />
        </linearGradient>
      </defs>
      <path d="M10 190 C 30 140, 20 90, 60 20" stroke="url(#leafGold)" strokeWidth="1.4" opacity="0.9" />
      {[
        { x: 22, y: 165, r: -40, s: 1 },
        { x: 30, y: 135, r: -20, s: 0.85 },
        { x: 22, y: 105, r: -55, s: 1.1 },
        { x: 38, y: 78, r: -15, s: 0.75 },
        { x: 45, y: 50, r: -35, s: 0.9 },
        { x: 55, y: 28, r: -10, s: 0.65 },
      ].map((leaf, i) => (
        <g key={i} transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.r}) scale(${leaf.s})`}>
          <path d="M0 0 C 10 -4, 20 -14, 24 -26 C 12 -22, 2 -14, 0 0 Z" fill="url(#leafGold)" opacity="0.85" />
        </g>
      ))}
    </svg>
  );
}
