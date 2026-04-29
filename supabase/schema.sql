-- =====================================================================
-- Nexplan Visual Drift — Supabase Postgres schema
-- Run in Supabase Dashboard → SQL Editor → New Query
-- =====================================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- =====================================================================
-- Tables
-- =====================================================================

create table if not exists public.drift_racks (
    id uuid primary key default uuid_generate_v4(),
    rack_id text unique not null,
    site text not null,
    location text not null,
    baseline_image_url text not null,
    drift_score numeric(5,2) not null default 100,
    status text not null default 'consistent',          -- consistent | warning | alert
    last_audit text,
    devices_count int not null default 0,
    notes text,
    schedule_enabled boolean not null default false,
    schedule_frequency_days int not null default 7,
    next_audit_due timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists drift_racks_status_idx on public.drift_racks (status);
create index if not exists drift_racks_next_audit_due_idx on public.drift_racks (next_audit_due);

create table if not exists public.drift_audits (
    id uuid primary key default uuid_generate_v4(),
    rack_id text not null references public.drift_racks(rack_id) on delete cascade,
    consistency_score numeric(5,2) not null,
    drift_boxes jsonb not null default '[]'::jsonb,
    summary text not null,
    baseline_image_url text not null,
    current_image_b64 text,
    technician text,
    user_email text,
    user_id uuid,                                       -- supabase auth uid
    created_at timestamptz not null default now()
);

create index if not exists drift_audits_rack_id_idx on public.drift_audits (rack_id);
create index if not exists drift_audits_created_at_idx on public.drift_audits (created_at desc);

-- =====================================================================
-- Row-Level Security (RLS)
-- All authenticated users can read & write (per your "auth user can do everything" choice)
-- =====================================================================

alter table public.drift_racks enable row level security;
alter table public.drift_audits enable row level security;

drop policy if exists "drift_racks_authenticated_select" on public.drift_racks;
create policy "drift_racks_authenticated_select" on public.drift_racks
    for select to authenticated using (true);

drop policy if exists "drift_racks_authenticated_modify" on public.drift_racks;
create policy "drift_racks_authenticated_modify" on public.drift_racks
    for all to authenticated using (true) with check (true);

drop policy if exists "drift_audits_authenticated_select" on public.drift_audits;
create policy "drift_audits_authenticated_select" on public.drift_audits
    for select to authenticated using (true);

drop policy if exists "drift_audits_authenticated_insert" on public.drift_audits;
create policy "drift_audits_authenticated_insert" on public.drift_audits
    for insert to authenticated with check (true);

-- service_role bypasses RLS automatically (used by cron + edge functions)

-- =====================================================================
-- Trigger — after each audit insert, update the parent rack
-- =====================================================================

create or replace function public.update_rack_after_audit()
returns trigger
language plpgsql
security definer
as $$
declare
    new_status text;
    new_next_due timestamptz;
    rack_row public.drift_racks%rowtype;
begin
    if new.consistency_score >= 85 then
        new_status := 'consistent';
    elsif new.consistency_score >= 60 then
        new_status := 'warning';
    else
        new_status := 'alert';
    end if;

    select * into rack_row from public.drift_racks where rack_id = new.rack_id;
    if rack_row.schedule_enabled then
        new_next_due := now() + make_interval(days => rack_row.schedule_frequency_days);
    end if;

    update public.drift_racks
        set drift_score = new.consistency_score,
            status = new_status,
            last_audit = 'just now',
            next_audit_due = coalesce(new_next_due, next_audit_due),
            updated_at = now()
        where rack_id = new.rack_id;

    return new;
end;
$$;

drop trigger if exists trg_drift_audits_update_rack on public.drift_audits;
create trigger trg_drift_audits_update_rack
    after insert on public.drift_audits
    for each row execute function public.update_rack_after_audit();

-- =====================================================================
-- View for site stats (used by frontend)
-- =====================================================================

create or replace view public.drift_site_stats as
select
    count(*)::int as total_racks,
    sum(case when status = 'alert' then 1 else 0 end)::int as alerts,
    sum(case when status = 'warning' then 1 else 0 end)::int as warnings,
    sum(case when status = 'consistent' then 1 else 0 end)::int as consistent,
    round(avg(drift_score)::numeric, 1) as avg_consistency,
    count(distinct site)::int as sites,
    sum(case when schedule_enabled then 1 else 0 end)::int as scheduled
from public.drift_racks;

grant select on public.drift_site_stats to authenticated;
