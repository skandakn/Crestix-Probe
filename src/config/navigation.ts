import {
  LayoutDashboard,
  Mountain,
  Cpu,
  TrendingUp,
  Activity,
  BarChart3,
  LogIn,
  UserPlus,
  Compass,
} from "lucide-react";
import type { NavItem, NavSection } from "@/types/navigation";

export const NAVIGATION_ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  TERRAIN: "/terrain",
  SIMULATION: "/simulation",
  FORECASTING: "/forecasting",
  SENSORS: "/sensors",
  ANALYTICS: "/analytics",
  LOGIN: "/login",
  REGISTER: "/register",
} as const;

export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    title: "Mission Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    badge: "Live",
    badgeVariant: "cyan",
    description: "Real-time telemetry overview and probe vital stats",
    owner: "Member 1 (Foundation) & Team",
  },
  {
    title: "Terrain Mapping",
    href: "/terrain",
    icon: Mountain,
    badge: "Module 2",
    badgeVariant: "default",
    description: "3D topological elevation maps and hazard detection",
    owner: "Member 2",
  },
  {
    title: "Probe Simulation",
    href: "/simulation",
    icon: Cpu,
    badge: "Module 3",
    badgeVariant: "default",
    description: "Physics simulation, thruster trajectories & descent models",
    owner: "Member 3",
  },
  {
    title: "Environmental Forecasting",
    href: "/forecasting",
    icon: TrendingUp,
    badge: "Module 4",
    badgeVariant: "default",
    description: "Atmospheric, solar flux, and thermal predictive models",
    owner: "Member 4",
  },
  {
    title: "Sensors & Telemetry",
    href: "/sensors",
    icon: Activity,
    badge: "Module 5",
    badgeVariant: "teal",
    description: "Multi-spectral sensor arrays and hardware health",
    owner: "Member 5",
  },
  {
    title: "Mission Analytics",
    href: "/analytics",
    icon: BarChart3,
    badge: "Module 6",
    badgeVariant: "default",
    description: "Historic telemetry logs, trend analysis, and mission reports",
    owner: "Member 6",
  },
];

export const AUTH_NAV_ITEMS: NavItem[] = [
  {
    title: "Authentication Login",
    href: "/login",
    icon: LogIn,
    description: "Probe operator sign-in and authorization",
    owner: "Auth Team",
  },
  {
    title: "Operator Registration",
    href: "/register",
    icon: UserPlus,
    description: "Enroll new probe station operator credentials",
    owner: "Auth Team",
  },
];

export const SIDEBAR_SECTIONS: NavSection[] = [
  {
    title: "Probe Telemetry & Control",
    items: MAIN_NAV_ITEMS,
  },
  {
    title: "Mission Access",
    items: AUTH_NAV_ITEMS,
  },
];

export const LANDING_NAV_ITEM: NavItem = {
  title: "Mission Portal",
  href: "/",
  icon: Compass,
  description: "Crestix Probe mission landing and overview",
};
