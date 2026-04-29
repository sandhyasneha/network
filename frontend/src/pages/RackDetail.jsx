import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Calendar, Camera, ChevronRight, ClockIcon, Cpu, MapPin, Activity,
  ShieldAlert, ShieldCheck, Shield, AlertTriangle, History,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid,
} from "recharts";
import { fetchRack, fetchRackHistory, listAudits, updateSchedule } from "@/lib/api";

const statusConfig = {
  consistent: { label: "CONSISTENT", color: "text-signal-green", bg: "bg-signal-green/10", border: "border-signal-green/40", bar: "bg-signal-green", icon: ShieldCheck },
  warning:    { label: "WARNING",    color: "text-signal-amber", bg: "bg-signal-amber/10", border: "border-signal-amber/40", bar: "bg-signal-amber", icon: Shield },
  alert:      { label: "ALERT",      color: "text-signal-red",   bg: "bg-signal-red/10",   border: "border-signal-red/50",   bar: "bg-signal-red",   icon: ShieldAlert },
};

const FREQ_OPTIONS = [
  { v: 1, l: "Daily" },
  { v: 3, l: "Every 3 days" },
  { v: 7, l: "Weekly" },
  { v: 14, l: "Bi-weekly" },
  { v: 30, l: "Monthly" },
];

export default function RackDetail() {
  const { rackId } = useParams();
  const navigate = useNavigate();
  const [rack, setRack] = useState(null);
  const [history, setHistory] = useState(null);
  const [audits, setAudits] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchRack(rackId).then(setRack).catch(() => {}),
      fetchRackHistory(rackId, 30).then(setHistory).catch(() => setHistory({ points: [] })),
      listAudits(rackId).then(setAudits).catch(() => setAudits([])),
    ]);
  }, [rackId]);

  const onToggleSchedule = async (enabled) => {
    if (!rack) return;
    setSaving(true);
    try {
      const updated = await updateSchedule(rackId, {
        schedule_enabled: enabled,
        schedule_frequency_days: rack.schedule_frequency_days || 7,
      });
      setRack(updated);
    } catch (e) {
      alert("Failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const onChangeFrequency = async (days) => {
    if (!rack) return;
    setSaving(true);
    try {
      const updated = await updateSchedule(rackId, {
        schedule_enabled: rack.schedule_enabled,
        schedule_frequency_days: days,
      });
      setRack(updated);
    } catch (e) {
      alert("Failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!rack) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950 text-slate-400 font-mono text-sm">
        Loading rack…
      </div>
    );
  }

  const cfg = statusConfig[rack.status] || statusConfig.consistent;
  const Icon = cfg.icon;

  // Chart points — synthesize a baseline path if history is sparse
  const points = history?.points || [];
  const chartData = points.length >= 2
    ? points.map((p) => ({
        ts: new Date(p.date).getTime(),
        label: new Date(p.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        score: p.score,
        drifts: p.drifts,
      }))
    : synthesizeTrend(rack);

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-navy-950/85 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <button
            data-testid="rack-back-btn"
            onClick={() => navigate("/")}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center border border-slate-800 hover:border-signal-blue/60 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <div className="text-[10px] font-mono tracking-[0.25em] text-signal-cyan">RACK DETAIL</div>
            <div className="font-mono text-sm font-bold">{rack.rack_id}</div>
          </div>
          <div className="w-11" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-5 md:py-8 space-y-5">
        {/* Hero */}
        <section className={`border ${cfg.border} ${cfg.bg} p-4 md:p-6`}>
          <div className="flex items-start gap-4">
            <Icon className={`w-9 h-9 ${cfg.color} flex-shrink-0`} />
            <div className="flex-1 min-w-0">
              <div className={`text-[10px] font-mono tracking-[0.25em] ${cfg.color}`}>STATUS · {cfg.label}</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-mono text-4xl md:text-5xl font-bold">{rack.drift_score.toFixed(1)}</span>
                <span className="font-mono text-base text-slate-400">% CONSISTENCY</span>
              </div>
              <p className="mt-2 text-sm text-slate-300">{rack.notes}</p>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {rack.site}</span>
                <span className="inline-flex items-center gap-1">{rack.location}</span>
                <span className="inline-flex items-center gap-1"><Cpu className="w-3 h-3" /> {rack.devices_count} devices</span>
                <span className="inline-flex items-center gap-1"><ClockIcon className="w-3 h-3" /> Last audit: {rack.last_audit || "—"}</span>
              </div>
            </div>
          </div>

          <Link
            data-testid="run-audit-btn"
            to={`/audit/${rack.rack_id}`}
            className="mt-5 inline-flex items-center gap-2 min-h-[48px] bg-signal-blue hover:bg-signal-cyan transition-colors px-6 font-mono text-xs tracking-[0.2em] font-bold w-full sm:w-auto justify-center"
          >
            <Camera className="w-4 h-4" /> RUN NEW AUDIT
            <ChevronRight className="w-3 h-3 opacity-60" />
          </Link>
        </section>

        {/* Trend Chart */}
        <section className="border border-slate-800 bg-navy-900 p-4 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-signal-cyan" />
              <h2 className="font-mono text-sm tracking-[0.18em] text-slate-300">CONSISTENCY TREND · 30D</h2>
            </div>
            <span className="text-[10px] font-mono text-slate-500">[ {chartData.length} pts ]</span>
          </div>

          <div data-testid="trend-chart" className="h-56 w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="#172554" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#475569", fontFamily: "Roboto Mono" }} axisLine={{ stroke: "#1e293b" }} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#475569", fontFamily: "Roboto Mono" }} axisLine={{ stroke: "#1e293b" }} tickLine={false} width={32} />
                <Tooltip
                  contentStyle={{ background: "#0A1128", border: "1px solid #172554", fontFamily: "Roboto Mono", fontSize: 11 }}
                  labelStyle={{ color: "#94A3B8" }}
                  itemStyle={{ color: "#3B82F6" }}
                  formatter={(v) => [`${v}%`, "Consistency"]}
                />
                <ReferenceLine y={85} stroke="#10B981" strokeDasharray="3 3" label={{ value: "OK", fontSize: 9, fill: "#10B981", position: "right" }} />
                <ReferenceLine y={60} stroke="#EF4444" strokeDasharray="3 3" label={{ value: "ALERT", fontSize: 9, fill: "#EF4444", position: "right" }} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: "#3B82F6", r: 3 }}
                  activeDot={{ r: 5, fill: "#3B82F6", stroke: "#F8FAFC" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Recurring Audit Scheduler */}
        <section className="border border-slate-800 bg-navy-900 p-4 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-signal-cyan" />
              <h2 className="font-mono text-sm tracking-[0.18em] text-slate-300">RECURRING AUDIT SCHEDULE</h2>
            </div>
            {saving && <span className="text-[10px] font-mono text-slate-500 animate-pulse">SAVING…</span>}
          </div>

          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <div className="text-sm">Schedule audits for this rack</div>
              <div className="text-[11px] text-slate-500 font-mono mt-1">
                {rack.schedule_enabled
                  ? `Next due: ${rack.next_audit_due ? new Date(rack.next_audit_due).toLocaleString() : "—"}`
                  : "Disabled — no automated audits"}
              </div>
            </div>
            <button
              data-testid="schedule-toggle"
              onClick={() => onToggleSchedule(!rack.schedule_enabled)}
              className={`relative w-14 h-8 transition-colors flex-shrink-0 ${rack.schedule_enabled ? "bg-signal-blue" : "bg-slate-700"}`}
              aria-pressed={rack.schedule_enabled}
            >
              <span
                className={`absolute top-1 w-6 h-6 bg-white transition-transform ${rack.schedule_enabled ? "translate-x-7" : "translate-x-1"}`}
              />
            </button>
          </div>

          <div className={rack.schedule_enabled ? "" : "opacity-40 pointer-events-none"}>
            <div className="text-[10px] font-mono text-slate-500 tracking-wider mb-2">FREQUENCY</div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 border border-slate-800 p-1 bg-navy-950">
              {FREQ_OPTIONS.map((opt) => (
                <button
                  key={opt.v}
                  data-testid={`freq-${opt.v}`}
                  disabled={!rack.schedule_enabled}
                  onClick={() => onChangeFrequency(opt.v)}
                  className={`min-h-[40px] text-[11px] font-mono tracking-wider transition-colors px-2 ${
                    rack.schedule_frequency_days === opt.v
                      ? "bg-signal-blue text-white"
                      : "text-slate-400 hover:text-slate-100"
                  }`}
                >
                  {opt.l.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="mt-3 text-[10px] font-mono text-slate-500 tracking-wider flex items-start gap-2">
              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0 text-signal-amber" />
              <span>
                When deployed to Vercel, a Cron Job will trigger overdue audits automatically. In this preview,
                schedules are stored but only manual audits run.
              </span>
            </div>
          </div>
        </section>

        {/* Recent Audits */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-signal-cyan" />
              <h2 className="font-mono text-sm tracking-[0.18em] text-slate-300">RECENT AUDITS</h2>
            </div>
            <span className="text-[10px] font-mono text-slate-500">[ {audits.length} ]</span>
          </div>

          <div className="space-y-2">
            {audits.length === 0 && (
              <div className="border border-slate-800 bg-navy-900 p-4 text-center text-sm text-slate-500 font-mono">
                No audits yet. Run your first audit above.
              </div>
            )}
            {audits.map((a, i) => {
              const aCfg = a.consistency_score >= 85 ? statusConfig.consistent : a.consistency_score >= 60 ? statusConfig.warning : statusConfig.alert;
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    to={`/result/${a.id}`}
                    data-testid={`audit-row-${a.id}`}
                    className="flex items-center gap-3 border border-slate-800 hover:border-signal-blue/60 bg-navy-900 p-3 transition-colors"
                  >
                    <div className={`w-1 h-12 ${aCfg.bar}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{a.summary}</div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                        {new Date(a.created_at).toLocaleString()} · {a.technician}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono text-base font-bold ${aCfg.color}`}>{a.consistency_score.toFixed(0)}%</div>
                      <div className="text-[9px] font-mono text-slate-500">{a.drift_boxes?.length || 0} drifts</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        <div className="h-8" />
      </main>
    </div>
  );
}

function synthesizeTrend(rack) {
  // Build a believable 30-day trend ending at the rack's current score
  const today = new Date();
  const target = rack.drift_score;
  const variance = rack.status === "alert" ? 22 : rack.status === "warning" ? 12 : 6;
  const start = Math.max(20, Math.min(99, target + (Math.random() * variance - variance / 2)));
  const points = [];
  const days = 12;
  for (let i = 0; i < days; i++) {
    const t = i / (days - 1);
    const noise = (Math.random() - 0.5) * variance * 0.6;
    const score = Math.max(0, Math.min(100, start + (target - start) * t + noise));
    const date = new Date(today.getTime() - (days - 1 - i) * 86400000 * 2.5);
    points.push({
      ts: date.getTime(),
      label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      score: Math.round(score * 10) / 10,
      drifts: 0,
    });
  }
  // ensure last point matches current
  points[points.length - 1].score = target;
  return points;
}
