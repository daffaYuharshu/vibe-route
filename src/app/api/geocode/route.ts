import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const proximity = searchParams.get('proximity') ?? '106.8272,-6.1751'; // Jakarta default [lng,lat]

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ features: [] });
  }

  const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'MAPTILER_API_KEY not set' }, { status: 500 });
  }

  // MapTiler Geocoding REST API: GET /geocoding/{query}.json
  const encoded = encodeURIComponent(q.trim());
  const url = new URL(`https://api.maptiler.com/geocoding/${encoded}.json`);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('proximity', proximity);   // [lng,lat] bias
  url.searchParams.set('language', 'id,en');
  url.searchParams.set('limit', '6');
  url.searchParams.set('autocomplete', 'true');

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 60 },
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[geocode] MapTiler error', res.status, body);
      return NextResponse.json({ error: `MapTiler ${res.status}` }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Geocoding error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
