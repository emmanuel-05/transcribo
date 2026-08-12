/**
 * Constantes de session et d'expiration des tokens.
 */

export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
export const WARNING_THRESHOLD_MS = 28 * 60 * 1000; // Avertissement à 28 minutes (2 min avant)
export const ABSOLUTE_SESSION_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours
export const CHECK_INTERVAL_MS = 1000; // Fréquence de vérification : 1s
export const ACTIVITY_THROTTLE_MS = 3000; // Throttle des événements d'activité : 3s
