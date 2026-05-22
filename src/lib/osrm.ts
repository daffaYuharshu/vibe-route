export interface Coordinates {
  lng: number;
  lat: number;
}

export interface RouteInfo {
  distance: number; // in meters
  duration: number; // in seconds
  geometry: GeoJSON.LineString;
}

/**
 * Fetch a driving route between two coordinates using OSRM.
 * Returns null if no route is found or on error.
 */
export async function getRoute(
  origin: Coordinates,
  destination: Coordinates
): Promise<RouteInfo | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_OSRM_BASE_URL || 'https://router.project-osrm.org';

    const url =
      `${baseUrl}/route/v1/driving/` +
      `${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
      `?overview=full&geometries=geojson`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`OSRM request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes?.length) {
      throw new Error('No route found in OSRM response');
    }

    const route = data.routes[0];

    return {
      distance: route.distance,
      duration: route.duration,
      geometry: route.geometry as GeoJSON.LineString,
    };
  } catch (error) {
    console.error('[OSRM] Error fetching route:', error);
    return null;
  }
}

/** Format distance in meters to a human-readable string */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/** Format duration in seconds to a human-readable string */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs} jam ${mins} menit`;
  return `${mins} menit`;
}
