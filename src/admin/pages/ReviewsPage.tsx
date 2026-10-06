import React, { useState } from "react";
import { useAdminData, type ReviewItem } from "../context/AdminDataContext";
import { DataTable, type Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { ConfirmDialog } from "../components/Modal";
import { Star, CheckCircle, XCircle, Trash2, MessageSquare } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";

export const ReviewsPage: React.FC = () => {
  const { t } = useI18n();
  const { reviews, updateReviewStatus, deleteReview } = useAdminData();

  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredReviews = reviews.filter((r) => {
    if (statusFilter === "all") return true;
    return r.status === statusFilter;
  });

  const pendingCount = reviews.filter((r) => r.status === "Pending").length;
  const approvedCount = reviews.filter((r) => r.status === "Approved").length;

  // Same definition the storefront uses: approved submissions only. A pending or
  // rejected review has not been published, so it must not move the published average.
  const approvedReviews = reviews.filter((r) => r.status === "Approved");
  const avgRating = approvedReviews.length
    ? (approvedReviews.reduce((acc, r) => acc + r.rating, 0) / approvedReviews.length).toFixed(1)
    : "—";

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5 text-gold">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${
            star <= rating ? "fill-gold text-gold" : "text-muted/30"
          }`}
        />
      ))}
    </div>
  );

  const columns: Column<ReviewItem>[] = [
    {
      header: t("admin.reviews.clientProduct"),
      accessor: (r) => (
        <div>
          <h4 className="font-serif font-bold text-sm text-ivory">{r.customerName}</h4>
          <span className="text-[10px] font-mono text-gold block">
            {t("admin.reviews.forProduct", { product: r.productName })}
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      header: t("admin.reviews.ratingTitle"),
      accessor: (r) => (
        <div className="space-y-1">
          {renderStars(r.rating)}
          <span className="font-sans font-semibold text-xs text-ivory block">
            {r.title}
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      header: t("admin.reviews.reviewTestimonial"),
      accessor: (r) => (
        <p className="text-xs text-muted font-light leading-relaxed max-w-sm line-clamp-2">
"{r.review}"
        </p>
      ),
    },
    {
      header: t("admin.orders.date"),
      accessor: (r) => <span className="text-xs text-muted font-mono">{r.date}</span>,
      sortable: true,
    },
    {
      header: t("admin.shared.status"),
      accessor: (r) => <StatusBadge status={r.status} />,
      sortable: true,
    },
    {
      header: t("admin.reviews.moderationActions"),
      accessor: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          {r.status !== "Approved" && (
            <button
              onClick={() => updateReviewStatus(r.id, "Approved")}
              className="p-1.5 rounded text-emerald-300 hover:bg-emerald-950/60 transition-colors"
              title={t("admin.reviews.approveReviewForFrontendDisplay")}
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          {r.status !== "Rejected" && (
            <button
              onClick={() => updateReviewStatus(r.id, "Rejected")}
              className="p-1.5 rounded text-amber-300 hover:bg-amber-950/60 transition-colors"
              title={t("admin.reviews.rejectReview")}
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setDeleteId(r.id)}
            className="p-1.5 rounded text-muted hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
            title={t("admin.reviews.deleteReview")}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      className: "text-end",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
            {t("admin.reviews.eyebrow")}
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
            {t("admin.reviews.pageTitle")}
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-0.5">
            {t("admin.reviews.intro")}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-navy2/90 border border-gold/20 p-5 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-gold uppercase tracking-widest block">
              {t("admin.reviews.averageClientRating")}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-serif text-ivory font-bold">{avgRating}</span>
              <span className="text-xs text-gold">/ 5.0</span>
            </div>
          </div>
          <Star className="w-6 h-6 text-gold fill-gold" />
        </div>

        <div className="bg-navy2/90 border border-gold/20 p-5 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-gold uppercase tracking-widest block">
              {t("admin.reviews.pendingApprovalQueue")}
            </span>
            <span className="text-2xl font-serif text-amber-300 font-bold block mt-1">
              {t("admin.reviews.reviewsCount", { count: pendingCount })}
            </span>
          </div>
          <MessageSquare className="w-6 h-6 text-amber-400" />
        </div>

        <div className="bg-navy2/90 border border-gold/20 p-5 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-gold uppercase tracking-widest block">
              {t("admin.reviews.approvedLiveReviews")}
            </span>
            <span className="text-2xl font-serif text-emerald-300 font-bold block mt-1">
              {t("admin.reviews.reviewsCount", { count: approvedCount })}
            </span>
          </div>
          <CheckCircle className="w-6 h-6 text-emerald-400" />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredReviews}
        keyExtractor={(r) => r.id}
        searchPlaceholder={t("admin.reviews.searchReviewTitleTextCustomer")}
        emptyMessage={t("admin.reviews.noReviewsFound")}
        filterControls={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-navy border border-gold/20 rounded px-3 py-1.5 text-xs text-ivory focus:outline-none focus:border-gold"
          >
            <option value="all">{t("admin.reviews.allModerationStatuses")}</option>
            <option value="Pending">{t("admin.reviews.pendingModerationCount", { count: pendingCount })}</option>
            <option value="Approved">{t("admin.status.approved")}</option>
            <option value="Rejected">{t("admin.status.rejected")}</option>
          </select>
        }
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteReview(deleteId);
        }}
        title={t("admin.reviews.deleteFragranceReview")}
        message={t("admin.reviews.deleteConfirmMessage")}
        confirmText={t("admin.reviews.deleteReview2")}
        isDanger={true}
      />
    </div>
  );
};
