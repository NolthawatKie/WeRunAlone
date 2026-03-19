import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import WeatherNavBadge from '@/components/WeatherNavBadge';

const NAV_LINKS = [
  { href: '/community', label: 'Community' },
  { href: '/about',     label: 'About'     },
  { href: '/updates',   label: 'Updates'   },
];

interface LogEntry {
  date: string;
  details: string;
}

function parseUpdateLog(): LogEntry[] {
  try {
    const filePath = path.join(process.cwd(), 'updatelog.md');
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim().startsWith('|'));
    // Skip header row and separator row
    return lines
      .slice(2)
      .map((line) => {
        const cells = line.split('|').slice(1, -1).map((c) => c.trim());
        return { date: cells[0] ?? '', details: cells[1] ?? '' };
      })
      .filter((r) => r.date && r.details);
  } catch {
    return [];
  }
}

export default function UpdatesPage() {
  const entries = parseUpdateLog();

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
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  l.href === '/updates'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="ml-2">
              <WeatherNavBadge />
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">

        <div className="mb-8">
          <span className="inline-flex items-center text-xs font-semibold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-200 px-3 py-1 rounded-full mb-4">
            Changelog
          </span>
          <h1 className="text-3xl font-bold text-slate-900 mt-3 mb-2">Update Log</h1>
          <p className="text-sm text-slate-500">
            A record of every change made to WeRunAlone, newest first.
          </p>
        </div>

        {entries.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm">
            No entries found in updatelog.md
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-36">
                    Date
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Update Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <tr
                    key={i}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-slate-400 text-xs font-mono whitespace-nowrap align-top">
                      {entry.date}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 leading-relaxed align-top">
                      {entry.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-6 text-xs text-slate-400">
          Source: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">updatelog.md</code> in the repository root.
          Add a new row to that file whenever a change is deployed.
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
