import { createClient } from "@supabase/supabase-js";

const supabaseUrl   = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnon  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a placeholder client if environment variables are not set
// This allows the app to start without Supabase configuration
export const supabase = supabaseUrl && supabaseAnon 
  ? createClient(supabaseUrl, supabaseAnon)
  : null;
