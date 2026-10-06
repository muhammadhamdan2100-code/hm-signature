import React, { useState } from "react";
import { useAdminData, type Order } from "../context/AdminDataContext";
import { DataTable, type Column } from "../components/DataTable";
import { StatusBadge, useStatusLabel, usePaymentMethodLabel } from "../components/StatusBadge";
import { Eye } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useI18n } from "../../i18n/I18nProvider";

export const OrdersList: React.FC = () => {
  const { t } = useI18n();
  // Payment and order states are stored in English; the badge helper renders them in the
  // console language and leaves a status the dictionaries have never seen exactly as it arrived.
  const statusLabel = useStatusLabel();
  const methodLabel = usePaymentMethodLabel();
  const { orders } = useAdminData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialStatusFilter = searchParams.get("status") || "all";
  const [statusTab, setStatusTab] = useState<string>(initialStatusFilter);

  const filteredOrders = orders.filter((o) => {
    if (statusTab === "all") return true;
    return o.status === statusTab;
  });

  const columns: Column<Order>[] = [
    {
      header: t("admin.orders.orderId"),
      accessor: (o) => (
        <div>
          <span className="font-mono text-gold font-bold text-xs block">
            {o.orderNumber}
          </span>
          <span className="text-[10px] text-muted">{methodLabel(o.paymentMethod)}</span>
        </div>
      ),
      sortable: true,
    },
    {
      header: t("admin.shared.clientContact"),
      accessor: (o) => (
        <div>
          <h4 className="font-serif font-bold text-sm text-ivory">{o.customerName}</h4>
          <span className="text-[11px] text-muted font-sans block">{o.customerEmail}</span>
        </div>
      ),
      sortable: true,
    },
    {
      header: t("admin.orders.itemsCount"),
      accessor: (o) => (
        <div>
          <span className="text-xs text-ivory font-medium">
            {o.items.reduce((acc, i) => acc + i.quantity, 0)} {t("admin.orders.itemsLabel")}
          </span>
          <span className="text-[10px] text-muted block truncate max-w-[140px]">
            {o.items.map((i) => i.name).join(", ")}
          </span>
        </div>
      ),
    },
    {
      header: t("admin.orders.totalAmount"),
      accessor: (o) => (
        <div>
          <span className="text-xs font-mono font-bold text-gold block">
            Rs. {o.total.toLocaleString()}
          </span>
          {(o.destinationCountry || (o.currency && o.currency !== "PKR")) && (
            <span className="text-[10px] font-mono text-muted block">
              {o.currency || "PKR"}
              {o.destinationCountry ? ` · ${o.destinationCountry}` : ""}
            </span>
          )}
          {o.discount > 0 && (
            <span className="text-[10px] font-mono text-emerald-400 block">
              Saved Rs. {o.discount}
            </span>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      header: t("admin.shared.status"),
      accessor: (o) => (
        <div className="space-y-1">
          <StatusBadge status={o.status} />
          <span className="text-[9px] font-mono text-muted uppercase tracking-wider block">
            {t("admin.orders.payPrefix")} {statusLabel(o.paymentStatus)}
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      header: t("admin.orders.date"),
      accessor: (o) => <span className="text-xs text-muted font-mono">{o.createdAt}</span>,
      sortable: true,
    },
    {
      header: t("admin.orders.action"),
      accessor: (o) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => navigate(`/admin/orders/${o.id}`)}
            className="px-3 py-1.5 rounded bg-navy border border-gold/30 hover:border-gold text-gold hover:text-ivory text-xs font-sans transition-colors flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{t("admin.orders.manage")}</span>
          </button>
        </div>
      ),
      className: "text-end",
    },
  ];

  const STATUS_TABS = [
    { label: t("admin.orders.allOrders"), value: "all", count: orders.length },
    { label: t("admin.status.pending"), value: "Pending", count: orders.filter((o) => o.status === "Pending").length },
    { label: t("admin.status.confirmed"), value: "Confirmed", count: orders.filter((o) => o.status === "Confirmed").length },
    { label: t("admin.status.processing"), value: "Processing", count: orders.filter((o) => o.status === "Processing").length },
    { label: t("admin.status.shipped"), value: "Shipped", count: orders.filter((o) => o.status === "Shipped").length },
    { label: t("admin.status.delivered"), value: "Delivered", count: orders.filter((o) => o.status === "Delivered").length },
    { label: t("admin.status.cancelled"), value: "Cancelled", count: orders.filter((o) => o.status === "Cancelled").length },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
            {t("admin.ordersList.clientConciergeFulfilment")}
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
            {t("admin.ordersList.boutiqueOrdersDirectory")}
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-0.5">
            {t("admin.ordersList.trackOrderStatusDescription")}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-gold/15 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusTab(tab.value)}
            className={`px-4 py-2 text-xs font-sans whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
              statusTab === tab.value
                ? "border-gold text-gold font-semibold bg-navy2/50"
                : "border-transparent text-muted hover:text-ivory"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                statusTab === tab.value ? "bg-gold text-navy" : "bg-navy text-gold/80"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredOrders}
        keyExtractor={(o) => o.id}
        searchPlaceholder={t("admin.orders.searchOrderCustomerNameEmail")}
        emptyMessage={t("admin.orders.noOrdersFound")}
        emptySubtitle={t("admin.orders.noTransactionsMatchYourCurrent")}
      />
    </div>
  );
};
