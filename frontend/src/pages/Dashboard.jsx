import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity, AlertTriangle, ChevronRight, CircuitBoard, Cpu,
  Filter, LogOut, MapPin, Radar, Search, Server, Shield, ShieldAlert, ShieldCheck,
} from "lucide-react";
import { fetchRacks, fetchSiteStats } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const statusConfig = {
  consistent: {
    label: "CONSISTENT",
    color: "text-signal-green",
    bg: "bg-signal-green/10",
    border: "border-signal-green/40",
    bar: "bg-signal-green",
    icon: ShieldCheck,
    dot: "bg-signal-green",
  },
  warning: {
    label: "WARNING",
    color: "text-signal-amber",
    bg: "bg-signal-amber/10",
    border: "border-signal-amber/40",
    bar: "bg-signal-amber",
    icon: Shield,
    dot: "bg-signal-amber",
  },
  alert: {
    label: "ALERT",
    color: "text-signal-red",
    bg: "bg-signal-red/10",
    border: "border-signal-red/50",
    bar: "bg-signal-red",
    icon: ShieldAlert,
    dot: "bg-signal-red animate-pulse",
  },
};

function KpiTile({ label, value, sub, accent = "text-slate-100", testid }) {
  return (
    <div data-testid={testid} className="border border-slate-800 bg-navy-900 p-4 relative overflow-hidden">
      <div className="text-[10px] tracking-[0.18em] text-slate-500 font-mono uppercase">{label}</div>
      <div className={`mt-2 font-mono text-3xl font-bold ${accent}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
      <div className="absolute -right-6 -bottom-6 opacity-[0.04] text-[80px] font-mono">▌</div>
    </div>
  );
}

function RackRow({ rack, index }) {
  const cfg = statusConfig[rack.status] || statusConfig.consistent;
  const Icon = cfg.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
    >
      <Link
        to={`/rack/${rack.rack_id}`}
        data-testid={`rack-row-${rack.rack_id}`}
        className="group block border border-slate-800 hover:border-signal-blue/60 transition-colors bg-navy-900 hover:bg-navy-800/60"
      >
        <div className="flex items-stretch">
          {/* Left status bar */}
          <div className={`w-1 ${cfg.bar}`} />

          <div className="flex-1 p-4 flex items-center gap-4">
            <div className="hidden sm:flex items-center justify-center w-10 h-10 border border-slate-800 bg-navy-950">
              <Server className="w-5 h-5 text-slate-400" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-base font-bold tracking-tight">RACK {rack.rack_id}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                  <span className={`inline-block w-1.5 h-1.5 mr-1.5 align-middle ${cfg.dot}`} />
                  {cfg.label}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {rack.site}</span>
                <span className="text-slate-600">·</span>
                <span>{rack.location}</span>
                <span className="text-slate-600">·</span>
                <span className="inline-flex items-center gap-1"><Cpu className="w-3 h-3" /> {rack.devices_count} devices</span>
              </div>

              {/* Drift bar */}
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-slate-800 relative overflow-hidden">
                  <div
                    className={`h-full ${cfg.bar}`}
                    style={{ width: `${rack.drift_score}%` }}
                  />
                </div>
                <span className={`font-mono text-xs ${cfg.color} w-14 text-right`}>{rack.drift_score.toFixed(0)}%</span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 text-right">
              <Icon className={`w-5 h-5 ${cfg.color}`} />
              <span className="text-[10px] text-slate-500 font-mono">{rack.last_audit}</span>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-signal-blue transition-colors" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [racks, setRacks] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchRacks(), fetchSiteStats()])
      .then(([r, s]) => {
        if (!mounted) return;
        setRacks(r);
        setStats(s);
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return racks.filter((r) => {
      const matchSearch =
        !search ||
        r.rack_id.toLowerCase().includes(search.toLowerCase()) ||
        r.site.toLowerCase().includes(search.toLowerCase()) ||
        r.location.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "all" || r.status === filter;
      return matchSearch && matchFilter;
    });
  }, [racks, search, filter]);

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 relative">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-navy-950/85 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 border border-signal-blue/60 bg-signal-blue/10 flex items-center justify-center">
              <Radar className="w-5 h-5 text-signal-cyan" />
            </div>
            <div>
              <div className="font-mono text-sm font-bold tracking-[0.2em]">NEXPLAN</div>
              <div className="text-[10px] text-slate-500 font-mono tracking-[0.2em]">VISUAL DRIFT v1.0</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-mono text-signal-green border border-signal-green/30 bg-signal-green/5 px-2 py-1">
              <span className="w-1.5 h-1.5 bg-signal-green animate-pulse rounded-full" />
              LIVE
            </span>
            {user && (
              <div className="flex items-center gap-2 border border-slate-800 px-2 py-1.5 hover:border-signal-blue/60 transition-colors">
                {user.picture ? (
                  <img src={user.picture} alt="" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-signal-blue/20 flex items-center justify-center text-[10px] font-mono text-signal-cyan">
                    {(user.name || user.email).slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:block text-[10px] font-mono leading-tight">
                  <div className="text-slate-200 truncate max-w-[120px]">{user.name || user.email.split("@")[0]}</div>
                  <div className="text-slate-500 truncate max-w-[120px]">{user.email}</div>
                </div>
                <button
                  data-testid="logout-btn"
                  onClick={logout}
                  className="ml-1 p-1 text-slate-400 hover:text-signal-red transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Strip */}
      <section className="bg-grid border-b border-slate-800 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 relative">
          <div className="text-[10px] font-mono tracking-[0.3em] text-signal-cyan/80">SITE HEALTH · {new Date().toUTCString().slice(5, 22)} UTC</div>
          <h1 className="mt-3 text-3xl md:text-5xl font-mono font-bold tracking-tight leading-[1.05]">
            Visual Drift<br />
            <span className="text-signal-cyan">Intelligence Console</span>
          </h1>
          <p className="mt-4 max-w-xl text-slate-400 text-sm md:text-base">
            Continuous AI verification of every rack, every cable, every device — against the Golden Baseline.
            Detect unauthorized hardware, missing cables, and physical drift before they become incidents.
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
        {/* KPI Grid */}
        <section data-testid="kpi-grid" className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
          <KpiTile testid="kpi-total" label="Total Racks" value={stats?.total_racks ?? "—"} sub={`${stats?.sites ?? 0} sites monitored`} accent="text-slate-100" />
          <KpiTile testid="kpi-avg" label="Avg Consistency" value={stats ? `${stats.avg_consistency}%` : "—"} sub="Across all sites" accent="text-signal-cyan" />
          <KpiTile testid="kpi-warnings" label="Warnings" value={stats?.warnings ?? "—"} sub="Re-audit recommended" accent="text-signal-amber" />
          <KpiTile testid="kpi-alerts" label="Active Alerts" value={stats?.alerts ?? "—"} sub="Immediate attention" accent="text-signal-red" />
        </section>

        {/* Filters */}
        <section className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <div className="flex items-center gap-2 flex-1 border border-slate-800 bg-navy-900 px-3 py-2 min-h-[44px]">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              data-testid="rack-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search racks, sites, aisles…"
              className="bg-transparent outline-none flex-1 text-sm placeholder:text-slate-600"
            />
          </div>
          <div className="flex items-center gap-1 border border-slate-800 bg-navy-900 p-1">
            {[
              { k: "all", l: "All" },
              { k: "alert", l: "Alerts" },
              { k: "warning", l: "Warnings" },
              { k: "consistent", l: "Consistent" },
            ].map((opt) => (
              <button
                key={opt.k}
                data-testid={`filter-${opt.k}`}
                onClick={() => setFilter(opt.k)}
                className={`px-3 min-h-[36px] text-xs font-mono tracking-wider transition-colors ${
                  filter === opt.k
                    ? "bg-signal-blue text-white"
                    : "text-slate-400 hover:text-slate-100"
                }`}
              >
                {opt.l.toUpperCase()}
              </button>
            ))}
          </div>
        </section>

        {/* Section header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CircuitBoard className="w-4 h-4 text-signal-cyan" />
            <h2 className="font-mono text-sm tracking-[0.18em] text-slate-300">RACK INVENTORY</h2>
            <span className="text-[10px] font-mono text-slate-500">[ {filtered.length} / {racks.length} ]</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 hidden sm:flex items-center gap-1">
            <Filter className="w-3 h-3" /> sort: priority
          </div>
        </div>

        {/* Rack list */}
        <section data-testid="rack-list" className="space-y-2">
          {loading && (
            <div className="border border-slate-800 bg-navy-900 p-8 text-center font-mono text-sm text-slate-500">
              <Activity className="w-5 h-5 mx-auto mb-2 animate-pulse text-signal-cyan" />
              Loading rack telemetry…
            </div>
          )}
          {err && (
            <div className="border border-signal-red/50 bg-signal-red/10 p-4 text-sm text-signal-red font-mono">
              <AlertTriangle className="w-4 h-4 inline mr-2" /> {err}
            </div>
          )}
          {!loading && filtered.map((r, i) => (
            <RackRow key={r.id} rack={r} index={i} />
          ))}
          {!loading && filtered.length === 0 && (
            <div className="border border-slate-800 bg-navy-900 p-8 text-center text-sm text-slate-500 font-mono">
              No racks match your filters.
            </div>
          )}
        </section>

        <footer className="mt-16 pb-8 border-t border-slate-800 pt-6 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-[10px] font-mono text-slate-600 tracking-[0.15em]">
          <span>NEXPLAN © 2026 · ENTERPRISE INFRASTRUCTURE INTELLIGENCE</span>
          <span>BUILD 1.0.0 · GEMINI 2.5 PRO VISION</span>
        </footer>
      </main>
    </div>
  );
}
