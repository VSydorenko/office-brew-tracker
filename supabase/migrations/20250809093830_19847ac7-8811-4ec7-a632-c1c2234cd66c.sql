-- Triggers for automatic status updates and amount change logs

-- Ensure purchase status updates when distributions change
DROP TRIGGER IF EXISTS trg_update_purchase_status ON public.purchase_distributions;
CREATE TRIGGER trg_update_purchase_status
AFTER INSERT OR UPDATE OF is_paid, adjusted_amount, calculated_amount
ON public.purchase_distributions
FOR EACH ROW
EXECUTE FUNCTION public.update_purchase_status();

-- Log amount changes on purchases and adjust status when needed
DROP TRIGGER IF EXISTS trg_log_purchase_amount_change ON public.purchases;
CREATE TRIGGER trg_log_purchase_amount_change
BEFORE UPDATE OF total_amount
ON public.purchases
FOR EACH ROW
EXECUTE FUNCTION public.log_purchase_amount_change();