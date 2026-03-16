import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { KRA } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Robustly converts various date formats (Firestore Timestamp, ISO String, or Date) 
 * into a standard JS Date object.
 */
export function ensureDate(dateValue: any): Date {
  if (!dateValue) return new Date();
  if (dateValue instanceof Date) return dateValue;
  
  // Handle Firestore Timestamp
  if (dateValue && typeof dateValue === 'object' && 'seconds' in dateValue) {
    return new Date(dateValue.seconds * 1000);
  }
  
  // Handle strings or numbers
  const d = new Date(dateValue);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Unifies KRA sorting across the application.
 * Primarily sorts by 'order' property, falling back to creation/update date.
 */
export function sortKras(kras: KRA[]): KRA[] {
  return [...kras].sort((a, b) => {
    // 1. Sort by explicit order if available
    const orderA = a.order ?? 0;
    const orderB = b.order ?? 0;
    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // 2. Fallback to creation/update date
    const dateA = ensureDate(a.createdAt || a.updatedAt || a.startDate).getTime();
    const dateB = ensureDate(b.createdAt || b.updatedAt || b.startDate).getTime();
    return dateA - dateB;
  });
}
