-- Restrict admin role creation to SQL editor only
-- App self-signup can only create student profiles.

DROP POLICY IF EXISTS "Users can insert their own profile on signup" ON profiles;
DROP POLICY IF EXISTS "Users can insert student profile on signup" ON profiles;

CREATE POLICY "Users can insert student profile on signup"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id
    AND role = 'student'
  );

-- Prevent creating/promoting admin accounts through authenticated app requests.
CREATE OR REPLACE FUNCTION prevent_app_admin_role_assignment()
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

DROP TRIGGER IF EXISTS prevent_app_admin_role_assignment_trigger ON profiles;

CREATE TRIGGER prevent_app_admin_role_assignment_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_app_admin_role_assignment();

-- Verification helpers
SELECT policyname, cmd, with_check
FROM pg_policies
WHERE tablename = 'profiles' AND cmd = 'INSERT';

SELECT tgname
FROM pg_trigger
WHERE tgrelid = 'profiles'::regclass
  AND NOT tgisinternal;
