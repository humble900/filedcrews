-- ==========================================
-- SPRINT 3 — PURCHASING & INVENTORY SYSTEM
-- ==========================================

-- 1. Create Warehouses Table
CREATE TABLE IF NOT EXISTS public.warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  location text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create Inventory Items (Parts Catalog & Stock levels)
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE SET NULL,
  part_number text NOT NULL,
  name text NOT NULL,
  description text,
  unit_cost numeric(12,2) NOT NULL DEFAULT 0.00,
  current_stock integer NOT NULL DEFAULT 0,
  minimum_stock integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, part_number)
);

-- 3. Create Purchase Orders Table
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  po_number text NOT NULL,
  vendor_name text NOT NULL,
  status text NOT NULL DEFAULT 'Draft', -- Draft, Sent, Received, Cancelled
  total_amount numeric(12,2) NOT NULL DEFAULT 0.00,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, po_number)
);

-- 4. Create Purchase Order Items Table
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_cost numeric(12,2) NOT NULL DEFAULT 0.00
);

-- 5. Enable RLS
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- Warehouses
CREATE POLICY "Company manage warehouses" ON public.warehouses
  FOR ALL TO authenticated
  USING (company_id IN (
    SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    UNION
    SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
  ))
  WITH CHECK (company_id IN (
    SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    UNION
    SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
  ));

-- Inventory Items
CREATE POLICY "Company manage inventory_items" ON public.inventory_items
  FOR ALL TO authenticated
  USING (company_id IN (
    SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    UNION
    SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
  ))
  WITH CHECK (company_id IN (
    SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    UNION
    SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
  ));

-- Purchase Orders
CREATE POLICY "Company manage purchase_orders" ON public.purchase_orders
  FOR ALL TO authenticated
  USING (company_id IN (
    SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    UNION
    SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
  ))
  WITH CHECK (company_id IN (
    SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
    UNION
    SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
  ));

-- Purchase Order Items
CREATE POLICY "Company manage purchase_order_items" ON public.purchase_order_items
  FOR ALL TO authenticated
  USING (po_id IN (
    SELECT id FROM public.purchase_orders WHERE company_id IN (
      SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
      UNION
      SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
    )
  ))
  WITH CHECK (po_id IN (
    SELECT id FROM public.purchase_orders WHERE company_id IN (
      SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
      UNION
      SELECT company_id FROM public.staff_profiles WHERE auth_user_id = auth.uid()
    )
  ));
