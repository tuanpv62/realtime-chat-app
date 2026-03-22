import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Merge Tailwind classes thông minh
// clsx: Conditional classes
// twMerge: Tránh conflict (e.g. px-2 + px-4 → px-4)
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
