// frontend/src/lib/api.js — Supabase + Vercel API replacement.
// Drop in over the existing /app/frontend/src/lib/api.js when deploying to Vercel.
// Reads racks/audits directly from Supabase (RLS protects them).
// Calls Vercel /api/analyze-drift for AI drift detection (server-side key).

import { supabase, getAccessToken } from "@/lib/supabase";

export const fetchRacks = async () => {
  const { data, error } = await supabase
    .from("drift_racks")
    .select("*")
    .order("status", { ascending: true })
    .order("rack_id", { ascending: true });
  if (error) throw error;
  return data;
};

export const fetchSiteStats = async () => {
  const { data, error } = await supabase.from("drift_site_stats").select("*").single();
  if (error) throw error;
  return data;
};

export const fetchRack = async (rackId) => {
  const { data, error } = await supabase.from("drift_racks").select("*").eq("rack_id", rackId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Rack not found");
  return data;
};

export const updateSchedule = async (rackId, payload) => {
  const next_due = payload.schedule_enabled
    ? new Date(Date.now() + payload.schedule_frequency_days * 86400000).toISOString()
    : null;
  const { data, error } = await supabase
    .from("drift_racks")
    .update({
      schedule_enabled: payload.schedule_enabled,
      schedule_frequency_days: payload.schedule_frequency_days,
      next_audit_due: next_due,
    })
    .eq("rack_id", rackId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
};

export const fetchRackHistory = async (rackId, days = 30) => {
  const cutoff = new Date(Date.now() - days * 86400000).toISOString();
  const { data, error } = await supabase
    .from("drift_audits")
    .select("id, created_at, consistency_score, drift_boxes")
    .eq("rack_id", rackId)
    .gte("created_at", cutoff)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return {
    rack_id: rackId,
    days,
    points: (data || []).map((a) => ({
      audit_id: a.id,
      date: a.created_at,
      score: a.consistency_score,
      drifts: (a.drift_boxes || []).length,
    })),
  };
};

// Audits: writes go through Vercel /api/analyze-drift so the AI key stays server-side.
export const createAudit = async (payload) => {
  const token = await getAccessToken();
  const r = await fetch("/api/analyze-drift", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error((await r.json()).error || "Audit failed");
  return r.json();
};

export const fetchAudit = async (auditId) => {
  const { data, error } = await supabase.from("drift_audits").select("*").eq("id", auditId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Audit not found");
  return data;
};

export const listAudits = async (rackId) => {
  const { data, error } = await supabase
    .from("drift_audits")
    .select("*")
    .eq("rack_id", rackId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data;
};
