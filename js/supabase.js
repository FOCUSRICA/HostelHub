import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://wsimhvefeaztkjjknbux.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_your_real_key_goes_here";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
