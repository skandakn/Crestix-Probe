import type { LucideIcon } from "lucide-react";

export type RoutePath =
  | "/"
  | "/dashboard"
  | "/terrain"
  | "/simulation"
  | "/forecasting"
  | "/sensors"
  | "/analytics"
  | "/login"
  | "/register";

export interface NavItem {
  title: string;
  href: RoutePath;
  icon: LucideIcon;
  badge?: string;
  badgeVariant?: "default" | "cyan" | "teal" | "warning";
  description?: string;
  owner?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}
