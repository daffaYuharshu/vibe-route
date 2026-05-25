import { NextRequest, NextResponse } from 'next/server';

// Indonesia bounding box: [west, south, east, north]
// Covers seluruh wilayah Indonesia termasuk Papua
const INDONESIA_BBOX = '95.0,-11.0,141.1,6.1';

// Detects "lat,lng" coordinate pattern (reverse geocoding from geolocation button)
const COORD_RE = /^-?\d{1,3}(\.\d+)?,\s*-?\d{1,3}(\.\d+)?$/;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';
  // Default proximity: Jakarta [lng,lat]
  const proximity = searchParams.get('proximity') ?? '106.8272,-6.1751';

  if (!q || q.length < 2) {
    return NextResponse.json({ features: [] });
  }

  const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'MAPTILER_API_KEY not set' }, { status: 500 });
  }

  const isCoord = COORD_RE.test(q);
  let url: URL;

  if (isCoord) {
    // ── Reverse geocoding (geolocation button) ────────────────────
    // MapTiler reverse: /geocoding/reverse.json?lat=&lon=
    // No limit param needed — returns single best match
    const [latStr, lngStr] = q.split(',').map((s) => s.trim());
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ features: [] });
    }

    url = new URL('https://api.maptiler.com/geocoding/reverse.json');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lng));
    url.searchParams.set('language', 'id,en');
    // Restrict reverse result to Indonesia only
    url.searchParams.set('country', 'id');
  } else {
    // ── Forward geocoding (text autocomplete) ─────────────────────
    // MapTiler Geocoding REST API: GET /geocoding/{query}.json
    const encoded = encodeURIComponent(q);
    url = new URL(`https://api.maptiler.com/geocoding/${encoded}.json`);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('proximity', proximity);        // [lng,lat] bias
    url.searchParams.set('language', 'id,en');
    url.searchParams.set('limit', '6');
    url.searchParams.set('autocomplete', 'true');
    // Restrict results to Indonesia using country code + bounding box
    url.searchParams.set('country', 'id');
    url.searchParams.set('bbox', INDONESIA_BBOX);
  }

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: isCoord ? 300 : 60 },
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[geocode] MapTiler error', res.status, body.slice(0, 200));
      return NextResponse.json({ error: `MapTiler ${res.status}` }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Geocoding error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
