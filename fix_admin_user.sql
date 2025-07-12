-- Fix Admin User Role and Access
-- This script ensures your admin user has the correct role and permissions

-- First, let's check if your admin user exists and update their role
-- Replace 'your-admin-email@example.com' with your actual admin email

-- Option 1: Update existing user to admin role
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';

-- Option 2: If you want to make a specific user admin by ID
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE id = 'your-user-id-here';

-- Option 3: Make all users with a specific email pattern admin (be careful!)
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE email LIKE '%@yourdomain.com';

-- Check current admin users
SELECT id, email, full_name, role, created_at 
FROM public.profiles 
WHERE role = 'admin';

-- Show all users for reference
SELECT id, email, full_name, role, created_at 
FROM public.profiles 
ORDER BY created_at DESC;

-- Ensure the profiles table has the role column with proper constraints
DO $$
BEGIN
    -- Add role column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'user'::text;
    END IF;
    
    -- Add role constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'profiles' AND constraint_name = 'profiles_role_check') THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
            CHECK (role = ANY (ARRAY['user'::text, 'admin'::text]));
    END IF;
END $$;

-- Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Show success message
SELECT 'Admin user setup completed! Please update the email address in the script above.' as status; 