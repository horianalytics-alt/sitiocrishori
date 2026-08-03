-- Instead of executing directly on the schema, make the function strictly internal/not exposed.
-- However, since RLS needs it, we keep it, but ensure it is not callable by arbitrary users.
-- Actually, SECURITY DEFINER functions *are* safer if they are in a schema that is not exposed via REST API.
-- Moving to a private schema is the ultimate best practice.
CREATE SCHEMA IF NOT EXISTS private;
ALTER FUNCTION public.has_role(uuid, app_role) SET SCHEMA private;

-- Grant execution to authenticated only (as before) but now it's in a private schema
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, app_role) TO authenticated;
