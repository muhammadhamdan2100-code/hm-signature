import React from "react";
import type { OrderStatus, OrderTimelineItem } from "../context/AdminDataContext";
import { CheckCircle, Clock, Truck, Package, ShieldCheck, XCircle } from "lucide-react";
import { useStatusLabel } from "./StatusBadge";
import { useI18n } from "../../i18n/I18nProvider";

interface OrderStatusTimelineProps {
  timeline: OrderTimelineItem[];
  currentStatus: OrderStatus;
  onUpdateStatus?: (newStatus: OrderStatus) => void;
}

const ALL_STEPS: OrderStatus[] = [
"Pending",
"Confirmed",
"Processing",
"Shipped",
"Out for Delivery",
"Delivered",
];

export const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({
  timeline,
  currentStatus,
  onUpdateStatus,
}) => {
  const { t } = useI18n();
  const statusLabel = useStatusLabel();
  const isCancelled = currentStatus === "Cancelled" || currentStatus === "Returned";
  const isRefunded = currentStatus === "Returned";

  const getStepIcon = (status: OrderStatus) => {
    switch (status) {
      case "Pending":
        return Clock;
      case "Confirmed":
        return ShieldCheck;
      case "Processing":
        return Package;
      case "Shipped":
        return Truck;
      case "Delivered":
        return CheckCircle;
      default:
        return XCircle;
    }
  };

  const getStepIndex = (st: OrderStatus) => ALL_STEPS.indexOf(st);
  const currentIndex = getStepIndex(currentStatus);

  return (
    <div className="bg-navy2/60 border border-gold/20 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-gold/15 pb-4">
        <div>
          <h4 className="font-serif text-base font-bold text-ivory tracking-wide">
            {t("admin.orderStatusTimeline.fulfilmentPipeline")}
          </h4>
          <p className="text-xs text-muted">
            {t("admin.orderStatusTimeline.lifecycleHistory")}
          </p>
        </div>
        {onUpdateStatus && !isCancelled && !isRefunded && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gold uppercase tracking-wider font-sans">
              {t("admin.orderStatusTimeline.updateStatus")}
            </span>
            <select
              value={currentStatus}
              onChange={(e) => onUpdateStatus(e.target.value as OrderStatus)}
              className="bg-navy border border-gold/30 text-ivory text-xs rounded px-3 py-1.5 focus:outline-none focus:border-gold"
            >
              {ALL_STEPS.map((st) => (
                <option key={st} value={st}>
                  {statusLabel(st)}
                </option>
              ))}
              <option value="Cancelled">{statusLabel("Cancelled")}</option>
            </select>
          </div>
        )}
      </div>

      {/* Progress Steps */}
      {isCancelled || isRefunded ? (
        <div className="p-4 rounded bg-rose-950/30 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-3">
          <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <p className="font-semibold uppercase tracking-wider">
              {t("admin.orderStatusTimeline.orderStatus", { status: statusLabel(currentStatus) })}
            </p>
            <p className="text-[11px] text-rose-300/80">
              {t("admin.orderStatusTimeline.markedAs", {
                status: statusLabel(currentStatus).toLowerCase(),
              })}
            </p>
          </div>
        </div>
      ) : (
        <div className="relative py-2">
          <div className="grid grid-cols-5 gap-2 relative z-10">
            {ALL_STEPS.map((step, idx) => {
              const Icon = getStepIcon(step);
              const isPassed = idx <= currentIndex;
              const isCurrent = idx === currentIndex;
              const timelineMatch = timeline.find((t) => t.status === step);

              return (
                <div
                  key={step}
                  className="flex flex-col items-center text-center group"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border ${
                      isCurrent
                        ? "bg-gold text-navy border-gold shadow-[0_0_15px_rgba(200,169,107,0.4)] scale-110"
                        : isPassed
                        ? "bg-navy text-gold border-gold/60"
                        : "bg-navy/60 text-muted/40 border-gold/10"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`mt-3 text-xs font-sans uppercase tracking-wider font-medium ${
                      isCurrent ? "text-gold" : isPassed ? "text-ivory" : "text-muted/50"
                    }`}
                  >
                    {statusLabel(step)}
                  </span>
                  {timelineMatch && (
                    <span className="text-[10px] text-muted mt-1 font-mono">
                      {timelineMatch.date.split(" ")[1] || timelineMatch.date}
                    </span>
                  )}
                  {timelineMatch?.note && (
                    <span className="text-[10px] text-gold/80 italic mt-0.5 line-clamp-1 max-w-[100px]">
                      {timelineMatch.note}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
