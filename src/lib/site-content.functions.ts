import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export type HeroContent = {
  headline: string;
  subheadline: string;
  cta_text: string;
  whatsapp_number: string;
  whatsapp_message: string;
};

export const getSiteContent = createServerFn({ method: "GET" })
  .validator((section: string) => section)
  .handler(async ({ data: section }) => {
    const { data, error } = await supabase
      .from("site_content")
      .select("content")
      .eq("section", section)
      .single();
    
    if (error) throw error;
    return data.content;
  });

export const updateSiteContent = createServerFn({ method: "POST" })
  .validator((data: { section: string; content: any }) => data)
  .handler(async ({ data }) => {
    // This will be wrapped with auth check in the UI / protected route logic
    const { error } = await supabase
      .from("site_content")
      .update({ content: data.content })
      .eq("section", data.section);
    
    if (error) throw error;
    return { success: true };
  });
