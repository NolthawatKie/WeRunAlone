import { NextRequest, NextResponse } from 'next/server';

export interface WeatherSnapshot {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  weatherCode: number;
  aqi: number | null;
  aqiStation: string | null;
}

interface LocParam {
  lat: number;
  lon: number;
}

async function fetchAqi(lat: number, lon: number, token: string): Promise<{ aqi: number | null; station: string | null }> {
  try {
    const res = await fetch(
      `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${token}`,
      { next: { revalidate: 1800 } },
    );
    const json = await res.json();
    if (json.status !== 'ok' || json.data === 'Unknown station') return { aqi: null, station: null };
    const aqi     = typeof json.data.aqi === 'number' ? json.data.aqi : null;
    const station = json.data.city?.name ?? null;
    return { aqi, station };
  } catch {
    return { aqi: null, station: null };
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const locsParam = req.nextUrl.searchParams.get('locs');
  if (!locsParam) {
    return NextResponse.json({ error: 'Missing locs parameter' }, { status: 400 });
  }

  let locs: LocParam[];
  try {
    locs = JSON.parse(locsParam) as LocParam[];
  } catch {
    return NextResponse.json({ error: 'Invalid locs JSON' }, { status: 400 });
  }

  if (!Array.isArray(locs) || locs.length === 0 || locs.length > 12) {
    return NextResponse.json({ error: 'locs must be an array of 1–12 items' }, { status: 400 });
  }

  const latitudes  = locs.map((l) => l.lat).join(',');
  const longitudes = locs.map((l) => l.lon).join(',');

  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${latitudes}&longitude=${longitudes}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,precipitation` +
    `&wind_speed_unit=kmh&timezone=auto`;

  try {
    const token = process.env.WAQI_TOKEN ?? '';

    // Fetch weather (1 call) and AQI for all locations in parallel
    const [weatherRes, ...aqiResults] = await Promise.all([
      fetch(weatherUrl, { next: { revalidate: 1800 } }),
      ...locs.map((l) => token ? fetchAqi(l.lat, l.lon, token) : Promise.resolve({ aqi: null, station: null })),
    ]);

    if (!weatherRes.ok) {
      return NextResponse.json({ error: 'Open-Meteo request failed' }, { status: 502 });
    }
    const data = await weatherRes.json();

    const items: { current: Record<string, number> }[] = Array.isArray(data) ? data : [data];

    const snapshots: WeatherSnapshot[] = items.map((item, i) => {
      const c   = item.current;
      const aqi = aqiResults[i] as { aqi: number | null; station: string | null };
      return {
        temperature:         Math.round(c.temperature_2m),
        apparentTemperature: Math.round(c.apparent_temperature),
        humidity:            Math.round(c.relative_humidity_2m),
        windSpeed:           Math.round(c.wind_speed_10m),
        precipitation:       c.precipitation ?? 0,
        weatherCode:         c.weather_code,
        aqi:                 aqi?.aqi ?? null,
        aqiStation:          aqi?.station ?? null,
      };
    });

    return NextResponse.json(snapshots);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch weather data' }, { status: 502 });
  }
}
