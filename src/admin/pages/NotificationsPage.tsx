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
import { useI18n } from "../../i18n/I18nProvider";

export const NotificationsPage: React.FC = () => {
  const { t } = useI18n();
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
      setQueueNote(t("admin.notifications.emailNotConfiguredNote"));
    } else {
      // A browser session can only claim rows addressed to the signed-in account;
      // staff copies and scheduled reminders stay queued for the server worker.
      setQueueNote(
        t("admin.notifications.drainResultNote", {
          sent: result.sent,
          failed: result.failed,
          skipped: result.skipped,
        })
      );
    }
    await loadQueue();
    setQueueBusy(false);
  };

  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [active, setActive] = useState(true);

  const handleOpenEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setSubject(template.subject);
    setBody(template.body);
    setActive(template.active);
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
            {t("admin.notifications.eyebrow")}
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
            {t("admin.notifications.title")}
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-0.5">
            {t("admin.notifications.introBody")}
          </p>
        </div>
      </div>

      {/* System Notifications Log */}
      <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 border-b border-gold/15 pb-3">
          <Bell className="w-4 h-4 text-gold" />
          <h3 className="font-serif text-base font-bold text-ivory">
            {t("admin.notifications.activityLogHeading")}
          </h3>
        </div>

        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markNotificationRead(n.id)}
              className={`p-4 rounded border transition-colors cursor-pointer flex items-start gap-3 ${
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
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-gold" />
            <h3 className="font-serif text-base font-bold text-ivory">
              {t("admin.notifications.outboundMessageQueue")}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadQueue}
              className="px-3 py-1.5 rounded text-xs font-sans text-muted hover:text-gold border border-gold/20 hover:border-gold/40 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t("admin.notifications.refresh")}</span>
            </button>
            <button
              onClick={handleDrain}
              disabled={queueBusy || emailReady === false}
              className="px-3 py-1.5 rounded text-xs font-sans bg-gold hover:bg-goldLight text-navy font-bold uppercase tracking-wider disabled:opacity-40"
            >
              {queueBusy ? t("admin.notifications.sending") : t("admin.notifications.sendQueuedNow")}
            </button>
          </div>
        </div>

        <p className="text-[11px] text-muted font-sans leading-relaxed">
          {emailReady === null
            ? t("admin.notifications.checkingEmailCapability")
            : emailReady
              ? t("admin.notifications.emailReadyNote")
              : t("admin.notifications.emailUnavailableNote")}
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
            {t("admin.notifications.nothingQueued")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-sans">
              <thead>
                <tr className="text-start text-[10px] uppercase tracking-wider text-muted border-b border-gold/15">
                  <th className="py-2 pe-3 font-mono">{t("admin.notifications.event")}</th>
                  <th className="py-2 pe-3 font-mono">{t("admin.shared.order")}</th>
                  <th className="py-2 pe-3 font-mono">{t("admin.notifications.to")}</th>
                  <th className="py-2 pe-3 font-mono">{t("admin.shared.status")}</th>
                  <th className="py-2 pe-3 font-mono">{t("admin.notifications.tries")}</th>
                  <th className="py-2 font-mono">{t("admin.notifications.recorded")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10">
                {queue.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2 pe-3 text-ivory font-mono">{row.template}</td>
                    <td className="py-2 pe-3 text-muted font-mono">{row.orderRef || "—"}</td>
                    <td className="py-2 pe-3 text-muted">{row.recipientKind}</td>
                    <td className="py-2 pe-3">
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
                    <td className="py-2 pe-3 text-muted font-mono">{row.attempts}</td>
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
        <div className="flex items-center gap-2 border-b border-gold/15 pb-3">
          <Mail className="w-4 h-4 text-gold" />
          <h3 className="font-serif text-base font-bold text-ivory">
            {t("admin.notifications.messageDraftsHeading")}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {emailTemplates.map((template) => (
            <div
              key={template.id}
              className="p-4 rounded bg-navy border border-gold/20 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2 font-sans">
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-sm text-ivory">
                    {template.type}
                  </span>
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                      template.active
                        ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/30"
                        : "bg-navy text-muted border-gold/20"
                    }`}
                  >
                    {template.active ? t("admin.notifications.activeTemplate") : t("common.disabled")}
                  </span>
                </div>
                <p className="text-xs text-gold font-mono truncate">{template.subject}</p>
                <p className="text-[11px] text-muted line-clamp-3 leading-relaxed whitespace-pre-line font-light">
                  {template.body}
                </p>
              </div>

              <div className="pt-2 border-t border-gold/15 flex justify-end">
                <button
                  onClick={() => handleOpenEdit(template)}
                  className="px-3 py-1.5 rounded text-xs font-sans text-muted hover:text-gold border border-gold/20 hover:border-gold/40 flex items-center gap-1"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>{t("admin.notifications.editTemplate")}</span>
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
        title={t("admin.notifications.editTemplateNamed", { name: editingTemplate?.type || "" })}
        maxWidth="xl"
      >
        {editingTemplate && (
          <form onSubmit={handleSaveTemplate} className="space-y-4">
            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                {t("admin.notifications.emailSubjectLineRequired")}
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
                {t("admin.notifications.emailBodyContent")} {t("admin.notifications.supportsTags")} {"{{customer_name}}"},{" "}
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

            <label className="flex items-center gap-3 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded border-gold/30 bg-navy text-gold focus:ring-0"
              />
              <span className="text-xs text-ivory">{t("admin.notifications.activeNotificationTemplate")}</span>
            </label>

            <div className="pt-4 flex justify-end gap-3 border-t border-gold/15">
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="px-4 py-2 rounded text-xs font-sans text-muted hover:text-ivory border border-gold/20"
              >
                {t("admin.modal.cancel")}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gold hover:bg-goldLight text-navy font-bold rounded text-xs font-sans uppercase tracking-wider"
              >
                {t("admin.notifications.saveTemplate")}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
