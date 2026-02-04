import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined, currency: string = 'EUR') {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount);
}
