import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { X, Send, Sparkles, MessageCircle, RefreshCw } from "lucide-react";
import { askConcierge, type ConciergeMessage, type ConciergeSource } from "../services/aiConcierge";
import { useAuth } from "../context/AuthContext";

const WHATSAPP_NUMBER = "923218602034";
const STORE_KEY = "hm-signature-concierge";
const MAX_TURNS = 20;

const SUGGESTIONS = [
  "Which fragrances suit evening wear?",
  "What bottle sizes do you offer?",
  "How do I pay with Raast?",
  "Where is my order?",
];

const GREETING: ConciergeMessage = {
  role: "assistant",
  content:
    "Welcome. I can help with fragrance families and notes, bottle sizes and prices, gifting, delivery across Pakistan, and the status of an order placed with this account.",
};

function readStored(): ConciergeMessage[] {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-MAX_TURNS) as ConciergeMessage[];
  } catch {
    return [];
  }
}

const SourceChips: React.FC<{ sources: ConciergeSource[] }> = ({ sources }) => {
  if (sources.length === 0) return null;
  const productSources = sources.filter((s) => s.type === "product" && s.slug);
  const unique = new Map(productSources.map((s) => [s.slug as string, s]));
  if (unique.size === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 pt-2">
      {[...unique.values()].slice(0, 3).map((s) => (
        <div key={`${s.slug}-${s.label}`} className="flex flex-col gap-0.5">
          <Link
            to={`/product/${s.slug}`}
            className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded border border-gold/30 text-gold hover:bg-gold hover:text-navy transition-colors"
          >
            {s.label}
          </Link>
          {/* The reason is written by the server from stored attributes only. */}
          {s.why && (
            <span className="text-[9px] font-light text-muted leading-snug max-w-[240px]">{s.why}</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default function ConciergeChat({
  open,
  onClose,
  whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi, I'd like to ask about HM Signature fragrances.")}`,
}: {
  open: boolean;
  onClose: () => void;
  whatsappHref?: string;
}) {
  const { user } = useAuth();
  const [history, setHistory] = useState<ConciergeMessage[]>(() => {
    const stored = readStored();
    return stored.length ? stored : [GREETING];
  });
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [sources, setSources] = useState<ConciergeSource[]>([]);
  const [degraded, setDegraded] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(history.slice(-MAX_TURNS)));
    } catch {
      /* session storage may be unavailable */
    }
    endRef.current?.scrollIntoView({ block: "end" });
  }, [history]);

  // A different signed-in client should not continue the previous conversation,
  // but the first render must keep what sessionStorage restored.
  const lastOwnerId = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const id = user?.id ?? null;
    if (lastOwnerId.current === undefined) {
      lastOwnerId.current = id;
      return;
    }
    if (lastOwnerId.current === id) return;
    lastOwnerId.current = id;
    setHistory([GREETING]);
    setSources([]);
    setNotice(null);
  }, [user?.id]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || pending) return;

    const userTurn: ConciergeMessage = { role: "user", content };
    const next: ConciergeMessage[] = [...history, userTurn].slice(-MAX_TURNS);
    setHistory(next);
    setDraft("");
    setPending(true);
    setNotice(null);

    const result = await askConcierge(next);
    setPending(false);

    if (!result.ok && result.error) {
      setNotice(result.error);
      const apology: ConciergeMessage = {
        role: "assistant",
        content: "I could not complete that request. Please try again, or reach our concierge directly.",
      };
      setHistory([...next, apology].slice(-MAX_TURNS));
      return;
    }

    const answer: ConciergeMessage = { role: "assistant", content: result.reply };
    setSources(result.sources);
    setDegraded(result.degraded);
    if (!result.configured) setNotice("The assistant is not enabled on this deployment yet.");
    setHistory([...next, answer].slice(-MAX_TURNS));
  };

  const reset = () => {
    setHistory([GREETING]);
    setSources([]);
    setNotice(null);
    setDegraded(false);
  };

  const visible = useMemo(() => history, [history]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center px-3 pb-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="HM Signature fragrance concierge"
    >
      <button
        type="button"
        aria-label="Close concierge"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-default"
      />

      <div
        ref={panelRef}
        className="relative w-full max-w-md bg-navy2 border border-gold/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: "min(78vh, 640px)" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gold/20 bg-navy">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-gold" />
            <div>
              <p className="text-[9px] font-mono uppercase tracking-[2.5px] text-gold font-semibold">HM Signature</p>
              <h2 className="font-serif text-sm text-ivory font-bold leading-tight">Fragrance Concierge</h2>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={reset}
              aria-label="Start a new conversation"
              className="p-2 min-h-11 min-w-11 inline-flex items-center justify-center text-muted hover:text-gold rounded transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close concierge"
              className="p-2 min-h-11 min-w-11 inline-flex items-center justify-center text-muted hover:text-ivory rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" role="log" aria-live="polite">
          {visible.map((m, i) => (
            <div key={`${m.role}-${i}`} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-gold text-navy font-medium"
                    : "bg-navy border border-gold/15 text-ivory"
                }`}
              >
                {m.content}
                {i === visible.length - 1 && m.role === "assistant" && <SourceChips sources={sources} />}
              </div>
            </div>
          ))}

          {pending && (
            <div className="flex justify-start">
              <div className="rounded-xl px-3.5 py-2.5 bg-navy border border-gold/15 text-muted text-[11px] font-mono">
                Consulting the atelier…
              </div>
            </div>
          )}

          {degraded && (
            <p className="text-[11px] text-muted font-light">
              Answers above are drawn directly from live catalogue and order records; the assistant could not add general guidance.
            </p>
          )}
          {notice && (
            <p className="text-[11px] text-rose-300 font-light">{notice}</p>
          )}
          <div ref={endRef} />
        </div>

        <div className="px-5 pt-3 pb-1 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              disabled={pending}
              onClick={() => send(s)}
              className="text-[10px] font-sans px-2.5 py-1.5 rounded-full border border-gold/25 text-muted hover:text-ivory hover:border-gold/60 transition-colors disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(draft);
          }}
          className="px-5 py-4 border-t border-gold/15 flex items-center gap-2"
        >
          <label htmlFor="concierge-input" className="sr-only">
            Ask the concierge
          </label>
          <input
            id="concierge-input"
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={500}
            placeholder={user ? "Ask about scents, sizes or your order…" : "Ask about scents, sizes or delivery…"}
            className="flex-1 bg-navy border border-gold/25 rounded-lg px-3 py-2.5 text-xs text-ivory placeholder:text-muted/70 focus:outline-none focus:border-gold"
          />
          <button
            type="submit"
            disabled={pending || !draft.trim()}
            aria-label="Send message"
            className="w-10 h-10 shrink-0 rounded-lg bg-gold hover:bg-goldLight text-navy flex items-center justify-center transition-colors disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="px-5 pb-4 flex items-center justify-between gap-3 text-[10px] text-muted font-mono">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-ivory transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp concierge
          </a>
          {!user && <span className="uppercase tracking-wider">Sign in for order status</span>}
        </div>
      </div>
    </div>
  );
}
