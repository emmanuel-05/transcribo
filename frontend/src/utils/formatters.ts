/**
 * Utilitaires de formatage de dates, heures et textes.
 */

/**
 * Formate une date ISO en chaîne lisible au format français (ex: 12/08/2026).
 */
export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/**
 * Formate une date et heure ISO en chaîne lisible (ex: 12/08/2026 à 14:30).
 */
export function formatDateTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    return `${d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })} à ${d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  } catch {
    return "";
  }
}

/**
 * Formate un nombre de secondes en format MM:SS ou HH:MM:SS.
 */
export function formatSecondsToTime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || isNaN(seconds) || seconds < 0) {
    return "0:00";
  }

  const rounded = Math.floor(seconds);
  const hrs = Math.floor(rounded / 3600);
  const mins = Math.floor((rounded % 3600) / 60);
  const secs = rounded % 60;

  const paddedSecs = secs < 10 ? `0${secs}` : `${secs}`;

  if (hrs > 0) {
    const paddedMins = mins < 10 ? `0${mins}` : `${mins}`;
    return `${hrs}:${paddedMins}:${paddedSecs}`;
  }

  return `${mins}:${paddedSecs}`;
}

/**
 * Tronque un texte s'il dépasse une longueur maximale avec ellipse (...).
 */
export function truncateText(text: string | null | undefined, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}
