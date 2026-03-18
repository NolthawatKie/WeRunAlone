'use client';

import { useEffect, useState } from 'react';

interface ScoreSnapshot {
  label: string;
  emoji: string;
  color: string;
}

export default function WeatherNavBadge() {
  const [score, setScore] = useState<ScoreSnapshot | null>(null);

  useEffect(() => {
    const read = () => {
      try {
        const cached = sessionStorage.getItem('werunalone_run_score');
        if (cached) setScore(JSON.parse(cached));
      } catch { /* ignore */ }
    };

    read(); // try immediately (if WeatherWidget already ran)
    window.addEventListener('werunalone_weather_ready', read);
    return () => window.removeEventListener('werunalone_weather_ready', read);
  }, []);

  if (!score) return null;

  return (
    <div className={`flex items-center gap-1 text-xs font-semibold ${score.color}`}>
      <span>{score.emoji}</span>
      <span className="hidden sm:inline">{score.label}</span>
    </div>
  );
}
