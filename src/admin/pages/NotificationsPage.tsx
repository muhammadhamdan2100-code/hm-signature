import React, { useCallback, useEffect, useState } from "react";
import { useAdminData, type EmailTemplate } from "../context/AdminDataContext";
import { Modal } from "../components/Modal";
import {
  fetchEmailQueueFromDB,
  fetchEmailQueueStatsFromDB,
  runEmailWorkerNow,
  type EmailQueueRow,
} from "../../services/adminContent";
import { fetchServiceCapabilities } from "../../services/emailService";
import { Bell, Mail, Edit, CheckCircle, AlertCircle, Sparkles, Send, RefreshCw } from "lucide-react";

export const NotificationsPage: React.FC = () => {
  const { notifications, emailTemplates, updateEmailTemplate, markNotificationRead } =
    useAdminData();

  const [queue, setQueue] = useState<EmailQueueRow[]>([]);
  const [queueCounts, setQueueCounts] = useState<{ status: string; count: number }[]>([]);
  const [emailReady, setEmailReady] = useState<boolean | null>(null);
  const [queueBusy, setQueueBusy] = useState(false);
  const [queueNote, setQueueNote] = useState("");

  const loadQueue = useCallback(async () => {
    const [rows, counts, capabilities] = await Promise.all([
      fetchEmailQueueFromDB(12),
      fetchEmailQueueStatsFromDB(),
      fetchServiceCapabilities(),
    ]);
    setQueue(rows);
    setQueueCounts(counts);
    setEmailReady(capabilities.email);
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const handleDrain = async () => {
    setQueueBusy(true);
    setQueueNote("");
    const result = await runEmailWorkerNow();
    if (!result) {
      setQueueNote("Email delivery is not configured on this deployment, so nothing was sent.");
    } else {
      // A browser session can only claim rows addressed to the signed-in account;
      // staff copies and scheduled reminders stay queued for the server worker.
      setQueueNote(
        `Sent ${result.sent}, failed ${result.failed}, skipped ${result.skipped} — from this account's own queued messages. Staff copies wait for the scheduler.`
      );
    }
    await loadQueue();
    setQueueBusy(false);
  };

  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [active, setActive] = useState(true);

  const handleOpenEdit = (t: EmailTemplate) => {
    setEditingTemplate(t);
    setSubject(t.subject);
    setBody(t.body);
    setActive(t.active);
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;
    updateEmailTemplate(editingTemplate.id, { subject, body, active });
    setEditingTemplate(null);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
            SYSTEM NOTIFICATIONS & MESSAGE DRAFTS
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
            Notifications & Message Drafts
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-0.5">
            Manage system activity logs and message drafts. Customer email is not sent from these.
          </p>
        </div>
      </div>

      {/* System Notifications Log */}
      <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4 shadow-xl">
        <div className="flex items-center space-x-2 border-b border-gold/15 pb-3">
          <Bell className="w-4 h-4 text-gold" />
          <h3 className="font-serif text-base font-bold text-ivory">
            Telemetry & Order System Activity Log
          </h3>
        </div>

        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markNotificationRead(n.id)}
              className={`p-4 rounded border transition-colors cursor-pointer flex items-start space-x-3 ${
                !n.read
                  ? "bg-navy2 border-gold/40 text-ivory"
                  : "bg-navy/50 border-gold/10 text-muted"
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {n.type === "Order" && <CheckCircle className="w-4 h-4 text-gold" />}
                {n.type === "Stock" && <AlertCircle className="w-4 h-4 text-amber-400" />}
                {n.type === "Customer" && <Sparkles className="w-4 h-4 text-emerald-400" />}
              </div>
              <div className="flex-1 text-xs font-sans space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ivory">{n.title}</span>
                  <span className="text-[10px] text-muted font-mono">{n.date}</span>
                </div>
                <p className="text-muted leading-relaxed">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transactional message queue */}
      <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gold/15 pb-3">
          <div className="flex items-center space-x-2">
            <Send className="w-4 h-4 text-gold" />
            <h3 className="font-serif text-base font-bold text-ivory">
              Outbound Message Queue
            </h3>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadQueue}
              className="px-3 py-1.5 rounded text-xs font-sans text-muted hover:text-gold border border-gold/20 hover:border-gold/40 flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleDrain}
              disabled={queueBusy || emailReady === false}
              className="px-3 py-1.5 rounded text-xs font-sans bg-gold hover:bg-goldLight text-navy font-bold uppercase tracking-wider disabled:opacity-40"
            >
              {queueBusy ? "SENDING…" : "Send queued now"}
            </button>
          </div>
        </div>

        <p className="text-[11px] text-muted font-sans leading-relaxed">
          {emailReady === null
            ? "Checking whether this deployment can deliver email…"
            : emailReady
              ? "Order, payment and refund events are queued by the database and delivered by the server worker. A browser session can only claim messages addressed to its own account; staff copies and time-based reminders wait for the scheduler."
              : "No email service is configured for this deployment, so queued messages stay recorded and nothing is sent. Delivery claims are never simulated."}
        </p>

        {queueCounts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {queueCounts.map((c) => (
              <span
                key={c.status}
                className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded border border-gold/20 bg-navy text-gold"
              >
                {c.status}: {c.count}
              </span>
            ))}
          </div>
        )}

        {queueNote && (
          <p className="text-[11px] text-goldLight font-sans" role="status">
            {queueNote}
          </p>
        )}

        {queue.length === 0 ? (
          <p className="text-xs text-muted font-sans py-3">
            Nothing is queued. Messages appear here as soon as an order, payment or
            refund event is recorded.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-sans">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted border-b border-gold/15">
                  <th className="py-2 pr-3 font-mono">Event</th>
                  <th className="py-2 pr-3 font-mono">Order</th>
                  <th className="py-2 pr-3 font-mono">To</th>
                  <th className="py-2 pr-3 font-mono">Status</th>
                  <th className="py-2 pr-3 font-mono">Tries</th>
                  <th className="py-2 font-mono">Recorded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10">
                {queue.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2 pr-3 text-ivory font-mono">{row.template}</td>
                    <td className="py-2 pr-3 text-muted font-mono">{row.orderRef || "—"}</td>
                    <td className="py-2 pr-3 text-muted">{row.recipientKind}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                          row.status === "sent"
                            ? "text-emerald-300 border-emerald-500/30 bg-emerald-950/40"
                            : row.status === "failed"
                              ? "text-rose-300 border-rose-500/30 bg-rose-950/40"
                              : row.status === "skipped"
                                ? "text-muted border-gold/20 bg-navy"
                                : "text-gold border-gold/30 bg-navy"
                        }`}
                      >
                        {row.status}
                      </span>
                      {row.lastError && (
                        <span className="block text-[10px] text-rose-300/80 mt-1 max-w-[240px] truncate">
                          {row.lastError}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-muted font-mono">{row.attempts}</td>
                    <td className="py-2 text-muted font-mono">{row.sentAt || row.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Email Templates Manager */}
      <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4 shadow-xl">
        <div className="flex items-center space-x-2 border-b border-gold/15 pb-3">
          <Mail className="w-4 h-4 text-gold" />
          <h3 className="font-serif text-base font-bold text-ivory">
            Message Drafts — Stored For Reference
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {emailTemplates.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded bg-navy border border-gold/20 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2 font-sans">
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-sm text-ivory">
                    {t.type}
                  </span>
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                      t.active
                        ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/30"
                        : "bg-navy text-muted border-gold/20"
                    }`}
                  >
                    {t.active ? "Active Template" : "Disabled"}
                  </span>
                </div>
                <p className="text-xs text-gold font-mono truncate">{t.subject}</p>
                <p className="text-[11px] text-muted line-clamp-3 leading-relaxed whitespace-pre-line font-light">
                  {t.body}
                </p>
              </div>

              <div className="pt-2 border-t border-gold/15 flex justify-end">
                <button
                  onClick={() => handleOpenEdit(t)}
                  className="px-3 py-1.5 rounded text-xs font-sans text-muted hover:text-gold border border-gold/20 hover:border-gold/40 flex items-center space-x-1"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Template</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Email Template Modal */}
      <Modal
        isOpen={editingTemplate !== null}
        onClose={() => setEditingTemplate(null)}
        title={`Edit Template — ${editingTemplate?.type || ""}`}
        maxWidth="xl"
      >
        {editingTemplate && (
          <form onSubmit={handleSaveTemplate} className="space-y-4">
            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                Email Subject Line *
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                Email Body Content (Supports tags: {"{{customer_name}}"},{" "}
                {"{{order_number}}"}, {"{{order_total}}"}, {"{{courier}}"},{" "}
                {"{{tracking_number}}"})
              </label>
              <textarea
                rows={8}
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full bg-navy border border-gold/30 rounded p-3 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
              />
            </div>

            <label className="flex items-center space-x-3 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded border-gold/30 bg-navy text-gold focus:ring-0"
              />
              <span className="text-xs text-ivory">Active Notification Template</span>
            </label>

            <div className="pt-4 flex justify-end space-x-3 border-t border-gold/15">
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="px-4 py-2 rounded text-xs font-sans text-muted hover:text-ivory border border-gold/20"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gold hover:bg-goldLight text-navy font-bold rounded text-xs font-sans uppercase tracking-wider"
              >
                Save Template
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
