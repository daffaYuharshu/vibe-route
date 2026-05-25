// ── Raw response from new Foursquare Places API (2025) ──────────────
interface FoursquareRawPlace {
  fsq_place_id: string; // new API uses fsq_place_id (not fsq_id)
  name: string;
  categories: { fsq_category_id: number; name: string; short_name: string; icon: { prefix: string; suffix: string } }[];
  location: {
    address?: string;
    locality?: string;
    region?: string;
    country?: string;
    formatted_address?: string;
  };
  latitude: number;   // new API: top-level lat/lng (not inside geocodes)
  longitude: number;
  distance?: number;
}

// ── Normalized shape used throughout the app ────────────────────────
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
  distance?: number;
}

export interface SearchPlacesParams {
  query: string;
  lat: number;
  lng: number;
  radius?: number; // meters
  limit?: number;
}

/**
 * Normalize raw Foursquare 2025 response to the app's FoursquarePlace shape.
 * The new API moved fsq_id → fsq_place_id and lat/lng to top-level fields.
 */
function normalize(raw: FoursquareRawPlace): FoursquarePlace {
  return {
    fsq_id: raw.fsq_place_id,
    name: raw.name,
    categories: (raw.categories ?? []).map((c) => ({
      id: Number(c.fsq_category_id),
      name: c.name,
      icon: c.icon,
    })),
    location: raw.location ?? {},
    geocodes: {
      main: { latitude: raw.latitude, longitude: raw.longitude },
    },
    distance: raw.distance,
  };
}

/**
 * Search for places near a coordinate using the Foursquare Places API (2025).
 *
 * Endpoint : https://places-api.foursquare.com/places/search
 * Auth     : Authorization: Bearer <FOURSQUARE_API_KEY>
 * Version  : X-Places-Api-Version: 2025-06-17  (required)
 *
 * Must be called server-side (via Next.js API route) to protect the API key.
 * Docs: https://docs.foursquare.com/fsq-developers-places/reference/place-search
 */
export async function searchPlaces(
  params: SearchPlacesParams
): Promise<FoursquarePlace[]> {
  const apiKey = process.env.FOURSQUARE_API_KEY;

  if (!apiKey) {
    throw new Error(
      'FOURSQUARE_API_KEY tidak diset. Dapatkan key di https://foursquare.com/developers/console dan tambahkan ke .env.local'
    );
  }

  const { query, lat, lng, radius = 2000, limit = 10 } = params;

  const url = new URL('https://places-api.foursquare.com/places/search');
  url.searchParams.set('query', query);
  url.searchParams.set('ll', `${lat},${lng}`);
  url.searchParams.set('radius', String(radius));
  url.searchParams.set('limit', String(limit));
  // Request all fields needed for FoursquarePlace shape
  url.searchParams.set(
    'fields',
    'fsq_place_id,name,categories,location,latitude,longitude,distance'
  );

  console.log('[foursquare] Requesting:', url.toString());

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'X-Places-Api-Version': '2025-06-17',
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '(unreadable)');
    console.error(
      `[foursquare] API error ${response.status} ${response.statusText}:`,
      errorBody
    );

    const hint =
      response.status === 401
        ? 'API key tidak valid atau expired. Perbarui FOURSQUARE_API_KEY di .env.local'
        : response.status === 403
        ? 'API key tidak memiliki akses ke Places API. Periksa permissions di Foursquare Console.'
        : response.status === 429
        ? 'Rate limit Foursquare tercapai. Coba lagi beberapa saat.'
        : `Foursquare error ${response.status}: ${errorBody.slice(0, 100)}`;

    throw new Error(hint);
  }

  const data = await response.json();
  const raw: FoursquareRawPlace[] = data.results ?? [];
  const places = raw.map(normalize);

  console.log(`[foursquare] Returned ${places.length} places`);
  return places;
}
