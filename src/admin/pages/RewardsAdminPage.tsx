import { useCallback, useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";
import { useAdminData } from "../context/AdminDataContext";
import { getCurrentStaff, hasPermission } from "../../services/auth";
import {
  adjustLoyaltyPoints,
  fetchCustomerLedger,
  fetchLoyaltyConfig,
  fetchLoyaltyCustomers,
  fetchVipTiers,
  saveLoyaltyConfig,
  saveVipTier,
  type LedgerRow,
  type VipTier,
} from "../../services/brandAdmin";
import { AccessDeniedNote, AdminField, cardClass, inputClass, rowClass } from "../components/Phase8Shared";

const EARN_KEYS = ["purchase", "signup", "review", "referral", "birthday", "campaign"] as const;

const EARN_LABELS: Record<(typeof EARN_KEYS)[number], string> = {
  purchase: "admin.rewards.earnPurchase",
  signup: "admin.rewards.earnSignup",
  review: "admin.rewards.earnReview",
  referral: "admin.rewards.earnReferral",
  birthday: "admin.rewards.earnBirthday",
  campaign: "admin.rewards.earnCampaign",
};

const numberOrNull = (value: string) => {
  const text = value.trim();
  if (text === "") return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
};

export function RewardsAdminPage() {
  const { t } = useI18n();
  const { showToast } = useAdminData();
  const canManage = hasPermission(getCurrentStaff(), "loyalty.manage");

  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [tiers, setTiers] = useState<VipTier[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string; email: string; tier: string }[]>([]);
  const [chosen, setChosen] = useState("");
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [adjust, setAdjust] = useState({ points: "", reason: "" });
  const [saving, setSaving] = useState<string | null>(null);
  const [earn, setEarn] = useState<Record<string, unknown>>({});
  const [fields, setFields] = useState({ pointsPerUnit: "", conversionRate: "", minRedeemPoints: "", maxRedeemPercent: "", expiryDays: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cfg, tierResult, customerResult] = await Promise.all([
        fetchLoyaltyConfig(),
        fetchVipTiers(),
        fetchLoyaltyCustomers(),
      ]);
      setConfig(cfg);
      setTiers(tierResult.tiers);
      setCustomers(customerResult.rows);
      if (tierResult.error || customerResult.error) showToast("error", tierResult.error || customerResult.error || "");
      const earn = (cfg.earnOn || {}) as Record<string, unknown>;
      setEarn(earn);
      setFields({
        pointsPerUnit: cfg.pointsPerUnit == null ? "" : String(cfg.pointsPerUnit),
        conversionRate: cfg.conversionRate == null ? "" : String(cfg.conversionRate),
        minRedeemPoints: cfg.minRedeemPoints == null ? "" : String(cfg.minRedeemPoints),
        maxRedeemPercent: cfg.maxRedeemPercent == null ? "" : String(cfg.maxRedeemPercent),
        expiryDays: cfg.expiryDays == null ? "" : String(cfg.expiryDays),
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!chosen) {
      setLedger([]);
      return;
    }
    void fetchCustomerLedger(chosen).then((result) => setLedger(result.rows));
  }, [chosen]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted font-mono uppercase tracking-wider py-10">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        {t("admin.shared.loading")}
      </div>
    );
  }

  if (!canManage) {
    return <AccessDeniedNote>{t("admin.rewards.denied")}</AccessDeniedNote>;
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-serif text-2xl">{t("admin.rewards.title")}</h1>
        <p className="text-xs text-muted leading-relaxed max-w-2xl">{t("admin.rewards.body")}</p>
      </header>

      <section className={cardClass}>
        <h2 className="font-serif text-lg">{t("admin.rewards.rules")}</h2>
        <p className="text-xs text-muted leading-relaxed">{t("admin.rewards.rulesBody")}</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AdminField label={t("admin.rewards.enabled")} htmlFor="lo-enabled">
            <select
              id="lo-enabled"
              value={config.enabled === true ? "on" : "off"}
              onChange={(event) => setConfig({ ...config, enabled: event.target.value === "on" })}
              className={inputClass}
            >
              <option value="on">{t("admin.common.on")}</option>
              <option value="off">{t("admin.common.off")}</option>
            </select>
          </AdminField>
          <AdminField label={t("admin.rewards.pointsPerUnit")} htmlFor="lo-rate" hint={t("admin.rewards.pointsPerUnitHint")}>
            <input id="lo-rate" value={fields.pointsPerUnit} onChange={(event) => setFields({ ...fields, pointsPerUnit: event.target.value })} className={inputClass} inputMode="decimal" />
          </AdminField>
          <AdminField label={t("admin.rewards.conversionRate")} htmlFor="lo-conversion" hint={t("admin.rewards.conversionHint")}>
            <input id="lo-conversion" value={fields.conversionRate} onChange={(event) => setFields({ ...fields, conversionRate: event.target.value })} className={inputClass} inputMode="decimal" />
          </AdminField>
          <AdminField label={t("admin.rewards.minRedeem")} htmlFor="lo-min">
            <input id="lo-min" value={fields.minRedeemPoints} onChange={(event) => setFields({ ...fields, minRedeemPoints: event.target.value })} className={inputClass} inputMode="numeric" />
          </AdminField>
          <AdminField label={t("admin.rewards.maxPercent")} htmlFor="lo-max">
            <input id="lo-max" value={fields.maxRedeemPercent} onChange={(event) => setFields({ ...fields, maxRedeemPercent: event.target.value })} className={inputClass} inputMode="numeric" />
          </AdminField>
          <AdminField label={t("admin.rewards.expiryDays")} htmlFor="lo-expiry">
            <input id="lo-expiry" value={fields.expiryDays} onChange={(event) => setFields({ ...fields, expiryDays: event.target.value })} className={inputClass} inputMode="numeric" />
          </AdminField>
        </div>

        <div className="flex flex-wrap gap-3">
          {EARN_KEYS.map((key) => (
            <label key={key} className="flex items-center gap-2 text-xs text-muted border border-gold/20 rounded px-3 py-2">
              <input
                type="checkbox"
                checked={earn[key] === true}
                onChange={(event) => setEarn({ ...earn, [key]: event.target.checked })}
                className="accent-gold"
              />
              {t(EARN_LABELS[key])}
            </label>
          ))}
        </div>

        <button
          type="button"
          disabled={saving === "cfg"}
          onClick={async () => {
            setSaving("cfg");
            const result = await saveLoyaltyConfig({
              enabled: config.enabled === true,
              pointsPerUnit: numberOrNull(fields.pointsPerUnit),
              conversionRate: numberOrNull(fields.conversionRate),
              minRedeemPoints: numberOrNull(fields.minRedeemPoints),
              maxRedeemPercent: numberOrNull(fields.maxRedeemPercent),
              expiryDays: numberOrNull(fields.expiryDays),
              earnOn: earn,
              eligibleCategoryIds: config.eligibleCategoryIds || [],
            });
            setSaving(null);
            if (result.success) showToast("success", t("admin.rewards.saved"));
            else showToast("error", result.error || t("admin.rewards.failed"));
            await load();
          }}
          className="btn-gold-fill font-sans text-xs disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="w-4 h-4" aria-hidden="true" />
          {t("admin.rewards.saveRules")}
        </button>
      </section>

      <section className={cardClass}>
        <h2 className="font-serif text-lg">{t("admin.rewards.tiers")}</h2>
        <p className="text-xs text-muted leading-relaxed">{t("admin.rewards.tiersBody")}</p>
        <ul className="space-y-3">
          {tiers.map((tier) => (
            <li key={tier.code} className={`${rowClass} space-y-3`}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-mono uppercase tracking-wider text-gold">{tier.rank}</span>
                <p className="text-xs text-ivory flex-1 min-w-0">{tier.name}</p>
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted">{tier.code}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <input
                  type="number"
                  min="0"
                  aria-label={`${tier.name} lifetime spend`}
                  defaultValue={tier.minLifetimeSpend ?? ""}
                  placeholder={t("admin.rewards.spendUnset")}
                  onBlur={(event) => {
                    const value = numberOrNull(event.target.value);
                    setTiers((prev) => prev.map((row) => (row.code === tier.code ? { ...row, minLifetimeSpend: value } : row)));
                  }}
                  className="bg-navy border border-gold/25 rounded px-2 py-1.5 text-xs text-ivory w-40 focus:outline-none focus:border-gold"
                />
                <input
                  type="number"
                  min="0"
                  aria-label={`${tier.name} points`}
                  defaultValue={tier.minPoints ?? ""}
                  placeholder={t("admin.rewards.pointsUnset")}
                  onBlur={(event) => {
                    const value = numberOrNull(event.target.value);
                    setTiers((prev) => prev.map((row) => (row.code === tier.code ? { ...row, minPoints: value == null ? null : Math.trunc(value) } : row)));
                  }}
                  className="bg-navy border border-gold/25 rounded px-2 py-1.5 text-xs text-ivory w-32 focus:outline-none focus:border-gold"
                />
                <button
                  type="button"
                  disabled={saving === `tier-${tier.code}`}
                  onClick={async () => {
                    const row = tiers.find((candidate) => candidate.code === tier.code) || tier;
                    setSaving(`tier-${tier.code}`);
                    const result = await saveVipTier(row);
                    setSaving(null);
                    if (result.success) showToast("success", t("admin.rewards.tierSaved"));
                    else showToast("error", result.error || t("admin.rewards.failed"));
                    await load();
                  }}
                  className="btn-gold font-sans text-xs disabled:opacity-50"
                >
                  {t("admin.rewards.saveTier")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className={cardClass}>
        <h2 className="font-serif text-lg">{t("admin.rewards.adjust")}</h2>
        <p className="text-xs text-muted leading-relaxed">{t("admin.rewards.adjustBody")}</p>

        <div className="grid sm:grid-cols-2 gap-4">
          <AdminField label={t("admin.rewards.customer")} htmlFor="lo-customer">
            <select id="lo-customer" value={chosen} onChange={(event) => setChosen(event.target.value)} className={inputClass}>
              <option value="">{t("admin.rewards.chooseCustomer")}</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} — {customer.email} ({customer.tier})
                </option>
              ))}
            </select>
          </AdminField>
        </div>

        {chosen && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <input
                type="number"
                aria-label={t("admin.rewards.adjustPoints")}
                value={adjust.points}
                onChange={(event) => setAdjust({ ...adjust, points: event.target.value })}
                placeholder={t("admin.rewards.adjustPlaceholder")}
                className="bg-navy border border-gold/25 rounded px-3 py-2 text-xs text-ivory w-32 focus:outline-none focus:border-gold font-mono"
              />
              <input
                value={adjust.reason}
                onChange={(event) => setAdjust({ ...adjust, reason: event.target.value })}
                placeholder={t("admin.rewards.reasonPlaceholder")}
                className="flex-1 min-w-0 bg-navy border border-gold/25 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
              />
              <button
                type="button"
                disabled={saving === "adjust" || !adjust.points || adjust.reason.trim().length < 3}
                onClick={async () => {
                  setSaving("adjust");
                  const result = await adjustLoyaltyPoints(chosen, Math.trunc(Number(adjust.points)), adjust.reason.trim());
                  setSaving(null);
                  if (result.success) {
                    showToast("success", t("admin.rewards.adjusted"));
                    setAdjust({ points: "", reason: "" });
                    const fresh = await fetchCustomerLedger(chosen);
                    setLedger(fresh.rows);
                  } else {
                    showToast("error", result.error || t("admin.rewards.failed"));
                  }
                }}
                className="btn-gold font-sans text-xs disabled:opacity-50"
              >
                {t("admin.rewards.applyAdjustment")}
              </button>
            </div>

            {ledger.length > 0 ? (
              <ul className="divide-y divide-gold/10">
                {ledger.slice(0, 15).map((row) => (
                  <li key={row.id} className="flex items-center justify-between gap-4 py-2">
                    <span className="text-xs text-muted truncate">{row.reason || row.entryType}</span>
                    <span className={`font-mono text-xs shrink-0 ${row.points > 0 ? "text-gold" : "text-rose-200"}`}>
                      {row.points > 0 ? `+${row.points}` : row.points}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted">{t("admin.rewards.ledgerEmpty")}</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default RewardsAdminPage;
