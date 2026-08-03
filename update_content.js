import { supabase } from "./src/integrations/supabase/client.js";

async function updateHero() {
  const newHero = {
    headline: "O cenário perfeito para os seus melhores momentos: Festas, Finais de Semana e Day Use.",
    subheadline: "Destaque para a localização, natureza e estrutura completa para reuniões familiares e eventos.",
    cta_text: "Verificar Disponibilidade",
    whatsapp_number: "5511973000753",
    whatsapp_message: "Olá! Gostaria de saber mais sobre a disponibilidade do sítio.",
    badges: [
      "Piscina Aquecida",
      "Campo de Futebol",
      "Área Gourmet",
      "Pernoite para X Pessoas"
    ]
  };

  const { error } = await supabase
    .from("site_content")
    .update({ content: newHero })
    .eq("section", "hero");

  if (error) {
    console.error("Error updating hero:", error);
    process.exit(1);
  }
  console.log("Hero updated successfully!");
}

updateHero();
