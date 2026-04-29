-- =====================================================================
-- Nexplan Visual Drift — seed data (6 demo racks across 4 sites)
-- Run AFTER schema.sql
-- =====================================================================

insert into public.drift_racks (rack_id, site, location, baseline_image_url, drift_score, status, last_audit, devices_count, notes, schedule_enabled, schedule_frequency_days)
values
    ('A-01', 'NYC-DC-01', 'Row A / Aisle 3',
     'https://images.unsplash.com/photo-1775519520461-6b6e068d9250?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTN8MHwxfHNlYXJjaHwzfHxzZXJ2ZXIlMjByYWNrJTIwZGF0YSUyMGNlbnRlcnxlbnwwfHx8fDE3NzczMjI4NDF8MA&ixlib=rb-4.1.0&q=85',
     98.0, 'consistent', '2 hours ago', 24, 'Fully compliant. No drift detected.', true, 7),

    ('B-04', 'NYC-DC-01', 'Row B / Aisle 1',
     'https://images.unsplash.com/photo-1775519520461-6b6e068d9250?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTN8MHwxfHNlYXJjaHwzfHxzZXJ2ZXIlMjByYWNrJTIwZGF0YSUyMGNlbnRlcnxlbnwwfHx8fDE3NzczMjI4NDF8MA&ixlib=rb-4.1.0&q=85',
     12.0, 'alert', '6 hours ago', 18, 'CRITICAL: Unknown device detected. Rack door open.', true, 1),

    ('C-07', 'NYC-DC-02', 'Row C / Aisle 5',
     'https://images.unsplash.com/photo-1775519520461-6b6e068d9250?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTN8MHwxfHNlYXJjaHwzfHxzZXJ2ZXIlMjByYWNrJTIwZGF0YSUyMGNlbnRlcnxlbnwwfHx8fDE3NzczMjI4NDF8MA&ixlib=rb-4.1.0&q=85',
     76.0, 'warning', 'Yesterday', 22, 'Minor drift: 2 cable displacements noted.', false, 14),

    ('D-12', 'LON-DC-01', 'Row D / Aisle 2',
     'https://images.unsplash.com/photo-1775519520461-6b6e068d9250?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTN8MHwxfHNlYXJjaHwzfHxzZXJ2ZXIlMjByYWNrJTIwZGF0YSUyMGNlbnRlcnxlbnwwfHx8fDE3NzczMjI4NDF8MA&ixlib=rb-4.1.0&q=85',
     94.0, 'consistent', '1 hour ago', 30, 'Within tolerance.', true, 7),

    ('E-03', 'LON-DC-01', 'Row E / Aisle 4',
     'https://images.unsplash.com/photo-1775519520461-6b6e068d9250?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTN8MHwxfHNlYXJjaHwzfHxzZXJ2ZXIlMjByYWNrJTIwZGF0YSUyMGNlbnRlcnxlbnwwfHx8fDE3NzczMjI4NDF8MA&ixlib=rb-4.1.0&q=85',
     88.0, 'consistent', '4 hours ago', 16, 'Routine check passed.', false, 30),

    ('F-09', 'TKY-DC-01', 'Row F / Aisle 1',
     'https://images.unsplash.com/photo-1775519520461-6b6e068d9250?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTN8MHwxfHNlYXJjaHwzfHxzZXJ2ZXIlMjByYWNrJTIwZGF0YSUyMGNlbnRlcnxlbnwwfHx8fDE3NzczMjI4NDF8MA&ixlib=rb-4.1.0&q=85',
     45.0, 'warning', '3 days ago', 20, 'Requires re-audit. Multiple displacements.', true, 3)
on conflict (rack_id) do nothing;
