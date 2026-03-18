import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://rcquvqkcebzxumqzgrfr.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcXV2cWtjZWJ6eHVtcXpncmZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3OTAyMTUsImV4cCI6MjA4OTM2NjIxNX0.MJNQsw46vtEH7ex5_fz_l9xza5JfMLlvNODkCQ6YkgI";

export interface AppProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export type FriendshipStatus = "pending" | "accepted" | "rejected";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
