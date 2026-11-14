import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names with Tailwind CSS conflict resolution.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format timestamp into standard mission time format (UTC ISO string or formatted).
 */
export function formatMissionTime(date: Date = new Date()): string {
  return date.toISOString().replace("T", " ").substring(0, 19) + " UTC";
}
