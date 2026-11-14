import { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
  Search,
} from 'lucide-react';

interface GroundingSource {
  title: string;
  uri: string;
}

interface SearchResultState {
  summary: string;
  sources: GroundingSource[];
  fetchedAt: string;
  notice?: string;
}

interface LpmppUpdatesPanelProps {
  portalUrl: string;
}

const QUICK_TOPICS = [
  'Panduan Pengisian Tracer Study Universitas Pattimura',
  'Berita Akademik Terbaru LPMPP Unpatti',
  'Ketentuan IKU 1 Lulusan Mendapat Pekerjaan Layak',
];

function parseApiErrorText(raw: string): string {
  if (!raw) return 'Gagal mengambil informasi dari portal LPMPP.';
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
    return 'Kuota Gemini API sedang tercapai (429). Silakan coba beberapa saat lagi atau perbarui API key di Settings > Secrets.';
  }
  return raw;
}

export function LpmppUpdatesPanel({ portalUrl }: LpmppUpdatesPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<SearchResultState | null>(null);

  async function runSearch(customTopic?: string) {
    const searchTopic = (customTopic ?? query).trim();
    if (customTopic) {
      setQuery(customTopic);
    }

    setExpanded(true);
    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/lpmpp-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchTopic,
          portalUrl,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          parseApiErrorText(
            data?.error || 'Gagal mengambil informasi dari portal LPMPP.'
          )
        );
      }

      setResult({
        summary: data.summary || 'Tidak ada ringkasan yang ditemukan.',
        sources: Array.isArray(data.sources) ? data.sources : [],
        fetchedAt: data.fetchedAt || new Date().toISOString(),
        notice: typeof data.notice === 'string' ? data.notice : undefined,
      });
    } catch (err) {
      const msg =
        err instanceof Error
          ? parseApiErrorText(err.message)
          : 'Terjadi kendala saat mencari pembaruan LPMPP.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      aria-label="Informasi Akademik dan Panduan LPMPP"
      className="glass-panel rounded-2xl shadow-lg overflow-hidden"
    >
      <div className="px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/80 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <BookOpen className="w-4 h-4 text-[#0A2342] shrink-0" />
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-[#0A2342] truncate">
              Pusat Panduan Tracer Study &amp; Berita Akademik LPMPP
            </h2>
            <p className="text-[11px] text-slate-500 truncate">
              Telusuri panduan resmi alumni dan informasi terbaru dari ekosistem
              LPMPP Universitas Pattimura
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0A2342] bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors self-start sm:self-auto whitespace-nowrap shrink-0"
        >
          <span>{expanded ? 'Tutup Pencarian' : 'Cari Panduan & Berita'}</span>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {expanded && (
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    runSearch();
                  }
                }}
                placeholder="Cari informasi akademik, jadwal yudisium, atau panduan IKU 1 LPMPP..."
                className="w-full min-h-[42px] pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#0A2342]"
              />
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={() => runSearch()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-[#0A2342] hover:bg-[#143763] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              <Search className="w-4 h-4 text-[#E8CF78]" />
              {loading ? 'Menelusuri...' : 'Telusuri Info'}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500">
              Topik cepat:
            </span>
            {QUICK_TOPICS.map((topic) => (
              <button
                key={topic}
                type="button"
                disabled={loading}
                onClick={() => runSearch(topic)}
                className="px-2.5 py-1 text-xs font-medium text-[#0A2342] bg-slate-100 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-50"
              >
                {topic}
              </button>
            ))}
          </div>

          {loading && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 animate-pulse">
              <div className="h-3.5 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-200 rounded w-full" />
              <div className="h-3 bg-slate-200 rounded w-5/6" />
              <div className="h-3 bg-slate-200 rounded w-2/3" />
            </div>
          )}

          {errorMsg && !loading && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-800"
            >
              {errorMsg}
            </div>
          )}

          {result && !loading && (
            <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              {result.notice && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>{result.notice}</span>
                </div>
              )}

              <div className="text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                {result.summary}
              </div>

              {result.sources.length > 0 && (
                <div className="pt-3 border-t border-slate-200 space-y-1.5">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Sumber Referensi Web Terverifikasi
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {result.sources.map((src) => (
                      <li key={src.uri}>
                        <a
                          href={src.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0A2342] hover:underline truncate max-w-full"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0 text-[#D4AF37]" />
                          <span className="truncate">{src.title}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
