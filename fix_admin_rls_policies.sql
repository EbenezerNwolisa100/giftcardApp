-- Fix RLS Policies for Admin Dashboard Access
-- This script ensures admins can view and manage all user data

-- 1. Fix giftcard_transactions RLS policies
ALTER TABLE public.giftcard_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own giftcard transactions" ON public.giftcard_transactions;
DROP POLICY IF EXISTS "Users can insert own giftcard transactions" ON public.giftcard_transactions;
DROP POLICY IF EXISTS "Admins can view all giftcard transactions" ON public.giftcard_transactions;
DROP POLICY IF EXISTS "Admins can update all giftcard transactions" ON public.giftcard_transactions;

-- Create new policies
CREATE POLICY "Users can view own giftcard transactions" ON public.giftcard_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own giftcard transactions" ON public.giftcard_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all giftcard transactions" ON public.giftcard_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all giftcard transactions" ON public.giftcard_transactions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 2. Fix withdrawals RLS policies
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Users can insert own withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Admins can update all withdrawals" ON public.withdrawals;

-- Create new policies
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdrawals" ON public.withdrawals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawals" ON public.withdrawals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all withdrawals" ON public.withdrawals
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 3. Fix profiles RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Create new policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4. Fix user_banks RLS policies
ALTER TABLE public.user_banks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own bank details" ON public.user_banks;
DROP POLICY IF EXISTS "Users can insert own bank details" ON public.user_banks;
DROP POLICY IF EXISTS "Users can update own bank details" ON public.user_banks;
DROP POLICY IF EXISTS "Admins can view all bank details" ON public.user_banks;
DROP POLICY IF EXISTS "Admins can update all bank details" ON public.user_banks;

-- Create new policies
CREATE POLICY "Users can view own bank details" ON public.user_banks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bank details" ON public.user_banks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bank details" ON public.user_banks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bank details" ON public.user_banks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all bank details" ON public.user_banks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 5. Fix notifications RLS policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;

-- Create new policies
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all notifications" ON public.notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 6. Fix support_requests RLS policies
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own support requests" ON public.support_requests;
DROP POLICY IF EXISTS "Users can insert own support requests" ON public.support_requests;
DROP POLICY IF EXISTS "Admins can view all support requests" ON public.support_requests;
DROP POLICY IF EXISTS "Admins can update all support requests" ON public.support_requests;

-- Create new policies
CREATE POLICY "Users can view own support requests" ON public.support_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own support requests" ON public.support_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all support requests" ON public.support_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all support requests" ON public.support_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 7. Fix giftcard_inventory RLS policies (admin only access)
ALTER TABLE public.giftcard_inventory ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all giftcard inventory" ON public.giftcard_inventory;
DROP POLICY IF EXISTS "Admins can insert giftcard inventory" ON public.giftcard_inventory;
DROP POLICY IF EXISTS "Admins can update all giftcard inventory" ON public.giftcard_inventory;
DROP POLICY IF EXISTS "Admins can delete all giftcard inventory" ON public.giftcard_inventory;

-- Create new policies
CREATE POLICY "Admins can view all giftcard inventory" ON public.giftcard_inventory
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert giftcard inventory" ON public.giftcard_inventory
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all giftcard inventory" ON public.giftcard_inventory
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete all giftcard inventory" ON public.giftcard_inventory
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 8. Fix giftcard_brands RLS policies (admin only access)
ALTER TABLE public.giftcard_brands ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all giftcard brands" ON public.giftcard_brands;
DROP POLICY IF EXISTS "Admins can insert giftcard brands" ON public.giftcard_brands;
DROP POLICY IF EXISTS "Admins can update all giftcard brands" ON public.giftcard_brands;
DROP POLICY IF EXISTS "Admins can delete all giftcard brands" ON public.giftcard_brands;

-- Create new policies
CREATE POLICY "Admins can view all giftcard brands" ON public.giftcard_brands
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert giftcard brands" ON public.giftcard_brands
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all giftcard brands" ON public.giftcard_brands
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete all giftcard brands" ON public.giftcard_brands
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 9. Fix giftcard_categories RLS policies (admin only access)
ALTER TABLE public.giftcard_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all giftcard categories" ON public.giftcard_categories;
DROP POLICY IF EXISTS "Admins can insert giftcard categories" ON public.giftcard_categories;
DROP POLICY IF EXISTS "Admins can update all giftcard categories" ON public.giftcard_categories;
DROP POLICY IF EXISTS "Admins can delete all giftcard categories" ON public.giftcard_categories;

-- Create new policies
CREATE POLICY "Admins can view all giftcard categories" ON public.giftcard_categories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert giftcard categories" ON public.giftcard_categories
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all giftcard categories" ON public.giftcard_categories
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete all giftcard categories" ON public.giftcard_categories
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 10. Fix admin_bank_details RLS policies (admin only access)
ALTER TABLE public.admin_bank_details ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all admin bank details" ON public.admin_bank_details;
DROP POLICY IF EXISTS "Admins can insert admin bank details" ON public.admin_bank_details;
DROP POLICY IF EXISTS "Admins can update all admin bank details" ON public.admin_bank_details;
DROP POLICY IF EXISTS "Admins can delete all admin bank details" ON public.admin_bank_details;

-- Create new policies
CREATE POLICY "Admins can view all admin bank details" ON public.admin_bank_details
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert admin bank details" ON public.admin_bank_details
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all admin bank details" ON public.admin_bank_details
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete all admin bank details" ON public.admin_bank_details
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Grant necessary permissions to authenticated users
GRANT ALL ON public.giftcard_transactions TO authenticated;
GRANT ALL ON public.withdrawals TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.user_banks TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.support_requests TO authenticated;
GRANT ALL ON public.giftcard_inventory TO authenticated;
GRANT ALL ON public.giftcard_brands TO authenticated;
GRANT ALL ON public.giftcard_categories TO authenticated;
GRANT ALL ON public.admin_bank_details TO authenticated;
GRANT ALL ON public.wallet_transactions TO authenticated;

-- Grant service role permissions
GRANT ALL ON public.giftcard_transactions TO service_role;
GRANT ALL ON public.withdrawals TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.user_banks TO service_role;
GRANT ALL ON public.notifications TO service_role;
GRANT ALL ON public.support_requests TO service_role;
GRANT ALL ON public.giftcard_inventory TO service_role;
GRANT ALL ON public.giftcard_brands TO service_role;
GRANT ALL ON public.giftcard_categories TO service_role;
GRANT ALL ON public.admin_bank_details TO service_role;
GRANT ALL ON public.wallet_transactions TO service_role;

-- Show success message
SELECT 'RLS policies updated successfully! Admin dashboard should now show all user data.' as status; 