-- Gamification and Fatigue Management

-- Create staff leaderboard stats table
CREATE TABLE IF NOT EXISTS staff_leaderboard_stats (
    staff_id UUID PRIMARY KEY REFERENCES staff_profiles(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Gamification Metrics
    jobs_completed_this_month INTEGER DEFAULT 0,
    five_star_reviews INTEGER DEFAULT 0,
    on_time_arrivals INTEGER DEFAULT 0,
    total_sales_revenue NUMERIC(10, 2) DEFAULT 0.00,
    current_points INTEGER DEFAULT 0,
    
    -- Fatigue Management & Safety Compliance
    hours_worked_this_week NUMERIC(5, 2) DEFAULT 0.00,
    last_shift_ended_at TIMESTAMPTZ,
    fatigue_warning_active BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for leaderboard stats
ALTER TABLE staff_leaderboard_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_leaderboard_access"
    ON staff_leaderboard_stats
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (company_id = (auth.jwt() ->> 'tenant_id')::uuid)
    WITH CHECK (company_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Trigger to auto-create leaderboard stat when staff profile is created
CREATE OR REPLACE FUNCTION public.create_staff_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.staff_leaderboard_stats (staff_id, company_id)
  VALUES (NEW.id, NEW.company_id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safe trigger creation
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_staff_profile_created_leaderboard') THEN
        CREATE TRIGGER on_staff_profile_created_leaderboard
        AFTER INSERT ON public.staff_profiles
        FOR EACH ROW EXECUTE FUNCTION public.create_staff_leaderboard();
    END IF;
END $$;
