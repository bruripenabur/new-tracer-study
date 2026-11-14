import { Lock, ArrowLeft } from 'lucide-react';
import { AppSettings } from '../types/tracer';
import { UnpattiLogo } from './UnpattiLogo';

interface OfficialHeaderProps {
  settings: AppSettings;
  isAdminRoute: boolean;
  onNavigate: (path: '/' | '/admin') => void;
}

export function OfficialHeader({
  settings,
  isAdminRoute,
  onNavigate,
}: OfficialHeaderProps) {
  const dynamicSubtitle =
    settings.mode_aplikasi === 'FAKULTAS' && settings.fakultas_aktif
      ? settings.fakultas_aktif
      : settings.subjudul_header || 'Lembaga Penjaminan Mutu dan Pengembangan Pembelajaran';

  const mainTitle = settings.judul_header || 'BORANG TRACER STUDY';

  return (
    <header className="no-print relative z-20 border-b border-white/15 bg-[#06172C]/90 backdrop-blur-md text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <UnpattiLogo className="w-12 h-12 sm:w-14 sm:h-14" />
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wider text-[#E8CF78] uppercase truncate">
              UNIVERSITAS PATTIMURA
            </p>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white truncate">
              {mainTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 truncate">
              {dynamicSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
          {isAdminRoute ? (
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-[#0A2342] bg-[#E8CF78] hover:bg-[#D4AF37] rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Borang
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('/admin')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Lock className="w-3.5 h-3.5 text-[#E8CF78]" />
              Login Admin / LPMPP
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
