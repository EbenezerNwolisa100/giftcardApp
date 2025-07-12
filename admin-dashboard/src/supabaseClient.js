import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cdiypuyqszqluypevfnq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkaXlwdXlxc3pxbHV5cGV2Zm5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTU2MTYxNCwiZXhwIjoyMDY3MTM3NjE0fQ.aMTyBMR5IjJIdqs4LHm3lYbGWHlASMq-ypNSgmkUgLU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// NOTE: If you want to bypass RLS policies for admin access, replace the anon key with your service role key:
// 1. Go to Supabase Dashboard → Settings → API
// 2. Copy the "service_role" key (not the anon key)
// 3. Replace SUPABASE_ANON_KEY with your service role key
// 4. This will allow the admin dashboard to see all data without RLS restrictions 
