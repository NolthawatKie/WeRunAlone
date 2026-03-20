import { NextRequest, NextResponse } from 'next/server';

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const q = req.nextUrl.searchParams.get('q');
  if (!q || q.trim().length === 0) {
    return NextResponse.json({ error: 'Missing q parameter' }, { status: 400 });
  }

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q.trim())}&format=json&limit=1`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'WeRunAlone/1.0' },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Geocoding request failed' }, { status: 502 });
    }

    const data = (await res.json()) as NominatimResult[];

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    const first = data[0];
    return NextResponse.json({
      lat:         parseFloat(first.lat),
      lon:         parseFloat(first.lon),
      displayName: first.display_name,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to geocode location' }, { status: 502 });
  }
}
