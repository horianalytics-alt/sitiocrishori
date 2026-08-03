import { updateSiteContent } from "./src/lib/site-content.functions";

const hero = {
  headline: "O cenário perfeito para os teus melhores momentos: Festas, Finais de Semana e Day Use.",
  subheadline: "Estrutura completa com piscina, área gourmet, suítes e muito mais em um ambiente cercado pela natureza.",
  cta_text: "Verificar Disponibilidade no WhatsApp",
  whatsapp_message: "Olá! Gostaria de saber mais sobre a disponibilidade do sítio.",
  whatsapp_number: "5511973000753",
  badges: ["Piscina Aquecida", "Campo de Futebol", "Área Gourmet", "Pernoite"]
};

updateSiteContent({ data: { section: 'hero', content: hero } })
  .then(res => {
    console.log("Success:", res);
    process.exit(0);
  })
  .catch(err => {
    console.error("Error:", err);
    process.exit(1);
  });
