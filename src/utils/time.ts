/**
 * Formats a Unix timestamp (seconds) into a human-readable relative time string.
 * Examples: "just now", "5m ago", "3h ago", "2d ago", "4mo ago", "2y ago"
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp * 1000;

  if (diffMs < 0) {
    return 'just now';
  }

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) {
    return 'just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays < 30) {
    return `${diffDays}d ago`;
  }
  if (diffMonths < 12) {
    return `${diffMonths}mo ago`;
  }
  return `${diffYears}y ago`;
}

/**
 * Formats a score number into a compact string.
 * Examples: 42 → "42", 1200 → "1.2k", 1_050_000 → "1.1m"
 */
export function formatScore(score: number): string {
  const abs = Math.abs(score);
  const sign = score < 0 ? '-' : '';

  if (abs < 1000) {
    return `${sign}${abs}`;
  }
  if (abs < 1_000_000) {
    const k = abs / 1000;
    return `${sign}${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  const m = abs / 1_000_000;
  return `${sign}${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}m`;
}

/**
 * Formats a subscriber count similarly to formatScore but with different labels.
 */
export function formatSubscribers(count: number): string {
  return formatScore(count);
}
