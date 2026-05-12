-- Remove legacy role-enforcement trigger that blocks SQL editor maintenance
-- This cleans up manual/legacy function names and keeps app-side restrictions.

-- Legacy objects from earlier manual SQL (safe if they don't exist)
DROP TRIGGER IF EXISTS enforce_profile_role_rules_trigger ON public.profiles;
DROP FUNCTION IF EXISTS public.enforce_profile_role_rules();

-- Ensure the intended app restriction function exists
CREATE OR REPLACE FUNCTION public.prevent_app_admin_role_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- SQL editor operations run as postgres and should remain allowed.
  IF current_user = 'postgres' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' AND NEW.role = 'admin' THEN
    RAISE EXCEPTION 'Admin accounts can only be created via Supabase SQL editor';
  END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.role = 'admin'
     AND OLD.role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Admin accounts can only be created via Supabase SQL editor';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_app_admin_role_assignment_trigger ON public.profiles;

CREATE TRIGGER prevent_app_admin_role_assignment_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_app_admin_role_assignment();

-- Verification
SELECT tgname
FROM pg_trigger
WHERE tgrelid = 'public.profiles'::regclass
  AND NOT tgisinternal
ORDER BY tgname;
