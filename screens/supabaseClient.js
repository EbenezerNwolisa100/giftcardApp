import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cdiypuyqszqluypevfnq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkaXlwdXlxc3pxbHV5cGV2Zm5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NjE2MTQsImV4cCI6MjA2NzEzNzYxNH0.tBGmhuSQXeWFLglnLZpESgODBlDw_puozRTOn5bsbOM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY); 