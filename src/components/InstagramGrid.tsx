import { useQuery } from "@tanstack/react-query";
import { getInstagramPosts } from "@/lib/site-content.functions";
import { Instagram } from "lucide-react";

export function InstagramGrid() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["instagram_feed"],
    queryFn: () => getInstagramPosts(),
    // Cache por 1 hora pra não bater no limite da API
    staleTime: 1000 * 60 * 60, 
  });

  if (isLoading) return null;
  if (!posts || posts.length === 0) return null; // Silent fail

  // Pegamos no máximo as 9 últimas
  const recentPosts = posts.slice(0, 9);

  return (
    <section className="py-20 md:py-32 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16 space-y-4">
          <div className="w-16 h-16 bg-[#FE8330]/10 rounded-2xl flex items-center justify-center text-[#FE8330] mx-auto">
            <Instagram className="w-8 h-8" />
          </div>
          <h2 className="text-2xl md:text-5xl font-black tracking-tight">Siga-nos no Instagram</h2>
          <p className="text-base md:text-lg text-muted-foreground font-medium max-w-[50ch] mx-auto">
            Acompanhe os melhores momentos, dicas e novidades do sítio em tempo real.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 max-w-4xl mx-auto">
          {recentPosts.map((post: any) => (
            <a
              key={post.id}
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="relative group aspect-square overflow-hidden bg-gray-100 rounded-xl md:rounded-3xl block"
            >
              <img
                src={post.media_type === "VIDEO" ? post.thumbnail_url : post.media_url}
                alt="Instagram post"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                <Instagram className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform scale-50 group-hover:scale-100" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
