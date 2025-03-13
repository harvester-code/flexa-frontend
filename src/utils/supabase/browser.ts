import { useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/utils/supabase/database.types';
import type { TypedSupabaseClient } from '@/utils/supabase/types';

let client: TypedSupabaseClient | undefined;

function createClient() {
  if (client) {
    return client;
  }

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return client;
}

// function useSupabaseBrowser() {
//   return useMemo(getSupabaseBrowserClient, []);
// }

export { createClient };
