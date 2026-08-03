import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const getSiteContent = createServerFn({ method: "GET" })
  .inputValidator((data) => z.string().parse(data))
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
  .inputValidator((data) => z.object({
    section: z.string(),
    content: z.any()
  }).parse(data))
  .handler(async ({ data }) => {
    // This will be wrapped with auth check in the UI / protected route logic
    const { error } = await supabase
      .from("site_content")
      .update({ content: data.content })
      .eq("section", data.section);
    
    if (error) throw error;
    return { success: true };
  });
