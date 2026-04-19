import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  "https://zucbgvsxrmbxfpiqppac.supabase.co";

const supabaseKey =
  "sb_publishable_ybf6lHEQEerCoyPvso_sWQ_5e6Zjyd-";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);