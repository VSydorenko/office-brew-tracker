-- 1) Enums for user status and roles
DO $$ BEGIN
  CREATE TYPE public.user_status AS ENUM ('pending','approved','rejected','blocked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Extend profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status public.user_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS role public.app_role NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS approved_by uuid NULL,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz NULL;

-- FK to profiles for approved_by (self-reference)
DO $$ BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_approved_by_fkey
    FOREIGN KEY (approved_by)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Helper security definer functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _user_id AND p.role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_approved(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _user_id AND p.status = 'approved'
  );
$$;

-- 4) Update handle_new_user to set defaults and auto-approve first user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update profile with defaults
  INSERT INTO public.profiles (id, name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'picture', NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = now();

  -- If this is the very first profile, make it admin and approved
  IF (SELECT count(*) FROM public.profiles) = 1 THEN
    UPDATE public.profiles
    SET role = 'admin',
        status = 'approved',
        approved_by = NEW.id,
        approved_at = now(),
        updated_at = now()
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- 5) Ensure trigger exists to run on auth.users insert
DO $$ BEGIN
  CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6) Prevent non-admins from changing sensitive columns
CREATE OR REPLACE FUNCTION public.profiles_guard_non_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    IF (OLD.status IS DISTINCT FROM NEW.status)
       OR (OLD.role IS DISTINCT FROM NEW.role)
       OR (OLD.approved_by IS DISTINCT FROM NEW.approved_by)
       OR (OLD.approved_at IS DISTINCT FROM NEW.approved_at) THEN
      RAISE EXCEPTION 'Недостатньо прав для зміни службових полів профілю';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER trg_profiles_guard_non_admin
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_guard_non_admin();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 7) RLS policies updates
-- Keep table RLS enabled (already enabled), adjust policies
-- a) Allow users to view their own profile
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
DO $$ BEGIN
  CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
END $$;

-- b) Approved users can view all profiles
DO $$ BEGIN
  CREATE POLICY "Approved users can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_approved(auth.uid()));
END $$;

-- c) Users can insert their own profile (keep existing behavior)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DO $$ BEGIN
  CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
END $$;

-- d) Users can update their own profile (non-admin fields enforced by trigger)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DO $$ BEGIN
  CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
END $$;

-- e) Admins can update any profile
DO $$ BEGIN
  CREATE POLICY "Admins can update any profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
END $$;