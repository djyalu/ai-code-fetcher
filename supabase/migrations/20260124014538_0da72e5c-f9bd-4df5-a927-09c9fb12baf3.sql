-- Drop the problematic recursive policies on profiles table
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- Recreate admin policies without recursive subquery using security definer function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Recreate policies using the function instead of subquery
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (public.is_admin());

-- Also fix ai_models policies that reference profiles
DROP POLICY IF EXISTS "Admins can delete models" ON public.ai_models;
DROP POLICY IF EXISTS "Admins can insert models" ON public.ai_models;
DROP POLICY IF EXISTS "Admins can update models" ON public.ai_models;
DROP POLICY IF EXISTS "Anyone can view active models" ON public.ai_models;

CREATE POLICY "Admins can delete models"
ON public.ai_models
FOR DELETE
USING (public.is_admin());

CREATE POLICY "Admins can insert models"
ON public.ai_models
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update models"
ON public.ai_models
FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Anyone can view active models"
ON public.ai_models
FOR SELECT
USING (is_active = true OR public.is_admin());

-- Fix prompt_logs policies
DROP POLICY IF EXISTS "Admins can view all prompt logs" ON public.prompt_logs;
DROP POLICY IF EXISTS "Admins can delete prompt logs" ON public.prompt_logs;

CREATE POLICY "Admins can view all prompt logs"
ON public.prompt_logs
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can delete prompt logs"
ON public.prompt_logs
FOR DELETE
USING (public.is_admin());