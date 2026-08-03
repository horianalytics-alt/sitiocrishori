import * as React from "react"
import { cn } from "@/lib/utils"

const Tabs = ({ children, value, onValueChange, className }: { children: React.ReactNode, value: string, onValueChange: (v: string) => void, className?: string }) => (
  <div className={cn("w-full", className)}>{children}</div>
)

const TabsList = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("inline-flex h-12 items-center justify-center rounded-full bg-gray-100 p-1 text-muted-foreground mb-8 w-full sm:w-auto", className)}>
    {children}
  </div>
)

const TabsTrigger = ({ children, value, activeValue, onClick, className }: { children: React.ReactNode, value: string, activeValue: string, onClick: (v: string) => void, className?: string }) => (
  <button
    onClick={() => onClick(value)}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-full px-8 py-2 text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
      activeValue === value ? "bg-white text-foreground shadow-sm" : "hover:text-foreground",
      className
    )}
  >
    {children}
  </button>
)

const TabsContent = ({ children, value, activeValue, className }: { children: React.ReactNode, value: string, activeValue: string, className?: string }) => (
  activeValue === value ? <div className={cn("mt-2", className)}>{children}</div> : null
)

export { Tabs, TabsList, TabsTrigger, TabsContent }
