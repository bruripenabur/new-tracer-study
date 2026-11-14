import { useCallback, useEffect, useMemo, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import {
  BarChart3,
  ClipboardCheck,
  Database,
  LogOut,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { TAHUN_LULUS_OPTIONS } from '../../data/kuesionerConstants';
import { supabase } from '../../lib/supabaseClient';
import {
  AppSettings,
  MasterProdi,
  StatistikIKU1Row,
  TracerAuditPlorca,
  TracerResponseRecord,
} from '../../types/tracer';
import { AdminLogin } from './AdminLogin';
import { AnalyticsTab } from './AnalyticsTab';
import { AuditPlorcaTab } from './AuditPlorcaTab';
import { RespondentsTab } from './RespondentsTab';
import { SettingsTab } from './SettingsTab';

type AdminTabKey = 'analytics' | 'respondents' | 'audit' | 'settings';

interface AdminDashboardProps {
  settings: AppSettings;
  prodiList: MasterProdi[];
  dbProdiList: MasterProdi[];
  onSettingsUpdated: () => void;
  onProdiUpdated: () => void;
}

export function AdminDashboard({
  settings,
  prodiList,
  dbProdiList,
  onSettingsUpdated,
  onProdiUpdated,
}: AdminDashboardProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTabKey>('analytics');

  const [responses, setResponses] = useState<TracerResponseRecord[]>([]);
  const [ikuStats, setIkuStats] = useState<StatistikIKU1Row[]>([]);
  const [audits, setAudits] = useState<TracerAuditPlorca[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Global Filters for Analytics & Respondents
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedFakultas, setSelectedFakultas] = useState<string>('ALL');
  const [selectedProdiId, setSelectedProdiId] = useState<string>('ALL');

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session ?? null);
        setCheckingAuth(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) {
        setSession(nextSession ?? null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchAdminData = useCallback(async () => {
    if (!session) return;
    setLoadingData(true);
    try {
      const [respRes, ikuRes, auditRes] = await Promise.all([
        supabase
          .from('tracer_responses')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase.from('v_statistik_iku1').select('*'),
        supabase
          .from('tracer_audit_plorca')
          .select('*')
          .order('created_at', { ascending: false }),
      ]);

      if (!respRes.error && respRes.data) {
        setResponses(respRes.data as TracerResponseRecord[]);
      }
      if (!ikuRes.error && ikuRes.data) {
        setIkuStats(ikuRes.data as StatistikIKU1Row[]);
      }
      if (!auditRes.error && auditRes.data) {
        setAudits(auditRes.data as TracerAuditPlorca[]);
      }
    } finally {
      setLoadingData(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchAdminData();
    }
  }, [session, fetchAdminData]);

  const fakultasOptions = useMemo(
    () =>
      Array.from(
        new Set(prodiList.map((p) => p.nama_fakultas).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b, 'id')),
    [prodiList]
  );

  const filteredProdiDropdown = useMemo(() => {
    if (selectedFakultas === 'ALL') return prodiList;
    return prodiList.filter((p) => p.nama_fakultas === selectedFakultas);
  }, [prodiList, selectedFakultas]);

  const selectedProdiObj = useMemo(
    () => prodiList.find((p) => p.id === selectedProdiId) || null,
    [prodiList, selectedProdiId]
  );

  const filteredResponses = useMemo(() => {
    return responses.filter((r) => {
      if (selectedYear !== 'ALL' && String(r.tahun_lulus) !== selectedYear) {
        return false;
      }
      if (selectedFakultas !== 'ALL' && r.fakultas !== selectedFakultas) {
        return false;
      }
      if (selectedProdiId !== 'ALL') {
        const matchesId = r.prodi_id === selectedProdiId;
        const matchesName =
          selectedProdiObj &&
          r.fakultas === selectedProdiObj.nama_fakultas &&
          r.nama_prodi
            ?.toLowerCase()
            .includes(selectedProdiObj.nama_prodi.toLowerCase());
        if (!matchesId && !matchesName) {
          return false;
        }
      }
      return true;
    });
  }, [
    responses,
    selectedYear,
    selectedFakultas,
    selectedProdiId,
    selectedProdiObj,
  ]);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (checkingAuth) {
    return (
      <div className="max-w-md mx-auto py-16 text-center text-white text-sm">
        Memeriksa sesi autentikasi LPMPP...
      </div>
    );
  }

  if (!session) {
    return <AdminLogin onLoginSuccess={fetchAdminData} />;
  }

  const tabs: { key: AdminTabKey; label: string; icon: typeof BarChart3 }[] = [
    { key: 'analytics', label: 'Dashboard Analitik & IKU 1', icon: BarChart3 },
    { key: 'respondents', label: 'Data Responden & Excel', icon: Database },
    { key: 'audit', label: 'Audit Mutu PLOR+CA', icon: ClipboardCheck },
    { key: 'settings', label: 'Pengaturan & Prodi', icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Console Bar */}
      <div className="glass-panel rounded-2xl shadow-xl p-4 sm:p-6 space-y-5">
        <div className="no-print flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <p className="text-xs font-semibold text-[#0A2342] uppercase tracking-wider">
              Console Pengelola Tracer Study · LPMPP
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Masuk sebagai{' '}
              <span className="font-mono font-semibold text-slate-800">
                {session.user.email}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              type="button"
              onClick={fetchAdminData}
              disabled={loadingData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`}
              />
              Muat Ulang Data
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="no-print flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#0A2342] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    active ? 'text-[#E8CF78]' : 'text-slate-500'
                  }`}
                />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Global Filters for Tab 1 & Tab 2 */}
        {(activeTab === 'analytics' || activeTab === 'respondents') && (
          <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Filter Tahun Lulus
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full min-h-[40px] px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm tabular-nums focus:outline-none focus:border-[#0A2342]"
              >
                <option value="ALL">Semua Tahun Lulus</option>
                {TAHUN_LULUS_OPTIONS.map((yr) => (
                  <option key={yr} value={String(yr)}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Filter Fakultas
              </label>
              <select
                value={selectedFakultas}
                onChange={(e) => {
                  setSelectedFakultas(e.target.value);
                  setSelectedProdiId('ALL');
                }}
                className="w-full min-h-[40px] px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#0A2342]"
              >
                <option value="ALL">Semua Fakultas</option>
                {fakultasOptions.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Filter Program Studi ({filteredProdiDropdown.length})
              </label>
              <select
                value={selectedProdiId}
                onChange={(e) => setSelectedProdiId(e.target.value)}
                className="w-full min-h-[40px] px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#0A2342]"
              >
                <option value="ALL">
                  Semua Program Studi ({filteredProdiDropdown.length})
                </option>
                {filteredProdiDropdown.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.jenjang ? `${p.jenjang} - ` : ''}
                    {p.nama_prodi}
                    {selectedFakultas === 'ALL' ? ` (${p.kode_fakultas})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Active Tab Viewport */}
        <div>
          {activeTab === 'analytics' && (
            <AnalyticsTab
              responses={filteredResponses}
              ikuStats={ikuStats}
              umpMaluku={settings.ump_maluku}
              selectedYear={selectedYear}
              selectedFakultas={selectedFakultas}
              selectedProdiId={selectedProdiId}
              selectedProdiObj={selectedProdiObj}
            />
          )}

          {activeTab === 'respondents' && (
            <RespondentsTab
              responses={filteredResponses}
              loading={loadingData}
              onRefresh={fetchAdminData}
            />
          )}

          {activeTab === 'audit' && (
            <AuditPlorcaTab
              audits={audits}
              prodiList={prodiList}
              auditorEmail={session.user.email || ''}
              loading={loadingData}
              onRefresh={fetchAdminData}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              settings={settings}
              prodiList={prodiList}
              dbProdiList={dbProdiList}
              onSettingsUpdated={onSettingsUpdated}
              onProdiUpdated={onProdiUpdated}
            />
          )}
        </div>
      </div>
    </div>
  );
}
