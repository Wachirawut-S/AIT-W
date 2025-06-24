export default function getImageUrl(path: string): string {
  if (!path) return path;
  if (path.startsWith("http")) return path;
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window!=="undefined"? `${window.location.protocol}//${window.location.hostname}:8000` : "http://localhost:8000");
  return `${base}${path}`;
} 