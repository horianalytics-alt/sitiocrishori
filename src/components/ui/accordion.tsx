import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const Accordion = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("space-y-2", className)}>{children}</div>
)

const AccordionItem = ({ children, className, title }: { children: React.ReactNode, className?: string, title: string }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  return (
    <div className={cn("border border-border rounded-xl overflow-hidden bg-white shadow-sm", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-6 py-4 text-left font-medium transition-all hover:bg-gray-50"
      >
        {title}
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>
      <div className={cn("grid transition-all duration-200 ease-in-out", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
        <div className="overflow-hidden">
          <div className="px-6 pb-4 pt-0 text-sm text-muted-foreground">{children}</div>
        </div>
      </div>
    </div>
  )
}

export { Accordion, AccordionItem }
