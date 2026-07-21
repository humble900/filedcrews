-- Migration: 20260721000001_create_affiliate_system.sql
-- Description: Schema tables and RLS policies for Affiliate & Partner Program and Referral Tracking

-- 1. AFFILIATE PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.affiliate_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    website TEXT,
    referral_code VARCHAR(30) UNIQUE NOT NULL,
    payout_email TEXT,
    stripe_connect_id TEXT,
    commission_rate_pct NUMERIC(5,2) DEFAULT 20.00,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended')),
    assigned_manager TEXT DEFAULT 'Lead Account Manager',
    total_clicks INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on affiliate_profiles
ALTER TABLE public.affiliate_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for affiliate_profiles
CREATE POLICY "Superadmins can manage all affiliate profiles"
    ON public.affiliate_profiles
    FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()));

CREATE POLICY "Affiliates can view own profile"
    ON public.affiliate_profiles
    FOR SELECT
    TO authenticated
    USING (auth_user_id = auth.uid() OR email = auth.jwt() ->> 'email');

CREATE POLICY "Affiliates can update own profile"
    ON public.affiliate_profiles
    FOR UPDATE
    TO authenticated
    USING (auth_user_id = auth.uid() OR email = auth.jwt() ->> 'email');

CREATE POLICY "Public registration for affiliate profiles"
    ON public.affiliate_profiles
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- 2. REFERRALS TABLE (TRACKING SIGN-UPS)
CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID REFERENCES public.affiliate_profiles(id) ON DELETE CASCADE,
    referred_company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    click_source TEXT,
    promo_code_used VARCHAR(30),
    status VARCHAR(20) DEFAULT 'trial' CHECK (status IN ('trial', 'active_paid', 'churned', 'pending_setup')),
    plan_tier TEXT DEFAULT 'Growth Crew',
    seats_count INTEGER DEFAULT 5,
    monthly_value NUMERIC(10,2) DEFAULT 0.00,
    commission_earned NUMERIC(10,2) DEFAULT 0.00,
    converted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on affiliate_referrals
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage all referrals"
    ON public.affiliate_referrals
    FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()));

CREATE POLICY "Affiliates can view own referrals"
    ON public.affiliate_referrals
    FOR SELECT
    TO authenticated
    USING (affiliate_id IN (
        SELECT id FROM public.affiliate_profiles 
        WHERE auth_user_id = auth.uid() OR email = auth.jwt() ->> 'email'
    ));

-- 3. AFFILIATE COMMISSIONS & PAYOUTS LEDGER
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID REFERENCES public.affiliate_profiles(id) ON DELETE CASCADE,
    referral_id UUID REFERENCES public.affiliate_referrals(id) ON DELETE SET NULL,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
    payout_date TIMESTAMPTZ,
    stripe_transfer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS on affiliate_commissions
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage all commissions"
    ON public.affiliate_commissions
    FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()));

CREATE POLICY "Affiliates can view own commissions"
    ON public.affiliate_commissions
    FOR SELECT
    TO authenticated
    USING (affiliate_id IN (
        SELECT id FROM public.affiliate_profiles 
        WHERE auth_user_id = auth.uid() OR email = auth.jwt() ->> 'email'
    ));

-- 4. ADD AFFILIATE TRACKING TO COMPANIES
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS referred_by_affiliate_id UUID REFERENCES public.affiliate_profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS affiliate_promo_code TEXT;
