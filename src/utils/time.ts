// src/utils/time.ts
export function formatTime(ts: Date | number): string {
  const d = typeof ts === "number" ? new Date(ts) : ts;

  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  if (hours === 0) hours = 12;

  const mm = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}:${mm} ${ampm}`;
}

export function timeAgo(ts: Date | number): string {
  const d = typeof ts === "number" ? new Date(ts) : ts;
  const diffMs = Date.now() - d.getTime();
  const sec = Math.floor(diffMs / 1000);

  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  return `${day}d`;
}
