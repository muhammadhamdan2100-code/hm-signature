import { useCallback, useEffect, useState } from "react";
import { Loader2, Gift } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";
import { useAdminData } from "../context/AdminDataContext";
import { getCurrentStaff, hasPermission } from "../../services/auth";
import { fetchGiftCardConfig, fetchGiftCards, issueGiftCard, setGiftCardStatus, type GiftCardRow } from "../../services/brandAdmin";
import { AccessDeniedNote, AdminField, cardClass, inputClass, rowClass } from "../components/Phase8Shared";

const STATUS_FLOW = ["Created", "Purchased", "Active", "Cancelled", "Expired"];

export function GiftCardsAdminPage() {
  const { t, locale } = useI18n();
  const { showToast } = useAdminData();
  const canManage = hasPermission(getCurrentStaff(), "giftCards.manage");

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<GiftCardRow[]>([]);
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [draft, setDraft] = useState({ amount: "", currency: "PKR", recipientName: "", recipientEmail: "", senderName: "", message: "", deliveryDate: "" });
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cards, cfg] = await Promise.all([fetchGiftCards(), fetchGiftCardConfig()]);
      setRows(cards.cards);
      setConfig(cfg);
      if (cards.error) showToast("error", cards.error);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted font-mono uppercase tracking-wider py-10">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        {t("admin.shared.loading")}
      </div>
    );
  }

  if (!canManage) return <AccessDeniedNote>{t("admin.giftCards.denied")}</AccessDeniedNote>;

  const enabled = config.enabled === true;
  const denominations = Array.isArray(config.denominations) ? (config.denominations as unknown[]) : [];

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-serif text-2xl">{t("admin.giftCards.title")}</h1>
        <p className="text-xs text-muted leading-relaxed max-w-2xl">{t("admin.giftCards.body")}</p>
      </header>

      {!enabled && (
        <p className="text-xs text-muted border border-gold/25 bg-navy2/40 rounded px-4 py-3 leading-relaxed">
          {t("admin.giftCards.disabledNote")}
        </p>
      )}

      <section className={cardClass}>
        <div className="flex items-center gap-3">
          <Gift className="w-5 h-5 text-gold" aria-hidden="true" />
          <h2 className="font-serif text-lg">{t("admin.giftCards.issue")}</h2>
        </div>
        <p className="text-xs text-muted leading-relaxed">{t("admin.giftCards.issueBody")}</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AdminField label={t("admin.giftCards.amount")} htmlFor="gc-amount" hint={denominations.length ? t("admin.giftCards.denominationsHint") : undefined}>
            <input id="gc-amount" value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: event.target.value })} className={inputClass} inputMode="decimal" />
          </AdminField>
          <AdminField label={t("admin.giftCards.currency")} htmlFor="gc-currency">
            <input id="gc-currency" value={draft.currency} onChange={(event) => setDraft({ ...draft, currency: event.target.value.toUpperCase().slice(0, 3) })} className={inputClass} />
          </AdminField>
          <AdminField label={t("admin.giftCards.recipientName")} htmlFor="gc-rname">
            <input id="gc-rname" value={draft.recipientName} onChange={(event) => setDraft({ ...draft, recipientName: event.target.value })} className={inputClass} />
          </AdminField>
          <AdminField label={t("admin.giftCards.recipientEmail")} htmlFor="gc-remail">
            <input id="gc-remail" type="email" value={draft.recipientEmail} onChange={(event) => setDraft({ ...draft, recipientEmail: event.target.value })} className={inputClass} />
          </AdminField>
          <AdminField label={t("admin.giftCards.senderName")} htmlFor="gc-sname">
            <input id="gc-sname" value={draft.senderName} onChange={(event) => setDraft({ ...draft, senderName: event.target.value })} className={inputClass} />
          </AdminField>
          <AdminField label={t("admin.giftCards.deliveryDate")} htmlFor="gc-date">
            <input id="gc-date" type="date" value={draft.deliveryDate} onChange={(event) => setDraft({ ...draft, deliveryDate: event.target.value })} className={inputClass} />
          </AdminField>
        </div>

        <AdminField label={t("admin.giftCards.message")} htmlFor="gc-message">
          <textarea id="gc-message" rows={2} value={draft.message} onChange={(event) => setDraft({ ...draft, message: event.target.value })} className={inputClass} />
        </AdminField>

        <button
          type="button"
          disabled={busy === "issue" || !draft.amount || draft.currency.length !== 3}
          onClick={async () => {
            setBusy("issue");
            const result = await issueGiftCard({
              amount: Number(draft.amount),
              currency: draft.currency,
              recipientName: draft.recipientName,
              recipientEmail: draft.recipientEmail,
              senderName: draft.senderName,
              message: draft.message,
              deliveryDate: draft.deliveryDate || null,
            });
            setBusy(null);
            if (result.success) {
              showToast("success", t("admin.giftCards.issued"));
              setDraft({ ...draft, amount: "", recipientName: "", recipientEmail: "", senderName: "", message: "", deliveryDate: "" });
              await load();
            } else {
              showToast("error", result.error || t("admin.giftCards.failed"));
            }
          }}
          className="btn-gold-fill font-sans text-xs disabled:opacity-50"
        >
          {t("admin.giftCards.issueCta")}
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-lg">{t("admin.giftCards.list")}</h2>
        {rows.length === 0 ? (
          <p className="text-xs text-muted border border-gold/20 rounded px-4 py-6 text-center leading-relaxed">
            {t("admin.giftCards.empty")}
          </p>
        ) : (
          <ul className="space-y-3">
            {rows.map((card) => (
              <li key={card.id} className={`${rowClass} flex flex-wrap items-center gap-4`}>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-mono text-xs text-gold">{card.code}</p>
                  <p className="text-[11px] text-muted truncate">
                    {card.recipientEmail || card.recipientName || t("admin.giftCards.noRecipient")}
                    {card.expiresAt ? ` · ${new Date(card.expiresAt).toLocaleDateString(locale)}` : ""}
                  </p>
                </div>
                <p className="font-mono text-xs text-ivory shrink-0">
                  {card.balance} / {card.initialAmount} {card.currency}
                </p>
                <select
                  aria-label={`${card.code} status`}
                  value={STATUS_FLOW.includes(card.status) ? card.status : "Created"}
                  onChange={async (event) => {
                    setBusy(card.id);
                    const result = await setGiftCardStatus(card.id, event.target.value);
                    setBusy(null);
                    if (result.success) await load();
                    else showToast("error", result.error || t("admin.giftCards.failed"));
                  }}
                  disabled={busy === card.id}
                  className="bg-navy border border-gold/25 rounded px-2 py-1.5 text-xs text-ivory focus:outline-none focus:border-gold"
                >
                  {STATUS_FLOW.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                  {!STATUS_FLOW.includes(card.status) && <option value={card.status}>{card.status}</option>}
                </select>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default GiftCardsAdminPage;
