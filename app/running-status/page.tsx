'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import WeatherNavBadge from '@/components/WeatherNavBadge';
import { WORLD_MAJORS } from '@/lib/world-majors';
import type { WeatherSnapshot } from '@/app/api/weather-batch/route';
import { getAqiInfo } from '@/components/WeatherWidget';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RunScore {
  score: number;
  label: string;
  emoji: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  reasons: string[];
  tips: string[];
}

type CardKind = 'user' | 'major' | 'custom';

interface LocationCard {
  id: string;
  kind: CardKind;
  name: string;
  subtitle: string;
  weather: WeatherSnapshot | null;
  loading: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getWeatherDescription(code: number): { label: string; emoji: string } {
  if (code === 0)  return { label: 'Clear sky',     emoji: '☀️' };
  if (code <= 2)   return { label: 'Partly cloudy', emoji: '⛅' };
  if (code === 3)  return { label: 'Overcast',      emoji: '☁️' };
  if (code <= 48)  return { label: 'Foggy',         emoji: '🌫️' };
  if (code <= 55)  return { label: 'Drizzle',       emoji: '🌦️' };
  if (code <= 65)  return { label: 'Rainy',         emoji: '🌧️' };
  if (code <= 77)  return { label: 'Snowy',         emoji: '❄️' };
  if (code <= 82)  return { label: 'Rain showers',  emoji: '🌧️' };
  if (code <= 86)  return { label: 'Snow showers',  emoji: '🌨️' };
  return             { label: 'Thunderstorm',       emoji: '⛈️' };
}

function evaluateRunConditions(w: WeatherSnapshot): RunScore {
  const reasons: string[] = [];
  const tips: string[] = [];
  let score = 100;

  const heatIndex = w.temperature + (w.humidity - 40) * 0.15;

  if (w.temperature < 0)        { score -= 40; reasons.push('Freezing temps — ice risk'); }
  else if (w.temperature < 5)   { score -= 15; reasons.push('Cold — dress in layers'); }
  else if (heatIndex <= 22)     { /* ideal */ }
  else if (heatIndex <= 27)     { score -= 10; tips.push(`Heat index ${heatIndex.toFixed(1)}°C — bring water`); }
  else if (heatIndex <= 32)     { score -= 25; reasons.push(`Heat index ${heatIndex.toFixed(1)}°C — run early morning`); }
  else if (heatIndex <= 38)     { score -= 40; reasons.push(`Heat index ${heatIndex.toFixed(1)}°C — high heat stress`); }
  else                          { score -= 55; reasons.push(`Heat index ${heatIndex.toFixed(1)}°C — dangerous`); }

  if (w.weatherCode >= 95)      { score -= 50; reasons.push('Thunderstorm — unsafe'); }
  else if (w.weatherCode >= 80) { score -= 30; reasons.push('Heavy rain showers'); }
  else if (w.weatherCode >= 71) { score -= 35; reasons.push('Snow — slippery roads'); }
  else if (w.weatherCode >= 63) { score -= 25; reasons.push('Moderate to heavy rain'); }
  else if (w.weatherCode >= 51) { score -= 10; reasons.push('Light drizzle'); }
  else if (w.weatherCode >= 45) { score -= 10; reasons.push('Low visibility — fog'); }

  if (w.windSpeed > 50)         { score -= 30; reasons.push('Very strong winds'); }
  else if (w.windSpeed > 30)    { score -= 15; reasons.push('Strong headwind'); }
  else if (w.windSpeed > 20)    { score -= 5;  tips.push('Breezy — plan a sheltered route'); }

  if (w.precipitation > 5)      { score -= 20; }
  else if (w.precipitation > 1) { score -= 10; }

  if (w.aqi !== null) {
    if (w.aqi > 300)      { score -= 80; reasons.push('Hazardous air — do not run outside'); }
    else if (w.aqi > 200) { score -= 60; reasons.push('Very unhealthy air — skip outdoor run'); }
    else if (w.aqi > 150) { score -= 45; reasons.push('Unhealthy air — wear N95 mask'); }
    else if (w.aqi > 100) { score -= 25; reasons.push('Unhealthy for sensitive runners'); }
    else if (w.aqi > 75)  { score -= 12; reasons.push('Moderate–High AQI'); }
    else if (w.aqi > 50)  { score -= 5; }
  }

  score = Math.max(0, Math.min(100, score));

  if (score >= 80) return { score, label: 'Great run!',    emoji: '🟢', color: 'text-emerald-700', badgeBg: 'bg-emerald-50', badgeBorder: 'border-emerald-200', badgeText: 'text-emerald-700', reasons: reasons.length ? reasons : ['Perfect conditions'], tips };
  if (score >= 45) return { score, label: 'Okay to run',   emoji: '🟡', color: 'text-amber-700',   badgeBg: 'bg-amber-50',   badgeBorder: 'border-amber-200',   badgeText: 'text-amber-700',   reasons, tips };
  return                  { score, label: 'Skip today',    emoji: '🔴', color: 'text-rose-700',    badgeBg: 'bg-rose-50',    badgeBorder: 'border-rose-200',    badgeText: 'text-rose-700',    reasons, tips };
}

// ---------------------------------------------------------------------------
// Card component — vertical layout
// ---------------------------------------------------------------------------

function LocationCardView({
  card,
  rank,
  onRemove,
}: {
  card: LocationCard;
  rank: number;
  onRemove?: () => void;
}) {
  if (card.loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse flex flex-col gap-3">
        <div className="h-4 bg-slate-200 rounded w-2/3" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="h-3 bg-slate-100 rounded w-full mt-2" />
        <div className="h-3 bg-slate-100 rounded w-4/5" />
        <div className="h-3 bg-slate-100 rounded w-3/5" />
      </div>
    );
  }

  if (card.error || !card.weather) {
    const errorBg =
      card.kind === 'user'   ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200' :
      card.kind === 'custom' ? 'bg-violet-50 border-violet-300 ring-1 ring-violet-200' :
      'bg-white border-slate-200';
    return (
      <div className={`border rounded-xl p-5 flex flex-col gap-1 ${errorBg}`}>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono w-5 text-right">{rank}</span>
          <div>
            <div className="font-semibold text-slate-900 text-sm">{card.name}</div>
            <div className="text-xs text-slate-400">{card.subtitle}</div>
          </div>
        </div>
        <div className="text-xs text-slate-400 mt-2">{card.error ?? 'No data'}</div>
      </div>
    );
  }

  const w      = card.weather;
  const desc   = getWeatherDescription(w.weatherCode);
  const run    = evaluateRunConditions(w);
  const aqiInfo = w.aqi !== null ? getAqiInfo(w.aqi) : null;
  const heatIndex = w.temperature + (w.humidity - 40) * 0.15;

  const kindLabel =
    card.kind === 'user'   ? '📍 Your Location' :
    card.kind === 'major'  ? '🏅 World Major' :
    '📌 Custom';

  const cardBg =
    card.kind === 'user'   ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200' :
    card.kind === 'custom' ? 'bg-violet-50 border-violet-300 ring-1 ring-violet-200' :
    `bg-white ${run.badgeBorder}`;

  return (
    <div className={`border rounded-xl p-5 flex flex-col gap-3 relative ${cardBg}`}>
      {/* Rank + remove */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xs font-bold text-slate-400 font-mono w-5 text-right flex-shrink-0">
            {rank}
          </span>
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 text-sm leading-snug">{card.name}</div>
            <div className="text-xs text-slate-400">{card.subtitle}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${run.badgeBg} ${run.badgeBorder} ${run.badgeText}`}>
            {run.emoji} {run.label}
          </span>
          {onRemove && (
            <button
              onClick={onRemove}
              className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 text-xs transition-colors cursor-pointer"
              title="Remove"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Kind tag */}
      <div className="text-xs text-slate-400">{kindLabel}</div>

      {/* Score bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-slate-100 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full ${run.score >= 80 ? 'bg-emerald-500' : run.score >= 45 ? 'bg-amber-400' : 'bg-rose-500'}`}
            style={{ width: `${run.score}%` }}
          />
        </div>
        <span className="text-xs font-mono text-slate-500 w-8 text-right">{run.score}</span>
      </div>

      {/* AQI — shown first, above weather params */}
      {aqiInfo && w.aqi !== null ? (
        <div className={`flex flex-col gap-0.5 px-2.5 py-2 rounded-lg border text-xs ${aqiInfo.bg} ${aqiInfo.border}`}>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${aqiInfo.dot}`} />
            <span className={`font-semibold ${aqiInfo.color}`}>AQI {w.aqi}</span>
            <span className={`${aqiInfo.color} opacity-80`}>· {aqiInfo.label}</span>
          </div>
          {w.aqiStation && (
            <div className="text-slate-400 pl-3.5">{w.aqiStation}</div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-100 text-xs text-slate-400 bg-slate-50">
          <span className="w-2 h-2 rounded-full bg-slate-300 flex-shrink-0" />
          AQI unavailable
        </div>
      )}

      {/* Weather params */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <div className="flex items-center gap-1.5 text-slate-600">
          <span>{desc.emoji}</span>
          <span>{desc.label}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600">
          <span className="text-slate-400">Temp</span>
          <span className="font-medium">{w.temperature}°C</span>
          <span className="text-slate-400 text-[10px]">(feels {w.apparentTemperature}°C)</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600">
          <span className="text-slate-400">Heat index</span>
          <span className="font-medium">{heatIndex.toFixed(1)}°C</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600">
          <span className="text-slate-400">Humidity</span>
          <span className="font-medium">{w.humidity}%</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600">
          <span className="text-slate-400">Wind</span>
          <span className="font-medium">{w.windSpeed} km/h</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600">
          <span className="text-slate-400">Precip</span>
          <span className="font-medium">{w.precipitation} mm</span>
        </div>
      </div>

      {/* Reason / tip chips */}
      {(run.reasons.length > 0 || run.tips.length > 0) && (
        <div className="flex flex-wrap gap-1">
          {run.reasons.map((r) => (
            <span key={r} className={`text-[11px] px-2 py-0.5 rounded-full border ${run.badgeBorder} ${run.badgeText} bg-white`}>
              {r}
            </span>
          ))}
          {run.tips.map((t) => (
            <span key={t} className="text-[11px] px-2 py-0.5 rounded-full border border-slate-200 text-slate-500 bg-white">
              💡 {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const MAX_CUSTOM = 4; // 7 majors + 1 user + 4 custom = 12 max

export default function RunningStatusPage() {
  const [userCard, setUserCard] = useState<LocationCard>({
    id: 'user-location',
    kind: 'user',
    name: 'Your Location',
    subtitle: 'Detecting…',
    weather: null,
    loading: true,
    error: null,
  });

  const [majorCards, setMajorCards] = useState<LocationCard[]>(
    WORLD_MAJORS.map((m) => ({
      id: `major-${m.name}`,
      kind: 'major' as CardKind,
      name: m.name,
      subtitle: `${m.city}, ${m.country}`,
      weather: null,
      loading: true,
      error: null,
    })),
  );

  const [customCards, setCustomCards] = useState<LocationCard[]>([]);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchError,   setSearchError]   = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  const hasFetchedUser   = useRef(false);
  const hasFetchedMajors = useRef(false);

  // Fetch user location
  useEffect(() => {
    if (hasFetchedUser.current) return;
    hasFetchedUser.current = true;

    if (!navigator.geolocation) {
      setUserCard((prev) => ({ ...prev, loading: false, error: 'Geolocation not supported' }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          const [weatherRes, aqiRes, geoRes] = await Promise.all([
            fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
              `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,precipitation` +
              `&wind_speed_unit=kmh&timezone=auto`,
            ),
            fetch(`/api/aqi?lat=${lat}&lon=${lon}`),
            fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`),
          ]);

          const weatherJson = await weatherRes.json();
          const aqiJson     = await aqiRes.json();
          const geoJson     = await geoRes.json();

          const c = weatherJson.current;
          const city =
            geoJson.address?.city    ||
            geoJson.address?.town    ||
            geoJson.address?.village ||
            geoJson.address?.county  ||
            'Your Location';

          const snapshot: WeatherSnapshot = {
            temperature:         Math.round(c.temperature_2m),
            apparentTemperature: Math.round(c.apparent_temperature),
            humidity:            Math.round(c.relative_humidity_2m),
            windSpeed:           Math.round(c.wind_speed_10m),
            precipitation:       c.precipitation ?? 0,
            weatherCode:         c.weather_code,
            aqi:                 aqiJson.aqi    ?? null,
            aqiStation:          aqiJson.station ?? null,
          };

          setUserCard((prev) => ({
            ...prev,
            subtitle: city,
            weather: snapshot,
            loading: false,
            error: null,
          }));
        } catch {
          setUserCard((prev) => ({ ...prev, loading: false, error: 'Could not fetch weather' }));
        }
      },
      () => {
        setUserCard((prev) => ({
          ...prev,
          loading: false,
          subtitle: 'Location access denied',
          weather: null,
          error: 'Enable location permission to see your conditions',
        }));
      },
      { timeout: 10000 },
    );
  }, []);

  // Fetch world majors via batch (1 weather call + AQI per city server-side)
  useEffect(() => {
    if (hasFetchedMajors.current) return;
    hasFetchedMajors.current = true;

    const locs = WORLD_MAJORS.map((m) => ({ lat: m.lat, lon: m.lon }));

    fetch(`/api/weather-batch?locs=${encodeURIComponent(JSON.stringify(locs))}`)
      .then((res) => res.json())
      .then((snapshots: WeatherSnapshot[]) => {
        setMajorCards((prev) =>
          prev.map((card, i) => ({
            ...card,
            weather: snapshots[i] ?? null,
            loading: false,
            error: snapshots[i] ? null : 'No data',
          })),
        );
      })
      .catch(() => {
        setMajorCards((prev) =>
          prev.map((card) => ({ ...card, loading: false, error: 'Failed to load weather' })),
        );
      });
  }, []);

  // Add custom location
  const canAddMore = customCards.length < MAX_CUSTOM;

  const handleAddLocation = async () => {
    if (!searchQuery.trim()) return;
    setSearchError('');
    setSearchLoading(true);

    try {
      const geoRes  = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery.trim())}`);
      const geoData = await geoRes.json() as { lat?: number; lon?: number; displayName?: string; error?: string };

      if (!geoRes.ok || geoData.error) {
        setSearchError(geoData.error ?? 'Location not found');
        setSearchLoading(false);
        return;
      }

      const { lat, lon, displayName } = geoData as { lat: number; lon: number; displayName: string };
      const parts     = displayName.split(',');
      const shortName = parts[0]?.trim() ?? displayName;
      const context   = parts.slice(1, 3).map((p) => p.trim()).filter(Boolean).join(', ');
      const newId     = `custom-${Date.now()}`;

      setCustomCards((prev) => [
        ...prev,
        { id: newId, kind: 'custom', name: shortName, subtitle: context || displayName, weather: null, loading: true, error: null },
      ]);
      setSearchQuery('');

      const [weatherRes, aqiRes] = await Promise.all([
        fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,precipitation` +
          `&wind_speed_unit=kmh&timezone=auto`,
        ),
        fetch(`/api/aqi?lat=${lat}&lon=${lon}`),
      ]);

      const weatherJson = await weatherRes.json();
      const aqiJson     = await aqiRes.json();
      const c = weatherJson.current;

      const snapshot: WeatherSnapshot = {
        temperature:         Math.round(c.temperature_2m),
        apparentTemperature: Math.round(c.apparent_temperature),
        humidity:            Math.round(c.relative_humidity_2m),
        windSpeed:           Math.round(c.wind_speed_10m),
        precipitation:       c.precipitation ?? 0,
        weatherCode:         c.weather_code,
        aqi:                 aqiJson.aqi    ?? null,
        aqiStation:          aqiJson.station ?? null,
      };

      setCustomCards((prev) =>
        prev.map((card) => card.id === newId ? { ...card, weather: snapshot, loading: false } : card),
      );
    } catch {
      setSearchError('Failed to fetch location data');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleRemoveCustom = (id: string) =>
    setCustomCards((prev) => prev.filter((c) => c.id !== id));

  // Rank all cards by score desc — loading/error cards go to the bottom
  const scoreOf = (card: LocationCard): number => {
    if (!card.weather || card.loading) return -1;
    return evaluateRunConditions(card.weather).score;
  };

  const allCards = [userCard, ...majorCards, ...customCards].sort((a, b) => scoreOf(b) - scoreOf(a));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg">🏃</span>
            <span className="font-bold text-slate-900 text-base hover:text-blue-600">WeRunAlone</span>
          </Link>
          <nav className="flex items-center gap-1 ml-auto">
            <Link href="/" className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
              Home
            </Link>
            <Link href="/community" className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
              Community
            </Link>
            <Link href="/running-status" className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-600">
              Running Status
            </Link>
            <Link href="/about" className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
              About
            </Link>
            <Link href="/updates" className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
              Updates
            </Link>
            <div className="ml-1">
              <WeatherNavBadge />
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">

        {/* Page header */}
        <div className="mb-8">
          <span className="inline-flex items-center text-xs font-semibold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-200 px-3 py-1 rounded-full mb-4">
            Live Conditions
          </span>
          <h1 className="text-3xl font-bold text-slate-900 mt-3 mb-2">Running Status</h1>
          <p className="text-sm text-slate-500">
            Live running conditions ranked by score — your location, all 7 World Marathon Majors, and up to {MAX_CUSTOM} custom cities.
          </p>
        </div>

        {/* Add location */}
        <div className="mb-8">
          <div className="flex items-center gap-2 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !searchLoading && canAddMore && handleAddLocation()}
              placeholder="Search a city to compare, e.g. Paris, Bangkok, Cape Town…"
              disabled={!canAddMore}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50 disabled:bg-slate-50"
            />
            <button
              onClick={handleAddLocation}
              disabled={searchLoading || !searchQuery.trim() || !canAddMore}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {searchLoading ? '…' : 'Add'}
            </button>
            {customCards.length > 0 && (
              <button
                onClick={() => setCustomCards([])}
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>
          {searchError && <p className="mt-2 text-xs text-red-600">{searchError}</p>}
          {!canAddMore && (
            <p className="mt-2 text-xs text-slate-400">
              Maximum {MAX_CUSTOM} custom locations reached. Remove one to add another.
            </p>
          )}

          {/* Location summary — all locations being ranked */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="text-xs text-slate-400 self-center mr-1">Ranking:</span>
            {/* user */}
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700">
              📍 {userCard.subtitle === 'Detecting…' || userCard.subtitle === 'Location access denied' ? 'Your Location' : userCard.subtitle}
            </span>
            {/* majors */}
            {majorCards.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-slate-200 bg-white text-slate-600">
                {c.subtitle}
              </span>
            ))}
            {/* custom */}
            {customCards.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-violet-200 bg-violet-50 text-violet-700">
                📌 {c.name}
                <button onClick={() => handleRemoveCustom(c.id)} className="ml-0.5 hover:text-rose-500 cursor-pointer leading-none">×</button>
              </span>
            ))}
          </div>
        </div>

        {/* All locations ranked by score desc */}
        <div className="flex flex-col gap-3">
          {allCards.map((card, i) => (
            <LocationCardView
              key={card.id}
              card={card}
              rank={i + 1}
              onRemove={card.kind === 'custom' ? () => handleRemoveCustom(card.id) : undefined}
            />
          ))}
        </div>

        {/* Legend + attribution */}
        <div className="mt-10 flex flex-wrap gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">🟢 Great run — score ≥ 80</span>
          <span className="flex items-center gap-1.5">🟡 Okay to run — score 45–79</span>
          <span className="flex items-center gap-1.5">🔴 Skip today — score &lt; 45</span>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Weather via{' '}
          <a href="https://open-meteo.com" target="_blank" rel="noreferrer" className="underline hover:text-slate-600">Open-Meteo</a>
          {' '}· AQI via{' '}
          <a href="https://waqi.info" target="_blank" rel="noreferrer" className="underline hover:text-slate-600">WAQI</a>
          {' '}· World Majors source:{' '}
          <a href="https://www.worldmarathonmajors.com/stars" target="_blank" rel="noreferrer" className="underline hover:text-slate-600">worldmarathonmajors.com</a>
          {' '}· Majors weather refreshes every 30 minutes.
        </p>

      </main>

      <footer className="border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-700">WeRunAlone</div>
          <div className="text-xs text-slate-400">Run solo, Run free, Then We Run Alone.</div>
        </div>
      </footer>
    </div>
  );
}
