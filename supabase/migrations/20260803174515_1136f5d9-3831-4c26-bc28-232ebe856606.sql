-- Revoke public execution of the has_role function
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated;

-- Allow only service_role (and by extension, policies using it) to execute
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
