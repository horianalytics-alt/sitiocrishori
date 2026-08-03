import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type HeroContent = {
  headline: string;
  subheadline: string;
  cta_text: string;
  whatsapp_number: string;
  whatsapp_message: string;
};

export type InfrastructureItem = {
  title: string;
  description: string;
  image: string;
};

export type FAQItem = {
  question: string;
  answer: string;
};

export const getSiteContent = createServerFn({ method: "GET" })
  .validator((section: string) => section)
  .handler(async ({ data: section }) => {
    try {
      const { data, error } = await supabase
        .from("site_content")
        .select("content")
        .eq("section", section)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return section === 'gallery' ? [] : null;
      return data.content as any;
    } catch (err) {
      console.error(`Error fetching site content for ${section}:`, err);
      return section === 'gallery' ? [] : null;
    }
  });

export const updateSiteContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { section: string; content: any }) => data)
  .handler(async ({ data, context }) => {
    // Check for admin role
    const { data: hasRole, error: roleError } = await context.supabase.rpc('has_role', {
      _user_id: context.userId,
      _role: 'admin'
    });

    // If RPC is in private schema, we might need a direct query since the standard client 
    // might not have 'private' in its search path by default. 
    // Let's try direct query as a fallback or if rpc fails.
    let isAdmin = hasRole;
    if (roleError || hasRole === null) {
      const { data: roleData } = await context.supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', context.userId)
        .eq('role', 'admin')
        .maybeSingle();
      isAdmin = !!roleData;
    }

    if (!isAdmin) {
      throw new Error("Unauthorized: Admin role required");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("site_content")
      .update({ content: data.content })
      .eq("section", data.section);
    
    if (error) throw error;
    return { success: true };
  });
