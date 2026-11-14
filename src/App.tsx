import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { FloatingPortalButton } from './components/FloatingPortalButton';
import { OfficialHeader } from './components/OfficialHeader';
import { TracerForm } from './components/tracer/TracerForm';
import { mergeProdiWithCatalog } from './data/unpattiProdiCatalog';
import { supabase } from './lib/supabaseClient';
import { AppSettings, MasterProdi } from './types/tracer';

const DEFAULT_SETTINGS: AppSettings = {
  id: 1,
  mode_aplikasi: 'UNIVERSITAS',
  fakultas_aktif: null,
  judul_header: 'BORANG TRACER STUDY',
  subjudul_header: 'Lembaga Penjaminan Mutu dan Pengembangan Pembelajaran',
  ump_maluku: 3141699,
  portal_url: 'https://portallpmpp.simpatti.site/',
};

function getRouteFromPath(pathname: string): '/' | '/admin' {
  return pathname.toLowerCase().startsWith('/admin') ? '/admin' : '/';
}

export default function App() {
  const [route, setRoute] = useState<'/' | '/admin'>(() =>
    getRouteFromPath(window.location.pathname)
  );
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [dbProdiList, setDbProdiList] = useState<MasterProdi[]>([]);
  const [loadingConfig, setLoadingConfig] = useState<boolean>(true);
  const [backdropError, setBackdropError] = useState<boolean>(false);

  const prodiList = useMemo(
    () => mergeProdiWithCatalog(dbProdiList),
    [dbProdiList]
  );

  const loadSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (!error && data) {
      setSettings({
        id: data.id ?? 1,
        mode_aplikasi:
          data.mode_aplikasi === 'FAKULTAS' ? 'FAKULTAS' : 'UNIVERSITAS',
        fakultas_aktif: data.fakultas_aktif ?? null,
        judul_header: data.judul_header || 'BORANG TRACER STUDY',
        subjudul_header:
          data.subjudul_header ||
          'Lembaga Penjaminan Mutu dan Pengembangan Pembelajaran',
        ump_maluku: Number(data.ump_maluku) || 3141699,
        portal_url: data.portal_url || 'https://portallpmpp.simpatti.site/',
      });
    }
  }, []);

  const loadProdi = useCallback(async () => {
    const { data, error } = await supabase
      .from('master_fakultas_prodi')
      .select('*')
      .order('nama_fakultas', { ascending: true })
      .order('nama_prodi', { ascending: true });

    if (!error && data) {
      setDbProdiList(data as MasterProdi[]);
    }
  }, []);

  useEffect(() => {
    let active = true;
    setLoadingConfig(true);
    Promise.all([loadSettings(), loadProdi()]).finally(() => {
      if (active) setLoadingConfig(false);
    });
    return () => {
      active = false;
    };
  }, [loadSettings, loadProdi]);

  useEffect(() => {
    function handlePopState() {
      setRoute(getRouteFromPath(window.location.pathname));
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function navigateTo(target: '/' | '/admin') {
    if (window.location.pathname !== target) {
      window.history.pushState({}, '', target);
    }
    setRoute(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen relative flex flex-col bg-[#0A2342] text-slate-900">
      {/* Maritime Campus Backdrop with Navy Blue Gradient Scrim */}
      <div className="no-print fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {!backdropError && (
          <img
            src="/src/assets/images/unpatti_maritime_campus_1794641673456.jpg"
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setBackdropError(true)}
            className="w-full h-full object-cover opacity-25 scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-[#06172C]/95 via-[#0A2342]/88 to-[#12345E]/85" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 85% 15%, rgba(212, 175, 55, 0.25), transparent 45%)',
          }}
        />
      </div>

      {/* Header */}
      <OfficialHeader
        settings={settings}
        isAdminRoute={route === '/admin'}
        onNavigate={navigateTo}
      />

      {/* Main Content */}
      <main className="relative z-10 flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24">
        {route === '/admin' ? (
          <AdminDashboard
            settings={settings}
            prodiList={prodiList}
            dbProdiList={dbProdiList}
            onSettingsUpdated={loadSettings}
            onProdiUpdated={loadProdi}
          />
        ) : (
          <TracerForm
            settings={settings}
            prodiList={prodiList}
            loadingConfig={loadingConfig}
          />
        )}
      </main>

      {/* Institutional Footer */}
      <footer className="no-print relative z-10 border-t border-white/10 bg-[#06172C]/80 backdrop-blur-sm text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p className="text-center sm:text-left">
            &copy; {new Date().getFullYear()} SIM-TracerStudy Universitas
            Pattimura · Ekosistem SIMPATTI LPMPP
          </p>
          <div className="flex items-center gap-4">
            {route === '/' ? (
              <button
                type="button"
                onClick={() => navigateTo('/admin')}
                className="text-[#E8CF78] hover:underline font-medium"
              >
                Login Admin / LPMPP
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigateTo('/')}
                className="text-[#E8CF78] hover:underline font-medium"
              >
                Borang Tracer Study
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Floating Action Button: Kembali ke Portal Utama */}
      <FloatingPortalButton portalUrl={settings.portal_url} />
    </div>
  );
}
