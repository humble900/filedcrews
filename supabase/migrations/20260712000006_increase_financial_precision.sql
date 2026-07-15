-- Increase financial column precision to support values up to ~10 trillion
ALTER TABLE public.projects
  ALTER COLUMN contract_value TYPE numeric(15, 2),
  ALTER COLUMN budget_labour_cost TYPE numeric(15, 2);
