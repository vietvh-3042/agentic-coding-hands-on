import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind class strings, resolving conflicting utility classes in
 * favor of the last one applied. Standard shadcn/ui helper — restored here
 * to satisfy the `components.json` `utils` alias (`@/lib/utils`).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
