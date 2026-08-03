import * as React from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const Tabs = ({ children, value, onValueChange, className }: { children: React.ReactNode, value: string, onValueChange: (v: string) => void, className?: string }) => (
  <div className={cn("w-full", className)}>{children}</div>
)

const TabsList = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("inline-flex h-auto items-center justify-center rounded-full bg-gray-100/50 p-1.5 text-muted-foreground mb-8 w-full sm:w-auto backdrop-blur-sm border border-gray-200", className)}>
    {children}
  </div>
)

const TabsTrigger = ({ children, value, activeValue, onClick, className }: { children: React.ReactNode, value: string, activeValue: string, onClick: (v: string) => void, className?: string }) => (
  <button
    onClick={() => onClick(value)}
    className={cn(
      "relative inline-flex items-center justify-center whitespace-nowrap rounded-full px-8 py-3 text-sm font-bold uppercase tracking-wider transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 z-10",
      activeValue === value ? "text-[#FE8330]" : "hover:text-foreground/70",
      className
    )}
  >
    {activeValue === value && (
      <motion.div
        layoutId="activeTab"
        className="absolute inset-0 bg-white rounded-full shadow-md z-[-1]"
        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
      />
    )}
    {children}
  </button>
)

const TabsContent = ({ children, value, activeValue, className }: { children: React.ReactNode, value: string, activeValue: string, className?: string }) => (
  activeValue === value ? <div className={cn("mt-2", className)}>{children}</div> : null
)

export { Tabs, TabsList, TabsTrigger, TabsContent }
