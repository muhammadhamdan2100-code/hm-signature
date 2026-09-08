export default function Pedestal({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pedestalTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a2a2c" />
          <stop offset="100%" stopColor="#0a0a0b" />
        </linearGradient>
        <linearGradient id="pedestalFace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#151516" />
          <stop offset="100%" stopColor="#020202" />
        </linearGradient>
      </defs>
      <polygon points="20,10 130,4 190,22 178,52 30,56 6,30" fill="url(#pedestalFace)" stroke="#C8A96B" strokeOpacity="0.25" strokeWidth="0.6" />
      <polygon points="20,10 130,4 190,22 150,26 60,20" fill="url(#pedestalTop)" opacity="0.9" />
      <ellipse cx="100" cy="58" rx="90" ry="6" fill="#000" opacity="0.45" />
    </svg>
  );
}
