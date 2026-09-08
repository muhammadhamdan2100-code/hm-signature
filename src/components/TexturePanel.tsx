interface Props {
  texture: string;
  className?: string;
  children?: React.ReactNode;
}

const patternByTexture: Record<string, string> = {
  "texture-velvet":
    "repeating-linear-gradient(100deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 7px), radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.05), transparent 45%)",
  "texture-marble-dark":
    "linear-gradient(115deg, transparent 40%, rgba(200,169,107,0.05) 41%, transparent 43%), linear-gradient(35deg, transparent 60%, rgba(255,255,255,0.03) 61%, transparent 64%)",
  "texture-marble-champagne":
    "linear-gradient(120deg, transparent 38%, rgba(255,255,255,0.06) 40%, transparent 43%), linear-gradient(25deg, transparent 55%, rgba(200,169,107,0.08) 57%, transparent 60%)",
  "texture-stone-beige":
    "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.04) 0, transparent 3%), radial-gradient(circle at 60% 70%, rgba(255,255,255,0.03) 0, transparent 2%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.03) 0, transparent 2%)",
  "texture-wood":
    "repeating-linear-gradient(88deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 2px, transparent 2px, transparent 10px)",
  "texture-navy":
    "radial-gradient(circle at 70% 30%, rgba(200,169,107,0.05), transparent 45%)",
};

export default function TexturePanel({ texture, className = "", children }: Props) {
  return (
    <div className={`relative overflow-hidden ${texture} ${className}`}>
      <div className="absolute inset-0" style={{ backgroundImage: patternByTexture[texture] || "" }} />
      <div
        className="absolute inset-0"
        style={{ boxShadow: "inset 0 0 60px rgba(0,0,0,0.55)" }}
      />
      {children}
    </div>
  );
}
