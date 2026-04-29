import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, AlertTriangle, CheckCircle2, Download, FileText, MoveHorizontal,
  ShieldAlert, ShieldCheck, Zap,
} from "lucide-react";
import jsPDF from "jspdf";
import { fetchAudit, fetchRack } from "@/lib/api";

const severityClass = {
  high: "drift-box-high",
  medium: "drift-box-medium",
  low: "drift-box-low",
};

const severityLabel = {
  high: "HIGH",
  medium: "MED",
  low: "LOW",
};

const severityText = {
  high: "text-signal-red",
  medium: "text-signal-amber",
  low: "text-signal-cyan",
};

export default function DriftResult() {
  const { auditId } = useParams();
  const navigate = useNavigate();
  const [audit, setAudit] = useState(null);
  const [rack, setRack] = useState(null);
  const [pos, setPos] = useState(50);
  const [err, setErr] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchAudit(auditId)
      .then(async (a) => {
        setAudit(a);
        try {
          const r = await fetchRack(a.rack_id);
          setRack(r);
        } catch {}
      })
      .catch((e) => setErr(e.message));
  }, [auditId]);

  const generateReport = () => {
    if (!audit) return;
    // Build a polished, branded PDF for the CIO
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    let y = 60;

    // Header band
    doc.setFillColor(10, 17, 40); // navy-900
    doc.rect(0, 0, W, 80, "F");
    doc.setTextColor(59, 130, 246);
    doc.setFont("courier", "bold");
    doc.setFontSize(11);
    doc.text("NEXPLAN · VISUAL DRIFT", 40, 36);
    doc.setTextColor(148, 163, 184);
    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    doc.text("EXECUTIVE BRIEF FOR CIO", 40, 54);
    doc.setFontSize(8);
    doc.text(new Date().toUTCString(), W - 40, 54, { align: "right" });

    y = 120;
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(`Rack ${audit.rack_id} · Drift Audit`, 40, y);

    y += 22;
    doc.setFont("courier", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Site: ${rack?.site || "—"}   ·   ${rack?.location || "—"}   ·   ${audit.devices_count || rack?.devices_count || 0} devices`, 40, y);

    // Score box
    y += 30;
    const isAlertReport = audit.consistency_score < 60;
    const isWarn = audit.consistency_score >= 60 && audit.consistency_score < 85;
    const fill = isAlertReport ? [239, 68, 68] : isWarn ? [245, 158, 11] : [16, 185, 129];
    doc.setFillColor(...fill);
    doc.rect(40, y, 160, 70, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.text(`${audit.consistency_score.toFixed(1)}%`, 50, y + 36);
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.text("CONSISTENCY", 50, y + 52);
    doc.setFontSize(10);
    doc.text(isAlertReport ? "DRIFT DETECTED" : isWarn ? "MINOR DRIFT" : "BASELINE MATCH", 50, y + 64);

    // Summary block
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Summary", 220, y + 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    const summaryLines = doc.splitTextToSize(audit.summary, W - 280);
    doc.text(summaryLines, 220, y + 32);

    y += 100;
    doc.setDrawColor(226, 232, 240);
    doc.line(40, y, W - 40, y);
    y += 24;

    // Anomalies
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(`Detected Anomalies (${audit.drift_boxes.length})`, 40, y);
    y += 18;

    if (audit.drift_boxes.length === 0) {
      doc.setTextColor(16, 185, 129);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("✓ No anomalies detected — within tolerance.", 40, y);
      y += 16;
    } else {
      audit.drift_boxes.forEach((b, i) => {
        if (y > 760) {
          doc.addPage();
          y = 60;
        }
        const sevColor = b.severity === "high" ? [239, 68, 68] : b.severity === "medium" ? [245, 158, 11] : [59, 130, 246];
        doc.setFillColor(...sevColor);
        doc.rect(40, y - 9, 4, 14, "F");
        doc.setFont("courier", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...sevColor);
        doc.text(b.severity.toUpperCase(), 52, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        const labelLines = doc.splitTextToSize(`${i + 1}. ${b.label}`, W - 200);
        doc.text(labelLines, 95, y);
        doc.setTextColor(100, 116, 139);
        doc.setFont("courier", "normal");
        doc.setFontSize(8);
        doc.text(`@ (${(b.x * 100).toFixed(0)}%, ${(b.y * 100).toFixed(0)}%) · ${(b.width * 100).toFixed(0)}×${(b.height * 100).toFixed(0)}`, W - 40, y, { align: "right" });
        y += Math.max(16, labelLines.length * 12);
      });
    }

    // Footer with metadata
    y = Math.max(y + 24, 760);
    doc.setDrawColor(226, 232, 240);
    doc.line(40, y, W - 40, y);
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Audit ID: ${audit.id}`, 40, y + 14);
    doc.text(`Technician: ${audit.technician || "—"}`, 40, y + 26);
    doc.text(`Generated: ${new Date().toISOString()}`, 40, y + 38);
    doc.text("Powered by Gemini 2.5 Pro Vision", W - 40, y + 38, { align: "right" });

    doc.save(`nexplan-drift-${audit.rack_id}-${audit.id.slice(0, 8)}.pdf`);
  };

  if (err) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950 p-4">
        <div className="border border-signal-red/50 bg-signal-red/10 p-4 max-w-md text-sm font-mono text-signal-red">
          <AlertTriangle className="w-4 h-4 inline mr-2" /> {err}
        </div>
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950 text-slate-400 font-mono text-sm">
        Loading audit…
      </div>
    );
  }

  const score = audit.consistency_score;
  const isAlert = score < 60;
  const isWarning = score >= 60 && score < 85;
  const StatusIcon = isAlert ? ShieldAlert : isWarning ? AlertTriangle : ShieldCheck;
  const statusColor = isAlert ? "text-signal-red" : isWarning ? "text-signal-amber" : "text-signal-green";
  const statusBg = isAlert ? "bg-signal-red/10 border-signal-red/40" : isWarning ? "bg-signal-amber/10 border-signal-amber/40" : "bg-signal-green/10 border-signal-green/40";
  const statusLabel = isAlert ? "DRIFT DETECTED" : isWarning ? "MINOR DRIFT" : "BASELINE MATCH";

  // Build before/after slider images:
  //  - left (baseline) always uses the rack's golden baseline URL
  //  - right (current) uses the actual captured snapshot stored as base64
  const baselineUrl = audit.baseline_image_url;
  const currentUrl = audit.current_image_b64
    ? `data:image/jpeg;base64,${audit.current_image_b64}`
    : audit.baseline_image_url;

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 relative">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-navy-950/85 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <button
            data-testid="result-back-btn"
            onClick={() => navigate("/")}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center border border-slate-800 hover:border-signal-blue/60 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <div className="text-[10px] font-mono tracking-[0.25em] text-signal-cyan">DRIFT REPORT</div>
            <div className="font-mono text-sm font-bold">RACK {audit.rack_id}</div>
          </div>
          <div className="w-11" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-5 md:py-8">
        {/* Status hero */}
        <section className={`border ${statusBg} p-4 md:p-6 mb-5`}>
          <div className="flex items-start gap-4">
            <StatusIcon className={`w-10 h-10 ${statusColor} flex-shrink-0`} />
            <div className="flex-1 min-w-0">
              <div className={`text-[10px] font-mono tracking-[0.25em] ${statusColor}`}>STATUS · {statusLabel}</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-mono text-4xl md:text-5xl font-bold">{score.toFixed(1)}</span>
                <span className="font-mono text-lg text-slate-400">% CONSISTENCY</span>
              </div>
              <p className="mt-2 text-sm text-slate-300">{audit.summary}</p>
            </div>
            <div className="hidden sm:flex flex-col items-end text-right gap-1">
              <span className="text-[10px] font-mono text-slate-500 tracking-wider">DRIFTS DETECTED</span>
              <span className={`font-mono text-3xl font-bold ${audit.drift_boxes.length > 0 ? "text-signal-red" : "text-signal-green"}`}>
                {audit.drift_boxes.length}
              </span>
            </div>
          </div>

          {/* progress bar */}
          <div className="mt-5 h-1.5 bg-slate-800 relative overflow-hidden">
            <div
              className={`h-full ${isAlert ? "bg-signal-red" : isWarning ? "bg-signal-amber" : "bg-signal-green"}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </section>

        {/* Compare slider */}
        <section className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-mono text-sm tracking-[0.18em] text-slate-300">VISUAL COMPARISON</h2>
            <span className="text-[10px] font-mono text-slate-500 inline-flex items-center gap-1">
              <MoveHorizontal className="w-3 h-3" /> drag to reveal
            </span>
          </div>

          <div
            ref={containerRef}
            data-testid="compare-container"
            className="relative w-full aspect-[4/3] md:aspect-[16/10] border border-slate-800 bg-navy-900 overflow-hidden select-none"
          >
            {/* Right side — Current snapshot (with drift boxes) */}
            <img
              src={currentUrl}
              alt="current"
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />

            {/* Drift boxes over current snapshot */}
            {audit.drift_boxes.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.25 }}
                className={`absolute ${severityClass[b.severity] || "drift-box-medium"}`}
                style={{
                  left: `${b.x * 100}%`,
                  top: `${b.y * 100}%`,
                  width: `${b.width * 100}%`,
                  height: `${b.height * 100}%`,
                }}
              >
                <span className={`absolute -top-6 left-0 text-[10px] font-mono tracking-wider px-2 py-0.5 bg-black/80 backdrop-blur-sm border border-current ${severityText[b.severity] || severityText.medium}`}>
                  {severityLabel[b.severity] || "MED"} · {b.label}
                </span>
              </motion.div>
            ))}

            {/* Left side — Golden Baseline (clipped from left to slider position) */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ width: `${pos}%` }}
            >
              <img
                src={baselineUrl}
                alt="baseline"
                className="absolute inset-0 h-full object-cover"
                style={{ width: containerRef.current?.clientWidth || "100%" }}
                draggable={false}
              />
              {/* Baseline tag */}
              <div className="absolute top-3 left-3 text-[10px] font-mono tracking-[0.2em] px-2 py-1 bg-black/70 border border-signal-green/40 text-signal-green backdrop-blur-sm">
                ◀ GOLDEN BASELINE · DAY 1
              </div>
            </div>

            {/* Current tag (right) */}
            <div className="absolute top-3 right-3 text-[10px] font-mono tracking-[0.2em] px-2 py-1 bg-black/70 border border-signal-red/40 text-signal-red backdrop-blur-sm">
              CURRENT · TODAY ▶
            </div>

            {/* Slider handle */}
            <div
              className="absolute top-0 bottom-0 z-20 pointer-events-none"
              style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
            >
              <div className="absolute inset-y-0 w-[2px] bg-signal-cyan shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2 w-10 h-10 rounded-full bg-signal-cyan/15 border-2 border-signal-cyan flex items-center justify-center backdrop-blur-sm">
                <MoveHorizontal className="w-4 h-4 text-signal-cyan" />
              </div>
            </div>

            <input
              data-testid="compare-slider"
              type="range"
              min={0}
              max={100}
              step={0.1}
              value={pos}
              onChange={(e) => setPos(parseFloat(e.target.value))}
              className="compare-slider"
              aria-label="Compare slider"
            />
          </div>
        </section>

        {/* Drift list */}
        <section className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-mono text-sm tracking-[0.18em] text-slate-300">DETECTED ANOMALIES</h2>
            <span className="text-[10px] font-mono text-slate-500">[ {audit.drift_boxes.length} ]</span>
          </div>
          <div data-testid="drift-list" className="space-y-2">
            {audit.drift_boxes.length === 0 && (
              <div className="border border-signal-green/30 bg-signal-green/5 p-4 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-signal-green" />
                <span className="text-sm font-mono text-signal-green">No anomalies detected — within tolerance.</span>
              </div>
            )}
            {audit.drift_boxes.map((b, i) => (
              <div key={i} className={`border border-slate-800 bg-navy-900 p-3 flex items-center gap-3`}>
                <div className={`w-2 h-12 ${b.severity === "high" ? "bg-signal-red" : b.severity === "medium" ? "bg-signal-amber" : "bg-signal-cyan"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{b.label}</div>
                  <div className="text-[10px] font-mono text-slate-500 mt-0.5 tracking-wider">
                    @ ({(b.x * 100).toFixed(0)}%, {(b.y * 100).toFixed(0)}%) · {(b.width * 100).toFixed(0)}×{(b.height * 100).toFixed(0)}
                  </div>
                </div>
                <span className={`text-[10px] font-mono px-2 py-1 border ${
                  b.severity === "high" ? "border-signal-red/50 text-signal-red bg-signal-red/10"
                    : b.severity === "medium" ? "border-signal-amber/50 text-signal-amber bg-signal-amber/10"
                    : "border-signal-cyan/50 text-signal-cyan bg-signal-cyan/10"
                }`}>
                  {severityLabel[b.severity] || "MED"}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Meta */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
          <Meta label="RACK" value={audit.rack_id} />
          <Meta label="SITE" value={rack?.site || "—"} />
          <Meta label="TECHNICIAN" value={audit.technician} />
          <Meta label="AUDIT TS" value={new Date(audit.created_at).toLocaleString()} />
        </section>

        {/* Actions */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 sticky bottom-3">
          <Link
            data-testid="back-to-dashboard-btn"
            to="/"
            className="min-h-[52px] flex items-center justify-center gap-2 border border-slate-800 hover:border-signal-blue/60 bg-navy-900 font-mono text-xs tracking-[0.2em] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> RETURN TO CONSOLE
          </Link>
          <button
            data-testid="generate-cio-report-btn"
            onClick={generateReport}
            className="min-h-[52px] flex items-center justify-center gap-2 bg-signal-blue hover:bg-signal-cyan transition-colors font-mono text-xs tracking-[0.2em] font-bold"
          >
            <FileText className="w-4 h-4" /> GENERATE REPORT FOR CIO
            <Download className="w-3 h-3 opacity-60" />
          </button>
        </section>

        <footer className="mt-8 mb-6 text-[10px] font-mono text-slate-600 tracking-[0.15em] flex items-center justify-between">
          <span>AUDIT_ID · {audit.id.slice(0, 12)}</span>
          <span className="inline-flex items-center gap-1"><Zap className="w-3 h-3" /> GEMINI 2.5 PRO</span>
        </footer>
      </main>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div className="border border-slate-800 bg-navy-900 p-3">
      <div className="text-[9px] font-mono tracking-[0.2em] text-slate-500">{label}</div>
      <div className="font-mono text-sm mt-1 truncate">{value}</div>
    </div>
  );
}
