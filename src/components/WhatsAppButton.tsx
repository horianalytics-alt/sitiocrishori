import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WhatsAppButtonProps {
  phoneNumber: string;
  message?: string;
  className?: string;
  label?: string;
  floating?: boolean;
}

export function WhatsAppButton({ 
  phoneNumber, 
  message = "Olá! Gostaria de saber mais sobre a disponibilidade do sítio.", 
  className,
  label = "Verificar Disponibilidade",
  floating = false
}: WhatsAppButtonProps) {
  const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  
  const baseClasses = "inline-flex items-center justify-center gap-2 rounded-full bg-[#FE8330] px-6 py-3 text-white font-semibold transition-all hover:bg-[#E06B1B] active:scale-95 shadow-lg transition-btn btn-pill-interactive focus-ring";
  
  if (floating) {
    return (
      <a 
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "fixed bottom-6 right-6 z-50 p-4 rounded-full bg-[#FE8330] text-white shadow-2xl hover:bg-[#E06B1B] active:scale-95 transition-all animate-bounce-subtle",
          className
        )}
      >
        <MessageCircle size={24} />
        <span className="sr-only">{label}</span>
      </a>
    );
  }

  return (
    <a 
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(baseClasses, className)}
    >
      <MessageCircle size={20} />
      {label}
    </a>
  );
}
