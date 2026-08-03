import { supabase } from "@/integrations/supabase/client";

export async function isAdmin(userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .single();
  
  return !!data && !error;
}
