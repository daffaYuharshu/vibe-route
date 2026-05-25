import { NextRequest, NextResponse } from 'next/server';
import { searchPlaces } from '@/lib/foursquare';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get('query');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius');
  const limit = searchParams.get('limit');

  if (!query || !lat || !lng) {
    return NextResponse.json(
      { error: 'Parameter query, lat, lng diperlukan' },
      { status: 400 }
    );
  }

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);

  if (isNaN(latNum) || isNaN(lngNum)) {
    return NextResponse.json(
      { error: 'Nilai lat/lng tidak valid' },
      { status: 400 }
    );
  }

  try {
    const places = await searchPlaces({
      query,
      lat: latNum,
      lng: lngNum,
      radius: radius ? parseInt(radius) : 2000,
      limit: limit ? parseInt(limit) : 10,
    });

    return NextResponse.json({ places });
  } catch (error) {
    console.error('[API /places] Error:', error);

    // Propagate the descriptive error message from foursquare.ts to the client
    const message =
      error instanceof Error ? error.message : 'Gagal mengambil data tempat';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
