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
  label = "Falar no WhatsApp",
  floating = false
}: WhatsAppButtonProps) {
  const cleanPhone = (phoneNumber || "11999999999").replace(/\D/g, "");
  const phoneWithDDI = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
  const url = `https://wa.me/${phoneWithDDI}?text=${encodeURIComponent(message)}`;
  
  if (floating) {
    return (
      <a 
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className={cn(
          "fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 min-h-[56px] min-w-[56px] px-4 py-3 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-2xl flex items-center justify-center gap-2.5 transition-all hover:scale-105 active:scale-95 group",
          className
        )}
      >
        <MessageCircle className="w-7 h-7 shrink-0 fill-current" />
        <span className="hidden sm:inline-block font-black text-sm pr-1">
          {label}
        </span>
      </a>
    );
  }

  return (
    <a 
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FE8330] hover:bg-[#E06B1B] px-6 py-3.5 text-white font-black text-base transition-all active:scale-95 shadow-md",
        className
      )}
    >
      <MessageCircle className="w-5 h-5" />
      {label}
    </a>
  );
}
