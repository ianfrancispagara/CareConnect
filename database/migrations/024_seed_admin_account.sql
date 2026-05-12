-- Seed a default admin account (idempotent)
-- Run in Supabase SQL editor.
-- Update the values below before running in production.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_email TEXT := 'admin@carsu.edu.ph';
  v_password TEXT := 'Test123!';
  v_full_name TEXT := 'test admin';
  v_school_id TEXT := '000-00001';

  v_user_id UUID;
  v_existing_profile_id UUID;
BEGIN
  IF current_user <> 'postgres' THEN
    RAISE EXCEPTION 'Run this script in Supabase SQL editor as postgres';
  END IF;

  SELECT id
  INTO v_user_id
  FROM auth.users
  WHERE email = v_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      v_email,
      crypt(v_password, gen_salt('bf')),
      NOW(),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      jsonb_build_object(
        'full_name', v_full_name,
        'school_id', v_school_id,
        'role', 'admin'
      ),
      NOW(),
      NOW()
    );
  ELSE
    UPDATE auth.users
    SET
      encrypted_password = crypt(v_password, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
        || jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
        || jsonb_build_object(
          'full_name', v_full_name,
          'school_id', v_school_id,
          'role', 'admin'
        ),
      updated_at = NOW()
    WHERE id = v_user_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM auth.identities
    WHERE user_id = v_user_id
      AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', v_email,
        'email_verified', true
      ),
      'email',
      v_user_id::text,
      NOW(),
      NOW(),
      NOW()
    );
  END IF;

  SELECT id
  INTO v_existing_profile_id
  FROM public.profiles
  WHERE email = v_email
  LIMIT 1;

  IF v_existing_profile_id IS NOT NULL
     AND v_existing_profile_id <> v_user_id THEN
    RAISE EXCEPTION
      'A profile with email % already exists with a different id (%). Resolve manually first.',
      v_email,
      v_existing_profile_id;
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    school_id,
    role
  )
  VALUES (
    v_user_id,
    v_email,
    v_full_name,
    v_school_id,
    'admin'
  )
  ON CONFLICT (id)
  DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    school_id = EXCLUDED.school_id,
    role = 'admin',
    updated_at = NOW();

  RAISE NOTICE 'Admin seeder completed for email: % (id: %)', v_email, v_user_id;
END;
$$;

-- Verify seeded admin account
SELECT id, email, full_name, school_id, role, created_at
FROM public.profiles
WHERE role = 'admin'
ORDER BY created_at DESC;
