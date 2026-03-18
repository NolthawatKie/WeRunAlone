'use client';

import { useEffect, useState } from 'react';

interface WeatherData {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  weatherCode: number;
  locationName: string;
  aqi: number | null;
  aqiStation: string | null;
}

interface RunScore {
  label: string;
  emoji: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  reasons: string[];
  tips: string[];
}

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

export function getAqiInfo(aqi: number): {
  label: string; color: string; bg: string; border: string; dot: string; tip: string;
} {
  if (aqi <= 50)  return { label: 'Good',                  color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', tip: '' };
  if (aqi <= 75)  return { label: 'Moderate',              color: 'text-yellow-700',  bg: 'bg-yellow-50',  border: 'border-yellow-200',  dot: 'bg-yellow-400', tip: 'Keep pace easy · avoid peak traffic hours' };
  if (aqi <= 100) return { label: 'Moderate–High',         color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   dot: 'bg-amber-500',  tip: 'Run early morning · shorter distance · breathe through nose' };
  if (aqi <= 150) return { label: 'Unhealthy (sensitive)', color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200',  dot: 'bg-orange-500', tip: 'Consider a mask · cut session short · no high-intensity' };
  if (aqi <= 200) return { label: 'Unhealthy',             color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',     dot: 'bg-red-500',    tip: 'Wear N95 mask or move indoors' };
  if (aqi <= 300) return { label: 'Very Unhealthy',        color: 'text-purple-700',  bg: 'bg-purple-50',  border: 'border-purple-200',  dot: 'bg-purple-600', tip: 'Skip outdoor run — treadmill only' };
  return           { label: 'Hazardous',                   color: 'text-rose-900',    bg: 'bg-rose-100',   border: 'border-rose-300',    dot: 'bg-rose-800',   tip: 'Do not run outdoors' };
}

function evaluateRunConditions(w: WeatherData): RunScore {
  const reasons: string[] = [];
  const tips: string[] = [];
  let score = 100;

  // Heat index combines temperature + humidity into a single feel score
  // Formula: heatIndex = temp + (humidity - 40) * 0.15
  const heatIndex = w.temperature + (w.humidity - 40) * 0.15;

  if (w.temperature < 0)        { score -= 40; reasons.push('Freezing temps — ice risk'); }
  else if (w.temperature < 5)   { score -= 15; reasons.push('Cold — dress in layers'); }
  else if (heatIndex <= 22)     { /* ideal range */ }
  else if (heatIndex <= 27)     { score -= 10; tips.push(`Heat index ${heatIndex.toFixed(1)}°C — bring water`); }
  else if (heatIndex <= 32)     { score -= 25; reasons.push(`Heat index ${heatIndex.toFixed(1)}°C — run early morning`); }
  else if (heatIndex <= 38)     { score -= 40; reasons.push(`Heat index ${heatIndex.toFixed(1)}°C — high heat stress`); }
  else                          { score -= 55; reasons.push(`Heat index ${heatIndex.toFixed(1)}°C — dangerous, skip run`); }

  // Weather code
  if (w.weatherCode >= 95)      { score -= 50; reasons.push('Thunderstorm — unsafe'); }
  else if (w.weatherCode >= 80) { score -= 30; reasons.push('Heavy rain showers'); }
  else if (w.weatherCode >= 71) { score -= 35; reasons.push('Snow — slippery roads'); }
  else if (w.weatherCode >= 63) { score -= 25; reasons.push('Moderate to heavy rain'); }
  else if (w.weatherCode >= 51) { score -= 10; reasons.push('Light drizzle'); }
  else if (w.weatherCode >= 45) { score -= 10; reasons.push('Low visibility — fog'); }

  // Wind
  if (w.windSpeed > 50)         { score -= 30; reasons.push('Very strong winds'); }
  else if (w.windSpeed > 30)    { score -= 15; reasons.push('Strong headwind'); }
  else if (w.windSpeed > 20)    { score -= 5;  tips.push('Breezy — plan a sheltered route'); }

  // Precipitation
  if (w.precipitation > 5)      { score -= 20; }
  else if (w.precipitation > 1) { score -= 10; }

  // AQI
  if (w.aqi !== null) {
    const aqiInfo = getAqiInfo(w.aqi);
    if (w.aqi > 300)      { score -= 80; reasons.push('Hazardous air — do not run outside'); }
    else if (w.aqi > 200) { score -= 60; reasons.push('Very unhealthy air — skip outdoor run'); }
    else if (w.aqi > 150) { score -= 45; reasons.push('Unhealthy air — wear N95 mask'); }
    else if (w.aqi > 100) { score -= 25; reasons.push('Unhealthy for sensitive runners'); if (aqiInfo.tip) tips.push(aqiInfo.tip); }
    else if (w.aqi > 75)  { score -= 12; reasons.push('Moderate–High AQI'); if (aqiInfo.tip) tips.push(aqiInfo.tip); }
    else if (w.aqi > 50)  { score -= 5;  if (aqiInfo.tip) tips.push(aqiInfo.tip); }
  }

  score = Math.max(0, Math.min(100, score));

  if (score >= 80) return { label: 'Great day to run!',    emoji: '🟢', color: 'text-emerald-700', badgeBg: 'bg-emerald-50', badgeBorder: 'border-emerald-300', badgeText: 'text-emerald-700', reasons: reasons.length ? reasons : ['Perfect conditions'], tips };
  if (score >= 45) return { label: 'Okay to run',          emoji: '🟡', color: 'text-amber-700',   badgeBg: 'bg-amber-50',   badgeBorder: 'border-amber-300',   badgeText: 'text-amber-700',   reasons, tips };
  return                  { label: 'Better to skip today', emoji: '🔴', color: 'text-rose-700',    badgeBg: 'bg-rose-50',    badgeBorder: 'border-rose-300',    badgeText: 'text-rose-700',    reasons, tips };
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [status, setStatus]   = useState<'idle' | 'locating' | 'loading' | 'done' | 'denied' | 'error'>('idle');

  useEffect(() => {
    if (!navigator.geolocation) { setStatus('error'); return; }
    setStatus('locating');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setStatus('loading');
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          const [weatherRes, aqiRes, geoRes] = await Promise.all([
            fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
              `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,precipitation` +
              `&wind_speed_unit=kmh&timezone=auto`
            ),
            fetch(`/api/aqi?lat=${lat}&lon=${lon}`),
            fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`),
          ]);

          const weatherJson = await weatherRes.json();
          const aqiJson     = await aqiRes.json();
          const geoJson     = await geoRes.json();

          const c    = weatherJson.current;
          const city =
            geoJson.address?.city    ||
            geoJson.address?.town    ||
            geoJson.address?.village ||
            geoJson.address?.county  ||
            'Your location';

          const weatherData: WeatherData = {
            temperature:         Math.round(c.temperature_2m),
            apparentTemperature: Math.round(c.apparent_temperature),
            humidity:            Math.round(c.relative_humidity_2m),
            windSpeed:           Math.round(c.wind_speed_10m),
            precipitation:       c.precipitation ?? 0,
            weatherCode:         c.weather_code,
            locationName:        city,
            aqi:                 aqiJson.aqi    ?? null,
            aqiStation:          aqiJson.station ?? null,
          };
          setWeather(weatherData);

          // Share score with WeatherNavBadge via sessionStorage + custom event
          const s = evaluateRunConditions(weatherData);
          try {
            sessionStorage.setItem('werunalone_run_score', JSON.stringify({ label: s.label, emoji: s.emoji, color: s.color }));
            window.dispatchEvent(new Event('werunalone_weather_ready'));
          } catch { /* ignore */ }

          setStatus('done');
        } catch {
          setStatus('error');
        }
      },
      () => setStatus('denied'),
      { timeout: 8000 }
    );
  }, []);

  if (status === 'idle') return null;

  if (status === 'locating' || status === 'loading') {
    return (
      <div className="flex items-center justify-center gap-2 text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 w-fit mx-auto">
        <span className="animate-spin inline-block">⟳</span>
        {status === 'locating' ? 'Getting your location…' : 'Fetching weather & air quality…'}
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 w-fit mx-auto">
        📍 Enable location to see today's running conditions
      </div>
    );
  }

  if (status === 'error' || !weather) return null;

  const score   = evaluateRunConditions(weather);
  const desc    = getWeatherDescription(weather.weatherCode);
  const aqiInfo = weather.aqi !== null ? getAqiInfo(weather.aqi) : null;

  const heatIndex = weather.temperature + (weather.humidity - 40) * 0.15;

  return (
    <div className={`${score.badgeBg} border ${score.badgeBorder} rounded-2xl px-5 py-4 w-full max-w-2xl mx-auto text-left`}>

      {/* Top row */}
      <div className="flex items-center gap-4 flex-wrap justify-center">

        {/* Location + weather */}
        <div className="flex items-center gap-2">
          <span className="text-xl">{desc.emoji}</span>
          <div>
            <div className="text-xs text-slate-500 leading-none mb-0.5">📍 {weather.locationName}</div>
            <div className="text-sm font-semibold text-slate-800">{desc.label} · {weather.temperature}°C</div>
          </div>
        </div>

        <div className="hidden sm:block w-px h-8 bg-slate-200" />

        {/* Weather stats */}
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span>💧 {weather.humidity}%</span>
          <span>🌡️ HI {heatIndex.toFixed(1)}°C</span>
          <span>💨 {weather.windSpeed} km/h</span>
        </div>

        <div className="hidden sm:block w-px h-8 bg-slate-200" />

        {/* AQI badge */}
        {aqiInfo && weather.aqi !== null ? (
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${aqiInfo.bg} ${aqiInfo.border} ${aqiInfo.color}`}>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${aqiInfo.dot}`} />
            <span>AQI {weather.aqi}</span>
            <span className="font-normal opacity-75">· {aqiInfo.label}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 text-xs text-slate-400 bg-white/60">
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            AQI unavailable
          </div>
        )}

        <div className="hidden sm:block w-px h-8 bg-slate-200" />

        {/* Run verdict — inline */}
        <div className={`flex items-center gap-1.5 font-bold text-sm ${score.color}`}>
          <span>{score.emoji}</span>
          <span>{score.label}</span>
        </div>
      </div>

      {/* Warning chips */}
      {score.reasons.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5 justify-center">
          {score.reasons.map((r) => (
            <span key={r} className={`text-xs px-2.5 py-0.5 rounded-full border ${score.badgeBorder} ${score.badgeText} bg-white/60`}>
              {r}
            </span>
          ))}
        </div>
      )}

      {/* Tip chips */}
      {score.tips.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5 justify-center">
          {score.tips.map((t) => (
            <span key={t} className="text-xs px-2.5 py-0.5 rounded-full border border-slate-200 text-slate-500 bg-white/70">
              💡 {t}
            </span>
          ))}
        </div>
      )}

      {/* Source note */}
      <div className="mt-2 text-center text-xs text-slate-400">
        {weather.aqi !== null && weather.aqiStation
          ? `AQI via WAQI · station: ${weather.aqiStation}`
          : weather.aqi !== null
          ? 'AQI via WAQI · nearest station'
          : 'Add WAQI_TOKEN to .env.local to enable AQI'}
      </div>
    </div>
  );
}
