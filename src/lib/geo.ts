export function parseLatLong(value: string | null | undefined): { lat: number; lng: number } | null {
  if (!value) return null;
  const parts = value.split(',').map((s) => s.trim());
  if (parts.length !== 2) return null;
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  if (isNaN(lat) || isNaN(lng)) return null;
  return { lat, lng };
}

export function formatLatLong(lat: number, lng: number): string {
  return `${lat},${lng}`;
}
