import React, { useState } from "react";
import { useAdminData, type ReviewItem } from "../context/AdminDataContext";
import { DataTable, type Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { ConfirmDialog } from "../components/Modal";
import { Star, CheckCircle, XCircle, Trash2, MessageSquare } from "lucide-react";

export const ReviewsPage: React.FC = () => {
  const { reviews, updateReviewStatus, deleteReview } = useAdminData();

  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredReviews = reviews.filter((r) => {
    if (statusFilter === "all") return true;
    return r.status === statusFilter;
  });

  const pendingCount = reviews.filter((r) => r.status === "Pending").length;
  const approvedCount = reviews.filter((r) => r.status === "Approved").length;

  const avgRating = (
    reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)
  ).toFixed(1);

  const renderStars = (rating: number) => (
    <div className="flex items-center space-x-0.5 text-gold">
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
      header: "Client & Product",
      accessor: (r) => (
        <div>
          <h4 className="font-serif font-bold text-sm text-ivory">{r.customerName}</h4>
          <span className="text-[10px] font-mono text-gold block">
            For: {r.productName}
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      header: "Rating & Title",
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
      header: "Review Testimonial",
      accessor: (r) => (
        <p className="text-xs text-muted font-light leading-relaxed max-w-sm line-clamp-2">
          "{r.review}"
        </p>
      ),
    },
    {
      header: "Date",
      accessor: (r) => <span className="text-xs text-muted font-mono">{r.date}</span>,
      sortable: true,
    },
    {
      header: "Status",
      accessor: (r) => <StatusBadge status={r.status} />,
      sortable: true,
    },
    {
      header: "Moderation Actions",
      accessor: (r) => (
        <div className="flex items-center justify-end space-x-1.5">
          {r.status !== "Approved" && (
            <button
              onClick={() => updateReviewStatus(r.id, "Approved")}
              className="p-1.5 rounded text-emerald-300 hover:bg-emerald-950/60 transition-colors"
              title="Approve review for frontend display"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          {r.status !== "Rejected" && (
            <button
              onClick={() => updateReviewStatus(r.id, "Rejected")}
              className="p-1.5 rounded text-amber-300 hover:bg-amber-950/60 transition-colors"
              title="Reject review"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setDeleteId(r.id)}
            className="p-1.5 rounded text-muted hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
            title="Delete review"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      className: "text-right",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
            CLIENT TESTIMONIALS & MODERATION
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
            Fragrance Reviews Moderation Queue
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-0.5">
            Only approved client reviews appear on the customer-facing e-commerce frontend.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-navy2/90 border border-gold/20 p-5 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-gold uppercase tracking-widest block">
              Average Client Rating
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-serif text-ivory font-bold">{avgRating}</span>
              <span className="text-xs text-gold">/ 5.0</span>
            </div>
          </div>
          <Star className="w-6 h-6 text-gold fill-gold" />
        </div>

        <div className="bg-navy2/90 border border-gold/20 p-5 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-gold uppercase tracking-widest block">
              Pending Approval Queue
            </span>
            <span className="text-2xl font-serif text-amber-300 font-bold block mt-1">
              {pendingCount} Reviews
            </span>
          </div>
          <MessageSquare className="w-6 h-6 text-amber-400" />
        </div>

        <div className="bg-navy2/90 border border-gold/20 p-5 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-gold uppercase tracking-widest block">
              Approved Live Reviews
            </span>
            <span className="text-2xl font-serif text-emerald-300 font-bold block mt-1">
              {approvedCount} Reviews
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
        searchPlaceholder="Search review title, text, customer..."
        emptyMessage="No reviews found"
        filterControls={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-navy border border-gold/20 rounded px-3 py-1.5 text-xs text-ivory focus:outline-none focus:border-gold"
          >
            <option value="all">All Moderation Statuses</option>
            <option value="Pending">Pending Moderation ({pendingCount})</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
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
        title="Delete Fragrance Review"
        message="Are you sure you want to delete this review from the moderation queue?"
        confirmText="Delete Review"
        isDanger={true}
      />
    </div>
  );
};
