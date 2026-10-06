import React, { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { submitPaymentProofRpc } from "../services/checkoutOps";
import type { Order, OrderStatus, PaymentMethod, PaymentStatus } from "../admin/context/AdminDataContext";
import {
  cancelSelfOrderInDB,
  fetchCustomerOrdersFromDB,
  type CustomerOrderView,
} from "../services/customerOrders";
import { saveCustomerOrderNotes } from "../services/tracking";
import AddressBook from "../components/AddressBook";
import AccountRewards from "../components/AccountRewards";
import CommunicationPreferences from "../components/CommunicationPreferences";
import {
  Package,
  LogOut,
  ShieldCheck,
  Truck,
  Check,
  Clock,
  Upload,
  Image as ImageIcon,
  X,
  ExternalLink,
  Smartphone,
  Banknote,
  Building2,
  AlertTriangle,
  CreditCard,
} from "lucide-react";
import { useI18n } from "../i18n/I18nProvider";
import { useCurrency } from "../context/CurrencyContext";

// Standard Stepper Order Pipeline
// The `status` values are the persisted database strings the stepper is keyed on; only the
// label keys travel to the shopper's language.
const STEPPER_STAGES: { status: OrderStatus; labelKey: string; descKey: string }[] = [
  { status: "Pending", labelKey: "account.stageOrderPlaced", descKey: "account.stageOrderPlacedDesc" },
  { status: "Confirmed", labelKey: "account.stagePaymentConfirmed", descKey: "account.stagePaymentConfirmedDesc" },
  { status: "Processing", labelKey: "account.stageAtelierHandcrafting", descKey: "account.stageAtelierHandcraftingDesc" },
  { status: "Shipped", labelKey: "status.dispatched", descKey: "account.stageDispatchedDesc" },
  { status: "Out for Delivery", labelKey: "status.outfordelivery", descKey: "account.stageOutForDeliveryDesc" },
  { status: "Delivered", labelKey: "status.delivered", descKey: "account.stageDeliveredDesc" },
];

function getStageIndex(status: OrderStatus): number {
  switch (status) {
    case "Pending":
      return 0;
    case "Confirmed":
      return 1;
    case "Processing":
      return 2;
    case "Shipped":
      return 3;
    case "Out for Delivery":
      return 4;
    case "Delivered":
      return 5;
    default:
      return 0;
  }
}

// Payment Method Icon & Color Helper
// The case values are the stored payment method ids; only the badge label is translated.
function getPaymentMethodBadge(method: PaymentMethod | string) {
  switch (method) {
    case "JazzCash":
      return { labelKey: "account.jazzCashWallet", icon: Smartphone, color: "text-rose-400 border-rose-500/30 bg-rose-950/30" };
    case "Raast":
      return { labelKey: "account.raastInstantId", icon: Banknote, color: "text-emerald-400 border-emerald-500/30 bg-emerald-950/30" };
    case "Bank Transfer":
      return { labelKey: "account.bankWireTransfer", icon: Building2, color: "text-amber-400 border-amber-500/30 bg-amber-950/30" };
    case "PayFast":
    case "payfast":
      return { labelKey: "account.payfastCardGateway", icon: CreditCard, color: "text-sky-400 border-sky-500/30 bg-sky-950/30" };
    default:
      return { labelKey: "account.cashOnDelivery", icon: Truck, color: "text-gold border-gold/30 bg-gold/10" };
  }
}

// Payment Status Badge Helper
function getPaymentStatusBadge(status: PaymentStatus | string) {
  switch (status) {
    case "Paid":
    case "Verified":
      return { labelKey: "status.paidandverified", bg: "bg-emerald-950/60 text-emerald-300 border-emerald-800/40" };
    case "Verification Pending":
      return { labelKey: "status.verificationpending", bg: "bg-amber-950/60 text-amber-300 border-amber-800/40" };
    case "Failed":
    case "Rejected":
      return { labelKey: "status.paymentfailedrejected", bg: "bg-rose-950/60 text-rose-300 border-rose-800/40" };
    case "Refunded":
      return { labelKey: "status.refunded", bg: "bg-sky-950/60 text-sky-300 border-sky-800/40" };
    default:
      return { labelKey: "status.paymentpending", bg: "bg-navy/80 text-muted border-gold/20" };
  }
}

// Payment proof files are uploaded to the private 'payment-proofs' bucket and
// then attached to the order through the submit_payment_proof RPC — the same
// path Checkout.tsx uses. Customers have no UPDATE policy on payments, so a
// direct table write here would be dropped silently by RLS while the UI still
// reported success.
const PROOF_BUCKET = "payment-proofs";
const PROOF_MAX_BYTES = 10 * 1024 * 1024;
const PROOF_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const REVIEWED_PAYMENT_STATUSES: PaymentStatus[] = ["Paid", "Verified", "Refunded", "Rejected"];

const proofExtension = (type: string) =>
  type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";

// submit_payment_proof rejects any evidence path outside ^proofs/[A-Za-z0-9._/-]+$,
// so the uploaded name is reduced to that character set before it is stored.
const sanitizeProofFileName = (value: string, ext: string): string => {
  const stem = value
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/\.{2,}/g, ".")
    .replace(/-{2,}/g, "-")
    .replace(/^[.-]+/, "")
    .replace(/[.-]+$/, "")
    .slice(0, 48);
  return `${stem || "receipt"}.${ext}`;
};

// Payment Proof Upload Card Component
const PaymentProofUploadSection: React.FC<{ order: Order; onSubmitted: () => void }> = ({
  order,
  onSubmitted,
}) => {
  const { t } = useI18n();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [storedProofUrl, setStoredProofUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isManualMethod = ["JazzCash", "Raast", "Bank Transfer"].includes(order.paymentMethod);
  const isReviewed = REVIEWED_PAYMENT_STATUSES.includes(order.paymentStatus);
  const storedPath = order.paymentProofUrl || "";
  const storedPathIsDirectUrl = /^(https?:|data:)/.test(storedPath);
  // Rows created by the RPC store a bucket-relative path; the bucket is private,
  // so it has to be exchanged for a signed URL before it can be displayed.
  const proofImage = localPreviewUrl || (storedPathIsDirectUrl ? storedPath : storedProofUrl);

  useEffect(() => {
    if (!storedPath || storedPathIsDirectUrl || !isSupabaseConfigured()) return;
    let cancelled = false;
    supabase.storage
      .from(PROOF_BUCKET)
      .createSignedUrl(storedPath, 3600)
      .then(({ data, error }) => {
        if (!cancelled) setStoredProofUrl(error ? null : data?.signedUrl || null);
      })
      .catch(() => {
        if (!cancelled) setStoredProofUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [storedPath, storedPathIsDirectUrl]);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  if (!isManualMethod || isReviewed) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    // Allow the same file to be picked again after a remove or a submit.
    e.currentTarget.value = "";
    if (!file) return;

    // Validate image format
    if (!PROOF_IMAGE_TYPES.includes(file.type)) {
      setErrorMsg(t("validation.proofImageType"));
      return;
    }

    // Validate size (max 10MB)
    if (file.size > PROOF_MAX_BYTES) {
      setErrorMsg(t("validation.proofImageSize"));
      return;
    }

    setSelectedFile(file);
    setLocalPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setLocalPreviewUrl(null);
    setErrorMsg(null);
  };

  const handleSubmitProof = async () => {
    if (!selectedFile) {
      setErrorMsg(t("validation.proofSelectFirst"));
      return;
    }
    if (!isSupabaseConfigured()) {
      setErrorMsg(t("account.proofUnavailable"));
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const fileName = sanitizeProofFileName(selectedFile.name, proofExtension(selectedFile.type));

    try {
      // The object is namespaced by the signed-in uid so the storage policy
      // (auth.uid() = owner) keeps the screenshot private to this customer.
      const { data: userData } = await supabase.auth.getUser();
      const authorId = userData.user?.id;
      if (!authorId) {
        setErrorMsg(t("account.proofSessionExpired"));
        return;
      }

      const proofPath = `proofs/${authorId}/${Date.now()}-${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from(PROOF_BUCKET)
        .upload(proofPath, selectedFile, { upsert: false, contentType: selectedFile.type });

      if (uploadError) {
        console.error("Payment screenshot upload failed:", uploadError.message);
        setErrorMsg(t("account.proofUploadFailed"));
        return;
      }

      const submitted = await submitPaymentProofRpc(order.id, {
        proofPath,
        // Stored on the payment record for the atelier: kept in English on purpose.
        note: `Payment receipt uploaded: ${fileName}`,
      });

      if (!submitted.success) {
        console.error("Payment proof could not be attached:", submitted.error);
        setErrorMsg(t("account.proofAttachFailed"));
        return;
      }

      setSelectedFile(null);
      setLocalPreviewUrl(null);
      setSuccessMsg(t("account.proofSubmitted"));
      onSubmitted();
    } catch (err) {
      console.error("Payment proof submission failed:", err);
      setErrorMsg(t("account.proofSubmitFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 p-4 rounded-lg bg-navy border border-gold/25 space-y-3 font-sans text-xs">
      <div className="flex items-center justify-between border-b border-gold/15 pb-2">
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-gold" />
          <span className="font-serif font-bold text-sm text-ivory">
            {t("account.proofHeading")}
          </span>
        </div>
        <span className="text-[10px] font-mono text-gold uppercase tracking-wider">
          {t("account.paymentMethodTag", { method: order.paymentMethod })}
        </span>
      </div>

      <p className="text-muted text-xs leading-relaxed font-light">
        {t("account.proofReviewNote")}
      </p>

      {/* Success Banner */}
      {(successMsg || order.paymentStatus === "Verification Pending") && (
        <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-lg text-amber-200 text-xs flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            {successMsg || t("account.proofSubmitted")}
          </span>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-lg text-rose-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Image Preview or Drop Area */}
      {proofImage ? (
        <div className="relative rounded-lg border border-gold/30 bg-navy2 p-3 flex items-center gap-4">
          <div className="w-16 h-16 rounded border border-gold/20 overflow-hidden bg-black shrink-0 relative group">
            <img src={proofImage} alt={t("account.proofImageAlt")} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-ivory font-medium text-xs truncate">
              {selectedFile ? selectedFile.name : t("account.proofAttached")}
            </p>
            <p className="text-[10px] text-gold font-mono uppercase">
              {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : t("account.uploadedReceipt")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedFile ? (
              <>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1.5 rounded bg-navy text-muted hover:text-rose-400 transition-colors border border-gold/20"
                  title={t("account.removeProofTitle")}
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitProof}
                  className="px-3 py-1.5 bg-gold hover:bg-goldLight text-navy font-bold text-xs uppercase tracking-wider rounded transition-colors shadow flex items-center gap-1"
                >
                  {isSubmitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-navy border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{t("account.submitProof")}</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <label
                className="px-3 py-1.5 border border-gold/30 hover:border-gold text-ivory font-bold text-[10px] uppercase tracking-wider rounded cursor-pointer transition-colors"
                title={t("account.replaceProofTitle")}
              >
                {t("account.replaceProof")}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center p-5 rounded-lg border-2 border-dashed border-gold/30 bg-navy2/60 hover:bg-navy2 hover:border-gold/60 transition-all cursor-pointer text-center">
          <ImageIcon className="w-8 h-8 text-gold/60 mb-2" />
          <span className="text-xs text-ivory font-medium">{t("account.proofDropzoneLabel")}</span>
          <span className="text-[10px] text-muted font-mono mt-1">{t("account.proofFormatsHint")}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
};

const OrderNotesAndActions: React.FC<{
  order: CustomerOrderView;
  busy: boolean;
  onSaveNotes: (value: string) => void;
  onCancel: () => void;
}> = ({ order, busy, onSaveNotes, onCancel }) => {
  const { t } = useI18n();
  const [notes, setNotes] = useState(order.customerNotes || "");
  const [editing, setEditing] = useState(false);

  const notesEditable = order.canCancel;
  const dirty = notes !== (order.customerNotes || "");

  return (
    <div className="pt-2 space-y-3 border-t border-gold/15">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-[11px] text-muted font-light">
          <span className="text-[10px] font-mono uppercase text-gold font-semibold block">{t("account.deliveryNotesHeading")}</span>
          {order.customerNotes && !editing ? (
            <p className="text-ivory mt-1 leading-relaxed">{order.customerNotes}</p>
          ) : notesEditable ? (
            <p className="mt-1">{t("account.notesEditableHint")}</p>
          ) : (
            <p className="mt-1">{t("account.notesLockedHint")}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to={`/track-order?id=${encodeURIComponent(order.trackingNumber || order.orderNumber)}`}
            className="px-4 py-2 border border-gold/30 text-ivory hover:border-gold rounded text-[11px] uppercase font-bold tracking-wider transition-colors"
          >
            {t("account.track")}
          </Link>
          {notesEditable && (
            <button
              type="button"
              disabled={busy || (!editing && !dirty)}
              onClick={() => (editing ? onSaveNotes(notes) : setEditing(true))}
              className="px-4 py-2 bg-gold hover:bg-goldLight disabled:opacity-40 disabled:hover:bg-gold text-navy rounded text-[11px] uppercase font-bold tracking-wider transition-colors"
            >
              {editing ? t("account.saveNote") : t("account.addNote")}
            </button>
          )}
          {order.canCancel && (
            <button
              type="button"
              disabled={busy}
              onClick={onCancel}
              className="px-4 py-2 border border-rose-500/40 text-rose-300 hover:bg-rose-950/40 disabled:opacity-40 rounded text-[11px] uppercase font-bold tracking-wider transition-colors"
            >
              {busy ? t("account.working") : t("account.cancelOrder")}
            </button>
          )}
        </div>
      </div>

      {editing && (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={500}
          aria-label={t("account.notesAriaLabel")}
          placeholder={t("account.notesPlaceholder")}
          className="w-full bg-navy border border-gold/30 rounded-lg px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
        />
      )}
    </div>
  );
};

export default function Account() {
  const { t } = useI18n();
  const { format } = useCurrency();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAddressesView = location.pathname.endsWith("/addresses");
  const isRewardsView = location.pathname.endsWith("/rewards");
  const [clientOrders, setClientOrders] = useState<CustomerOrderView[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    setOrdersLoading(true);
    setOrdersError(null);
    fetchCustomerOrdersFromDB()
      .then((rows) => {
        if (mounted) setClientOrders(rows);
      })
      .catch((e: any) => {
        if (mounted) setOrdersError(e?.message || t("account.ordersLoadError"));
      })
      .finally(() => {
        if (mounted) setOrdersLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [reloadToken, user?.id]);

  if (!user) {
    return <Navigate to="/login?next=/account" replace />;
  }

  const customerName = user.fullName || t("account.valuedPatron");

  const refreshOrders = () => setReloadToken((t) => t + 1);

  const handleSelfCancel = async (order: CustomerOrderView) => {
    const reason = window.prompt(t("account.cancelPrompt", { number: order.orderNumber }), "");
    if (reason === null) return;
    setBusyOrderId(order.id);
    setActionMessage(null);
    const res = await cancelSelfOrderInDB(order.id, reason || undefined);
    setBusyOrderId(null);
    if (res.success) {
      setActionMessage({
        tone: "ok",
        text: t("account.orderCancelled", { number: order.orderNumber }),
      });
      refreshOrders();
    } else {
      setActionMessage({ tone: "err", text: res.error || t("account.cancelFailed") });
    }
  };

  const handleSaveNotes = async (order: CustomerOrderView, value: string) => {
    setBusyOrderId(order.id);
    const res = await saveCustomerOrderNotes(order.id, value);
    setBusyOrderId(null);
    setActionMessage(
      res.success
        ? { tone: "ok", text: t("account.noteSaved") }
        : { tone: "err", text: res.error || t("account.noteSaveFailed") }
    );
    if (res.success) refreshOrders();
  };

  return (
    <div className="pt-28 pb-20 bg-navy min-h-screen text-ivory select-none font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Luxury Welcome Hero Card */}
        <div className="relative overflow-hidden bg-navy2/90 border border-gold/30 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          <div className="absolute top-0 end-0 w-80 h-80 bg-gold/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-gold/15 border-2 border-gold flex items-center justify-center font-serif text-gold font-bold text-3xl shadow-lg shrink-0">
                {customerName.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-[2.5px] text-gold font-bold bg-gold/10 px-2 py-0.5 rounded border border-gold/30">
                    {t("account.privilegedMember")}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ivory tracking-wide">
                  {t("account.welcomeBack", { name: customerName })}
                </h1>
                <p className="text-xs text-muted font-mono font-light">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {user.role !== "customer" && (
                <button
                  onClick={() => navigate("/admin/dashboard")}
                  className="px-4 py-2.5 bg-gold hover:bg-goldLight text-navy font-bold rounded-lg text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t("account.adminWorkspace")}</span>
                </button>
              )}
              <button
                onClick={logout}
                className="px-4 py-2.5 border border-rose-500/30 text-rose-300 hover:bg-rose-950/40 rounded-lg text-xs uppercase tracking-wider flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>{t("nav.signOut")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Account sections */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wider font-sans">
          <Link
            to="/account/orders"
            className={`px-3.5 py-2.5 rounded-lg border transition-colors min-h-11 ${
              isAddressesView
                ? "border-gold/25 text-muted hover:text-ivory"
                : "border-gold/60 text-navy bg-gold font-semibold"
            }`}
          >
            {t("account.ordersTab")}
          </Link>
          <Link
            to="/account/addresses"
            className={`px-3.5 py-2.5 rounded-lg border transition-colors min-h-11 ${
              isAddressesView
                ? "border-gold/60 text-navy bg-gold font-semibold"
                : "border-gold/25 text-muted hover:text-ivory"
            }`}
          >
            {t("account.addressesTab")}
          </Link>
          <Link
            to="/account/rewards"
            className={`px-3.5 py-2.5 rounded-lg border transition-colors min-h-11 ${
              location.pathname.endsWith("/rewards")
                ? "border-gold/60 text-navy bg-gold font-semibold"
                : "border-gold/25 text-muted hover:text-ivory"
            }`}
          >
            {t("account.rewardsTab")}
          </Link>
        </div>

        {isAddressesView ? (
          <AddressBook />
        ) : isRewardsView ? (
          <AccountRewards />
        ) : (
        <>
        {/* Customer Fragrance Order Portal */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-gold/20 pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
                {t("account.ordersEyebrow")}
              </span>
              <h2 className="text-2xl font-serif font-bold text-ivory mt-0.5">
                {t("account.ordersTitle", { count: clientOrders.length })}
              </h2>
            </div>
            <Link
              to="/collections"
              className="hidden sm:inline-flex items-center gap-1 text-xs text-gold hover:text-goldLight font-semibold uppercase tracking-wider"
            >
              <span>{t("account.browseCatalog")}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {actionMessage && (
            <div
              role="status"
              aria-live="polite"
              className={`px-4 py-3 rounded-lg border text-xs font-sans ${
                actionMessage.tone === "ok"
                  ? "bg-emerald-950/40 border-emerald-700/50 text-emerald-200"
                  : "bg-rose-950/40 border-rose-600/50 text-rose-200"
              }`}
            >
              {actionMessage.text}
            </div>
          )}

          {/* Loading / Error / Empty states */}
          {ordersLoading ? (
            <div className="space-y-4" role="status" aria-live="polite">
              <span className="sr-only">{t("account.loadingOrders")}</span>
              {[0, 1].map((i) => (
                <div key={i} className="bg-navy2/70 border border-gold/15 rounded-2xl p-6 animate-pulse space-y-4">
                  <div className="h-4 w-40 bg-navy/80 rounded" />
                  <div className="h-3 w-64 bg-navy/70 rounded" />
                  <div className="h-20 w-full bg-navy/60 rounded" />
                </div>
              ))}
            </div>
          ) : ordersError ? (
            <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-8 text-center space-y-4">
              <p className="text-sm font-serif text-ivory">{t("account.ordersLoadError")}</p>
              <p className="text-xs text-rose-200/80 font-light">{ordersError}</p>
              <button
                onClick={refreshOrders}
                className="px-5 py-2.5 bg-gold hover:bg-goldLight text-navy font-bold rounded text-xs uppercase tracking-wider transition-colors"
              >
                {t("account.tryAgain")}
              </button>
            </div>
          ) : clientOrders.length === 0 ? (
            <div className="bg-navy2/80 border border-gold/20 rounded-2xl p-12 text-center space-y-4 max-w-xl mx-auto shadow-xl">
              <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 text-gold mx-auto flex items-center justify-center">
                <Package className="w-8 h-8 text-gold" />
              </div>
              <h3 className="font-serif text-xl text-ivory font-bold">{t("account.noOrdersTitle")}</h3>
              <p className="text-xs text-muted leading-relaxed font-light">
                {t("account.noOrdersBody")}
              </p>
              <div className="pt-2">
                <Link
                  to="/collections"
                  className="inline-flex items-center px-6 py-3 bg-gold hover:bg-goldLight text-navy font-bold rounded-lg text-xs uppercase tracking-wider shadow-lg transition-colors"
                >
                  {t("account.exploreFragrances")}
                </Link>
              </div>
            </div>
          ) : (
            /* Order List Cards */
            <div className="space-y-6">
              {clientOrders.map((order) => {
                const currentStageIdx = getStageIndex(order.status);
                const isSpecialState = order.status === "Cancelled" || order.status === "Returned";
                const pmBadge = getPaymentMethodBadge(order.paymentMethod);
                const psBadge = getPaymentStatusBadge(order.paymentStatus);
                const refundedTotal = order.refundedTotal;
                const PMIcon = pmBadge.icon;
                const timeline = order.timeline || [];

                return (
                  <div
                    key={order.id}
                    className="bg-navy2/90 border border-gold/30 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-md"
                  >
                    {/* Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase text-gold tracking-widest font-semibold">
                            {t("account.refLabel")}
                          </span>
                          <span className="font-mono font-bold text-lg text-ivory">
                            {order.orderNumber}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted font-light mt-0.5">
                          {t("account.placedOn")} <span className="text-ivory font-medium">{order.createdAt}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Payment Method Badge */}
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold border ${pmBadge.color}`}>
                          <PMIcon className="w-3.5 h-3.5" />
                          <span>{t(pmBadge.labelKey)}</span>
                        </div>

                        {/* Payment Status Badge */}
                        <span className={`px-3 py-1 rounded text-xs font-semibold border ${psBadge.bg}`}>
                          {t(psBadge.labelKey)}
                        </span>

                        {refundedTotal > 0 && (
                          <span className="px-3 py-1 rounded text-xs font-mono border border-sky-800/40 bg-sky-950/40 text-sky-300">
                            {t("status.refunded")} {format(refundedTotal)}
                          </span>
                        )}

                        {/* Total Amount */}
                        <div className="text-end">
                          <span className="text-[10px] text-muted block uppercase font-mono">{t("common.total")}</span>
                          <span className="font-mono font-bold text-sm sm:text-base text-gold">
                            {format(order.total)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stepper Timeline for Normal Flow */}
                    {!isSpecialState ? (
                      <div className="space-y-3 pt-2">
                        <span className="text-[10px] font-mono uppercase tracking-[2px] text-gold font-semibold block">
                          {t("account.stepperHeading")}
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                          {STEPPER_STAGES.map((stage, idx) => {
                            const isDone = idx < currentStageIdx;
                            const isCurrent = idx === currentStageIdx;

                            return (
                              <div
                                key={stage.status}
                                className={`p-2.5 rounded-lg border transition-all text-start space-y-1 ${
                                  isCurrent
                                    ? "bg-navy border-gold shadow-lg ring-1 ring-gold/40"
                                    : isDone
                                    ? "bg-navy/80 border-gold/30 opacity-90"
                                    : "bg-navy/40 border-gold/10 opacity-50"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div
                                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                      isDone
                                        ? "bg-gold text-navy"
                                        : isCurrent
                                        ? "bg-gold/20 text-gold border border-gold"
                                        : "bg-navy border border-gold/20 text-muted"
                                    }`}
                                  >
                                    {isDone ? <Check className="w-3 h-3" /> : idx + 1}
                                  </div>
                                  {isCurrent && (
                                    <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                                  )}
                                </div>
                                <div>
                                  <p className={`text-xs font-serif font-bold ${isCurrent ? "text-gold" : isDone ? "text-ivory" : "text-muted"}`}>
                                    {t(stage.labelKey)}
                                  </p>
                                  <p className="text-[9px] text-muted font-sans line-clamp-1">
                                    {t(stage.descKey)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      /* Special State Banner (Cancelled / Returned) */
                      <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                        <div>
                          <p className="font-serif font-bold text-sm text-ivory">
                            {t("account.orderStatusPrefix")} {order.status}
                          </p>
                          <p className="text-xs text-rose-300/80 font-light">
                            {order.status === "Cancelled"
                              ? t("account.cancelledOrderBody")
                              : t("account.returnedOrderBody")}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Inline Product Item Breakdown */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-mono uppercase tracking-[2px] text-gold font-semibold block">
                        {t("account.itemsHeading")}
                      </span>
                      <div className="bg-navy/70 border border-gold/15 rounded-xl divide-y divide-gold/10 overflow-hidden">
                        {order.items?.map((item, i) => (
                          <div key={i} className="p-3.5 flex items-center justify-between gap-4 font-sans">
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-12 h-12 rounded border border-gold/20 bg-black overflow-hidden shrink-0 flex items-center justify-center">
                                {item.image?.startsWith("http") || item.image?.startsWith("/") ? (
                                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-6 h-6 text-gold/60" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-serif font-bold text-sm text-ivory truncate">
                                  {item.name}
                                </h4>
                                <div className="flex items-center gap-2 text-[11px] text-muted">
                                  <span className="font-mono text-gold">{item.size || "50ML"}</span>
                                  <span>•</span>
                                  <span>{t("account.quantityPrefix")} {item.quantity}</span>
                                  {item.sku && <span>• {t("account.skuLabel")} {item.sku}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="text-end shrink-0">
                              <span className="text-xs font-mono font-bold text-gold">
                                {format(item.price * item.quantity)}
                              </span>
                              <span className="text-[10px] text-muted block">
                                ({format(item.price)} {t("account.each")})
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping & Courier Tracking Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      {/* Shipping Address */}
                      <div className="p-4 rounded-xl bg-navy/60 border border-gold/15 space-y-1 text-xs">
                        <span className="text-[10px] font-mono uppercase text-gold font-semibold block">
                          {t("account.deliveryHeading")}
                        </span>
                        <p className="text-ivory font-medium">
                          {order.shippingAddress?.street || t("account.addressFallback")}
                        </p>
                        <p className="text-muted">
                          {[order.shippingAddress?.city, order.shippingAddress?.zip, order.shippingAddress?.country]
                            .filter(Boolean)
                            .join(", ") || "Pakistan"}
                        </p>
                        {order.estimatedDelivery && (
                          <p className="text-[11px] text-ivory pt-1">
                            {t("account.estimatedDelivery")}{" "}
                            <span className="font-mono text-gold">{String(order.estimatedDelivery).slice(0, 10)}</span>
                          </p>
                        )}
                      </div>

                      {/* Tracking Information */}
                      <div className="p-4 rounded-xl bg-navy/60 border border-gold/15 space-y-1 text-xs">
                        <span className="text-[10px] font-mono uppercase text-gold font-semibold block">
                          {t("account.courierHeading")}
                        </span>
                        {order.trackingNumber || order.courier ? (
                          <div className="space-y-1">
                            <p className="text-ivory font-medium flex items-center justify-between">
                              <span>{t("account.courierLabel")} {order.courier || t("account.toBeAdvised")}</span>
                              <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase">
                                {order.shipmentStatus || order.shippingStatus}
                              </span>
                            </p>
                            <p className="text-gold font-mono font-bold">
                              {t("account.trackingIdLabel")} {order.trackingNumber || t("account.awaitingIssue")}
                            </p>
                            {order.trackingUrl && (
                              <a
                                href={order.trackingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-[11px] text-ivory underline decoration-gold/50 underline-offset-2 hover:text-gold"
                              >
                                <span>{t("account.openCourierTracking")}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <p className="text-muted italic text-[11px] leading-relaxed">
                            {t("account.trackingPending")}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Order Timeline (real events, oldest first) */}
                    {timeline.length > 0 && (
                      <div className="space-y-3 pt-1">
                        <span className="text-[10px] font-mono uppercase tracking-[2px] text-gold font-semibold block">
                          {t("account.timelineHeading")}
                        </span>
                        <ol className="relative border-l border-gold/20 ms-1.5 space-y-4">
                          {[...timeline]
                            .slice()
                            .reverse()
                            .map((event, i) => (
                              <li key={`${event.date}-${i}`} className="ms-5">
                                <span
                                  className={`absolute -left-[7px] w-3.5 h-3.5 rounded-full border ${
                                    i === 0 ? "bg-gold border-gold" : "bg-navy border-gold/40"
                                  }`}
                                />
                                <p className="text-xs font-serif font-bold text-ivory">{event.status}</p>
                                {event.note && <p className="text-[11px] text-muted font-light leading-relaxed">{event.note}</p>}
                                <p className="text-[10px] text-muted/70 font-mono">{event.date}</p>
                              </li>
                            ))}
                        </ol>
                      </div>
                    )}

                    {order.refundRecords.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-mono uppercase tracking-[2px] text-gold font-semibold block">
                          {t("account.refundHeading")}
                        </span>
                        <ul className="space-y-1 text-[11px] text-muted font-mono">
                          {order.refundRecords.map((r) => (
                            <li key={`${r.reference || "refund"}-${r.date}`}>
                              {format(r.amount)} — {r.status}
                              {r.reference ? ` · ref ${r.reference}` : ""} · {r.date}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Customer notes + cancellation request */}
                    <OrderNotesAndActions
                      order={order}
                      busy={busyOrderId === order.id}
                      onSaveNotes={(value) => handleSaveNotes(order, value)}
                      onCancel={() => handleSelfCancel(order)}
                    />

                    {/* Payment Proof Upload Component (For manual payment methods) */}
                    <PaymentProofUploadSection order={order} onSubmitted={refreshOrders} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <CommunicationPreferences />
        </>
        )}
      </div>
    </div>
  );
}
