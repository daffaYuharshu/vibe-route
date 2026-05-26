import { NextRequest, NextResponse } from 'next/server';

const OSRM_BASE =
  process.env.OSRM_BASE_URL ??
  process.env.NEXT_PUBLIC_OSRM_BASE_URL ??
  'https://router.project-osrm.org';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const originLat = searchParams.get('originLat');
  const originLng = searchParams.get('originLng');
  const destLat = searchParams.get('destLat');
  const destLng = searchParams.get('destLng');

  if (!originLat || !originLng || !destLat || !destLng) {
    return NextResponse.json(
      { error: 'Parameter originLat, originLng, destLat, destLng diperlukan' },
      { status: 400 }
    );
  }

  const coords = [
    [originLng, originLat],
    [destLng, destLat],
  ]
    .map((c) => c.join(','))
    .join(';');

  const url =
    `${OSRM_BASE}/route/v1/driving/${coords}` +
    `?overview=full&geometries=geojson&steps=false&annotations=false`;

  console.log('[route] OSRM request:', url);

  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[route] OSRM error', res.status, body);
      return NextResponse.json({ error: `OSRM ${res.status}` }, { status: 502 });
    }
    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) {
      return NextResponse.json({ error: 'Rute tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({
      distanceKm: route.distance / 1000,
      durationMin: route.duration / 60,
      geometry: route.geometry,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Route error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
