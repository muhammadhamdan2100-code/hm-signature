import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Coins, Gift, Loader2, Package, Sparkles, X } from "lucide-react";
import { useI18n } from "../i18n/I18nProvider";
import { useCurrency } from "../context/CurrencyContext";
import { useAuth } from "../context/AuthContext";
import {
  cancelMyPreOrder,
  fetchMyGiftCards,
  fetchMyLedger,
  fetchMyLoyalty,
  fetchMyPreOrders,
  fetchMyWaitlist,
  leaveWaitlist,
  type LedgerEntry,
  type LoyaltyState,
  type MyGiftCard,
  type MyPreOrder,
  type WaitlistEntry,
} from "../services/luxuryRewards";

/**
 * Everything Phase 8 gives a customer a sight of: points and their history, the tier derived from
 * real purchases, gift cards addressed to their email, live pre-orders and waitlist entries.
 *
 * Each panel states what is missing rather than filling the gap. A shop that has not set loyalty
 * rates has no balance to show, and that is said plainly instead of showing zero as if it were a
 * computed result.
 */
export function AccountRewards() {
  const { t, locale } = useI18n();
  const { format } = useCurrency();
  const { user } = useAuth();
  const [loyalty, setLoyalty] = useState<LoyaltyState | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [cards, setCards] = useState<MyGiftCard[]>([]);
  const [preOrders, setPreOrders] = useState<MyPreOrder[]>([]);
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setProblem(null);
    try {
      const [loyaltyResult, ledgerResult, cardsResult, preResult, waitResult] = await Promise.all([
        fetchMyLoyalty(),
        fetchMyLedger(),
        fetchMyGiftCards(),
        fetchMyPreOrders(),
        fetchMyWaitlist(),
      ]);
      setLoyalty(loyaltyResult.state);
      setLedger(ledgerResult.entries);
      setCards(cardsResult.cards);
      setPreOrders(preResult.preOrders);
      setEntries(waitResult.entries);
      const firstError = loyaltyResult.error || ledgerResult.error || cardsResult.error || preResult.error || waitResult.error;
      if (firstError) setProblem(firstError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dateText = (value: string | null) =>
    value ? new Date(value).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" }) : "";

  const entryLabel = (entryType: string) => {
    switch (entryType) {
      case "earn_purchase":
        return t("rewards.entryEarnPurchase");
      case "earn_signup":
        return t("rewards.entryEarnSignup");
      case "earn_review":
        return t("rewards.entryEarnReview");
      case "earn_referral":
        return t("rewards.entryEarnReferral");
      case "earn_birthday":
        return t("rewards.entryEarnBirthday");
      case "earn_campaign":
        return t("rewards.entryEarnCampaign");
      case "redeem":
        return t("rewards.entryRedeem");
      case "cancel_reversal":
        return t("rewards.entryReversal");
      case "cancel_clawback":
        return t("rewards.entryClawback");
      case "expire":
        return t("rewards.entryExpire");
      case "adjust":
        return t("rewards.entryAdjust");
      default:
        return t("rewards.entryOther");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted font-mono uppercase tracking-wider py-10">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        {t("rewards.loading")}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold">{t("rewards.eyebrow")}</span>
          <h2 className="text-2xl font-serif text-ivory mt-1">{t("rewards.accountTitle")}</h2>
        </div>
        <button type="button" onClick={() => void load()} className="btn-gold font-sans text-xs">
          {t("rewards.refresh")}
        </button>
      </div>

      {problem && (
        <p className="text-xs text-muted border border-gold/25 bg-navy2/40 rounded px-4 py-3 leading-relaxed">{problem}</p>
      )}
      {notice && (
        <p role="status" className="text-xs text-gold border border-gold/40 bg-navy2/40 rounded px-4 py-3" onClick={() => setNotice(null)}>
          {notice}
        </p>
      )}

      {/* 8.6 + 8.7 — points and the tier derived from them */}
      <section className="border border-gold/25 bg-navy2/60 rounded-lg p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Coins className="w-5 h-5 text-gold" aria-hidden="true" />
          <h3 className="font-serif text-xl">{t("rewards.loyaltyTitle")}</h3>
        </div>

        {loyalty?.configured ? (
          <div className="grid sm:grid-cols-4 gap-4">
            <div className="border border-gold/30 bg-navy rounded px-4 py-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted">{t("rewards.balance")}</p>
              <p className="text-2xl font-serif text-gold mt-1">{loyalty.balance}</p>
            </div>
            <div className="border border-gold/15 bg-navy rounded px-4 py-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted">{t("rewards.lifetimeEarned")}</p>
              <p className="text-lg font-mono text-ivory mt-1">{loyalty.lifetimeEarned}</p>
            </div>
            <div className="border border-gold/15 bg-navy rounded px-4 py-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted">{t("rewards.expiringSoon")}</p>
              <p className="text-lg font-mono text-ivory mt-1">{loyalty.expiringIn90Days}</p>
            </div>
            <div className="border border-gold/15 bg-navy rounded px-4 py-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted">{t("rewards.tier")}</p>
              <p className="text-lg font-mono text-ivory mt-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-gold" aria-hidden="true" />
                {loyalty.tier === "member" ? t("rewards.tierMember") : loyalty.tier}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted leading-relaxed">{t("rewards.loyaltyNotConfigured")}</p>
        )}

        {loyalty?.configured && (
          ledger.length > 0 ? (
            <ul className="divide-y divide-gold/10">
              {ledger.map((entry) => (
                <li key={entry.id} className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs text-ivory">{entryLabel(entry.entryType)}</p>
                    <p className="text-[11px] text-muted truncate">{entry.reason || t("rewards.noReason")}</p>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-muted mt-0.5">{dateText(entry.occurredAt)}</p>
                  </div>
                  <span className={`font-mono text-sm shrink-0 ${entry.points > 0 ? "text-gold" : "text-muted"}`}>
                    {entry.points > 0 ? `+${entry.points}` : entry.points}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted leading-relaxed">{t("rewards.ledgerEmpty")}</p>
          )
        )}
      </section>

      {/* 8.5 — cards addressed to this account's email */}
      <section className="border border-gold/25 bg-navy2/60 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Gift className="w-5 h-5 text-gold" aria-hidden="true" />
          <h3 className="font-serif text-xl">{t("rewards.myCardsTitle")}</h3>
        </div>
        {cards.length > 0 ? (
          <ul className="grid sm:grid-cols-2 gap-4">
            {cards.map((card) => (
              <li key={card.id} className="border border-gold/20 bg-navy rounded px-4 py-3 space-y-1">
                <p className="font-mono text-sm text-gold">{card.codeMasked}</p>
                <p className="text-lg font-serif text-ivory">{format(card.balance)}</p>
                <p className="text-[11px] text-muted">
                  {card.status === "Active" ? t("rewards.cardActive") : card.status === "Partially Redeemed" ? t("rewards.cardPartial") : card.status}
                </p>
                {card.senderName && <p className="text-[11px] text-muted">{t("rewards.cardFrom", { name: card.senderName })}</p>}
                {card.expiresAt && <p className="text-[10px] font-mono uppercase tracking-wider text-muted">{t("rewards.cardExpires", { date: dateText(card.expiresAt) })}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted leading-relaxed">{t("rewards.cardsEmpty")}</p>
        )}
        <Link to="/gift-cards" className="link-underline text-sm inline-block">
          {t("rewards.checkCardCta")}
        </Link>
      </section>

      {/* 8.10 — live pre-orders */}
      <section className="border border-gold/25 bg-navy2/60 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-gold" aria-hidden="true" />
          <h3 className="font-serif text-xl">{t("rewards.preOrdersTitle")}</h3>
        </div>
        {preOrders.length > 0 ? (
          <ul className="divide-y divide-gold/10">
            {preOrders.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-xs text-ivory truncate">
                    {row.productSlug ? <Link to={`/product/${row.productSlug}`} className="hover:text-gold">{row.productName || t("rewards.preOrderItem")}</Link> : row.productName || t("rewards.preOrderItem")}
                  </p>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted mt-0.5">
                    {t("rewards.preOrderMeta", { count: row.quantity, date: row.expectedReleaseOn ? dateText(row.expectedReleaseOn) : t("rewards.releaseUnset") })}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gold border border-gold/25 px-2 py-1">{row.status}</span>
                  <button
                    type="button"
                    onClick={async () => {
                      const result = await cancelMyPreOrder(row.id);
                      setNotice(result.success ? t("rewards.preOrderCancelled") : result.error || t("rewards.failed"));
                      if (result.success) await load();
                    }}
                    className="text-[10px] font-mono uppercase tracking-wider text-muted hover:text-gold"
                  >
                    {t("rewards.cancel")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted leading-relaxed">{t("rewards.preOrdersEmpty")}</p>
        )}
      </section>

      {/* 8.11 — waitlist entries */}
      <section className="border border-gold/25 bg-navy2/60 rounded-lg p-6 space-y-4">
        <h3 className="font-serif text-xl">{t("rewards.waitlistTitle")}</h3>
        {entries.length > 0 ? (
          <ul className="divide-y divide-gold/10">
            {entries.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-4 py-3">
                <span className="text-xs text-ivory truncate">
                  {row.status === "Notified"
                    ? t("rewards.waitlistNotified")
                    : t("rewards.waitlistWaiting")}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    const result = await leaveWaitlist(row.id);
                    setNotice(result.success ? t("rewards.waitlistLeft") : result.error || t("rewards.failed"));
                    if (result.success) await load();
                  }}
                  className="text-[10px] font-mono uppercase tracking-wider text-muted hover:text-gold flex items-center gap-1 shrink-0"
                >
                  <X className="w-3 h-3" aria-hidden="true" />
                  {t("rewards.leave")}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted leading-relaxed">{t("rewards.waitlistEmpty")}</p>
        )}
      </section>

      <p className="text-[11px] text-muted leading-relaxed">
        {t("rewards.privacyNote", { email: user?.email ? user.email.split("@")[0] + "***" : "" })}
      </p>
    </div>
  );
}

export default AccountRewards;
