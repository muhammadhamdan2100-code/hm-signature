export default function Bottle({ className = "", label = "Signature" }: { className?: string; label?: string }) {
  const uid = label.replace(/\s+/g, "");
  return (
    <svg className={className} viewBox="0 0 120 240" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`cap-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8a6a3a" />
          <stop offset="35%" stopColor="#E0C27A" />
          <stop offset="55%" stopColor="#C8A96B" />
          <stop offset="100%" stopColor="#7a5a30" />
        </linearGradient>
        <linearGradient id={`collar-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F3DFA6" />
          <stop offset="50%" stopColor="#C8A96B" />
          <stop offset="100%" stopColor="#8a6a3a" />
        </linearGradient>
        <linearGradient id={`glass-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#16222E" />
          <stop offset="45%" stopColor="#0a1219" />
          <stop offset="100%" stopColor="#04070a" />
        </linearGradient>
        <linearGradient id={`shine-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#F6F1E7" stopOpacity="0" />
          <stop offset="50%" stopColor="#F6F1E7" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#F6F1E7" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`reflect-${uid}`} cx="50%" cy="0%" r="80%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="50" y="2" width="20" height="20" rx="3" fill={`url(#cap-${uid})`} stroke="#5a4423" strokeWidth="0.5" />
      <rect x="52" y="4" width="3" height="16" fill="#F3DFA6" opacity="0.5" />
      <rect x="44" y="20" width="32" height="12" rx="2" fill={`url(#collar-${uid})`} stroke="#5a4423" strokeWidth="0.5" />

      <path
        d="M28 36 h64 a5 5 0 0 1 5 5 v182 a8 8 0 0 1 -8 8 H31 a8 8 0 0 1 -8 -8 V41 a5 5 0 0 1 5 -5 z"
        fill={`url(#glass-${uid})`}
        stroke="#C8A96B"
        strokeWidth="1.1"
      />
      <path d="M38 40 v186" stroke={`url(#shine-${uid})`} strokeWidth="14" opacity="0.9" />
      <path d="M92 40 v186" stroke={`url(#shine-${uid})`} strokeWidth="10" opacity="0.6" />

      <rect x="26" y="98" width="68" height="52" fill="rgba(200,169,107,0.06)" stroke="#C8A96B" strokeWidth="0.6" />
      <path d="M60 104 l3 6 h-6 z" fill="#E0C27A" opacity="0.8" />
      <text x="60" y="122" textAnchor="middle" fill="#E0C27A" fontFamily="Cormorant Garamond, serif" fontSize="13" letterSpacing="1">
        HM
      </text>
      <text
        x="60"
        y="136"
        textAnchor="middle"
        fill="#F6F1E7"
        fontFamily="Cormorant Garamond, serif"
        fontStyle="italic"
        fontSize="9.5"
      >
        {label}
      </text>
      <text x="60" y="145" textAnchor="middle" fill="#A7ADB3" fontFamily="Inter, sans-serif" fontSize="4" letterSpacing="1">
        EXTRAIT DE PARFUM
      </text>

      <rect x="20" y="226" width="80" height="6" fill={`url(#reflect-${uid})`} opacity="0.4" />
    </svg>
  );
}
