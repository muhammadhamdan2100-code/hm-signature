import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAdminData } from "../context/AdminDataContext";
import { useI18n } from "../../i18n/I18nProvider";
import { StatCard } from "../components/StatCard";
import { formatPKR } from "../../utils/currency";
import {
  Save,
  CreditCard,
  Shield,
  Globe,
  Radio,
  Truck,
  Banknote,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Info,
  KeyRound,
} from "lucide-react";
import {
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_SHIPPING_CONFIG,
  fetchPaymentMethodsConfig,
  fetchShippingConfig,
  savePaymentMethodsConfig,
  saveShippingConfig,
  type PaymentMethodConfig,
  type PaymentMethodDetail,
  type ShippingConfig,
} from "../../services/storeConfig";

/* ------------------------------------------------------------------ *
 * Checkout configuration helpers (payment_config / shipping_config)
 * ------------------------------------------------------------------ */

const MAX_VALUE_LENGTH = 120;
const MAX_SHORT_LENGTH = 60;

/** Guard rail copy shown when the owner tries to switch off the only available method. */
type TFn = (key: string, vars?: Record<string, string | number>) => string;

const lastMethodMessage = (t: TFn) => t("admin.settings.atLeastOneMethodAvailable");

/** The only payment ids the storefront understands. No card gateway exists yet. */
const SUPPORTED_PAYMENT_IDS: string[] = ["Cash on Delivery", "JazzCash", "Raast", "Bank Transfer"];

/** Anything that smells like a credential must never reach public settings. */
const SECRET_SIGNATURES: { pattern: RegExp; label: "secretApiKey" | "bearerToken" | "jwtToken" }[] = [
  { pattern: /sk_[a-z0-9_]{4,}/i, label: "secretApiKey" },
  { pattern: /bearer\s+[a-z0-9._~+/=-]{8,}/i, label: "bearerToken" },
  { pattern: /eyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}/, label: "jwtToken" },
];

function findSecret(t: TFn, text: string): string | null {
  for (const signature of SECRET_SIGNATURES) {
    if (signature.pattern.test(text)) {
      if (signature.label === "secretApiKey") return t("admin.settings.secretApiKey");
      if (signature.label === "bearerToken") return t("admin.settings.bearerToken");
      return t("admin.settings.jwtToken");
    }
  }
  return null;
}

/** Inline warning so the owner sees the problem before pressing save. */
function secretWarning(t: TFn, text: string): string | undefined {
  const secret = findSecret(t, text);
  if (!secret) return undefined;
  return t("admin.settings.thisLooksLikeSecret", { secret });
}

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const cloneMethod = (method: PaymentMethodConfig): PaymentMethodConfig => ({
  ...method,
  details: method.details.map((d) => ({ ...d })),
});

function defaultMethodFor(id: string): PaymentMethodConfig {
  const base = DEFAULT_PAYMENT_METHODS.find((d) => d.id === id);
  if (base) return cloneMethod(base);
  return {
    id,
    label: id,
    description: "",
    enabled: false,
    requiresReference: false,
    requiresProof: false,
    referenceLabel: "",
    referencePlaceholder: "",
    instructionHeading: id.toUpperCase(),
    details: [],
  };
}

/** Checkout treats a missing flag as available, so mirror that here instead of lying. */
const coerceFlags = (method: PaymentMethodConfig): PaymentMethodConfig => ({
  ...cloneMethod(method),
  enabled: method.enabled !== false,
  requiresReference: method.requiresReference === true,
  requiresProof: method.requiresProof === true,
});

/** Guarantee the four supported ids are present and ordered, keeping any extra rows. */
function withSupportedMethods(list: PaymentMethodConfig[]): PaymentMethodConfig[] {
  const canonical = SUPPORTED_PAYMENT_IDS.map((id) => {
    const stored = list.find((m) => m.id === id);
    return stored ? coerceFlags(stored) : defaultMethodFor(id);
  });
  const extras = list.filter((m) => !SUPPORTED_PAYMENT_IDS.includes(m.id)).map(coerceFlags);
  return [...canonical, ...extras];
}

function normalizeMethod(method: PaymentMethodConfig): PaymentMethodConfig {
  const cap = (value: string, max: number) => value.trim().slice(0, max);
  return {
    ...method,
    label: cap(method.label, MAX_SHORT_LENGTH),
    description: cap(method.description, MAX_VALUE_LENGTH),
    instructionHeading: cap(method.instructionHeading, MAX_VALUE_LENGTH),
    referenceLabel: cap(method.referenceLabel, MAX_VALUE_LENGTH),
    referencePlaceholder: cap(method.referencePlaceholder, MAX_SHORT_LENGTH),
    details: method.details.map((detail) => {
      const next: PaymentMethodDetail = {
        label: cap(detail.label, MAX_SHORT_LENGTH),
        value: cap(detail.value, MAX_VALUE_LENGTH),
      };
      const copyValue = cap(detail.copyValue ?? "", MAX_VALUE_LENGTH);
      if (copyValue) next.copyValue = copyValue;
      return next;
    }),
  };
}

function validateMethods(t: TFn, list: PaymentMethodConfig[]): string[] {
  const problems: string[] = [];

  if (!list.some((m) => m.enabled)) {
    problems.push(lastMethodMessage(t));
  }

  list.forEach((method) => {
    const name = method.label.trim() || method.id;

    if (!method.label.trim()) problems.push(t("admin.settings.labelEmptyError", { name }));
    if (!method.instructionHeading.trim()) {
      problems.push(t("admin.settings.headingMissingError", { name }));
    }
    if (method.enabled && method.details.length === 0) {
      problems.push(t("admin.settings.keepOneDetailError", { name }));
    }
    if (method.enabled && method.requiresReference && (!method.referenceLabel.trim() || !method.referencePlaceholder.trim())) {
      problems.push(t("admin.settings.referenceNeedsBothError", { name }));
    }

    method.details.forEach((detail, index) => {
      const where = t("admin.settings.detailRowRef", { name, number: index + 1 });
      if (!detail.label.trim() || !detail.value.trim()) {
        problems.push(t("admin.settings.labelValueRequiredError", { where }));
      }
      if (detail.value.trim().length > MAX_VALUE_LENGTH) {
        problems.push(t("admin.settings.valueTooLongError", { where, max: MAX_VALUE_LENGTH }));
      }
      [detail.label, detail.value, detail.copyValue ?? ""].forEach((field, fieldIndex) => {
        const secret = findSecret(t, field);
        if (secret) {
          const fieldName =
            fieldIndex === 0
              ? t("admin.settings.fieldLabelWord")
              : fieldIndex === 1
                ? t("admin.settings.fieldValueWord")
                : t("admin.settings.fieldCopyValueWord");
          problems.push(t("admin.settings.secretInFieldError", { where, field: fieldName, secret }));
        }
      });
    });

    [method.label, method.description, method.instructionHeading, method.referenceLabel, method.referencePlaceholder].forEach(
      (field) => {
        const secret = findSecret(t, field);
        if (secret) {
          problems.push(t("admin.settings.secretInMethodError", { name, secret }));
        }
      }
    );
  });

  return problems;
}

interface ShippingDraft {
  freeThreshold: string;
  standardCost: string;
  estimatedDays: string;
}

const draftFromShipping = (config: ShippingConfig): ShippingDraft => ({
  freeThreshold: String(config.freeThreshold),
  standardCost: String(config.standardCost),
  estimatedDays: config.estimatedDays,
});

const SHIPPING_DRAFT_LIMIT = 60;

/* ------------------------------------------------------------------ *
 * Small presentational helpers
 * ------------------------------------------------------------------ */

type SectionStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; stamp: string }
  | { kind: "failed"; message: string };

const stampNow = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const inputClass =
"w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold disabled:opacity-60";

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  warning?: string;
  maxLength?: number;
  mono?: boolean;
  type?: "text" | "number";
  disabled?: boolean;
  required?: boolean;
}

const TextField: React.FC<TextFieldProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  warning,
  maxLength,
  mono = false,
  type = "text",
  disabled = false,
  required = false,
}) => (
  <div className="min-w-0">
    <label htmlFor={id} className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
      {label}
      {required ? " *" : ""}
    </label>
    <input
      id={id}
      type={type}
      inputMode={type === "number" ? "decimal" : undefined}
      value={value}
      disabled={disabled}
      maxLength={maxLength}
      placeholder={placeholder}
      aria-invalid={warning ? true : undefined}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputClass} ${mono ? "font-mono" : ""} ${warning ? "border-rose-500/60" : ""}`}
    />
    {warning && (
      <p className="text-[10px] text-rose-300 font-light mt-1 leading-relaxed break-words">{warning}</p>
    )}
    {(hint || maxLength) && (
      <p className="text-[10px] text-muted font-light mt-1 leading-relaxed break-words">
        {hint}
        {maxLength ? ` ${value.length}/${maxLength}` : ""}
      </p>
    )}
  </div>
);

interface SwitchFieldProps {
  id: string;
  title: string;
  hint?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}

const SwitchField: React.FC<SwitchFieldProps> = ({ id, title, hint, checked, onChange, disabled = false }) => (
  <div className="flex items-start justify-between gap-3 rounded border border-gold/20 bg-navy px-3 py-2.5 min-w-0">
    <div className="min-w-0">
      <span
        id={`${id}-label`}
        className={`block text-xs font-sans uppercase tracking-wider ${checked ? "text-ivory font-semibold" : "text-muted"}`}
      >
        {title}
      </span>
      {hint && <span className="block text-[10px] text-muted font-light mt-0.5 leading-relaxed">{hint}</span>}
    </div>
    <button
      type="button"
      id={id}
      aria-pressed={checked}
      aria-labelledby={`${id}-label`}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative shrink-0 w-11 h-6 rounded-full border transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-gold ${
        checked ? "bg-gold border-gold" : "bg-navy2 border-gold/30"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <span
        aria-hidden="true"
        className={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${
          checked ? "end-1 bg-navy" : "start-1 bg-muted"
        }`}
      />
    </button>
  </div>
);

const ProblemList: React.FC<{ heading: string; problems: string[] }> = ({ heading, problems }) => {
  if (problems.length === 0) return null;
  return (
    <div role="alert" className="rounded border border-rose-500/30 bg-rose-950/30 p-4 space-y-2">
      <p className="flex items-center gap-2 text-[11px] font-sans font-bold uppercase tracking-wider text-rose-200">
        <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
        {heading}
      </p>
      <ul className="list-disc ps-5 space-y-1 text-[11px] text-rose-100/90 font-light leading-relaxed">
        {problems.map((problem, index) => (
          <li key={`${index}-${problem}`} className="break-words">
            {problem}
          </li>
        ))}
      </ul>
    </div>
  );
};

interface SaveStatusProps {
  status: SectionStatus;
  dirty: boolean;
  savedLabel: string;
  loadingLabel: string;
  retryLabel: string;
  onRetry: () => void;
}

const SaveStatus: React.FC<SaveStatusProps> = ({ status, dirty, savedLabel, loadingLabel, retryLabel, onRetry }) => {
  const { t } = useI18n();
  let body: React.ReactNode;
  if (status.kind === "saving") {
    body = (
      <>
        <Loader2 className="w-3.5 h-3.5 text-gold animate-spin" aria-hidden="true" />
        <span className="text-gold">{loadingLabel}</span>
      </>
    );
  } else if (status.kind === "failed") {
    body = (
      <>
        <AlertTriangle className="w-3.5 h-3.5 text-rose-300" aria-hidden="true" />
        <span className="text-rose-200 break-words">{status.message}</span>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded border border-gold/40 text-[10px] font-mono uppercase tracking-[1.5px] text-gold hover:bg-gold hover:text-navy focus:outline-none focus-visible:ring-1 focus-visible:ring-goldLight transition-colors"
        >
          <RotateCcw className="w-3 h-3" aria-hidden="true" />
          {retryLabel}
        </button>
      </>
    );
  } else if (dirty) {
    body = <span className="text-amber-300">{t("admin.settings.unsavedChanges")}</span>;
  } else if (status.kind === "saved") {
    body = <span className="text-emerald-300">{t("admin.settings.savedAtLine", { label: savedLabel, stamp: status.stamp })}</span>;
  } else {
    body = <span className="text-muted">{t("admin.settings.loadedFromSettings")}</span>;
  }

  return (
    <div role="status" aria-live="polite" className="flex flex-wrap items-center gap-2 text-[11px] font-sans min-w-0">
      {body}
    </div>
  );
};

const PanelSkeleton: React.FC<{ height: string; count: number; keyPrefix: string }> = ({ height, count, keyPrefix }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, index) => (
      <div key={`${keyPrefix}-${index}`} className={`${height} w-full rounded-lg bg-navy2/80 border border-gold/10 animate-pulse`} />
    ))}
  </div>
);

interface PaymentMethodCardProps {
  method: PaymentMethodConfig;
  index: number;
  disabled: boolean;
  onPatch: (index: number, patch: Partial<PaymentMethodConfig>) => void;
  onPatchDetail: (methodIndex: number, detailIndex: number, patch: Partial<PaymentMethodDetail>) => void;
  onAddDetail: (methodIndex: number) => void;
  onRemoveDetail: (methodIndex: number, detailIndex: number) => void;
  onRestoreMethod: (methodIndex: number) => void;
}

const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  method,
  index,
  disabled,
  onPatch,
  onPatchDetail,
  onAddDetail,
  onRemoveDetail,
  onRestoreMethod,
}) => {
  const { t } = useI18n();
  const key = slug(method.id) || `method-${index}`;
  const knownId = SUPPORTED_PAYMENT_IDS.includes(method.id);
  const isBankTransfer = method.id === "Bank Transfer";

  return (
    <fieldset className="bg-navy2/90 border border-gold/20 rounded-lg p-5 sm:p-6 space-y-5 shadow-xl">
      <legend className="sr-only">{t("admin.settings.methodSettingsLegend", { label: method.label || method.id })}</legend>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gold/15 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded bg-navy border border-gold/20 text-gold shrink-0">
            <CreditCard className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h4 className="font-serif text-base font-bold text-ivory leading-tight break-words">{method.label || method.id}</h4>
            <p className="text-[10px] font-mono uppercase tracking-[2px] text-gold/80 mt-0.5 break-words">{method.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <span
            className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
              method.enabled
                ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/30"
                : "bg-navy text-muted border-gold/20"
            }`}
          >
            {method.enabled ? t("admin.settings.shownAtCheckout") : t("admin.settings.hidden")}
          </span>
          <button
            type="button"
            onClick={() => onRestoreMethod(index)}
            className="px-3 py-1 rounded border border-gold/25 text-[10px] font-mono uppercase tracking-[1.5px] text-gold hover:text-ivory hover:border-gold focus:outline-none focus-visible:ring-1 focus-visible:ring-gold transition-colors"
          >
            {t("admin.settings.restoreDefaultFields")}
          </button>
        </div>
      </div>

      {!knownId && (
        <p className="text-[11px] text-amber-300 font-light leading-relaxed">
          {t("admin.settings.unrecognisedMethodNote")}
        </p>
      )}

      <div className="space-y-2">
        <SwitchField
          id={`${key}-enabled`}
          title={t("admin.settings.availableAtCheckout")}
          hint={t("admin.settings.availableAtCheckoutHint")}
          checked={method.enabled}
          disabled={disabled}
          onChange={(next) => onPatch(index, { enabled: next })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField
          id={`${key}-label`}
          label={t("admin.settings.methodLabelField")}
          required
          value={method.label}
          maxLength={MAX_SHORT_LENGTH}
          hint={t("admin.settings.methodLabelHint")}
          onChange={(value) => onPatch(index, { label: value })}
        />
        <TextField
          id={`${key}-heading`}
          label={t("admin.settings.instructionHeadingField")}
          required
          value={method.instructionHeading}
          maxLength={MAX_VALUE_LENGTH}
          mono
          hint={t("admin.settings.instructionHeadingHint")}
          onChange={(value) => onPatch(index, { instructionHeading: value })}
        />
      </div>

      <TextField
        id={`${key}-description`}
        label={t("admin.settings.shortDescriptionField")}
        value={method.description}
        maxLength={MAX_VALUE_LENGTH}
        hint={t("admin.settings.shortDescriptionHint")}
        onChange={(value) => onPatch(index, { description: value })}
      />

      <fieldset className="rounded border border-gold/15 bg-navy/40 p-4 space-y-3">
        <legend className="px-1 text-[10px] font-mono uppercase tracking-[2px] text-gold">{t("admin.settings.checkoutRequirements")}</legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SwitchField
            id={`${key}-reference`}
            title={t("admin.settings.referenceRequired")}
            hint={t("admin.settings.referenceRequiredHint")}
            checked={method.requiresReference}
            disabled={disabled}
            onChange={(next) => onPatch(index, { requiresReference: next })}
          />
          <SwitchField
            id={`${key}-proof`}
            title={t("admin.settings.paymentScreenshotRequired")}
            hint={t("admin.settings.paymentScreenshotRequiredHint")}
            checked={method.requiresProof}
            disabled={disabled}
            onChange={(next) => onPatch(index, { requiresProof: next })}
          />
        </div>

        {method.requiresReference && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <TextField
              id={`${key}-reference-label`}
              label={t("admin.settings.referenceFieldLabel")}
              required
              value={method.referenceLabel}
              maxLength={MAX_VALUE_LENGTH}
              hint={t("admin.settings.referenceFieldLabelHint")}
              warning={secretWarning(t, method.referenceLabel)}
              onChange={(value) => onPatch(index, { referenceLabel: value })}
            />
            <TextField
              id={`${key}-reference-placeholder`}
              label={t("admin.settings.referencePlaceholderField")}
              required
              value={method.referencePlaceholder}
              maxLength={MAX_SHORT_LENGTH}
              hint={t("admin.settings.referencePlaceholderHint")}
              warning={secretWarning(t, method.referencePlaceholder)}
              onChange={(value) => onPatch(index, { referencePlaceholder: value })}
            />
          </div>
        )}
      </fieldset>

      <fieldset className="rounded border border-gold/15 bg-navy/40 p-4 space-y-3">
        <legend className="px-1 text-[10px] font-mono uppercase tracking-[2px] text-gold">{t("admin.settings.paymentDetails")}</legend>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-[11px] text-muted font-light leading-relaxed min-w-0">
            {isBankTransfer
              ? t("admin.settings.bankTransferRowsHint")
              : t("admin.settings.everyRowPrintedHint")}
          </p>
          <button
            type="button"
            onClick={() => onAddDetail(index)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-navy border border-gold/30 hover:border-gold text-gold hover:text-ivory text-[10px] font-sans uppercase tracking-wider transition-colors shrink-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            {t("admin.settings.addDetailRow")}
          </button>
        </div>

        {method.details.length === 0 ? (
          <p className="text-[11px] text-muted font-light italic">
            {t("admin.settings.noDetailRowsYet")}
          </p>
        ) : (
          <div className="space-y-3">
            {method.details.map((detail, detailIndex) => {
              const rowKey = `${key}-d${detailIndex}`;
              return (
                <div key={rowKey} className="rounded border border-gold/15 bg-navy p-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-[2px] text-gold/80">{t("admin.settings.detailRowNumber", { number: detailIndex + 1 })}</span>
                    <button
                      type="button"
                      onClick={() => onRemoveDetail(index, detailIndex)}
                      disabled={method.details.length <= 1 || disabled}
                      title={t("admin.settings.keepOneDetailRow")}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-gold/20 text-[10px] font-sans uppercase tracking-wider text-muted hover:text-rose-300 hover:border-rose-500/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      {t("admin.settings.remove")}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <TextField
                      id={`${rowKey}-label`}
                      label={t("admin.settings.rowLabel")}
                      required
                      value={detail.label}
                      maxLength={MAX_SHORT_LENGTH}
                      placeholder="IBAN"
                      hint={t("admin.settings.rowLabelHint")}
                      onChange={(value) => onPatchDetail(index, detailIndex, { label: value })}
                    />
                    <TextField
                      id={`${rowKey}-value`}
                      label={t("admin.settings.displayedValue")}
                      required
                      mono
                      value={detail.value}
                      maxLength={MAX_VALUE_LENGTH}
                      placeholder="PK36 MEZN 0001 0293 8475 6101"
                      hint={t("admin.settings.displayedValueHint")}
                      warning={secretWarning(t, detail.value)}
                      onChange={(value) => onPatchDetail(index, detailIndex, { value })}
                    />
                  </div>

                  <TextField
                    id={`${rowKey}-copy`}
                    label={t("admin.settings.copyValueOptional")}
                    mono
                    value={detail.copyValue ?? ""}
                    maxLength={MAX_VALUE_LENGTH}
                    placeholder="PK36MEZN0001029384756101"
                    hint={t("admin.settings.copyValueHint")}
                    warning={secretWarning(t, detail.copyValue ?? "")}
                    onChange={(value) => onPatchDetail(index, detailIndex, { copyValue: value })}
                  />
                </div>
              );
            })}
          </div>
        )}
      </fieldset>
    </fieldset>
  );
};

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */

export const SettingsPage: React.FC = () => {
  const { t } = useI18n();
  const { storeSettings, updateStoreSettings, showToast } = useAdminData();

  const [activeTab, setActiveTab] = useState<"general" | "store" | "account" | "payment">("general");

  // General Form
  const [storeName, setStoreName] = useState(storeSettings.storeName);
  const [tagline, setTagline] = useState(storeSettings.tagline);
  const [email, setEmail] = useState(storeSettings.email);
  const [phone, setPhone] = useState(storeSettings.phone);
  const [whatsApp, setWhatsApp] = useState(storeSettings.whatsApp);
  const [address, setAddress] = useState(storeSettings.address);
  const [instagram, setInstagram] = useState(storeSettings.socialLinks.instagram);
  const [facebook, setFacebook] = useState(storeSettings.socialLinks.facebook);

  // Store Form
  const [currency, setCurrency] = useState(storeSettings.currency);
  const [currencySymbol, setCurrencySymbol] = useState(storeSettings.currencySymbol);
  const [taxRate, setTaxRate] = useState(storeSettings.taxRate);
  const [storeStatus, setStoreStatus] = useState(storeSettings.storeStatus);

  // storeSettings hydrates from site_settings after mount; re-seed the form
  // once per loaded object so Save cannot overwrite real settings with defaults.
  const syncedSettings = useRef(storeSettings);
  useEffect(() => {
    if (syncedSettings.current === storeSettings) return;
    syncedSettings.current = storeSettings;
    setStoreName(storeSettings.storeName);
    setTagline(storeSettings.tagline);
    setEmail(storeSettings.email);
    setPhone(storeSettings.phone);
    setWhatsApp(storeSettings.whatsApp);
    setAddress(storeSettings.address);
    setInstagram(storeSettings.socialLinks.instagram);
    setFacebook(storeSettings.socialLinks.facebook);
    setCurrency(storeSettings.currency);
    setCurrencySymbol(storeSettings.currencySymbol);
    setTaxRate(storeSettings.taxRate);
    setStoreStatus(storeSettings.storeStatus);
  }, [storeSettings]);

  // Checkout configuration (payment_config / shipping_config in site_settings)
  const [methods, setMethods] = useState<PaymentMethodConfig[]>([]);
  const [methodsBaseline, setMethodsBaseline] = useState<PaymentMethodConfig[]>([]);
  const [draft, setDraft] = useState<ShippingDraft>(draftFromShipping(DEFAULT_SHIPPING_CONFIG));
  const [draftBaseline, setDraftBaseline] = useState<ShippingDraft>(draftFromShipping(DEFAULT_SHIPPING_CONFIG));

  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<SectionStatus>({ kind: "idle" });
  const [deliveryStatus, setDeliveryStatus] = useState<SectionStatus>({ kind: "idle" });
  const [paymentProblems, setPaymentProblems] = useState<string[]>([]);
  const [deliveryProblems, setDeliveryProblems] = useState<string[]>([]);

  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const loadCheckoutConfig = useCallback(async () => {
    try {
      const [loadedMethods, loadedShipping] = await Promise.all([fetchPaymentMethodsConfig(), fetchShippingConfig()]);
      if (!alive.current) return;
      const prepared = withSupportedMethods(loadedMethods);
      setMethods(prepared);
      setMethodsBaseline(prepared.map(cloneMethod));
      const shippingDraft = draftFromShipping(loadedShipping);
      setDraft(shippingDraft);
      setDraftBaseline({ ...shippingDraft });
      setPaymentStatus({ kind: "idle" });
      setDeliveryStatus({ kind: "idle" });
      setPaymentProblems([]);
      setDeliveryProblems([]);
      setConfigError(null);
    } catch (err) {
      if (!alive.current) return;
      setConfigError(err instanceof Error ? err.message : t("admin.settings.readSettingsFailed"));
    } finally {
      if (alive.current) setConfigLoading(false);
    }
  }, []);

  const reloadCheckoutConfig = async () => {
    setConfigLoading(true);
    setConfigError(null);
    await loadCheckoutConfig();
  };

  useEffect(() => {
    void loadCheckoutConfig();
  }, [loadCheckoutConfig]);

  const paymentDirty = useMemo(() => JSON.stringify(methods) !== JSON.stringify(methodsBaseline), [methods, methodsBaseline]);
  const deliveryDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(draftBaseline), [draft, draftBaseline]);
  const enabledCount = useMemo(() => methods.filter((m) => m.enabled).length, [methods]);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings({
      storeName,
      tagline,
      email,
      phone,
      whatsApp,
      address,
      socialLinks: {
        ...storeSettings.socialLinks,
        instagram,
        facebook,
      },
    });
  };

  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings({
      currency,
      currencySymbol,
      taxRate: Number(taxRate),
      storeStatus,
    });
  };

  const patchMethod = (index: number, patch: Partial<PaymentMethodConfig>) => {
    const wasLastEnabled =
      patch.enabled === false && methods.filter((method, i) => (i === index ? false : method.enabled)).length === 0;

    setMethods((prev) => prev.map((method, i) => (i === index ? { ...method, ...patch } : method)));
    setPaymentStatus({ kind: "idle" });

    if (wasLastEnabled) {
      // Guard rail: the shopper always needs one way to pay, but the switch stays
      // usable so another method can be enabled before saving.
      const message = lastMethodMessage(t);
      setPaymentProblems((prev) => (prev.includes(message) ? prev : [...prev, message]));
      setPaymentStatus({ kind: "failed", message });
    } else if (patch.enabled === true) {
      const message = lastMethodMessage(t);
      setPaymentProblems((prev) => prev.filter((problem) => problem !== message));
    }
  };

  const patchDetail = (methodIndex: number, detailIndex: number, patch: Partial<PaymentMethodDetail>) => {
    setMethods((prev) =>
      prev.map((method, i) =>
        i === methodIndex
          ? { ...method, details: method.details.map((d, j) => (j === detailIndex ? { ...d, ...patch } : d)) }
          : method
      )
    );
    setPaymentStatus({ kind: "idle" });
  };

  const addDetail = (methodIndex: number) => {
    setMethods((prev) =>
      prev.map((method, i) => (i === methodIndex ? { ...method, details: [...method.details, { label: "", value: "" }] } : method))
    );
    setPaymentStatus({ kind: "idle" });
  };

  const removeDetail = (methodIndex: number, detailIndex: number) => {
    setMethods((prev) =>
      prev.map((method, i) => (i === methodIndex ? { ...method, details: method.details.filter((_, j) => j !== detailIndex) } : method))
    );
    setPaymentStatus({ kind: "idle" });
  };

  const restoreMethod = (methodIndex: number) => {
    setMethods((prev) => prev.map((method, i) => (i === methodIndex ? defaultMethodFor(method.id) : method)));
    setPaymentProblems([]);
    setPaymentStatus({ kind: "idle" });
  };

  const restoreAllPaymentDefaults = () => {
    setMethods(withSupportedMethods(DEFAULT_PAYMENT_METHODS));
    setPaymentProblems([]);
    setPaymentStatus({ kind: "idle" });
  };

  const savePaymentConfig = async () => {
    const cleaned = methods.map(normalizeMethod);
    const problems = validateMethods(t, cleaned);

    if (problems.length > 0) {
      setMethods(cleaned);
      setPaymentProblems(problems);
      setPaymentStatus({ kind: "failed", message: t("admin.settings.nothingSavedCount", { count: problems.length }) });
      showToast("error", t("admin.settings.checkoutNotSavedToast"));
      return;
    }

    setPaymentProblems([]);
    setPaymentStatus({ kind: "saving" });

    const ok = await savePaymentMethodsConfig(cleaned);
    if (!alive.current) return;

    if (ok) {
      setMethods(cleaned);
      setMethodsBaseline(cleaned.map(cloneMethod));
      setPaymentStatus({ kind: "saved", stamp: stampNow() });
      showToast("success", t("admin.settings.checkoutSavedToast"));
    } else {
      setMethods(cleaned);
      setPaymentStatus({
        kind: "failed",
        message: t("admin.settings.settingsRejectedPaymentWrite"),
      });
      showToast("error", t("admin.settings.checkoutCouldNotBeSaved"));
    }
  };

  const saveDeliveryConfig = async () => {
    const freeThresholdText = draft.freeThreshold.trim();
    const standardCostText = draft.standardCost.trim();
    const estimatedDaysText = draft.estimatedDays.trim().slice(0, SHIPPING_DRAFT_LIMIT);

    const problems: string[] = [];
    const freeThreshold = Number(freeThresholdText);
    const standardCost = Number(standardCostText);

    if (!freeThresholdText || !Number.isFinite(freeThreshold) || freeThreshold < 0 || freeThreshold > 100000000) {
      problems.push(t("admin.settings.freeThresholdRangeError"));
    }
    if (!standardCostText || !Number.isFinite(standardCost) || standardCost < 0 || standardCost > 100000000) {
      problems.push(t("admin.settings.standardCostRangeError"));
    }
    if (!estimatedDaysText) {
      problems.push(t("admin.settings.estimatedDaysEmptyError"));
    }
    const secret = findSecret(t, estimatedDaysText);
    if (secret) {
      problems.push(t("admin.settings.estimatedDaysSecretError", { secret }));
    }

    const cleaned: ShippingDraft = {
      freeThreshold: freeThresholdText,
      standardCost: standardCostText,
      estimatedDays: estimatedDaysText,
    };

    if (problems.length > 0) {
      setDraft(cleaned);
      setDeliveryProblems(problems);
      setDeliveryStatus({ kind: "failed", message: t("admin.settings.nothingSavedCount", { count: problems.length }) });
      showToast("error", t("admin.settings.deliveryNotSavedToast"));
      return;
    }

    setDeliveryProblems([]);
    setDeliveryStatus({ kind: "saving" });

    const payload: ShippingConfig = {
      freeThreshold: Math.round(freeThreshold),
      standardCost: Math.round(standardCost),
      estimatedDays: estimatedDaysText,
    };

    const ok = await saveShippingConfig(payload);
    if (!alive.current) return;

    if (ok) {
      const nextDraft = draftFromShipping(payload);
      setDraft(nextDraft);
      setDraftBaseline({ ...nextDraft });
      setDeliveryStatus({ kind: "saved", stamp: stampNow() });
      showToast("success", t("admin.settings.deliverySavedToast"));
    } else {
      setDraft(cleaned);
      setDeliveryStatus({
        kind: "failed",
        message: t("admin.settings.settingsRejectedDeliveryWrite"),
      });
      showToast("error", t("admin.settings.deliveryCouldNotBeSaved"));
    }
  };

  const deliveryPreview = useMemo(() => {
    const threshold = Number(draft.freeThreshold);
    const cost = Number(draft.standardCost);
    if (!Number.isFinite(threshold) || !Number.isFinite(cost) || draft.freeThreshold.trim() === "" || draft.standardCost.trim() === "") {
      return t("admin.settings.enterAmountsToPreview");
    }
    const window = draft.estimatedDays.trim() || t("admin.settings.noTransitTimeSetLower");
    return t("admin.settings.deliveryPreviewLine", { threshold: formatPKR(threshold), cost: formatPKR(cost), window });
  }, [draft, t]);

  const methodSummary = useMemo(
    () => t("admin.settings.methodsAvailableSummary", { enabled: enabledCount, total: methods.length }),
    [enabledCount, methods.length, t]
  );

  // Rupee text for the summary cards: never print a fake amount mid-edit.
  const rupeeCell = (text: string) => {
    const value = Number(text);
    return text.trim() !== "" && Number.isFinite(value) && value >= 0 ? formatPKR(value) : t("admin.settings.checkTheValue");
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
            {t("admin.settings.eyebrow")}
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
            {t("admin.settings.title")}
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-0.5">
            {t("admin.settings.introBody")}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gold/15 pb-1 overflow-x-auto">
        {[
          { id: "general", label: t("admin.settings.tabGeneral"), icon: Globe },
          { id: "store", label: t("admin.settings.tabStore"), icon: Radio },
          { id: "account", label: t("admin.settings.tabAccount"), icon: Shield },
          { id: "payment", label: t("admin.settings.tabPayment"), icon: CreditCard },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              aria-pressed={activeTab === tab.id}
              className={`px-4 py-2 rounded-t text-xs font-sans uppercase tracking-wider flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-gold text-gold font-bold bg-navy2/60"
                  : "border-transparent text-muted hover:text-ivory"
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-gold" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* General Settings */}
      {activeTab === "general" && (
        <form onSubmit={handleSaveGeneral} className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-6 shadow-xl">
          <h3 className="font-serif text-lg font-bold text-ivory border-b border-gold/15 pb-3">
            {t("admin.settings.boutiqueContactHeading")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                {t("admin.settings.storeName")} *
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                {t("admin.settings.tagline")}
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                {t("admin.settings.conciergeEmail")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                {t("admin.settings.phoneNumber")}
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                {t("admin.settings.whatsappBusinessNumber")}
              </label>
              <input
                type="text"
                value={whatsApp}
                onChange={(e) => setWhatsApp(e.target.value)}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
              {t("admin.settings.atelierAddress")}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gold/15 pt-4">
            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                {t("admin.settings.instagramUrl")}
              </label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                {t("admin.settings.facebookUrl")}
              </label>
              <input
                type="text"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-gold hover:bg-goldLight text-navy font-bold rounded text-xs font-sans uppercase tracking-wider flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{t("admin.settings.saveGeneralSettings")}</span>
            </button>
          </div>
        </form>
      )}

      {/* Store & Currency */}
      {activeTab === "store" && (
        <form onSubmit={handleSaveStore} className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-6 shadow-xl">
          <h3 className="font-serif text-lg font-bold text-ivory border-b border-gold/15 pb-3">
            {t("admin.settings.currencyMaintenanceHeading")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                {t("admin.settings.baseCurrencyCode")}
              </label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-gold font-mono font-bold focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                {t("admin.settings.currencySymbol")}
              </label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                {t("admin.settings.salesTaxRate")}
              </label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
              {t("admin.settings.storefrontStatus")}
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="Live"
                  checked={storeStatus === "Live"}
                  onChange={() => setStoreStatus("Live")}
                  className="text-gold focus:ring-0"
                />
                <span className="text-xs text-emerald-300 font-bold uppercase">
                  {t("admin.settings.liveOnline")}
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="Maintenance"
                  checked={storeStatus === "Maintenance"}
                  onChange={() => setStoreStatus("Maintenance")}
                  className="text-gold focus:ring-0"
                />
                <span className="text-xs text-amber-300 font-bold uppercase">
                  {t("admin.settings.maintenanceMode")}
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-gold hover:bg-goldLight text-navy font-bold rounded text-xs font-sans uppercase tracking-wider flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{t("admin.settings.saveStoreSettings")}</span>
            </button>
          </div>
        </form>
      )}

      {/* Account Security */}
      {activeTab === "account" && (
        <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-6 shadow-xl">
          <h3 className="font-serif text-lg font-bold text-ivory border-b border-gold/15 pb-3">
            {t("admin.settings.adminSecurityHeading")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                {t("admin.settings.currentPassword")}
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                {t("admin.settings.newPassword")}
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div className="p-4 rounded bg-navy border border-gold/15 flex items-center justify-between text-xs font-sans">
            <div>
              <p className="font-bold text-ivory">{t("admin.settings.twoFactor")}</p>
              <p className="text-muted text-[11px]">
                {t("admin.settings.twoFactorHint")}
              </p>
            </div>
            <span className="text-emerald-400 font-mono uppercase font-bold text-[10px]">
              {t("admin.settings.enabled")}
            </span>
          </div>
        </div>
      )}

      {/* Payment Methods & Delivery Rules */}
      {activeTab === "payment" && (
        <div className="space-y-6">
          {configLoading && (
            <div role="status" aria-live="polite" className="space-y-4">
              <p className="flex items-center gap-2 text-xs text-muted font-sans">
                <Loader2 className="w-4 h-4 text-gold animate-spin" aria-hidden="true" />
                {t("admin.settings.loadingCheckoutConfig")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-28 rounded-lg bg-navy2/80 border border-gold/10 animate-pulse" />
                ))}
              </div>
              <PanelSkeleton height="h-64" count={2} keyPrefix="payment-skeleton" />
            </div>
          )}

          {!configLoading && configError && (
            <div
              role="alert"
              className="bg-navy2/90 border border-rose-500/30 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl"
            >
              <div className="flex items-start gap-3 min-w-0">
                <AlertTriangle className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="min-w-0">
                  <h3 className="font-serif text-base font-bold text-ivory">{t("admin.settings.checkoutSettingsUnavailable")}</h3>
                  <p className="text-xs text-muted font-light mt-0.5 break-words">{configError}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void reloadCheckoutConfig()}
                className="px-4 py-2 rounded bg-gold hover:bg-goldLight text-navy text-xs font-sans font-semibold uppercase tracking-wider transition-colors flex items-center gap-2 shrink-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                {t("admin.settings.retry")}
              </button>
            </div>
          )}

          {!configLoading && !configError && (
            <>
              {/* Summary strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  title={t("admin.settings.methodsAvailable")}
                  value={methodSummary}
                  subtitle={t("admin.settings.paymentMethodsSummary")}
                  icon={Banknote}
                />
                <StatCard
                  title={t("admin.settings.freeDeliveryAbove")}
                  value={rupeeCell(draft.freeThreshold)}
                  subtitle={t("admin.settings.freeDeliveryAboveSubtitle")}
                  icon={Truck}
                />
                <StatCard
                  title={t("admin.settings.standardDelivery")}
                  value={rupeeCell(draft.standardCost)}
                  subtitle={draft.estimatedDays.trim() || t("admin.settings.noTransitTimeSet")}
                  icon={CreditCard}
                />
              </div>

              {/* Out-of-scope card payments */}
              <div className="bg-navy2/90 border border-gold/20 rounded-lg p-5 shadow-xl flex items-start gap-3">
                <Info className="w-5 h-5 text-gold shrink-0 mt-0.5" aria-hidden="true" />
                <div className="min-w-0 space-y-1">
                  <p className="font-serif text-base font-bold text-ivory leading-tight">{t("admin.settings.cardPaymentsLaterRelease")}</p>
                  <p className="text-xs text-muted font-light leading-relaxed">
                    {t("admin.settings.cardPaymentsNote")}
                  </p>
                </div>
              </div>

              {/* Payment methods */}
              <section aria-labelledby="payment-methods-heading" className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gold/15 pb-3">
                  <h3 id="payment-methods-heading" className="font-serif text-lg font-bold text-ivory">
                    {t("admin.settings.paymentMethodsHeading")}
                  </h3>
                  <button
                    type="button"
                    onClick={restoreAllPaymentDefaults}
                    className="px-3 py-1.5 rounded border border-gold/25 text-[10px] font-mono uppercase tracking-[1.5px] text-gold hover:bg-gold hover:text-navy transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-goldLight shrink-0"
                  >
                    {t("admin.settings.restoreAllDefaults")}
                  </button>
                </div>

                <p className="text-xs text-muted font-light leading-relaxed">
                  {t("admin.settings.storedAsJsonPrefix")} <code className="text-gold">site_settings</code>{" "}
                  {t("admin.settings.storedAsJsonMiddle")} <code className="text-gold">payment_config</code>. {t("admin.settings.storedAsJsonSuffix")}
                </p>

                <SaveStatus
                  status={paymentStatus}
                  dirty={paymentDirty}
                  loadingLabel={t("admin.settings.savingPaymentConfiguration")}
                  savedLabel={t("admin.settings.checkoutInstructionsSaved")}
                  retryLabel={t("admin.settings.retrySave")}
                  onRetry={() => void savePaymentConfig()}
                />

                <div className="space-y-5">
                  {methods.map((method, index) => (
                    <PaymentMethodCard
                      key={method.id}
                      method={method}
                      index={index}
                      disabled={paymentStatus.kind === "saving"}
                      onPatch={patchMethod}
                      onPatchDetail={patchDetail}
                      onAddDetail={addDetail}
                      onRemoveDetail={removeDetail}
                      onRestoreMethod={restoreMethod}
                    />
                  ))}
                </div>

                <ProblemList heading={t("admin.settings.paymentProblemHeading")} problems={paymentProblems} />

                <div className="bg-navy2/90 border border-gold/20 rounded-lg p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <p className="flex items-start gap-2 text-[11px] text-muted font-light leading-relaxed min-w-0">
                    <KeyRound className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" aria-hidden="true" />
                    {t("admin.settings.publishImmediatelyNote")}
                  </p>
                  <button
                    type="button"
                    onClick={() => void savePaymentConfig()}
                    disabled={paymentStatus.kind === "saving"}
                    className="px-5 py-2 bg-gold hover:bg-goldLight text-navy font-bold rounded text-xs font-sans uppercase tracking-wider flex items-center justify-center gap-1.5 gap-2 shrink-0 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                  >
                    {paymentStatus.kind === "saving" ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{t("admin.settings.savePaymentConfiguration")}</span>
                  </button>
                </div>
              </section>

              {/* Delivery rules */}
              <section aria-labelledby="delivery-rules-heading" className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gold/15 pb-3">
                  <Truck className="w-5 h-5 text-gold" aria-hidden="true" />
                  <h3 id="delivery-rules-heading" className="font-serif text-lg font-bold text-ivory">
                    {t("admin.settings.deliveryPricingRules")}
                  </h3>
                </div>

                <fieldset className="bg-navy2/90 border border-gold/20 rounded-lg p-5 sm:p-6 space-y-5 shadow-xl">
                  <legend className="sr-only">{t("admin.settings.deliveryRulesSrOnly")}</legend>

                  <p className="text-xs text-muted font-light leading-relaxed">
                    {t("admin.settings.deliveryAuthoritativePrefix")}{" "}
                    <code className="text-gold">site_settings</code> {t("admin.settings.deliveryAuthoritativeMiddle")}
                    <code className="text-gold">shipping_config</code>
                    {t("admin.settings.deliveryAuthoritativeSuffix")}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <TextField
                      id="delivery-free-threshold"
                      label={t("admin.settings.freeDeliveryAboveField")}
                      required
                      type="number"
                      mono
                      value={draft.freeThreshold}
                      hint={t("admin.settings.freeDeliveryAboveHint")}
                      onChange={(value) => {
                        setDraft((prev) => ({ ...prev, freeThreshold: value }));
                        setDeliveryStatus({ kind: "idle" });
                      }}
                    />
                    <TextField
                      id="delivery-standard-cost"
                      label={t("admin.settings.standardDeliveryField")}
                      required
                      type="number"
                      mono
                      value={draft.standardCost}
                      hint={t("admin.settings.standardDeliveryHint")}
                      onChange={(value) => {
                        setDraft((prev) => ({ ...prev, standardCost: value }));
                        setDeliveryStatus({ kind: "idle" });
                      }}
                    />
                    <TextField
                      id="delivery-estimated-days"
                      label={t("admin.settings.estimatedDeliveryTime")}
                      required
                      maxLength={SHIPPING_DRAFT_LIMIT}
                      value={draft.estimatedDays}
                      placeholder={t("admin.settings.estimatedDaysPlaceholder")}
                      hint={t("admin.settings.estimatedDeliveryHint")}
                      warning={secretWarning(t, draft.estimatedDays)}
                      onChange={(value) => {
                        setDraft((prev) => ({ ...prev, estimatedDays: value }));
                        setDeliveryStatus({ kind: "idle" });
                      }}
                    />
                  </div>

                  <p className="text-[11px] text-muted font-light leading-relaxed">
                    <span className="text-gold font-semibold uppercase tracking-wider text-[10px]">{t("admin.settings.previewLabel")} · </span>
                    {deliveryPreview}
                  </p>

                  <ProblemList heading={t("admin.settings.deliveryProblemHeading")} problems={deliveryProblems} />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-gold/15 pt-4">
                    <SaveStatus
                      status={deliveryStatus}
                      dirty={deliveryDirty}
                      loadingLabel={t("admin.settings.savingDeliveryRules")}
                      savedLabel={t("admin.settings.deliveryPricingSavedLabel")}
                      retryLabel={t("admin.settings.retrySave")}
                      onRetry={() => void saveDeliveryConfig()}
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setDraft(draftFromShipping(DEFAULT_SHIPPING_CONFIG));
                          setDeliveryProblems([]);
                          setDeliveryStatus({ kind: "idle" });
                        }}
                        className="px-4 py-2 rounded border border-gold/25 text-[10px] font-mono uppercase tracking-[1.5px] text-gold hover:text-ivory hover:border-gold transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                      >
                        {t("admin.settings.restoreDefaults")}
                      </button>
                      <button
                        type="button"
                        onClick={() => void saveDeliveryConfig()}
                        disabled={deliveryStatus.kind === "saving"}
                        className="px-5 py-2 bg-gold hover:bg-goldLight text-navy font-bold rounded text-xs font-sans uppercase tracking-wider flex items-center gap-1.5 gap-2 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                      >
                        {deliveryStatus.kind === "saving" ? (
                          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        <span>{t("admin.settings.saveDeliveryRules")}</span>
                      </button>
                    </div>
                  </div>
                </fieldset>
              </section>
            </>
          )}
        </div>
      )}
    </div>
  );
};
