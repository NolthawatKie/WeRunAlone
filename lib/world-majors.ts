export interface WorldMajor {
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
}

// Source: https://www.worldmarathonmajors.com/stars
// Update this list when new majors are added
export const WORLD_MAJORS: WorldMajor[] = [
  { name: 'Tokyo Marathon',                city: 'Tokyo',     country: 'Japan',          lat: 35.6762,  lon: 139.6503  },
  { name: 'Boston Marathon',               city: 'Boston',    country: 'USA',            lat: 42.3601,  lon: -71.0589  },
  { name: 'TCS London Marathon',           city: 'London',    country: 'United Kingdom', lat: 51.5074,  lon: -0.1278   },
  { name: 'Sydney Marathon',               city: 'Sydney',    country: 'Australia',      lat: -33.8688, lon: 151.2093  },
  { name: 'BMW Berlin Marathon',           city: 'Berlin',    country: 'Germany',        lat: 52.5200,  lon: 13.4050   },
  { name: 'Bank of America Chicago Marathon', city: 'Chicago', country: 'USA',           lat: 41.8781,  lon: -87.6298  },
  { name: 'TCS New York City Marathon',    city: 'New York',  country: 'USA',            lat: 40.7128,  lon: -74.0060  },
];
