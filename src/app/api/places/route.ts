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
      { error: 'Missing required parameters: query, lat, lng' },
      { status: 400 }
    );
  }

  try {
    const places = await searchPlaces({
      query,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radius: radius ? parseInt(radius) : 1000,
      limit: limit ? parseInt(limit) : 10,
    });

    return NextResponse.json({ places });
  } catch (error) {
    console.error('[API /places]', error);
    return NextResponse.json(
      { error: 'Failed to fetch places' },
      { status: 500 }
    );
  }
}
