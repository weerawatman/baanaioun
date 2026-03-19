import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/config/env';

export const supabase = createBrowserClient(env.supabase.url, env.supabase.anonKey);
