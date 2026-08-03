CREATE TYPE public.app_role AS enum ('admin', 'user');

CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.site_content (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    section text NOT NULL UNIQUE,
    content jsonb NOT NULL DEFAULT '{}'::jsonb,
    updated_at timestamptz DEFAULT now()
);

GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT ALL ON public.site_content TO service_role;

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to site_content"
    ON public.site_content FOR SELECT
    USING (true);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE POLICY "Allow admins to update site_content"
    ON public.site_content FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Initial Seed Data
INSERT INTO public.site_content (section, content) VALUES
('hero', '{
    "headline": "O cenário perfeito para os teus melhores momentos: Festas, Finais de Semana e Day Use.",
    "subheadline": "Estrutura completa com piscina, área gourmet, suítes e muito mais em um ambiente cercado pela natureza.",
    "cta_text": "Verificar Disponibilidade no WhatsApp",
    "whatsapp_number": "5511999999999",
    "whatsapp_message": "Olá! Gostaria de saber mais sobre a disponibilidade do sítio."
}'),
('infrastructure', '[
    {"title": "Área de Festas", "description": "Salão amplo e coberto para até 100 convidados.", "image": "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800"},
    {"title": "Piscina Aquecida", "description": "Piscina com aquecimento solar e deck molhado.", "image": "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=800"},
    {"title": "Área Gourmet", "description": "Churrasqueira, forno a lenha e cozinha completa.", "image": "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=800"},
    {"title": "Suítes Confortáveis", "description": "Acomodações para até 20 pessoas pernoitarem.", "image": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800"}
]'),
('faq', '[
    {"question": "Qual a capacidade máxima?", "answer": "Até 100 pessoas para eventos e 20 para pernoite."},
    {"question": "Como funciona o horário de som?", "answer": "Som ambiente permitido até às 22h, respeitando a vizinhança."}
]');
