// Free, no-API-key distance helpers. We deliberately avoid any paid
// geocoding/directions API: haversineKm gives an instant straight-line
// estimate from two GPS points, and buildGoogleMapsDirectionsUrl hands off
// to Google Maps itself (opened by the therapist) for the real driving
// route — Maps does its own address resolution for free when the link is
// opened, so we never need to geocode text addresses ourselves.

const EARTH_RADIUS_KM = 6371;

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

type GeoPoint = { lat: number; lng: number };

// destination can be precise GPS coords (best case) or a free-text address
// (fallback) — Google Maps resolves the text itself, no API key needed.
export function buildGoogleMapsDirectionsUrl(origin: GeoPoint, destination: GeoPoint | string): string {
  const originParam = `${origin.lat},${origin.lng}`;
  const destParam = typeof destination === "string" ? destination : `${destination.lat},${destination.lng}`;
  const params = new URLSearchParams({
    api: "1",
    origin: originParam,
    destination: destParam,
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
