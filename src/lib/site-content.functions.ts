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

const heroSchema = z.object({
  headline: z.string().max(300),
  subheadline: z.string().max(1000),
  cta_text: z.string().max(120),
  whatsapp_number: z.string().max(30),
  whatsapp_message: z.string().max(500),
  badges: z.array(z.string().max(120)).max(20).optional(),
});

const infrastructureSchema = z
  .array(
    z.object({
      title: z.string().max(200),
      description: z.string().max(1000),
      image: z.string().max(2000),
    }),
  )
  .max(50);

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
        caption: z.string().max(300).optional(),
      }),
    ]),
  )
  .max(100);

const rentalsSchema = z
  .array(
    z.object({
      title: z.string().max(200),
      description: z.string().max(2000),
      price: z.string().max(120).optional(),
      features: z.array(z.string().max(300)).max(30).optional(),
      image: z.string().max(2000).optional(),
    }),
  )
  .max(30);

const testimonialsSchema = z
  .array(
    z.object({
      name: z.string().max(200),
      text: z.string().max(2000),
      rating: z.number().min(0).max(5).optional(),
      avatar: z.string().max(2000).optional(),
    }),
  )
  .max(50);

const sectionSchemas = {
  hero: heroSchema,
  infrastructure: infrastructureSchema,
  faq: faqSchema,
  gallery: gallerySchema,
  rentals: rentalsSchema,
  testimonials: testimonialsSchema,
} as const;

const updateInputSchema = z
  .object({
    section: z.enum([
      "hero",
      "infrastructure",
      "faq",
      "gallery",
      "rentals",
      "testimonials",
    ]),
    content: z.unknown(),
  })
  .superRefine((val, ctx) => {
    const result = sectionSchemas[val.section].safeParse(val.content);
    if (!result.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid content for section "${val.section}"`,
        path: ["content"],
      });
    }
  });

export const updateSiteContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { section: string; content: unknown }) =>
    updateInputSchema.parse(data),
  )
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
