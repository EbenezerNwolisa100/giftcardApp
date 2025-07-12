-- Fix wallet_transactions table to match the code requirements
-- Add missing status column and update type constraints

-- First, drop the existing table if it exists (be careful with this in production)
-- DROP TABLE IF EXISTS public.wallet_transactions CASCADE;

-- Create the corrected wallet_transactions table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  type text CHECK (type = ANY (ARRAY['fund'::text, 'purchase'::text, 'withdrawal'::text, 'refund'::text, 'credit'::text, 'debit'::text])),
  amount numeric NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'cancelled'::text])),
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  payment_method text,
  reference text,
  proof_of_payment_url text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT wallet_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- If the table already exists, add the missing columns
DO $$
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wallet_transactions' AND column_name = 'status') THEN
        ALTER TABLE public.wallet_transactions ADD COLUMN status text DEFAULT 'pending'::text;
        ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_status_check 
            CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'cancelled'::text]));
    END IF;
    
    -- Update type constraint to include the new types used in the code
    -- First drop the existing constraint
    ALTER TABLE public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;
    
    -- Add the new constraint with all the types
    ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_type_check 
        CHECK (type = ANY (ARRAY['fund'::text, 'purchase'::text, 'withdrawal'::text, 'refund'::text, 'credit'::text, 'debit'::text]));
END $$;

-- Fix giftcard_transactions payment_method constraint to include 'wallet'
DO $$
BEGIN
    -- Drop the existing payment_method constraint
    ALTER TABLE public.giftcard_transactions DROP CONSTRAINT IF EXISTS giftcard_transactions_payment_method_check;
    
    -- Add the new constraint with 'wallet' included
    ALTER TABLE public.giftcard_transactions ADD CONSTRAINT giftcard_transactions_payment_method_check 
        CHECK (payment_method = ANY (ARRAY['paystack'::text, 'manual_transfer'::text, 'wallet'::text]));
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON public.wallet_transactions(status);

-- Set up RLS (Row Level Security) policies
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own transactions
CREATE POLICY IF NOT EXISTS "Users can view own wallet transactions" ON public.wallet_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own transactions
CREATE POLICY IF NOT EXISTS "Users can insert own wallet transactions" ON public.wallet_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for admins to view all transactions
CREATE POLICY IF NOT EXISTS "Admins can view all wallet transactions" ON public.wallet_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy for admins to update all transactions
CREATE POLICY IF NOT EXISTS "Admins can update all wallet transactions" ON public.wallet_transactions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Grant necessary permissions
GRANT ALL ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;

-- Insert some sample data for testing (optional)
-- INSERT INTO public.wallet_transactions (user_id, type, amount, status, description, payment_method)
-- VALUES 
--   ('your-user-id-here', 'fund', 10000, 'completed', 'Initial wallet funding', 'paystack'),
--   ('your-user-id-here', 'purchase', 5000, 'completed', 'Gift card purchase', 'wallet');

COMMENT ON TABLE public.wallet_transactions IS 'Wallet transactions for users including funding, purchases, withdrawals, and refunds';
COMMENT ON COLUMN public.wallet_transactions.type IS 'Transaction type: fund, purchase, withdrawal, refund, credit, debit';
COMMENT ON COLUMN public.wallet_transactions.status IS 'Transaction status: pending, completed, failed, cancelled';
COMMENT ON COLUMN public.wallet_transactions.payment_method IS 'Payment method used: paystack, manual_transfer, wallet, etc.'; 