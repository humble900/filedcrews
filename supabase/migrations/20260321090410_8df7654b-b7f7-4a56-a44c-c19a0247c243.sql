
CREATE OR REPLACE FUNCTION public.validate_company_prefix()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF char_length(NEW.prefix) <> 5 THEN
    RAISE EXCEPTION 'prefix must be exactly 5 characters';
  END IF;
  IF NEW.prefix !~ '^[A-Za-z]{5}$' THEN
    RAISE EXCEPTION 'prefix must contain only letters (A-Z)';
  END IF;
  NEW.prefix := upper(NEW.prefix);
  RETURN NEW;
END;
$function$;
