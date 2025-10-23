-- Recreate has_role function with correct parameter names to match the code
DROP FUNCTION IF EXISTS public.has_role(UUID, app_role);

CREATE OR REPLACE FUNCTION public.has_role(user_id UUID, required_role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = has_role.user_id
      AND user_roles.role = has_role.required_role
  )
$$;