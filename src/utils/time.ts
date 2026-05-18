/**
 * Formats a duration in seconds to a string.
 * - If less than 1 hour: m:ss or mm:ss (e.g., 3:15, 12:08, 0:45)
 * - If 1 hour or more: h:mm:ss (e.g., 1:12:20, 2:05:09, 10:00:00)
 */
export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Parses an ISO 8601 duration string (e.g., PT1H12M20S, PT3M15S, PT45S) into seconds.
 */
export function parseISO8601Duration(durationStr: string): number {
  if (!durationStr) return 0;
  
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = durationStr.match(regex);
  if (!matches) return 0;

  const hours = parseInt(matches[1] || '0', 10);
  const minutes = parseInt(matches[2] || '0', 10);
  const seconds = parseInt(matches[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}
