import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://helfjeviqqeudqzyvlez.supabase.co';
const supabaseAnonKey = 'sb_publishable_nRqXq1wahz11x5AOhKUwow_CYCC82Jq';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
