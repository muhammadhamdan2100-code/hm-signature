import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

/** The same refusal the boutique and payment panels show: a reason, not an empty screen. */
export function AccessDeniedNote({ children }: { children: ReactNode }) {
  return (
    <div className="border border-rose-400/30 bg-rose-500/5 rounded-lg p-6 flex items-start gap-3">
      <ShieldAlert className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" aria-hidden="true" />
      <p className="text-xs text-muted leading-relaxed">{children}</p>
    </div>
  );
}

export function AdminField({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="space-y-1.5 block">
      <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{label}</span>
      {children}
      {hint && <span className="block text-[10px] text-muted leading-relaxed">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full bg-navy border border-gold/25 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold";

export const cardClass = "rounded-xl border border-gold/25 bg-navy2 p-6 space-y-5";

export const rowClass = "border border-gold/15 bg-navy/50 rounded-lg p-4";

export function StatusNote({ kind, children }: { kind: "ok" | "bad"; children: ReactNode }) {
  return (
    <p
      role="status"
      className={`text-xs rounded border px-3 py-2 leading-relaxed ${
        kind === "ok" ? "border-gold/40 text-gold" : "border-rose-400/30 text-rose-200"
      }`}
    >
      {children}
    </p>
  );
}
