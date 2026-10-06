import { useCallback, useEffect, useState } from "react";
import { Gift, Coins, Loader2, Check } from "lucide-react";
import { useI18n } from "../i18n/I18nProvider";
import { useCurrency } from "../context/CurrencyContext";
import { supabase } from "../lib/supabase";
import {
  applyGiftCard,
  fetchMyLoyalty,
  releaseGiftCard,
  redeemLoyaltyPoints,
  type LoyaltyState,
} from "../services/luxuryRewards";

interface OrderMoney {
  total: number;
  giftCardAmount: number;
  loyaltyPointsUsed: number;
  loyaltyDiscount: number;
  paymentStatus: string;
  status: string;
  currency: string;
}

interface RewardsPanelProps {
  orderId: string;
  onOutstandingChange?: (amount: number) => void;
}

/**
 * Applies a gift card or loyalty points to an order that has already been placed.
 *
 * Both instruments move money, so nothing is decided here: the panel asks the database, shows the
 * figure it returns, and re-reads the order so what the shopper sees is what is stored.
 */
export function RewardsPanel({ orderId, onOutstandingChange }: RewardsPanelProps) {
  const { t } = useI18n();
  const { formatIn } = useCurrency();
  const [order, setOrder] = useState<OrderMoney | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [points, setPoints] = useState("");
  const [loyalty, setLoyalty] = useState<LoyaltyState | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "bad"; text: string } | null>(null);

  const reload = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("total, gift_card_amount, loyalty_points_used, loyalty_discount, payment_status, status, currency")
      .eq("id", orderId)
      .maybeSingle();
    if (error || !data) {
      setOrder(null);
      return;
    }
    const next: OrderMoney = {
      total: Number(data.total ?? 0),
      giftCardAmount: Number(data.gift_card_amount ?? 0),
      loyaltyPointsUsed: Number(data.loyalty_points_used ?? 0),
      loyaltyDiscount: Number(data.loyalty_discount ?? 0),
      paymentStatus: String(data.payment_status ?? ""),
      status: String(data.status ?? ""),
      currency: String(data.currency ?? "PKR"),
    };
    setOrder(next);
    onOutstandingChange?.(next.total);
  }, [orderId, onOutstandingChange]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([reload(), fetchMyLoyalty()])
      .then(([, state]) => {
        if (alive) setLoyalty(state.state);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [reload]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted font-mono uppercase tracking-wider">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        {t("rewards.loading")}
      </div>
    );
  }

  if (!order) return null;

  const settled = order.paymentStatus === "Paid" || order.paymentStatus === "Verified" || order.status === "Cancelled";
  const money = (value: number) => formatIn(value, order.currency);
  const run = async (action: () => Promise<{ success: boolean; error?: string }>, doneText: string) => {
    setBusy(true);
    setNotice(null);
    try {
      const result = await action();
      setNotice({ kind: result.success ? "ok" : "bad", text: result.success ? doneText : result.error || t("rewards.failed") });
      if (result.success) await reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="border border-gold/25 bg-navy2/60 rounded-lg p-6 space-y-5" aria-label={t("rewards.title")}>
      <div className="flex items-center gap-3">
        <Gift className="w-5 h-5 text-gold" aria-hidden="true" />
        <h2 className="font-serif text-xl">{t("rewards.title")}</h2>
      </div>

      {(order.giftCardAmount > 0 || order.loyaltyDiscount > 0) && (
        <dl className="grid sm:grid-cols-2 gap-3 text-xs">
          {order.giftCardAmount > 0 && (
            <div className="flex items-center justify-between border border-gold/15 bg-navy/50 rounded px-3 py-2">
              <dt className="text-muted font-mono uppercase tracking-wider">{t("rewards.giftCardApplied")}</dt>
              <dd className="text-ivory font-mono">{money(order.giftCardAmount)}</dd>
            </div>
          )}
          {order.loyaltyDiscount > 0 && (
            <div className="flex items-center justify-between border border-gold/15 bg-navy/50 rounded px-3 py-2">
              <dt className="text-muted font-mono uppercase tracking-wider">
                {t("rewards.pointsApplied", { count: order.loyaltyPointsUsed })}
              </dt>
              <dd className="text-ivory font-mono">{money(order.loyaltyDiscount)}</dd>
            </div>
          )}
          <div className="sm:col-span-2 flex items-center justify-between border border-gold/30 bg-navy rounded px-3 py-2">
            <dt className="text-gold font-mono uppercase tracking-wider">{t("rewards.stillOwed")}</dt>
            <dd className="text-gold font-mono text-sm">{money(order.total)}</dd>
          </div>
        </dl>
      )}

      {settled ? (
        <p className="text-xs text-muted leading-relaxed">{t("rewards.settledNote")}</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          <form
            className="space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!code.trim()) return;
              void run(() => applyGiftCard(orderId, code.trim()), t("rewards.giftCardOk"));
            }}
          >
            <label htmlFor={`gift-${orderId}`} className="text-[10px] font-mono uppercase tracking-widest text-gold">
              {t("rewards.giftCardLabel")}
            </label>
            <div className="flex gap-2">
              <input
                id={`gift-${orderId}`}
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder={t("rewards.giftCardPlaceholder")}
                className="flex-1 min-w-0 bg-navy border border-gold/25 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold font-mono"
              />
              <button type="submit" disabled={busy || !code.trim()} className="btn-gold font-sans text-xs disabled:opacity-50">
                {t("rewards.apply")}
              </button>
            </div>
            {order.giftCardAmount > 0 && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void run(() => releaseGiftCard(orderId), t("rewards.giftCardRemoved"))}
                className="text-[10px] font-mono uppercase tracking-wider text-muted hover:text-gold"
              >
                {t("rewards.removeGiftCard")}
              </button>
            )}
          </form>

          <form
            className="space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              const value = Number(points);
              if (!Number.isFinite(value) || value <= 0) return;
              void run(() => redeemLoyaltyPoints(orderId, Math.trunc(value)), t("rewards.pointsOk"));
            }}
          >
            <label htmlFor={`points-${orderId}`} className="text-[10px] font-mono uppercase tracking-widest text-gold flex items-center gap-2">
              <Coins className="w-3.5 h-3.5" aria-hidden="true" />
              {loyalty?.configured
                ? t("rewards.pointsLabelWithBalance", { count: loyalty.balance })
                : t("rewards.pointsLabel")}
            </label>
            {loyalty?.configured ? (
              <div className="flex gap-2">
                <input
                  id={`points-${orderId}`}
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={points}
                  onChange={(event) => setPoints(event.target.value)}
                  placeholder={t("rewards.pointsPlaceholder")}
                  className="flex-1 min-w-0 bg-navy border border-gold/25 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold font-mono"
                />
                <button
                  type="submit"
                  disabled={busy || !points || order.loyaltyPointsUsed > 0}
                  className="btn-gold font-sans text-xs disabled:opacity-50"
                >
                  {t("rewards.apply")}
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-muted leading-relaxed">{t("rewards.loyaltyNotConfigured")}</p>
            )}
            {loyalty?.configured && order.loyaltyPointsUsed > 0 && (
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted">{t("rewards.pointsAlreadyUsed")}</p>
            )}
          </form>
        </div>
      )}

      {notice && (
        <p
          role="status"
          className={`flex items-start gap-2 text-xs leading-relaxed border rounded px-3 py-2 ${
            notice.kind === "ok" ? "border-gold/40 text-gold" : "border-gold/25 text-muted"
          }`}
        >
          {notice.kind === "ok" && <Check className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />}
          {notice.text}
        </p>
      )}
    </section>
  );
}

export default RewardsPanel;
