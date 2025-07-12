-- Wallet System Setup Fix - Handles existing tables and policies

-- Check if wallet_transactions table exists, if not create it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'wallet_transactions') THEN
        CREATE TABLE wallet_transactions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            type TEXT NOT NULL CHECK (type IN ('fund', 'purchase', 'withdrawal', 'refund')),
            amount DECIMAL(10,2) NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
            payment_method TEXT,
            reference TEXT,
            description TEXT,
            proof_of_payment_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);

-- Enable Row Level Security if not already enabled
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view their own wallet transactions" ON wallet_transactions;
DROP POLICY IF EXISTS "Users can insert their own wallet transactions" ON wallet_transactions;
DROP POLICY IF EXISTS "Admins can view all wallet transactions" ON wallet_transactions;
DROP POLICY IF EXISTS "Admins can update wallet transactions" ON wallet_transactions;

-- Create policies
CREATE POLICY "Users can view their own wallet transactions" ON wallet_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet transactions" ON wallet_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallet transactions" ON wallet_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update wallet transactions" ON wallet_transactions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_wallet_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS update_wallet_transactions_updated_at ON wallet_transactions;
CREATE TRIGGER update_wallet_transactions_updated_at
    BEFORE UPDATE ON wallet_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_transactions_updated_at();

-- Create or replace function to handle wallet balance updates
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user balance based on transaction type
    IF NEW.status = 'completed' THEN
        IF NEW.type = 'fund' OR NEW.type = 'refund' THEN
            -- Add to balance
            UPDATE profiles 
            SET balance = balance + NEW.amount
            WHERE id = NEW.user_id;
        ELSIF NEW.type = 'purchase' OR NEW.type = 'withdrawal' THEN
            -- Subtract from balance (purchase/withdrawal should already be deducted)
            -- This is handled in the application logic
            NULL;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS update_wallet_balance_trigger ON wallet_transactions;
CREATE TRIGGER update_wallet_balance_trigger
    AFTER INSERT OR UPDATE ON wallet_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_balance();

-- Insert sample admin bank details if not exists
INSERT INTO admin_bank_details (bank_name, account_name, account_number)
VALUES ('Sample Bank', 'Admin Account', '1234567890')
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON wallet_transactions TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Verify the setup
SELECT 'Wallet system setup completed successfully!' as status; 