import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchAutomationDashboard,
  fetchCustomerSegments,
  setAutomationWorkflowEnabled,
  updateWorkflowTiming,
  type AutomationDashboard,
  type CustomerSegmentRow,
  type FollowUpTaskRow,
  type AutomationRunRow,
} from "../../services/adminOps";
import { refreshServiceCapabilities, type ServiceCapabilities } from "../../services/emailService";
import { getCurrentStaff, hasPermission } from "../../services/auth";
import { DataTable, type Column } from "../components/DataTable";
import { StatCard } from "../components/StatCard";
import { Zap, Clock, Users, Send, AlertTriangle, ShieldCheck, CircleSlash } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";
import type { Translator } from "../../i18n";

const shortDateTime = (iso: string | null) => (iso ? iso.replace("T", " ").slice(0, 16) : "—");

/**
 * Compact waiting-period render. The unit abbreviations are screen text, so they come from the
 * dictionary; the helper stays at module scope by taking the translator as an argument.
 */
const formatDelay = (minutes: number, t: Translator) => {
  if (minutes < 60) return t("admin.automations.delayMinutes", { minutes });
  const hours = minutes / 60;
  if (hours < 48)
    return t("admin.automations.delayHours", { hours: hours % 1 === 0 ? hours : hours.toFixed(1) });
  return t("admin.automations.delayDays", { days: Math.round(hours / 24) });
};

const TASK_TONE: Record<string, string> = {
  pending: "text-gold border-gold/30 bg-navy",
  claimed: "text-gold border-gold/30 bg-navy",
  completed: "text-emerald-300 border-emerald-500/30 bg-emerald-950/40",
  skipped: "text-muted border-gold/20 bg-navy",
  failed: "text-rose-300 border-rose-500/30 bg-rose-950/40",
  running: "text-gold border-gold/30 bg-navy",
  succeeded: "text-emerald-300 border-emerald-500/30 bg-emerald-950/40",
};

const Chip: React.FC<{ value: string; tone?: string }> = ({ value, tone }) => (
  <span
    className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
      tone ?? "text-muted border-gold/20 bg-navy"
    }`}
  >
    {value}
  </span>
);

export const AutomationsPage: React.FC = () => {
  const { t } = useI18n();
  const [dashboard, setDashboard] = useState<AutomationDashboard | null>(null);
  const [segments, setSegments] = useState<CustomerSegmentRow[]>([]);
  const [capabilities, setCapabilities] = useState<ServiceCapabilities | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyWorkflow, setBusyWorkflow] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState<string>("");
  const [delayDraft, setDelayDraft] = useState("");
  const [timingBusy, setTimingBusy] = useState(false);

  const canManage = hasPermission(getCurrentStaff(), "settings.manage");

  const load = useCallback(async () => {
    setLoading(true);
    const [board, segs, caps] = await Promise.all([
      fetchAutomationDashboard(),
      fetchCustomerSegments(),
      refreshServiceCapabilities(),
    ]);
    setDashboard(board);
    setSegments(segs);
    setCapabilities(caps);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggle = async (workflowId: string, nextEnabled: boolean) => {
    setBusyWorkflow(workflowId);
    setActionNote("");
    const result = await setAutomationWorkflowEnabled(workflowId, nextEnabled);
    if (result.ok) {
      setActionNote(
        nextEnabled
          ? t("admin.automations.toastEnabled")
          : t("admin.automations.toastDisabled")
      );
      await load();
    } else {
      setActionNote(result.error || t("admin.automations.toastChangeFailed"));
    }
    setBusyWorkflow(null);
  };

  const handleTiming = async (workflowId: string, currentMinutes: number) => {
    setTimingBusy(true);
    setActionNote("");
    const minutes = delayDraft.trim() === "" ? currentMinutes : Number(delayDraft);
    const result = await updateWorkflowTiming(workflowId, minutes);
    if (result.ok) {
      setDelayDraft("");
      setActionNote(t("admin.automations.toastTimingSaved"));
      await load();
    } else {
      setActionNote(result.error || t("admin.automations.toastTimingFailed"));
    }
    setTimingBusy(false);
  };

  const totals = useMemo(() => {
    const workflows = dashboard?.workflows ?? [];
    return {
      enabled: workflows.filter((w) => w.enabled).length,
      pending: workflows.reduce((sum, w) => sum + w.pending, 0),
      completed: workflows.reduce((sum, w) => sum + w.completed, 0),
      skipped: workflows.reduce((sum, w) => sum + w.skipped, 0),
      failed: workflows.reduce((sum, w) => sum + w.failed, 0),
    };
  }, [dashboard]);

  // The three server requirements are reported separately so the owner knows exactly
  // what is missing, rather than a single "not configured".
  const readiness = useMemo(() => {
    if (!capabilities) return null;
    return [
      { labelKey: "admin.automations.capServerDatabase", ok: capabilities.serverDatabase },
      { labelKey: "admin.automations.capEmailTransport", ok: capabilities.email },
      { labelKey: "admin.automations.capSchedulerSecret", ok: capabilities.automations },
    ];
  }, [capabilities]);

  const runColumns: Column<AutomationRunRow>[] = [
    {
      header: t("admin.automations.colStarted"),
      accessor: (r) => <span className="text-[10px] font-mono text-muted">{shortDateTime(r.startedAt)}</span>,
      sortable: true,
    },
    {
      header: t("admin.automations.colWorkflow"),
      accessor: (r) => (
        <span className="text-xs text-ivory">{r.workflowId ?? t("admin.automations.fullSweep")}</span>
      ),
    },
    {
      header: t("admin.shared.status"),
      accessor: (r) => <Chip value={r.status} tone={TASK_TONE[r.status]} />,
      sortable: true,
    },
    {
      header: t("admin.automations.colQueued"),
      accessor: (r) => <span className="font-mono text-xs text-gold">{r.queued}</span>,
      sortable: true,
    },
    {
      header: t("admin.automations.colProcessed"),
      accessor: (r) => <span className="font-mono text-xs text-ivory">{r.processed}</span>,
      sortable: true,
    },
    {
      header: t("admin.automations.colResult"),
      accessor: (r) => (
        <span className="text-[10px] font-mono text-rose-300 block max-w-[220px] truncate">
          {r.error || "—"}
        </span>
      ),
    },
  ];

  const taskColumns: Column<FollowUpTaskRow>[] = [
    {
      header: t("admin.automations.colDue"),
      accessor: (row) => <span className="text-[10px] font-mono text-muted">{shortDateTime(row.dueAt)}</span>,
      sortable: true,
    },
    {
      header: t("admin.automations.colWorkflow"),
      accessor: (row) => <span className="text-xs text-ivory">{row.workflowId}</span>,
      sortable: true,
    },
    {
      header: t("admin.shared.status"),
      accessor: (row) => <Chip value={row.status} tone={TASK_TONE[row.status]} />,
      sortable: true,
    },
    {
      header: t("admin.shared.order"),
      accessor: (row) => (
        <span className="text-[10px] font-mono text-gold/90">{row.orderRef || "—"}</span>
      ),
    },
    {
      header: t("admin.automations.colTries"),
      accessor: (row) => <span className="font-mono text-[10px] text-muted">{row.attempts}</span>,
      sortable: true,
    },
    {
      header: t("admin.automations.colWhy"),
      accessor: (row) => (
        <span className="text-[10px] font-mono text-muted block max-w-[260px] truncate">
          {row.skipReason || row.lastError || "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gold/20 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
            {t("admin.automations.eyebrow")}
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5 flex items-center gap-2">
            <Zap className="w-5 h-5 text-gold" />
            <span>{t("admin.automations.title")}</span>
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-1 max-w-3xl leading-relaxed">
            {t("admin.automations.intro")}
          </p>
        </div>
        <button
          onClick={load}
          className="self-start md:self-auto px-3 py-1.5 rounded text-[11px] font-sans uppercase tracking-wider text-muted border border-gold/20 hover:text-gold hover:border-gold/40"
        >
          {t("admin.automations.reload")}
        </button>
      </div>

      {dashboard === null && !loading && (
        <div className="bg-navy2/90 border border-gold/20 rounded-lg p-5 flex items-start gap-3">
          <CircleSlash className="w-4 h-4 text-gold mt-0.5 shrink-0" />
          <p className="text-xs text-muted font-sans leading-relaxed">
            {t("admin.automations.accessDenied")}
          </p>
        </div>
      )}

      {readiness && (
        <div className="bg-navy2/90 border border-gold/20 rounded-lg p-5 space-y-3 shadow-xl">
          <div className="flex items-center gap-2 border-b border-gold/15 pb-2">
            <ShieldCheck className="w-4 h-4 text-gold" />
            <h2 className="font-serif text-sm font-bold text-ivory">{t("admin.automations.readinessHeading")}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {readiness.map((item) => (
              <div key={item.labelKey} className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${item.ok ? "bg-emerald-400" : "bg-rose-400"}`}
                  aria-hidden="true"
                />
                <span className={`text-xs font-sans ${item.ok ? "text-ivory" : "text-rose-200"}`}>
                  {t(item.labelKey)}
                </span>
                <span className="text-[10px] font-mono uppercase text-muted">
                  {item.ok ? t("admin.automations.capReady") : t("admin.automations.capMissing")}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted font-sans leading-relaxed">
            {readiness.every((r) => r.ok)
              ? t("admin.automations.schedulingNote")
              : t("admin.automations.notReadyNote")}
          </p>
          <p className="text-[11px] text-muted font-sans leading-relaxed">
            {t("admin.automations.noBrowserSweepNote")}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title={t("admin.automations.statWorkflowsEnabled")}
          value={totals.enabled}
          subtitle={t("admin.automations.statAvailable", { count: dashboard?.workflows.length ?? 0 })}
          icon={Zap}
        />
        <StatCard
          title={t("admin.automations.statTasksWaiting")}
          value={totals.pending}
          subtitle={t("admin.automations.statTasksWaitingSub")}
          icon={Clock}
        />
        <StatCard
          title={t("admin.automations.statFollowUpsSent")}
          value={totals.completed}
          subtitle={t("admin.automations.statFollowUpsSentSub")}
          icon={Send}
        />
        <StatCard
          title={t("admin.automations.statSkippedOrFailed")}
          value={totals.skipped + totals.failed}
          subtitle={t("admin.automations.statSkippedOrFailedSub")}
          icon={AlertTriangle}
        />
      </div>

      {dashboard && dashboard.workflows.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {dashboard.workflows.map((w) => (
            <div key={w.id} className="bg-navy2/90 border border-gold/20 rounded-lg p-5 flex flex-col space-y-3 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-serif text-sm font-bold text-ivory leading-snug">{w.name}</h3>
                <Chip
                  value={w.enabled ? t("admin.automations.chipEnabled") : t("admin.automations.chipDisabled")}
                  tone={w.enabled ? "text-emerald-300 border-emerald-500/30 bg-emerald-950/40" : undefined}
                />
              </div>
              <p className="text-[11px] text-muted font-sans font-light leading-relaxed flex-1">{w.description}</p>

              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-mono text-muted">
                <div className="flex justify-between">
                  <dt>{t("admin.automations.dtWait")}</dt>
                  <dd className="text-ivory">{formatDelay(w.delayMinutes, t)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>{t("admin.automations.dtPending")}</dt>
                  <dd className="text-gold">{w.pending}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>{t("admin.automations.dtSent")}</dt>
                  <dd className="text-ivory">{w.completed}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>{t("admin.automations.dtSkipped")}</dt>
                  <dd className="text-ivory">{w.skipped}</dd>
                </div>
              </dl>

              {w.id === "abandoned_cart" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleTiming(w.id, w.delayMinutes);
                  }}
                  className="flex items-end gap-2"
                >
                  <div className="flex-1">
                    <label
                      htmlFor={`delay-${w.id}`}
                      className="block text-[10px] font-mono uppercase tracking-wider text-muted mb-1"
                    >
                      {t("admin.automations.waitingPeriodLabel")}
                    </label>
                    <input
                      id={`delay-${w.id}`}
                      type="number"
                      min={15}
                      max={10080}
                      step={15}
                      value={delayDraft || String(w.delayMinutes)}
                      disabled={!canManage}
                      onChange={(e) => setDelayDraft(e.target.value)}
                      className="w-full bg-navy border border-gold/30 rounded px-2 py-1.5 text-xs font-mono text-ivory focus:outline-none focus:border-gold disabled:opacity-50"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!canManage || timingBusy}
                    className="min-h-11 px-3 rounded text-[10px] font-sans uppercase tracking-wider text-muted border border-gold/20 hover:text-gold hover:border-gold/40 disabled:opacity-40"
                  >
                    {timingBusy ? t("admin.automations.savingUpper") : t("common.apply")}
                  </button>
                </form>
              )}

              {w.requiresMarketingConsent && (
                <p className="text-[10px] font-sans text-gold/90 flex items-start gap-1.5">
                  <Users className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{t("admin.automations.consentRequired")}</span>
                </p>
              )}

              <p className="text-[10px] font-mono text-muted">
                {t("admin.automations.lastRunLabel")}{" "}
                {w.lastRun ? `${shortDateTime(w.lastRun.at)} · ${w.lastRun.status}` : t("admin.automations.lastRunNever")}
              </p>

              <div className="pt-1">
                <button
                  onClick={() => handleToggle(w.id, !w.enabled)}
                  disabled={!canManage || busyWorkflow === w.id}
                  aria-pressed={w.enabled}
                  className="w-full min-h-11 px-3 py-2 rounded text-xs font-sans uppercase tracking-wider border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  data-enabled={w.enabled ? "true" : "false"}
                >
                  {busyWorkflow === w.id
                    ? t("admin.automations.updating")
                    : w.enabled
                      ? t("admin.automations.disableWorkflow")
                      : t("admin.automations.enableWorkflow")}
                </button>
                {!canManage && (
                  <p className="text-[10px] font-sans text-muted mt-2">
                    {t("admin.automations.roleReadOnly")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {actionNote && (
        <p className="text-[11px] font-sans text-goldLight" role="status">
          {actionNote}
        </p>
      )}

      {dashboard && (
        <div className="bg-navy2/90 border border-gold/20 rounded-lg p-5 space-y-3 shadow-xl">
          <div className="flex items-center gap-2 border-b border-gold/15 pb-2">
            <Send className="w-4 h-4 text-gold" />
            <h2 className="font-serif text-sm font-bold text-ivory">{t("admin.automations.emailQueueHeading")}</h2>
          </div>
          {dashboard.emailQueue.length === 0 ? (
            <p className="text-xs text-muted font-sans">{t("admin.automations.emailQueueEmpty")}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {dashboard.emailQueue.map((e) => (
                <span
                  key={e.status}
                  className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded border border-gold/20 bg-navy text-gold"
                >
                  {e.status}: {e.count}
                </span>
              ))}
            </div>
          )}
          <p className="text-[11px] text-muted font-sans leading-relaxed">
            {t("admin.automations.sentMeansNote")}
          </p>
        </div>
      )}

      {dashboard && dashboard.queue.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-serif text-base font-bold text-ivory flex items-center gap-2">
            <Clock className="w-4 h-4 text-gold" />
            <span>{t("admin.automations.taskQueueHeading")}</span>
          </h2>
          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-2 shadow-xl">
            <DataTable
              columns={taskColumns}
              data={dashboard.queue}
              keyExtractor={(row) => String(row.id)}
              emptyMessage={t("admin.automations.taskQueueEmpty")}
              searchPlaceholder={t("admin.automations.taskSearchPlaceholder")}
            />
          </div>
        </div>
      )}

      {dashboard && dashboard.recentRuns.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-serif text-base font-bold text-ivory flex items-center gap-2">
            <Zap className="w-4 h-4 text-gold" />
            <span>{t("admin.automations.schedulerRunsHeading")}</span>
          </h2>
          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-2 shadow-xl">
            <DataTable
              columns={runColumns}
              data={dashboard.recentRuns}
              keyExtractor={(row) => String(row.id)}
              emptyMessage={t("admin.automations.schedulerRunsEmpty")}
            />
          </div>
        </div>
      )}

      {segments.length > 0 && (
        <div className="bg-navy2/90 border border-gold/20 rounded-lg p-5 space-y-3 shadow-xl">
          <div className="flex items-center gap-2 border-b border-gold/15 pb-2">
            <Users className="w-4 h-4 text-gold" />
            <h2 className="font-serif text-sm font-bold text-ivory">{t("admin.automations.segmentsHeading")}</h2>
          </div>
          <p className="text-[11px] text-muted font-sans leading-relaxed">
            {t("admin.automations.segmentsIntro")}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-sans">
              <thead>
                <tr className="text-start text-[10px] uppercase tracking-wider text-muted border-b border-gold/15">
                  <th className="py-2 pe-3 font-medium">{t("admin.automations.colSegment")}</th>
                  <th className="py-2 pe-3 font-medium">{t("admin.automations.colRuleApplied")}</th>
                  <th className="py-2 text-end font-medium">{t("admin.automations.colCustomers")}</th>
                </tr>
              </thead>
              <tbody>
                {segments.map((s) => (
                  <tr key={s.id} className="border-b border-gold/10 last:border-0">
                    <td className="py-2 pe-3 text-ivory">{s.label}</td>
                    <td className="py-2 pe-3 text-muted text-[11px] font-mono">{s.rule}</td>
                    <td className="py-2 text-end font-mono text-gold">{s.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(totals.failed > 0 || (dashboard?.recentRuns ?? []).some((r) => r.status === "failed")) && (
        <div className="bg-rose-950/30 border border-rose-500/40 rounded-lg p-5 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-300 mt-0.5 shrink-0" />
          <p className="text-xs text-rose-100 font-sans leading-relaxed">
            {t("admin.automations.failureAlert")}
          </p>
        </div>
      )}
    </div>
  );
};
