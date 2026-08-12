/**
 * Utilitaire simple pour combiner des classes CSS conditionnelles.
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
