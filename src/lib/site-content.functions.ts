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
    // Check for admin role directly in user_roles table
    const { data: roleData, error: roleError } = await context.supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', context.userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
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
