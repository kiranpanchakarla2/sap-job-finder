/** Relative posted label from ISO date. */
export function formatPostedAgo(iso: string, now = new Date()): string {
  const ms = now.getTime() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return "Recently";
  const hours = Math.floor(ms / (60 * 60 * 1000));
  if (hours < 24) {
    if (hours <= 1) return "Posted 1 hour ago";
    return `Posted ${hours} hours ago`;
  }
  const days = Math.floor(hours / 24);
  if (days === 1) return "Posted 1 day ago";
  if (days < 7) return `Posted ${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "Posted 1 week ago";
  if (weeks < 5) return `Posted ${weeks} weeks ago`;
  return `Posted ${days} days ago`;
}

export function formatPostedShort(iso: string, now = new Date()): string {
  return formatPostedAgo(iso, now).replace(/^Posted\s+/i, "");
}
