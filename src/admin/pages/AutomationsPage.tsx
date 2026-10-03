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

const shortDateTime = (iso: string | null) => (iso ? iso.replace("T", " ").slice(0, 16) : "—");

const formatDelay = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  if (hours < 48) return `${hours % 1 === 0 ? hours : hours.toFixed(1)} h`;
  return `${Math.round(hours / 24)} d`;
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
          ? "Enabled. It will be picked up the next time the server scheduler runs."
          : "Disabled. Tasks already queued stay in the queue and are skipped when they come due."
      );
      await load();
    } else {
      setActionNote(result.error || "The change could not be recorded.");
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
      setActionNote("Waiting period saved. Bags newer than that period are left alone.");
      await load();
    } else {
      setActionNote(result.error || "The waiting period could not be saved.");
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
      { label: "Server database access", ok: capabilities.serverDatabase },
      { label: "Email transport (SMTP)", ok: capabilities.email },
      { label: "Scheduler secret", ok: capabilities.automations },
    ];
  }, [capabilities]);

  const runColumns: Column<AutomationRunRow>[] = [
    {
      header: "Started",
      accessor: (r) => <span className="text-[10px] font-mono text-muted">{shortDateTime(r.startedAt)}</span>,
      sortable: true,
    },
    {
      header: "Workflow",
      accessor: (r) => (
        <span className="text-xs text-ivory">{r.workflowId ?? "full sweep"}</span>
      ),
    },
    {
      header: "Status",
      accessor: (r) => <Chip value={r.status} tone={TASK_TONE[r.status]} />,
      sortable: true,
    },
    {
      header: "Queued",
      accessor: (r) => <span className="font-mono text-xs text-gold">{r.queued}</span>,
      sortable: true,
    },
    {
      header: "Processed",
      accessor: (r) => <span className="font-mono text-xs text-ivory">{r.processed}</span>,
      sortable: true,
    },
    {
      header: "Result",
      accessor: (r) => (
        <span className="text-[10px] font-mono text-rose-300 block max-w-[220px] truncate">
          {r.error || "—"}
        </span>
      ),
    },
  ];

  const taskColumns: Column<FollowUpTaskRow>[] = [
    {
      header: "Due",
      accessor: (t) => <span className="text-[10px] font-mono text-muted">{shortDateTime(t.dueAt)}</span>,
      sortable: true,
    },
    { header: "Workflow", accessor: (t) => <span className="text-xs text-ivory">{t.workflowId}</span>, sortable: true },
    { header: "Status", accessor: (t) => <Chip value={t.status} tone={TASK_TONE[t.status]} />, sortable: true },
    {
      header: "Order",
      accessor: (t) => (
        <span className="text-[10px] font-mono text-gold/90">{t.orderRef || "—"}</span>
      ),
    },
    {
      header: "Tries",
      accessor: (t) => <span className="font-mono text-[10px] text-muted">{t.attempts}</span>,
      sortable: true,
    },
    {
      header: "Why",
      accessor: (t) => (
        <span className="text-[10px] font-mono text-muted block max-w-[260px] truncate">
          {t.skipReason || t.lastError || "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gold/20 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
            AUTOMATION CONTROL
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5 flex items-center space-x-2">
            <Zap className="w-5 h-5 text-gold" />
            <span>Follow-up Automations</span>
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-1 max-w-3xl leading-relaxed">
            Abandoned-bag reminders, review requests and delivery check-ins. Every workflow starts
            disabled, promotional ones are sent only to customers who accepted marketing email, and a
            bag can never be reminded twice. Nothing here sends from the browser — delivery happens in
            the server worker, and an email is only claimed when the transport actually reports it.
          </p>
        </div>
        <button
          onClick={load}
          className="self-start md:self-auto px-3 py-1.5 rounded text-[11px] font-sans uppercase tracking-wider text-muted border border-gold/20 hover:text-gold hover:border-gold/40"
        >
          Reload
        </button>
      </div>

      {dashboard === null && !loading && (
        <div className="bg-navy2/90 border border-gold/20 rounded-lg p-5 flex items-start space-x-3">
          <CircleSlash className="w-4 h-4 text-gold mt-0.5 shrink-0" />
          <p className="text-xs text-muted font-sans leading-relaxed">
            The automation board is staff-only and the current session was not accepted, or the
            database is unreachable. Sign in as staff and reload.
          </p>
        </div>
      )}

      {readiness && (
        <div className="bg-navy2/90 border border-gold/20 rounded-lg p-5 space-y-3 shadow-xl">
          <div className="flex items-center space-x-2 border-b border-gold/15 pb-2">
            <ShieldCheck className="w-4 h-4 text-gold" />
            <h2 className="font-serif text-sm font-bold text-ivory">What this deployment can do right now</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {readiness.map((item) => (
              <div key={item.label} className="flex items-center space-x-2">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${item.ok ? "bg-emerald-400" : "bg-rose-400"}`}
                  aria-hidden="true"
                />
                <span className={`text-xs font-sans ${item.ok ? "text-ivory" : "text-rose-200"}`}>
                  {item.label}
                </span>
                <span className="text-[10px] font-mono uppercase text-muted">{item.ok ? "ready" : "missing"}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted font-sans leading-relaxed">
            {readiness.every((r) => r.ok)
              ? "Scheduling: vercel.json calls /api/automation-worker daily at 04:20 UTC, which queues follow-ups and then drains the email queue in the same run. Vercel does not report a next-run timestamp to the application, so the next execution is the schedule rather than a measured time. A Pro plan can tighten that cron to every few minutes; a Hobby plan is limited to one run per day."
              : "Until all three are present, enabling a workflow queues tasks and messages without delivering them. Nothing is discarded and no delivery is claimed."}
          </p>
          <p className="text-[11px] text-muted font-sans leading-relaxed">
            A browser cannot trigger a sweep: the queue functions are executable only by the server
            role, so no customer session or admin page can cause a send.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Workflows enabled"
          value={totals.enabled}
          subtitle={`${dashboard?.workflows.length ?? 0} available`}
          icon={Zap}
        />
        <StatCard title="Tasks waiting" value={totals.pending} subtitle="Queued, not yet due" icon={Clock} />
        <StatCard
          title="Follow-ups sent"
          value={totals.completed}
          subtitle="Handed to the email queue"
          icon={Send}
        />
        <StatCard
          title="Skipped or failed"
          value={totals.skipped + totals.failed}
          subtitle="Consent, recovered bags, errors"
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
                  value={w.enabled ? "enabled" : "disabled"}
                  tone={w.enabled ? "text-emerald-300 border-emerald-500/30 bg-emerald-950/40" : undefined}
                />
              </div>
              <p className="text-[11px] text-muted font-sans font-light leading-relaxed flex-1">{w.description}</p>

              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-mono text-muted">
                <div className="flex justify-between">
                  <dt>wait</dt>
                  <dd className="text-ivory">{formatDelay(w.delayMinutes)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>pending</dt>
                  <dd className="text-gold">{w.pending}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>sent</dt>
                  <dd className="text-ivory">{w.completed}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>skipped</dt>
                  <dd className="text-ivory">{w.skipped}</dd>
                </div>
              </dl>

              {w.id === "abandoned_cart" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleTiming(w.id, w.delayMinutes);
                  }}
                  className="flex items-end space-x-2"
                >
                  <div className="flex-1">
                    <label
                      htmlFor={`delay-${w.id}`}
                      className="block text-[10px] font-mono uppercase tracking-wider text-muted mb-1"
                    >
                      Waiting period (minutes)
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
                    {timingBusy ? "SAVING…" : "Apply"}
                  </button>
                </form>
              )}

              {w.requiresMarketingConsent && (
                <p className="text-[10px] font-sans text-gold/90 flex items-start space-x-1.5">
                  <Users className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>Marketing consent required — customers who did not opt in are skipped.</span>
                </p>
              )}

              <p className="text-[10px] font-mono text-muted">
                last run: {w.lastRun ? `${shortDateTime(w.lastRun.at)} · ${w.lastRun.status}` : "never"}
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
                    ? "UPDATING…"
                    : w.enabled
                      ? "Disable workflow"
                      : "Enable workflow"}
                </button>
                {!canManage && (
                  <p className="text-[10px] font-sans text-muted mt-2">
                    Your staff role can review automations; changing them needs settings permission.
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
          <div className="flex items-center space-x-2 border-b border-gold/15 pb-2">
            <Send className="w-4 h-4 text-gold" />
            <h2 className="font-serif text-sm font-bold text-ivory">Email queue after these workflows</h2>
          </div>
          {dashboard.emailQueue.length === 0 ? (
            <p className="text-xs text-muted font-sans">The email queue is empty.</p>
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
            “sent” means the mail transport accepted the message for a recipient. It does not prove
            delivery to an inbox. Failed rows are retried with a backoff and stop after the attempt
            ceiling, where they stay visible.
          </p>
        </div>
      )}

      {dashboard && dashboard.queue.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-serif text-base font-bold text-ivory flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gold" />
            <span>Follow-up task queue</span>
          </h2>
          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-2 shadow-xl">
            <DataTable
              columns={taskColumns}
              data={dashboard.queue}
              keyExtractor={(t) => String(t.id)}
              emptyMessage="No follow-up tasks recorded."
              searchPlaceholder="Search workflow or order number…"
            />
          </div>
        </div>
      )}

      {dashboard && dashboard.recentRuns.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-serif text-base font-bold text-ivory flex items-center space-x-2">
            <Zap className="w-4 h-4 text-gold" />
            <span>Scheduler runs</span>
          </h2>
          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-2 shadow-xl">
            <DataTable
              columns={runColumns}
              data={dashboard.recentRuns}
              keyExtractor={(r) => String(r.id)}
              emptyMessage="The scheduler has not run yet."
            />
          </div>
        </div>
      )}

      {segments.length > 0 && (
        <div className="bg-navy2/90 border border-gold/20 rounded-lg p-5 space-y-3 shadow-xl">
          <div className="flex items-center space-x-2 border-b border-gold/15 pb-2">
            <Users className="w-4 h-4 text-gold" />
            <h2 className="font-serif text-sm font-bold text-ivory">Customer segments</h2>
          </div>
          <p className="text-[11px] text-muted font-sans leading-relaxed">
            Counts derived from real orders, bags and consent records. No individual customer is
            listed or exported, and a segment cannot be targeted from this screen — bulk campaigns
            still require explicit approval.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-sans">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted border-b border-gold/15">
                  <th className="py-2 pr-3 font-medium">Segment</th>
                  <th className="py-2 pr-3 font-medium">Rule applied</th>
                  <th className="py-2 text-right font-medium">Customers</th>
                </tr>
              </thead>
              <tbody>
                {segments.map((s) => (
                  <tr key={s.id} className="border-b border-gold/10 last:border-0">
                    <td className="py-2 pr-3 text-ivory">{s.label}</td>
                    <td className="py-2 pr-3 text-muted text-[11px] font-mono">{s.rule}</td>
                    <td className="py-2 text-right font-mono text-gold">{s.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(totals.failed > 0 || (dashboard?.recentRuns ?? []).some((r) => r.status === "failed")) && (
        <div className="bg-rose-950/30 border border-rose-500/40 rounded-lg p-5 flex items-start space-x-3">
          <AlertTriangle className="w-4 h-4 text-rose-300 mt-0.5 shrink-0" />
          <p className="text-xs text-rose-100 font-sans leading-relaxed">
            A task or scheduler run has failed. The reason is stored with the row above; it names the
            step that failed, never a credential.
          </p>
        </div>
      )}
    </div>
  );
};
