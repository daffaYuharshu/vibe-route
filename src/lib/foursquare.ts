export interface FoursquarePlace {
  fsq_id: string;
  name: string;
  categories: { id: number; name: string; icon: { prefix: string; suffix: string } }[];
  location: {
    address?: string;
    locality?: string;
    country?: string;
    formatted_address?: string;
  };
  geocodes: {
    main: { latitude: number; longitude: number };
  };
  rating?: number;
  distance?: number; // in meters, relative to search point
}

export interface SearchPlacesParams {
  query: string;
  lat: number;
  lng: number;
  radius?: number; // meters, default 1000
  limit?: number;
}

/**
 * Search for places near a coordinate using Foursquare Places API.
 * Must be called server-side (via Next.js API route) to protect the API key.
 */
export async function searchPlaces(
  params: SearchPlacesParams
): Promise<FoursquarePlace[]> {
  const apiKey = process.env.FOURSQUARE_API_KEY;

  if (!apiKey) {
    throw new Error('FOURSQUARE_API_KEY is not set');
  }

  const { query, lat, lng, radius = 1000, limit = 10 } = params;

  const url = new URL('https://api.foursquare.com/v3/places/search');
  url.searchParams.set('query', query);
  url.searchParams.set('ll', `${lat},${lng}`);
  url.searchParams.set('radius', String(radius));
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('fields', 'fsq_id,name,categories,location,geocodes,rating,distance');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: apiKey,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Foursquare API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return (data.results as FoursquarePlace[]) ?? [];
}
