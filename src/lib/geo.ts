export function parseLatLong(value: string | null | undefined): { lat: number; lng: number } | null {
  if (!value) return null;
  
  // Remove brackets if present (e.g. from Google Maps copy)
  const cleanValue = value.replace(/[()\[\]]/g, '');
  
  const parts = cleanValue.split(',').map((s) => s.trim());
  if (parts.length !== 2) return null;
  
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  
  if (isNaN(lat) || isNaN(lng)) return null;
  
  // Basic range validation
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  
  return { lat, lng };
}

export function formatLatLong(lat: number, lng: number): string {
  // Use fixed precision to ensure database consistency and prevent floating point noise
  return `${lat.toFixed(6)},${lng.toFixed(6)}`;
}
