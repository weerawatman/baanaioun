-- Create activity logs table for auditing
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can view all logs" 
    ON public.activity_logs 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
        )
    );

-- Trigger function for logging changes
CREATE OR REPLACE FUNCTION public.log_asset_changes()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID := auth.uid();
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.activity_logs (user_id, action, table_name, record_id, old_data, new_data)
        VALUES (current_user_id, TG_OP, TG_TABLE_NAME, OLD.id, to_jsonb(OLD), to_jsonb(NEW));
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.activity_logs (user_id, action, table_name, record_id, old_data)
        VALUES (current_user_id, TG_OP, TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.activity_logs (user_id, action, table_name, record_id, new_data)
        VALUES (current_user_id, TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to assets table
DROP TRIGGER IF EXISTS tr_log_asset_changes ON public.assets;
CREATE TRIGGER tr_log_asset_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.assets
    FOR EACH ROW EXECUTE FUNCTION public.log_asset_changes();
