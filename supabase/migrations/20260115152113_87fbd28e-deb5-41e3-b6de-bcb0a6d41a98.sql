-- Create table to store model health check status
CREATE TABLE public.model_health (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    model_id TEXT NOT NULL UNIQUE,
    is_available BOOLEAN NOT NULL DEFAULT true,
    last_checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.model_health ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read model health status (public data)
CREATE POLICY "Anyone can read model health" 
ON public.model_health 
FOR SELECT 
USING (true);

-- Only allow service role to update (edge functions)
CREATE POLICY "Service role can manage model health" 
ON public.model_health 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_model_health_updated_at
BEFORE UPDATE ON public.model_health
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();