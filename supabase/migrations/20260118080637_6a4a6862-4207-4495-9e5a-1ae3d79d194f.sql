-- Create profiles table for user management
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
    )
);

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
    )
);

CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
    )
);

-- Create prompt_logs table for history
CREATE TABLE IF NOT EXISTS public.prompt_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt TEXT NOT NULL,
    result TEXT NOT NULL,
    model_id TEXT NOT NULL,
    owner_email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on prompt_logs
ALTER TABLE public.prompt_logs ENABLE ROW LEVEL SECURITY;

-- Prompt logs policies
CREATE POLICY "Admins can view all prompt logs"
ON public.prompt_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
    )
);

CREATE POLICY "Users can view their own prompt logs"
ON public.prompt_logs FOR SELECT
USING (owner_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Anyone can insert prompt logs"
ON public.prompt_logs FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can delete prompt logs"
ON public.prompt_logs FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
    )
);

-- Create ai_models table for model management
CREATE TABLE IF NOT EXISTS public.ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    description TEXT,
    input_price NUMERIC NOT NULL DEFAULT 0,
    output_price NUMERIC NOT NULL DEFAULT 0,
    context_window INTEGER NOT NULL DEFAULT 8192,
    color TEXT NOT NULL DEFAULT '#888888',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on ai_models
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;

-- AI models policies
CREATE POLICY "Anyone can view active models"
ON public.ai_models FOR SELECT
USING (is_active = true OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
));

CREATE POLICY "Admins can insert models"
ON public.ai_models FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
    )
);

CREATE POLICY "Admins can update models"
ON public.ai_models FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
    )
);

CREATE POLICY "Admins can delete models"
ON public.ai_models FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
    )
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_models_updated_at
    BEFORE UPDATE ON public.ai_models
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();