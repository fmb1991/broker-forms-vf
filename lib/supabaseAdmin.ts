import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,     // public URL is fine
  process.env.SUPABASE_SERVICE_ROLE_KEY!     // server-only key
);
