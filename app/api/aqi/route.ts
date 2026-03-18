import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Missing lat/lon' }, { status: 400 });
  }

  const token = process.env.WAQI_TOKEN;
  if (!token) {
    return NextResponse.json({ aqi: null, pm25: null, station: null });
  }

  try {
    const res = await fetch(
      `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${token}`,
      { next: { revalidate: 600 } } // cache 10 min
    );
    const json = await res.json();

    if (json.status !== 'ok' || json.data === 'Unknown station') {
      return NextResponse.json({ aqi: null, pm25: null, station: null });
    }

    const data    = json.data;
    const aqi     = typeof data.aqi === 'number' ? data.aqi : null;
    const pm25    = data.iaqi?.pm25?.v ?? null;
    const station = data.city?.name ?? null;

    return NextResponse.json({ aqi, pm25, station });
  } catch {
    return NextResponse.json({ aqi: null, pm25: null, station: null });
  }
}
