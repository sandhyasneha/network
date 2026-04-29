// /api/cron/recurring-audits.js
// Vercel Cron — runs every 6 hours (see vercel.json)
// Finds racks with next_audit_due in the past and emails the operator
// to remind them. (Actual capture must be done by a human technician via the app.)

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ALERT_FROM_EMAIL = process.env.ALERT_FROM_EMAIL;
const ALERT_TO_EMAIL = process.env.ALERT_TO_EMAIL;
const APP_BASE_URL = process.env.APP_BASE_URL;
const CRON_SECRET = process.env.CRON_SECRET;

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export default async function handler(req, res) {
  // Vercel cron sets `Authorization: Bearer ${CRON_SECRET}` automatically when
  // CRON_SECRET is set as an env var. Reject anything else.
  const auth = req.headers.authorization || "";
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const nowIso = new Date().toISOString();
  const { data: due, error } = await db
    .from("drift_racks")
    .select("rack_id, site, location, next_audit_due, schedule_frequency_days")
    .eq("schedule_enabled", true)
    .lt("next_audit_due", nowIso);

  if (error) return res.status(500).json({ error: error.message });

  if (!due || due.length === 0) {
    return res.status(200).json({ checked: 0, notified: 0, message: "No racks due." });
  }

  let notified = 0;
  if (RESEND_API_KEY && ALERT_TO_EMAIL) {
    const rows = due
      .map(
        (r) => `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #172554;font-family:'Roboto Mono',monospace;color:#3B82F6;">${r.rack_id}</td>
            <td style="padding:8px;border-bottom:1px solid #172554;color:#F8FAFC;">${r.site} · ${r.location}</td>
            <td style="padding:8px;border-bottom:1px solid #172554;color:#94A3B8;">Every ${r.schedule_frequency_days}d</td>
            <td style="padding:8px;border-bottom:1px solid #172554;"><a href="${APP_BASE_URL || ""}/audit/${r.rack_id}" style="color:#10B981;">Run audit ▸</a></td>
          </tr>`
      )
      .join("");

    const html = `
      <div style="font-family: Inter, system-ui, sans-serif; background:#050B14; color:#F8FAFC; padding:24px;">
        <h1 style="font-family: 'Roboto Mono', monospace; color:#3B82F6; letter-spacing:0.1em;">NEXPLAN · ${due.length} AUDITS DUE</h1>
        <p>The following racks are overdue for a scheduled visual drift audit:</p>
        <table style="border-collapse:collapse;width:100%;margin-top:12px;background:#0A1128;">
          <thead>
            <tr>
              <th style="padding:8px;text-align:left;border-bottom:1px solid #172554;color:#94A3B8;font-family:'Roboto Mono',monospace;font-size:11px;letter-spacing:0.1em;">RACK</th>
              <th style="padding:8px;text-align:left;border-bottom:1px solid #172554;color:#94A3B8;font-family:'Roboto Mono',monospace;font-size:11px;letter-spacing:0.1em;">LOCATION</th>
              <th style="padding:8px;text-align:left;border-bottom:1px solid #172554;color:#94A3B8;font-family:'Roboto Mono',monospace;font-size:11px;letter-spacing:0.1em;">CADENCE</th>
              <th></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: ALERT_FROM_EMAIL,
        to: [ALERT_TO_EMAIL],
        subject: `Nexplan · ${due.length} rack${due.length > 1 ? "s" : ""} due for audit`,
        html,
      }),
    });
    if (r.ok) notified = due.length;
  }

  return res.status(200).json({ checked: due.length, notified, due: due.map((d) => d.rack_id) });
}
