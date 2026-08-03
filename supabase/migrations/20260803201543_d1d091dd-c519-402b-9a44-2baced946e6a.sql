UPDATE public.site_content 
SET content = '[
  "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=800",
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800",
  "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=800",
  "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=800",
  "https://images.unsplash.com/photo-1470753937643-efad93c239fa?q=80&w=800",
  "https://images.unsplash.com/photo-1531058020387-3be344556be6?q=80&w=800",
  "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800"
]'::jsonb 
WHERE section = 'gallery';