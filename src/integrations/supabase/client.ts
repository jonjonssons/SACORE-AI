// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ucofzcubtdgwcekdogxr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjb2Z6Y3VidGRnd2Nla2RvZ3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3NjkyMTMsImV4cCI6MjA1OTM0NTIxM30.apdeUYFWD_eKJWe4xRstyxT9jFs3RQ1aUMQV0P3QhHo";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);