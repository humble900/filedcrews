-- Update validate_company_prefix trigger function to allow flexible prefix length between 3 and 8 characters
CREATE OR REPLACE FUNCTION public.validate_company_prefix()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF char_length(NEW.prefix) < 3 OR char_length(NEW.prefix) > 8 THEN
    RAISE EXCEPTION 'prefix must be between 3 and 8 characters';
  END IF;
  IF NEW.prefix !~ '^[A-Za-z]{3,8}$' THEN
    RAISE EXCEPTION 'prefix must contain only letters (A-Z)';
  END IF;
  NEW.prefix := upper(NEW.prefix);
  RETURN NEW;
END;
$function$;
