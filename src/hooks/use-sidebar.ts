"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";

export interface UseSidebarReturn {
  isOpen: boolean;
  isCollapsed: boolean;
  setIsOpen: (open: boolean) => void;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  toggleCollapse: () => void;
  closeMobile: () => void;
}

export function useSidebar(): UseSidebarReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Close mobile sidebar whenever pathname changes without an effect
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsOpen(false);
  }

  const toggleSidebar = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const closeMobile = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    isCollapsed,
    setIsOpen,
    setIsCollapsed,
    toggleSidebar,
    toggleCollapse,
    closeMobile,
  };
}
