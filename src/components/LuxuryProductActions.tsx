import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Bell, CalendarClock, Award, Check } from "lucide-react";
import { useI18n } from "../i18n/I18nProvider";
import { useAuth } from "../context/AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import { joinWaitlist, reservePreOrder } from "../services/luxuryRewards";
import type { Product } from "../data/products";

interface LuxuryProductActionsProps {
  product: Product;
  variantId?: string | null;
  sizeLabel: string;
  totalStock: number;
}

/**
 * Phase 8 (8.9, 8.10, 8.11) on the fragrance page.
 *
 * Each panel appears only when the database actually says so. A limited edition reports what is
 * left out of real bottle stock rather than a counter of its own, a pre-order is offered only
 * while the release date is still ahead of today, and the waitlist shows when nothing is in stock —
 * so a shopper is never invited to reserve something that is already on the shelf.
 */
export function LuxuryProductActions({ product, variantId, sizeLabel, totalStock }: LuxuryProductActionsProps) {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const { currency, country } = useCurrency();

  const [email, setEmail] = useState(user?.email || "");
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ kind: "ok" | "bad"; text: string } | null>(null);

  const releaseInFuture = useMemo(() => {
    if (!product.preOrderReleaseOn) return false;
    const release = new Date(product.preOrderReleaseOn);
    return Number.isFinite(release.getTime()) && release.getTime() > Date.now();
  }, [product.preOrderReleaseOn]);

  const preOrderOpen = product.preOrderEnabled === true && releaseInFuture;
  const soldOut = totalStock <= 0;

  const dateText = (value?: string) =>
    value ? new Date(value).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" }) : "";

  if (!product.isLimitedEdition && !preOrderOpen && !soldOut) return null;

  const submitPreOrder = async () => {
    setBusy(true);
    setResult(null);
    const outcome = await reservePreOrder({
      productId: product.id,
      variantId: variantId || null,
      quantity,
      email: email.trim(),
    });
    setResult({
      kind: outcome.success ? "ok" : "bad",
      text: outcome.success
        ? t("luxury.preOrderReserved", { date: outcome.expectedReleaseOn ? dateText(outcome.expectedReleaseOn) : dateText(product.preOrderReleaseOn) })
        : outcome.error || t("luxury.preOrderFailed"),
    });
    setBusy(false);
  };

  const submitWaitlist = async () => {
    setBusy(true);
    setResult(null);
    const outcome = await joinWaitlist({
      productId: product.id,
      variantId: variantId || null,
      email: email.trim(),
      countryCode: country?.code || null,
      currency: currency?.code || null,
    });
    setResult({
      kind: outcome.success ? "ok" : "bad",
      text: outcome.success
        ? outcome.alreadyOnList
          ? t("luxury.waitlistAlready")
          : t("luxury.waitlistJoined")
        : outcome.error || t("luxury.waitlistFailed"),
    });
    setBusy(false);
  };

  return (
    <div className="space-y-4 mb-8">
      {product.isLimitedEdition && (
        <div className="flex items-start gap-3 border border-gold/30 bg-gold/5 rounded px-4 py-3">
          <Award className="w-4 h-4 text-gold shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <p className="text-xs text-ivory">
              {product.editionTotal
                ? t("luxury.limitedOf", { total: product.editionTotal })
                : t("luxury.limitedEdition")}
            </p>
            <p className="text-[11px] text-muted">
              {product.editionNumber
                ? t("luxury.editionNumber", { number: product.editionNumber })
                : t("luxury.editionRemaining", { count: totalStock })}
            </p>
            {(product.editionReleasedOn || product.editionEndsOn) && (
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted">
                {product.editionReleasedOn ? dateText(product.editionReleasedOn) : ""}
                {product.editionEndsOn ? ` – ${dateText(product.editionEndsOn)}` : ""}
              </p>
            )}
          </div>
        </div>
      )}

      {preOrderOpen && (
        <div className="border border-gold/25 bg-navy2/60 rounded px-4 py-4 space-y-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-gold" aria-hidden="true" />
            <p className="text-xs text-ivory">
              {t("luxury.preOrderTitle", { date: dateText(product.preOrderReleaseOn) })}
            </p>
          </div>
          <p className="text-[11px] text-muted leading-relaxed">{t("luxury.preOrderBody")}</p>

          {user ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted">
                {t("luxury.quantity")}
                <select
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                  className="bg-navy border border-gold/25 rounded px-2 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
                >
                  {Array.from({ length: Math.min(product.preOrderMaxQuantity ?? 6, 6) }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("luxury.emailPlaceholder")}
                className="flex-1 min-w-0 bg-navy border border-gold/25 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
              />
              <button
                type="button"
                onClick={() => void submitPreOrder()}
                disabled={busy || !email.trim()}
                className="btn-gold-fill font-sans text-xs disabled:opacity-50 shrink-0"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : t("luxury.reserveCta")}
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-gold font-sans text-xs inline-block">
              {t("luxury.signInToReserve")}
            </Link>
          )}
        </div>
      )}

      {soldOut && !preOrderOpen && (
        <div className="border border-gold/25 bg-navy2/60 rounded px-4 py-4 space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-gold" aria-hidden="true" />
            <p className="text-xs text-ivory">{t("luxury.waitlistTitle", { size: sizeLabel })}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("luxury.emailPlaceholder")}
              className="flex-1 min-w-0 bg-navy border border-gold/25 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
            />
            <button
              type="button"
              onClick={() => void submitWaitlist()}
              disabled={busy || !email.trim()}
              className="btn-gold font-sans text-xs disabled:opacity-50 shrink-0"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : t("luxury.notifyCta")}
            </button>
          </div>
          <p className="text-[10px] text-muted leading-relaxed">{t("luxury.waitlistNote")}</p>
        </div>
      )}

      {result && (
        <p
          role="status"
          className={`flex items-start gap-2 text-xs rounded border px-3 py-2 leading-relaxed ${
            result.kind === "ok" ? "border-gold/40 text-gold" : "border-gold/25 text-muted"
          }`}
        >
          {result.kind === "ok" && <Check className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />}
          {result.text}
        </p>
      )}
    </div>
  );
}

export default LuxuryProductActions;
