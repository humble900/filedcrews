-- Add B2B AMC and SLA columns to public.memberships
ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS contract_value numeric(12, 2),
  ADD COLUMN IF NOT EXISTS billing_terms text DEFAULT 'Net 30',
  ADD COLUMN IF NOT EXISTS included_visits integer DEFAULT 2,
  ADD COLUMN IF NOT EXISTS completed_visits integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sla_response_hours integer,
  ADD COLUMN IF NOT EXISTS auto_renew boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS renewal_status text DEFAULT 'active' 
    CHECK (renewal_status IN ('active', 'in_renewal_window', 'renewed', 'expired', 'lost')),
  ADD COLUMN IF NOT EXISTS contract_notes text,
  ADD COLUMN IF NOT EXISTS contract_document_url text;

-- Create function to automatically compute renewal status based on renewal date
CREATE OR REPLACE FUNCTION public.update_amc_renewal_statuses()
RETURNS trigger AS $$
BEGIN
  -- Default behavior for renewal statuses
  IF NEW.renewal_date IS NOT NULL THEN
    IF NEW.status = 'active' THEN
      -- If within 30 days of renewal date
      IF (NEW.renewal_date - CURRENT_DATE) <= 30 AND (NEW.renewal_date - CURRENT_DATE) > 0 THEN
        NEW.renewal_status := 'in_renewal_window';
      ELSIF NEW.renewal_date < CURRENT_DATE THEN
        NEW.renewal_status := 'expired';
        NEW.status := 'expired';
      ELSE
        NEW.renewal_status := 'active';
      END IF;
    END IF;
  ELSE
    NEW.renewal_status := 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Bind the trigger
DROP TRIGGER IF EXISTS trigger_update_amc_renewals ON public.memberships;
CREATE TRIGGER trigger_update_amc_renewals
  BEFORE INSERT OR UPDATE ON public.memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_amc_renewal_statuses();
