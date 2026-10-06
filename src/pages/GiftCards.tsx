import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Gift } from "lucide-react";
import { useI18n } from "../i18n/I18nProvider";
import { useCurrency } from "../context/CurrencyContext";
import { useAuth } from "../context/AuthContext";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { checkGiftCard, type GiftCardState } from "../services/luxuryRewards";

/**
 * Phase 8 (8.5) from the customer's side: what a gift card is here, how to check one, and where the
 * cards addressed to this account live.
 *
 * Buying one is deliberately absent. The catalogue has six fragrances and no gift-card product, so
 * offering a "buy" button would mean inventing a price, a SKU and a stock figure. Until the house
 * defines that, issuing stays with the Super Admin and this page checks and explains.
 */
export default function GiftCards() {
  const { t } = useI18n();
  const { format } = useCurrency();
  const { user } = useAuth();
  useSeoMeta(t("seo.giftCardsTitle"), t("seo.giftCardsDescription"));

  const [code, setCode] = useState("");
  const [state, setState] = useState<GiftCardState | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = async () => {
    const trimmed = code.trim();
    if (trimmed.length < 8) {
      setError(t("giftCards.codeTooShort"));
      setState(null);
      return;
    }
    setChecking(true);
    setError(null);
    try {
      const result = await checkGiftCard(trimmed);
      setState(result);
      if (!result.found) setError(t("giftCards.notFound"));
    } catch {
      setError(t("giftCards.checkFailed"));
      setState(null);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="bg-navy min-h-screen">
      <section className="pt-32 pb-12 border-b border-gold/15">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="flex items-start gap-5 max-w-3xl">
            <Gift className="w-8 h-8 text-gold shrink-0 mt-2" aria-hidden="true" />
            <div>
              <div className="eyebrow mb-4">{t("giftCards.eyebrow")}</div>
              <h1 className="font-serif text-4xl lg:text-5xl">{t("giftCards.title")}</h1>
              <p className="text-muted mt-4 leading-relaxed text-sm">{t("giftCards.body")}</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-3xl mx-auto px-6 lg:px-10 space-y-10">
          <form
            className="border border-gold/25 bg-navy2/60 rounded-lg p-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void check();
            }}
          >
            <label htmlFor="gift-card-code" className="text-[10px] font-mono uppercase tracking-widest text-gold">
              {t("giftCards.checkLabel")}
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="gift-card-code"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder={t("giftCards.checkPlaceholder")}
                autoComplete="off"
                className="flex-1 min-w-0 bg-navy border border-gold/25 rounded px-3 py-2.5 text-sm text-ivory focus:outline-none focus:border-gold font-mono"
              />
              <button type="submit" disabled={checking || !code.trim()} className="btn-gold-fill font-sans text-xs disabled:opacity-50">
                {checking ? t("giftCards.checking") : t("giftCards.checkCta")}
              </button>
            </div>

            {error && (
              <p role="status" className="text-xs text-muted leading-relaxed border border-gold/25 rounded px-3 py-2">{error}</p>
            )}

            {state?.found && (
              <div className="border border-gold/30 bg-navy rounded px-4 py-3 space-y-1" role="status">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted">{t("giftCards.remaining")}</p>
                <p className="text-2xl font-serif text-gold">{format(Number(state.balance ?? 0))}</p>
                <p className="text-xs text-muted">
                  {state.status === "Active" ? t("giftCards.statusActive")
                    : state.status === "Partially Redeemed" ? t("giftCards.statusPartial")
                    : state.status === "Expired" || state.expired ? t("giftCards.statusExpired")
                    : state.status === "Cancelled" ? t("giftCards.statusCancelled")
                    : state.status === "Fully Redeemed" ? t("giftCards.statusSpent")
                    : t("giftCards.statusNotActive")}
                </p>
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted">{t("giftCards.currencyNote", { currency: state.currency || "PKR" })}</p>
              </div>
            )}
          </form>

          <div className="grid sm:grid-cols-2 gap-6 text-sm">
            <div className="border border-gold/15 bg-navy2/40 rounded p-5 space-y-2">
              <h2 className="font-serif text-lg text-ivory">{t("giftCards.howTitle")}</h2>
              <p className="text-xs text-muted leading-relaxed">{t("giftCards.howBody")}</p>
            </div>
            <div className="border border-gold/15 bg-navy2/40 rounded p-5 space-y-2">
              <h2 className="font-serif text-lg text-ivory">{t("giftCards.buyTitle")}</h2>
              <p className="text-xs text-muted leading-relaxed">{t("giftCards.buyBody")}</p>
              <Link to="/gift-finder" className="link-underline text-xs inline-block">{t("giftCards.giftFinderCta")}</Link>
            </div>
          </div>

          {user && (
            <Link to="/account/rewards" className="btn-gold font-sans text-xs inline-block">
              {t("giftCards.myCardsCta")}
            </Link>
          )}

          <p className="text-[11px] text-muted leading-relaxed border-t border-gold/15 pt-6">{t("giftCards.footnote")}</p>
        </div>
      </section>
    </div>
  );
}
