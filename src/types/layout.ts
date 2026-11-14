import type { ReactNode } from "react";
import type { RoutePath } from "./navigation";

export interface BreadcrumbItem {
  label: string;
  href?: RoutePath;
}

export interface SharedLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
}

export interface SidebarState {
  isOpen: boolean;
  isCollapsed: boolean;
  setIsOpen: (open: boolean) => void;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  toggleCollapse: () => void;
}
