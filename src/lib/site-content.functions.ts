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
  hero_image?: string;
  badges?: string[];
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

// Generic types for the client to handle until types are re-generated
export type Reserva = any;
export type Depoimento = any;

// Site Content Functions
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
      
      let content = data?.content as any;
      
      // Fallback for empty gallery to ensure spiral demo works
      if (section === 'gallery' && (!content || content.length === 0)) {
        return [
          "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=800",
          "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800",
          "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=800",
          "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=800",
          "https://images.unsplash.com/photo-1470753937643-efad93c239fa?q=80&w=800",
          "https://images.unsplash.com/photo-1531058020387-3be344556be6?q=80&w=800",
          "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800"
        ];
      }
      
      if (!data) return section === 'gallery' ? [] : null;
      return content;
    } catch (err) {
      console.error(`Error fetching site content for ${section}:`, err);
      return section === 'gallery' ? [] : null;
    }
  });


// Reservations Functions
export const getReservas = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
      .from("reservas" as any)
      .select("*")
      .order("data_inicio", { ascending: true });
    if (error) throw error;
    return data as any[];
  });

export const upsertReserva = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: any) => data)
  .handler(async ({ data, context }) => {
    // Admin check
    const { data: roleData } = await context.supabase
      .from('user_roles' as any)
      .select('role')
      .eq('user_id', context.userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) throw new Error("Unauthorized");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("reservas")
      .upsert(data);
    
    if (error) throw error;
    return { success: true };
  });

export const deleteReserva = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    const { data: roleData } = await context.supabase
      .from('user_roles' as any)
      .select('role')
      .eq('user_id', context.userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) throw new Error("Unauthorized");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("reservas")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
    return { success: true };
  });

// Testimonials Functions
export const getDepoimentos = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
      .from("depoimentos" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as any[];
  });

export const upsertDepoimento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: any) => data)
  .handler(async ({ data, context }) => {
    const { data: roleData } = await context.supabase
      .from('user_roles' as any)
      .select('role')
      .eq('user_id', context.userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) throw new Error("Unauthorized");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("depoimentos")
      .upsert(data);
    
    if (error) throw error;
    return { success: true };
  });

// Schema Validations for site_content
const heroSchema = z.object({
  headline: z.string().max(300),
  subheadline: z.string().max(1000),
  cta_text: z.string().max(120),
  whatsapp_number: z.string().max(30),
  whatsapp_message: z.string().max(500),
  hero_image: z.string().max(2000).optional(),
  badges: z.array(z.string().max(120)).max(20).optional(),
});

const infrastructureSchema = z.array(z.object({
  title: z.string().max(200),
  description: z.string().max(1000),
  image: z.string().max(2000),
})).max(50);

const faqSchema = z.array(z.object({
  question: z.string().max(500),
  answer: z.string().max(2000),
})).max(50);

const gallerySchema = z.array(z.string().max(2000)).max(100);

const sectionSchemas = {
  hero: heroSchema,
  infrastructure: infrastructureSchema,
  faq: faqSchema,
  gallery: gallerySchema,
} as const;

export const updateSiteContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { section: string; content: unknown }) => {
    const section = data.section as keyof typeof sectionSchemas;
    if (sectionSchemas[section]) {
      sectionSchemas[section].parse(data.content);
    }
    return data;
  })
  .handler(async ({ data, context }) => {
    const { data: roleData } = await context.supabase
      .from('user_roles' as any)
      .select('role')
      .eq('user_id', context.userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) throw new Error("Unauthorized");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("site_content")
      .update({ content: data.content as any })
      .eq("section", data.section);
    
    if (error) throw error;
    return { success: true };
  });


