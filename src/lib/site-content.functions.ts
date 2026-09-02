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

// Helper: verify admin role
async function verifyAdmin(context: { supabase: any; userId: string }) {
  const { data: roleData } = await context.supabase
    .from("user_roles" as any)
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!roleData) throw new Error("Unauthorized");
}

// ─────────────────────────────────────────────
// SITE CONTENT
// ─────────────────────────────────────────────

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
      if (section === "gallery" && (!content || content.length === 0)) {
        return [
          "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=800",
          "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800",
          "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=800",
          "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=800",
          "https://images.unsplash.com/photo-1470753937643-efad93c239fa?q=80&w=800",
          "https://images.unsplash.com/photo-1531058020387-3be344556be6?q=80&w=800",
          "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800",
        ];
      }

      if (!data) return section === "gallery" ? [] : null;
      return content;
    } catch (err) {
      console.error(`Error fetching site content for ${section}:`, err);
      return section === "gallery" ? [] : null;
    }
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

const infrastructureSchema = z.array(
  z.object({
    title: z.string().max(200),
    description: z.string().max(1000),
    image: z.string().max(2000),
  }),
).max(50);

const faqSchema = z
  .array(
    z.object({
      question: z.string().max(500),
      answer: z.string().max(2000),
    }),
  )
  .max(50);

const gallerySchema = z
  .array(
    z.union([
      z.string().max(2000),
      z.object({
        url: z.string().max(2000),
        tag: z.enum(["dia", "noite", "ambos"]),
        tipo: z.enum(["foto", "video"]).optional(),
        ambiente: z
          .enum(["piscina", "area_gourmet", "suites", "salao", "area_externa", "geral"])
          .optional(),
      }),
    ]),
  )
  .max(100);

const sectionSchemas = {
  hero: heroSchema,
  infrastructure: infrastructureSchema,
  faq: faqSchema,
  gallery: gallerySchema,
  gallery_natal: gallerySchema,
  gallery_pascoa: gallerySchema,
  gallery_ano_novo: gallerySchema,
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
    await verifyAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("site_content")
      .update({ content: data.content as any })
      .eq("section", data.section);
    if (error) throw error;
    return { success: true };
  });

// ─────────────────────────────────────────────
// RESERVAS
// ─────────────────────────────────────────────

// Public: only date ranges + status (no customer PII)
export const getReservas = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await (supabaseAdmin as any).rpc("get_reservas_disponibilidade");
  if (error) throw error;
  return ((data as any[]) || []).sort((a, b) =>
    String(a.data_inicio).localeCompare(String(b.data_inicio)),
  );
});

// Admin only: full reservation records including customer data
export const getReservasAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(
    (filters?: { status?: string; mes?: string }) => filters,
  )
  .handler(async ({ data: filters, context }) => {
    await verifyAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let query = (supabaseAdmin as any)
      .from("reservas")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters?.status && filters.status !== "todos") {
      query = query.eq("status_novo", filters.status);
    }
    if (filters?.mes) {
      // filters.mes format: "YYYY-MM"
      query = query
        .gte("data_evento", `${filters.mes}-01`)
        .lte("data_evento", `${filters.mes}-31`);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data as any[];
  });

export const upsertReserva = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: any) => data)
  .handler(async ({ data, context }) => {
    await verifyAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any).from("reservas").upsert(data);
    if (error) throw error;
    return { success: true };
  });

export const deleteReserva = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    await verifyAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any).from("reservas").delete().eq("id", id);
    if (error) throw error;
    return { success: true };
  });

export const updateReservaStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string; status_novo: string }) => data)
  .handler(async ({ data, context }) => {
    await verifyAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("reservas")
      .update({ status_novo: data.status_novo })
      .eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });

// ─────────────────────────────────────────────
// DISPONIBILIDADE
// ─────────────────────────────────────────────

export const getDisponibilidade = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: { ano: number; mes: number }) => data)
  .handler(async ({ data, context }) => {
    await verifyAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const start = `${data.ano}-${String(data.mes).padStart(2, "0")}-01`;
    const end = `${data.ano}-${String(data.mes).padStart(2, "0")}-31`;
    const { data: rows, error } = await (supabaseAdmin as any)
      .from("disponibilidade")
      .select("*")
      .gte("data", start)
      .lte("data", end);
    if (error) throw error;
    return (rows as any[]) || [];
  });

export const setDisponibilidade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (data: { data: string; status: string; observacao?: string }) => data,
  )
  .handler(async ({ data, context }) => {
    await verifyAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("disponibilidade")
      .upsert({ data: data.data, status: data.status, observacao: data.observacao ?? null }, {
        onConflict: "data",
      });
    if (error) throw error;
    return { success: true };
  });

// ─────────────────────────────────────────────
// DEPOIMENTOS
// ─────────────────────────────────────────────

export const getDepoimentos = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabase
    .from("depoimentos" as any)
    .select("*")
    .eq("aprovado", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as any[];
});

export const getDepoimentosAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await verifyAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any)
      .from("depoimentos")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as any[];
  });

export const upsertDepoimento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: any) => data)
  .handler(async ({ data, context }) => {
    await verifyAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any).from("depoimentos").upsert(data);
    if (error) throw error;
    return { success: true };
  });

export const aprovarDepoimento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string; aprovado: boolean }) => data)
  .handler(async ({ data, context }) => {
    await verifyAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("depoimentos")
      .update({ aprovado: data.aprovado })
      .eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });

export const deleteDepoimento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    await verifyAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("depoimentos")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return { success: true };
  });

// ─────────────────────────────────────────────
// REGRAS E POLÍTICAS
// ─────────────────────────────────────────────

export const getRegrasPoliticas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await verifyAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any)
      .from("regras_politicas")
      .select("*")
      .order("ordem", { ascending: true });
    if (error) throw error;
    return (data as any[]) || [];
  });

export const upsertRegraPolitica = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: any) => data)
  .handler(async ({ data, context }) => {
    await verifyAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await (supabaseAdmin as any)
      .from("regras_politicas")
      .upsert(data)
      .select()
      .single();
    if (error) throw error;
    return result;
  });

export const deleteRegraPolitica = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    await verifyAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any)
      .from("regras_politicas")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return { success: true };
  });

export const reorderRegrasPoliticas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((orderedIds: string[]) => orderedIds)
  .handler(async ({ data: orderedIds, context }) => {
    await verifyAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (let i = 0; i < orderedIds.length; i++) {
      await (supabaseAdmin as any)
        .from("regras_politicas")
        .update({ ordem: i })
        .eq("id", orderedIds[i]);
    }
    return { success: true };
  });

// ─────────────────────────────────────────────
// LEADS CAPTURADOS
// ─────────────────────────────────────────────

export const getLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await verifyAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any)
      .from("leads_capturados")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as any[]) || [];
  });

// ─────────────────────────────────────────────
// CONFIG SITE
// ─────────────────────────────────────────────

export const getConfigSite = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await verifyAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any)
      .from("config_site")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  });

export const updateConfigSite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (data: {
      id?: string;
      countdown_mensagem?: string;
      datas_quase_lotadas?: string;
      instagram_usuario?: string;
      whatsapp_contato?: string;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    await verifyAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.id) {
      const { error } = await (supabaseAdmin as any)
        .from("config_site")
        .update({
          countdown_mensagem: data.countdown_mensagem,
          datas_quase_lotadas: data.datas_quase_lotadas,
          instagram_usuario: data.instagram_usuario,
          whatsapp_contato: data.whatsapp_contato,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);
      if (error) throw error;
    } else {
      const { error } = await (supabaseAdmin as any).from("config_site").insert({
        countdown_mensagem: data.countdown_mensagem,
        datas_quase_lotadas: data.datas_quase_lotadas,
        instagram_usuario: data.instagram_usuario,
        whatsapp_contato: data.whatsapp_contato,
      });
      if (error) throw error;
    }
    return { success: true };
  });
// Funções públicas adicionais
export const getDisponibilidadePublica = createServerFn({ method: "GET" })
  .validator((data?: { ano: number; mes: number }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let query = (supabaseAdmin as any).from("disponibilidade").select("*");
    
    if (data) {
      const start = `${data.ano}-${String(data.mes).padStart(2, "0")}-01`;
      const end = `${data.ano}-${String(data.mes).padStart(2, "0")}-31`;
      query = query.gte("data", start).lte("data", end);
    }
    
    const { data: rows, error } = await query;
    if (error) throw error;
    return rows as any[];
  });

export const criarReservaPublica = createServerFn({ method: "POST" })
  .validator((data: any) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: res, error } = await (supabaseAdmin as any)
      .from("reservas")
      .insert({ ...data, status_novo: 'pendente' })
      .select("link_unico")
      .single();
    if (error) throw error;
    return res;
  });
// ─────────────────────────────────────────────
// INSTAGRAM
// ─────────────────────────────────────────────

export const getInstagramPosts = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: config } = await (supabaseAdmin as any)
      .from("config_site")
      .select("instagram_token")
      .single();

    if (!config?.instagram_token) {
      return null; // Silent fail se não tiver token
    }

    try {
      const token = config.instagram_token;
      // Chamada oficial da Instagram Basic Display API
      const res = await fetch(`https://graph.instagram.com/me/media?fields=id,media_type,media_url,permalink,thumbnail_url&access_token=${token}&limit=9`);
      if (!res.ok) {
        return null; // Silent fail
      }
      const data = await res.json();
      return data.data;
    } catch (e) {
      return null;
    }
  });

// ─────────────────────────────────────────────
// TOUR VIRTUAL
// ─────────────────────────────────────────────

export const setTourVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    await verifyAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Zera todos os tours antigos
    await (supabaseAdmin as any)
      .from("midias")
      .update({ is_tour: false })
      .eq("is_tour", true);

    // Seta o novo
    if (id) {
      const { error } = await (supabaseAdmin as any)
        .from("midias")
        .update({ is_tour: true })
        .eq("id", id);
      if (error) throw error;
    }
    
    return { success: true };
  });

export const getTourVideo = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await (supabaseAdmin as any)
      .from("midias")
      .select("url")
      .eq("is_tour", true)
      .single();
    
    return data?.url || null;
  });
