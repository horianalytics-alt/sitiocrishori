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

export type Reserva = {
  id?: string;
  data_inicio: string;
  data_fim: string;
  cliente_nome: string;
  cliente_telefone: string;
  valor_total: number;
  sinal_pago: boolean;
  status: string;
};

export type Depoimento = {
  id?: string;
  nome: string;
  evento: string;
  depoimento: string;
  estrelas: number;
  foto_url?: string;
};

// Site Content Functions (Legacy but maintained for compatibility)
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

// Reservations Functions
export const getReservas = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
      .from("reservas")
      .select("*")
      .order("data_inicio", { ascending: true });
    if (error) throw error;
    return data as Reserva[];
  });

export const upsertReserva = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: Reserva) => data)
  .handler(async ({ data, context }) => {
    // Admin check
    const { data: roleData } = await context.supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', context.userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) throw new Error("Unauthorized");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
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
      .from('user_roles')
      .select('role')
      .eq('user_id', context.userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) throw new Error("Unauthorized");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
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
      .from("depoimentos")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Depoimento[];
  });

export const upsertDepoimento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: Depoimento) => data)
  .handler(async ({ data, context }) => {
    const { data: roleData } = await context.supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', context.userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) throw new Error("Unauthorized");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
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
      .from('user_roles')
      .select('role')
      .eq('user_id', context.userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) throw new Error("Unauthorized");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("site_content")
      .update({ content: data.content as any })
      .eq("section", data.section);
    
    if (error) throw error;
    return { success: true };
  });

