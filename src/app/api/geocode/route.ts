import { NextRequest, NextResponse } from 'next/server';

// Indonesia bounding box
const INDONESIA_BBOX = '95.0,-11.0,141.1,6.1';

// Detects "lat,lng" coordinate pattern (reverse geocoding from geolocation button)
const COORD_RE = /^-?\d{1,3}(\.\d+)?,\s*-?\d{1,3}(\.\d+)?$/;

// ── Nominatim response shape ──────────────────────────────────────────
interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  class: string;
  importance?: number;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';
  const proximity = searchParams.get('proximity') ?? '106.8272,-6.1751';

  if (!q || q.length < 2) {
    return NextResponse.json({ features: [] });
  }

  const isCoord = COORD_RE.test(q);

  // ── REVERSE geocoding (geolocation button) — keep MapTiler ─────────
  if (isCoord) {
    const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'MAPTILER_API_KEY not set' }, { status: 500 });
    }

    const [latStr, lngStr] = q.split(',').map((s) => s.trim());
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ features: [] });
    }

    const url = new URL('https://api.maptiler.com/geocoding/reverse.json');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lng));
    url.searchParams.set('language', 'id,en');
    url.searchParams.set('country', 'id');

    try {
      const res = await fetch(url.toString(), {
        next: { revalidate: 300 },
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error('[geocode] MapTiler reverse error', res.status, body.slice(0, 200));
        return NextResponse.json({ error: `MapTiler ${res.status}` }, { status: 500 });
      }
      const data = await res.json();
      return NextResponse.json(data);
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Reverse geocode error' }, { status: 500 });
    }
  }

  // ── FORWARD geocoding — Nominatim (OSM) ────────────────────────────
  // Nominatim supports POI/landmark search (stasiun, masjid, RS, kafe, etc.)
  // and is free for Indonesia with full OSM data coverage.
  //
  // Proximity bias: build a viewbox around the proximity coord (±0.3°, ~33km)
  // so results near the user appear first, but don't block other Indonesia results.
  let viewbox: string | null = null;
  const [lngStr, latStr] = proximity.split(',');
  const proxLng = parseFloat(lngStr);
  const proxLat = parseFloat(latStr);
  if (!isNaN(proxLng) && !isNaN(proxLat)) {
    // viewbox = left,top,right,bottom (west, north, east, south)
    viewbox = `${proxLng - 0.3},${proxLat + 0.3},${proxLng + 0.3},${proxLat - 0.3}`;
  }

  const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search');
  nominatimUrl.searchParams.set('q', q);
  nominatimUrl.searchParams.set('format', 'json');
  nominatimUrl.searchParams.set('addressdetails', '1');
  nominatimUrl.searchParams.set('countrycodes', 'id');       // Indonesia only
  nominatimUrl.searchParams.set('limit', '6');
  nominatimUrl.searchParams.set('accept-language', 'id,en');
  nominatimUrl.searchParams.set('dedupe', '1');
  if (viewbox) {
    nominatimUrl.searchParams.set('viewbox', viewbox);
    nominatimUrl.searchParams.set('bounded', '0'); // soft bias, not hard bound
  }

  console.log('[geocode] Nominatim request:', nominatimUrl.toString());

  try {
    const res = await fetch(nominatimUrl.toString(), {
      next: { revalidate: 60 },
      headers: {
        // Nominatim requires a valid User-Agent to identify the app
        'User-Agent': 'VibeRoute/1.0 (https://github.com/daffaYuharshu/vibe-route)',
        'Accept': 'application/json',
        'Accept-Language': 'id,en',
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[geocode] Nominatim error', res.status, body.slice(0, 200));
      return NextResponse.json({ error: `Nominatim ${res.status}` }, { status: 500 });
    }

    const results: NominatimResult[] = await res.json();

    // Normalize Nominatim → MapTiler-compatible GeoFeature format
    // (SearchBox expects: id, type, place_name, center[lng, lat], place_type)
    const features = results.map((r) => ({
      id: String(r.place_id),
      type: 'Feature' as const,
      place_name: r.display_name,
      center: [parseFloat(r.lon), parseFloat(r.lat)] as [number, number],
      place_type: [r.class ?? r.type],
    }));

    console.log(`[geocode] Nominatim returned ${features.length} results for "${q}"`);
    return NextResponse.json({ features });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Geocoding error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
