-- =====================================================================
-- PHASE 3 — OPERATIONS DEPTH: Timesheet Automation Trigger
-- Migration: 20260714000006_phase3_timesheet_triggers.sql
-- Date: 2026-07-14
-- =====================================================================

CREATE OR REPLACE FUNCTION public.fn_auto_log_timesheet_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff_id uuid;
  v_last_entry_id uuid;
  v_duration numeric(8, 2);
BEGIN
  -- We track timesheet entries for the assigned technician (assigned_staff_id)
  v_staff_id := NEW.assigned_staff_id;
  
  IF v_staff_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- 1. IF TRANSITIONING TO 'Dispatched' (starts driving) OR 'In Progress' (onsite work)
  IF (NEW.status = 'Dispatched' AND (OLD.status IS DISTINCT FROM 'Dispatched')) OR
     (NEW.status = 'In Progress' AND (OLD.status IS DISTINCT FROM 'In Progress')) THEN
     
    -- Auto-close any open timesheet entries for this technician first
    UPDATE public.timesheet_entries
    SET 
      end_time = now(),
      duration_minutes = EXTRACT(EPOCH FROM (now() - start_time)) / 60.0
    WHERE staff_id = v_staff_id AND end_time IS NULL;

    -- Create new entry
    INSERT INTO public.timesheet_entries (
      staff_id,
      job_id,
      entry_type,
      source,
      start_time,
      approval_status
    ) VALUES (
      v_staff_id,
      NEW.id,
      CASE WHEN NEW.status = 'Dispatched' THEN 'drive' ELSE 'onsite' END,
      'auto',
      now(),
      'pending'
    );
    
  -- 2. IF TRANSITIONING TO 'Completed', 'Cancelled', OR 'Invoiced' (closes onsite/drive entry)
  ELSIF (NEW.status IN ('Completed', 'Cancelled', 'Invoiced') AND (OLD.status NOT IN ('Completed', 'Cancelled', 'Invoiced'))) THEN
    
    -- Find and update the open entry for this job
    UPDATE public.timesheet_entries
    SET 
      end_time = now(),
      duration_minutes = EXTRACT(EPOCH FROM (now() - start_time)) / 60.0
    WHERE staff_id = v_staff_id AND job_id = NEW.id AND end_time IS NULL;
    
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_log_timesheet ON public.jobs;
CREATE TRIGGER trg_auto_log_timesheet
  AFTER UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.fn_auto_log_timesheet_entry();
