-- ══════════════════════════════════════════════════════════
-- KARYIKA v3 — Fix: Insert missing profiles for existing users
-- Run this ONCE in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════

-- 1. Insert profile for any auth user who doesn't have one yet
INSERT INTO public.profiles (id, email, name, role)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  'user'
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- 2. Make sure the trigger exists for future signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR each row EXECUTE PROCEDURE public.handle_new_user();

-- 3. Verify — should show your user
SELECT id, email, name, role FROM public.profiles;
