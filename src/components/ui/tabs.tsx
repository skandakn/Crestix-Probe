"use client";

import React, { createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";

interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
  ...props
}: TabsProps) {
  const [internalTab, setInternalTab] = useState(defaultValue);
  const activeTab = value !== undefined ? value : internalTab;

  const setActiveTab = (tab: string) => {
    if (value === undefined) {
      setInternalTab(tab);
    }
    onValueChange?.(tab);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn("w-full space-y-4", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export type TabListProps = React.HTMLAttributes<HTMLDivElement>;

export function TabList({ className, children, ...props }: TabListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1 p-1 rounded-lg bg-[#0b0f17] border border-slate-800",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface TabTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  icon?: React.ReactNode;
}

export function TabTrigger({
  value,
  icon,
  children,
  className,
  ...props
}: TabTriggerProps) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("TabTrigger must be used within Tabs");
  }

  const isActive = context.activeTab === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => context.setActiveTab(value)}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 cursor-pointer",
        isActive
          ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm"
          : "text-slate-400 hover:text-slate-200 hover:bg-[#151d2c] border border-transparent",
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

export interface TabContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabContent({ value, children, className, ...props }: TabContentProps) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("TabContent must be used within Tabs");
  }

  if (context.activeTab !== value) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      className={cn("animate-fadeIn duration-150 focus:outline-none", className)}
      {...props}
    >
      {children}
    </div>
  );
}
