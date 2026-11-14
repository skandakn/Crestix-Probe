"use client";

import React from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useSidebar } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";

export interface AppShellProps {
  children: React.ReactNode;
  title?: string;
}

export function AppShell({ children, title }: AppShellProps) {
  const {
    isOpen,
    isCollapsed,
    toggleSidebar,
    toggleCollapse,
    closeMobile,
  } = useSidebar();

  return (
    <div className="min-h-screen bg-[#07090e] text-[#f8fafc] flex">
      {/* Responsive Sidebar */}
      <Sidebar
        isOpen={isOpen}
        isCollapsed={isCollapsed}
        onCloseMobile={closeMobile}
        onToggleCollapse={toggleCollapse}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
          // Responsive left margin on desktop to accommodate sidebar width
          isCollapsed ? "lg:ml-[72px]" : "lg:ml-64"
        )}
      >
        <Header
          onToggleSidebarMobile={toggleSidebar}
          title={title}
          isCollapsed={isCollapsed}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
