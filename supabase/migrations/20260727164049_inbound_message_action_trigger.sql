-- Trigger to create an action item when an inbound message is received
CREATE OR REPLACE FUNCTION fn_trigger_inbound_message_action()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    customer_name TEXT;
BEGIN
    IF NEW.direction = 'inbound' AND NEW.status = 'received' THEN
        -- Get customer name
        SELECT COALESCE(first_name || ' ' || last_name, 'Customer') INTO customer_name
        FROM public.customers
        WHERE id = NEW.customer_id;

        -- Insert an action item
        INSERT INTO public.action_items (
            company_id,
            type,
            entity_type,
            entity_id,
            title,
            description,
            severity,
            action_url
        ) VALUES (
            NEW.tenant_id,
            'lead_follow_up',
            'communications_log',
            NEW.id,
            'New ' || UPPER(NEW.channel::text) || ' from ' || customer_name,
            NEW.content,
            'High',
            '/crm?customer=' || NEW.customer_id
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_inbound_message_action ON public.communications_log;

CREATE TRIGGER trigger_inbound_message_action
AFTER INSERT OR UPDATE ON public.communications_log
FOR EACH ROW
EXECUTE FUNCTION fn_trigger_inbound_message_action();
