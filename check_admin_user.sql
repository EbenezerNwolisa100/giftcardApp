-- Check and Fix Admin User Access
-- Run this script to diagnose and fix admin access issues

-- 1. Show all users in the system
SELECT 
    id, 
    email, 
    full_name, 
    role, 
    created_at,
    CASE 
        WHEN role = 'admin' THEN '✅ Admin'
        WHEN role = 'user' THEN '👤 User'
        ELSE '❓ Unknown Role'
    END as status
FROM public.profiles 
ORDER BY created_at DESC;

-- 2. Check if there are any admin users
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
    COUNT(CASE WHEN role = 'user' THEN 1 END) as regular_users
FROM public.profiles;

-- 3. Show the most recent users (potential admins)
SELECT 
    id, 
    email, 
    full_name, 
    role, 
    created_at
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. If no admin users exist, create one from the most recent user
-- Uncomment and modify the line below to make the most recent user an admin
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE id = (SELECT id FROM public.profiles ORDER BY created_at DESC LIMIT 1);

-- 5. Test query to see if RLS is working
-- This should return all users if RLS is properly configured for admin access
SELECT 
    'Testing admin access - should see all users' as test_message,
    COUNT(*) as total_users_visible
FROM public.profiles;

-- 6. Show RLS policies for profiles table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'; 