import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Database,
  Edit3,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { getMissingCatalogProdi } from '../../data/unpattiProdiCatalog';
import { supabase } from '../../lib/supabaseClient';
import { AppMode, AppSettings, MasterProdi } from '../../types/tracer';
import { formatRupiah } from '../../utils/formatters';
import { ConfirmModal } from '../ConfirmModal';

interface SettingsTabProps {
  settings: AppSettings;
  prodiList: MasterProdi[];
  dbProdiList: MasterProdi[];
  onSettingsUpdated: () => void;
  onProdiUpdated: () => void;
}

interface ProdiFormState {
  kode_fakultas: string;
  nama_fakultas: string;
  kode_prodi: string;
  nama_prodi: string;
  jenjang: string;
  is_active: boolean;
}

const EMPTY_PRODI: ProdiFormState = {
  kode_fakultas: '',
  nama_fakultas: '',
  kode_prodi: '',
  nama_prodi: '',
  jenjang: 'S1',
  is_active: true,
};

export function SettingsTab({
  settings,
  prodiList,
  dbProdiList,
  onSettingsUpdated,
  onProdiUpdated,
}: SettingsTabProps) {
  const [formSettings, setFormSettings] = useState<AppSettings>(settings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [prodiModalOpen, setProdiModalOpen] = useState(false);
  const [editingProdiId, setEditingProdiId] = useState<string | null>(null);
  const [prodiForm, setProdiForm] = useState<ProdiFormState>(EMPTY_PRODI);
  const [savingProdi, setSavingProdi] = useState(false);
  const [prodiError, setProdiError] = useState('');
  const [deleteProdiTarget, setDeleteProdiTarget] =
    useState<MasterProdi | null>(null);
  const [deletingProdi, setDeletingProdi] = useState(false);
  const [syncingCatalog, setSyncingCatalog] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string>('');

  const missingCatalogCount = useMemo(
    () => getMissingCatalogProdi(dbProdiList).length,
    [dbProdiList]
  );

  async function handleSyncCatalogToDb() {
    const missing = getMissingCatalogProdi(dbProdiList);
    if (missing.length === 0) return;

    setSyncingCatalog(true);
    setSyncMessage('');
    try {
      const payload = missing.map((m) => ({
        kode_fakultas: m.kode_fakultas,
        nama_fakultas: m.nama_fakultas,
        kode_prodi: m.kode_prodi,
        nama_prodi: m.nama_prodi,
        jenjang: m.jenjang,
        is_active: true,
      }));
      const { error } = await supabase
        .from('master_fakultas_prodi')
        .insert(payload);
      if (error) throw new Error(error.message);
      setSyncMessage(
        `Berhasil menyinkronkan ${missing.length} program studi ke database Supabase.`
      );
      onProdiUpdated();
    } catch (err) {
      setSyncMessage(
        err instanceof Error
          ? `Gagal sinkronisasi: ${err.message}`
          : 'Gagal menyinkronkan prodi ke database.'
      );
    } finally {
      setSyncingCatalog(false);
    }
  }

  useEffect(() => {
    setFormSettings(settings);
  }, [settings]);

  const fakultasOptions = useMemo(
    () =>
      Array.from(
        new Set(prodiList.map((p) => p.nama_fakultas).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b, 'id')),
    [prodiList]
  );

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSettingsMsg(null);
    setSavingSettings(true);

    try {
      const payload = {
        mode_aplikasi: formSettings.mode_aplikasi,
        fakultas_aktif:
          formSettings.mode_aplikasi === 'FAKULTAS'
            ? formSettings.fakultas_aktif || fakultasOptions[0] || null
            : null,
        judul_header: formSettings.judul_header.trim() || 'BORANG TRACER STUDY',
        subjudul_header: formSettings.subjudul_header.trim(),
        ump_maluku: Number(formSettings.ump_maluku) || 3141699,
        portal_url:
          formSettings.portal_url.trim() || 'https://portallpmpp.simpatti.site/',
      };

      const { error } = await supabase
        .from('app_settings')
        .update(payload)
        .eq('id', settings.id || 1);

      if (error) throw new Error(error.message);

      setSettingsMsg({
        type: 'success',
        text: 'Pengaturan mode aplikasi & parameter IKU 1 berhasil diperbarui.',
      });
      onSettingsUpdated();
    } catch (err) {
      setSettingsMsg({
        type: 'error',
        text:
          err instanceof Error ? err.message : 'Gagal memperbarui pengaturan.',
      });
    } finally {
      setSavingSettings(false);
    }
  }

  function openNewProdi() {
    setEditingProdiId(null);
    setProdiForm(EMPTY_PRODI);
    setProdiError('');
    setProdiModalOpen(true);
  }

  function openEditProdi(p: MasterProdi) {
    setEditingProdiId(p.id.startsWith('catalog-') ? null : p.id);
    setProdiForm({
      kode_fakultas: p.kode_fakultas,
      nama_fakultas: p.nama_fakultas,
      kode_prodi: p.kode_prodi,
      nama_prodi: p.nama_prodi,
      jenjang: p.jenjang,
      is_active: p.is_active,
    });
    setProdiError('');
    setProdiModalOpen(true);
  }

  async function handleSaveProdi(e: React.FormEvent) {
    e.preventDefault();
    setProdiError('');

    if (
      !prodiForm.kode_fakultas.trim() ||
      !prodiForm.nama_fakultas.trim() ||
      !prodiForm.kode_prodi.trim() ||
      !prodiForm.nama_prodi.trim() ||
      !prodiForm.jenjang.trim()
    ) {
      setProdiError('Semua kolom kode dan nama Fakultas/Prodi wajib diisi.');
      return;
    }

    setSavingProdi(true);
    try {
      const payload = {
        kode_fakultas: prodiForm.kode_fakultas.trim(),
        nama_fakultas: prodiForm.nama_fakultas.trim(),
        kode_prodi: prodiForm.kode_prodi.trim(),
        nama_prodi: prodiForm.nama_prodi.trim(),
        jenjang: prodiForm.jenjang.trim(),
        is_active: prodiForm.is_active,
      };

      if (editingProdiId) {
        const { error } = await supabase
          .from('master_fakultas_prodi')
          .update(payload)
          .eq('id', editingProdiId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from('master_fakultas_prodi')
          .insert([payload]);
        if (error) throw new Error(error.message);
      }

      setProdiModalOpen(false);
      onProdiUpdated();
    } catch (err) {
      setProdiError(
        err instanceof Error ? err.message : 'Gagal menyimpan data prodi.'
      );
    } finally {
      setSavingProdi(false);
    }
  }

  async function toggleProdiActive(p: MasterProdi) {
    await supabase
      .from('master_fakultas_prodi')
      .update({ is_active: !p.is_active })
      .eq('id', p.id);
    onProdiUpdated();
  }

  async function handleDeleteProdi() {
    if (!deleteProdiTarget) return;
    setDeletingProdi(true);
    try {
      const { error } = await supabase
        .from('master_fakultas_prodi')
        .delete()
        .eq('id', deleteProdiTarget.id);
      if (error) throw new Error(error.message);
      setDeleteProdiTarget(null);
      onProdiUpdated();
    } finally {
      setDeletingProdi(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* App Settings Form */}
      <form
        onSubmit={handleSaveSettings}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
      >
        <div className="border-b border-slate-200 pb-3">
          <h3 className="text-base font-bold text-[#0A2342]">
            Konfigurasi Mode Aplikasi &amp; Parameter IKU 1
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Atur apakah borang berjalan pada mode Universitas (seluruh fakultas)
            atau mode Fakultas spesifik, serta nilai acuan UMP Provinsi Maluku.
          </p>
        </div>

        {settingsMsg && (
          <div
            className={`p-3.5 rounded-lg border text-xs sm:text-sm flex items-center gap-2 ${
              settingsMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {settingsMsg.type === 'success' && (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{settingsMsg.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Mode Operasional Borang
            </label>
            <select
              value={formSettings.mode_aplikasi}
              onChange={(e) =>
                setFormSettings((prev) => ({
                  ...prev,
                  mode_aplikasi: e.target.value as AppMode,
                }))
              }
              className="w-full min-h-[42px] px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:border-[#0A2342]"
            >
              <option value="UNIVERSITAS">
                UNIVERSITAS (Semua Fakultas Terbuka)
              </option>
              <option value="FAKULTAS">
                FAKULTAS (Terkunci pada Fakultas Tertentu)
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Fakultas Aktif (Khusus Mode FAKULTAS)
            </label>
            <select
              value={formSettings.fakultas_aktif || ''}
              disabled={formSettings.mode_aplikasi !== 'FAKULTAS'}
              onChange={(e) =>
                setFormSettings((prev) => ({
                  ...prev,
                  fakultas_aktif: e.target.value || null,
                }))
              }
              className="w-full min-h-[42px] px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:border-[#0A2342]"
            >
              <option value="">-- Pilih Fakultas Aktif --</option>
              {fakultasOptions.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Judul Header Utama
            </label>
            <input
              type="text"
              value={formSettings.judul_header}
              onChange={(e) =>
                setFormSettings((prev) => ({
                  ...prev,
                  judul_header: e.target.value,
                }))
              }
              className="w-full min-h-[42px] px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#0A2342]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Subjudul Header (Mode UNIVERSITAS)
            </label>
            <input
              type="text"
              value={formSettings.subjudul_header}
              onChange={(e) =>
                setFormSettings((prev) => ({
                  ...prev,
                  subjudul_header: e.target.value,
                }))
              }
              className="w-full min-h-[42px] px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#0A2342]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              UMP Provinsi Maluku (Rp) — Acuan IKU 1
            </label>
            <input
              type="number"
              min={0}
              value={formSettings.ump_maluku}
              onChange={(e) =>
                setFormSettings((prev) => ({
                  ...prev,
                  ump_maluku: Number(e.target.value),
                }))
              }
              className="w-full min-h-[42px] px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono tabular-nums focus:outline-none focus:border-[#0A2342]"
            />
            <p className="mt-1 text-[11px] text-slate-500 tabular-nums">
              1,2× UMP saat ini:{' '}
              <strong>
                {formatRupiah(
                  Math.round((Number(formSettings.ump_maluku) || 0) * 1.2)
                )}
              </strong>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              URL Portal Utama (Tombol Mengambang)
            </label>
            <input
              type="url"
              value={formSettings.portal_url}
              onChange={(e) =>
                setFormSettings((prev) => ({
                  ...prev,
                  portal_url: e.target.value,
                }))
              }
              className="w-full min-h-[42px] px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#0A2342]"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={savingSettings}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0A2342] hover:bg-[#143763] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
          >
            <Save className="w-4 h-4 text-[#E8CF78]" />
            {savingSettings ? 'Menyimpan...' : 'Simpan Pengaturan Aplikasi'}
          </button>
        </div>
      </form>

      {/* Master Fakultas & Prodi CRUD */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#0A2342]">
              Master Data Fakultas &amp; Program Studi ({prodiList.length})
            </h3>
            <p className="text-xs text-slate-500">
              Kelola daftar Program Studi aktif yang muncul pada Borang Tracer
              Study ({dbProdiList.length} tersimpan di Supabase).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {missingCatalogCount > 0 && (
              <button
                type="button"
                disabled={syncingCatalog}
                onClick={handleSyncCatalogToDb}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#D4AF37] hover:bg-[#c39e2b] text-[#0A2342] text-xs sm:text-sm font-bold rounded-lg transition-colors disabled:opacity-60 whitespace-nowrap"
              >
                <Database className="w-4 h-4" />
                {syncingCatalog
                  ? 'Menyinkronkan...'
                  : `Sinkronkan ${missingCatalogCount} Prodi ke DB`}
              </button>
            )}
            <button
              type="button"
              onClick={openNewProdi}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0A2342] hover:bg-[#143763] text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-[#E8CF78]" />
              Tambah Program Studi
            </button>
          </div>
        </div>

        {syncMessage && (
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-800">
            {syncMessage}
          </div>
        )}

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="bg-slate-100 text-slate-700 text-xs border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Kode Fak / Prodi</th>
                <th className="px-4 py-3 font-semibold">Fakultas</th>
                <th className="px-4 py-3 font-semibold">Program Studi</th>
                <th className="px-3 py-3 font-semibold">Jenjang</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {prodiList.map((p) => {
                const isCatalogOnly = p.id.startsWith('catalog-');
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {p.kode_fakultas} / {p.kode_prodi}
                    </td>
                    <td className="px-4 py-2.5 text-slate-800">
                      {p.nama_fakultas}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-slate-900">
                      {p.nama_prodi}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-700">
                      {p.jenjang}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {isCatalogOnly ? (
                        <span className="text-xs font-medium text-amber-700">
                          Katalog (Belum di DB)
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleProdiActive(p)}
                          className={`text-xs font-semibold underline-offset-2 hover:underline ${
                            p.is_active ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          {p.is_active ? 'Aktif' : 'Nonaktif'}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditProdi(p)}
                          className="p-1.5 text-[#0A2342] hover:bg-slate-100 rounded-lg"
                          title={isCatalogOnly ? 'Simpan ke Database' : 'Edit Prodi'}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {!isCatalogOnly && (
                          <button
                            type="button"
                            onClick={() => setDeleteProdiTarget(p)}
                            className="p-1.5 text-red-700 hover:bg-red-50 rounded-lg"
                            title="Hapus Prodi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Prodi Modal */}
      {prodiModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-[#0A2342] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold">
                {editingProdiId ? 'Edit Program Studi' : 'Tambah Program Studi'}
              </h3>
              <button
                type="button"
                onClick={() => setProdiModalOpen(false)}
                className="p-1 text-slate-300 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProdi} className="p-6 space-y-4 text-sm">
              {prodiError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                  {prodiError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode Fakultas *
                  </label>
                  <input
                    type="text"
                    value={prodiForm.kode_fakultas}
                    onChange={(e) =>
                      setProdiForm((prev) => ({
                        ...prev,
                        kode_fakultas: e.target.value,
                      }))
                    }
                    placeholder="FTEK"
                    className="w-full min-h-[40px] px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode Prodi (DIKTI) *
                  </label>
                  <input
                    type="text"
                    value={prodiForm.kode_prodi}
                    onChange={(e) =>
                      setProdiForm((prev) => ({
                        ...prev,
                        kode_prodi: e.target.value,
                      }))
                    }
                    placeholder="55201"
                    className="w-full min-h-[40px] px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Fakultas *
                </label>
                <input
                  type="text"
                  value={prodiForm.nama_fakultas}
                  onChange={(e) =>
                    setProdiForm((prev) => ({
                      ...prev,
                      nama_fakultas: e.target.value,
                    }))
                  }
                  placeholder="Fakultas Teknik"
                  className="w-full min-h-[40px] px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Program Studi *
                  </label>
                  <input
                    type="text"
                    value={prodiForm.nama_prodi}
                    onChange={(e) =>
                      setProdiForm((prev) => ({
                        ...prev,
                        nama_prodi: e.target.value,
                      }))
                    }
                    placeholder="Teknik Informatika"
                    className="w-full min-h-[40px] px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jenjang *
                  </label>
                  <select
                    value={prodiForm.jenjang}
                    onChange={(e) =>
                      setProdiForm((prev) => ({
                        ...prev,
                        jenjang: e.target.value,
                      }))
                    }
                    className="w-full min-h-[40px] px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="D3">D3</option>
                    <option value="D4">D4</option>
                    <option value="S1">S1</option>
                    <option value="Profesi">Profesi</option>
                    <option value="S2">S2</option>
                    <option value="S3">S3</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-sm text-slate-700 pt-1">
                <input
                  type="checkbox"
                  checked={prodiForm.is_active}
                  onChange={(e) =>
                    setProdiForm((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 accent-[#0A2342] rounded"
                />
                <span>Aktif ditampilkan pada borang alumni</span>
              </label>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setProdiModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingProdi}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#0A2342] hover:bg-[#143763] rounded-lg disabled:opacity-60"
                >
                  {savingProdi ? 'Menyimpan...' : 'Simpan Prodi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteProdiTarget)}
        title="Hapus Program Studi?"
        description={`Program Studi "${deleteProdiTarget?.nama_prodi || ''}" (${
          deleteProdiTarget?.nama_fakultas || ''
        }) akan dihapus dari master data.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        destructive
        loading={deletingProdi}
        onConfirm={handleDeleteProdi}
        onCancel={() => setDeleteProdiTarget(null)}
      />
    </div>
  );
}
