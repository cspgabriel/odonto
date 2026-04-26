/**
 * Supabase Admin client (service role). Use ONLY in server code (e.g. server actions).
 * Never expose this client or SUPABASE_SERVICE_ROLE_KEY to the browser.
 */

import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it in .env to allow admin operations (e.g. creating staff)."
    );
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Returns Supabase client with service role, or null if key is not set. */
export function getSupabaseAdmin() {
  try {
    return getAdminClient();
  } catch {
    return null;
  }
}
