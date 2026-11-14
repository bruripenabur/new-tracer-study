import { useMemo, useState } from 'react';
import {
  Download,
  Eye,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { F17_KOMPETENSI } from '../../data/kuesionerConstants';
import { supabase } from '../../lib/supabaseClient';
import { TracerResponseRecord } from '../../types/tracer';
import { formatDateTimeID, formatRupiah } from '../../utils/formatters';
import { ConfirmModal } from '../ConfirmModal';

interface RespondentsTabProps {
  responses: TracerResponseRecord[];
  loading: boolean;
  onRefresh: () => void;
}

export function RespondentsTab({
  responses,
  loading,
  onRefresh,
}: RespondentsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [detailRow, setDetailRow] = useState<TracerResponseRecord | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<TracerResponseRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState('');

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return responses;
    return responses.filter(
      (r) =>
        r.nama_responden?.toLowerCase().includes(q) ||
        r.nim?.toLowerCase().includes(q) ||
        r.nomor_tiket?.toLowerCase().includes(q) ||
        r.nama_prodi?.toLowerCase().includes(q)
    );
  }, [responses, searchQuery]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setActionError('');
    try {
      const { error } = await supabase
        .from('tracer_responses')
        .delete()
        .eq('id', deleteTarget.id);
      if (error) throw new Error(error.message);
      setDeleteTarget(null);
      onRefresh();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Gagal menghapus data responden.'
      );
    } finally {
      setDeleting(false);
    }
  }

  function handleExportExcel() {
    const exportRows = filteredList.map((r, index) => {
      const base: Record<string, string | number | boolean | null> = {
        No: index + 1,
        Nomor_Tiket: r.nomor_tiket,
        Tanggal_Input: formatDateTimeID(r.created_at),
        Fakultas: r.fakultas,
        Program_Studi: r.nama_prodi,
        NIM: r.nim,
        Nama_Responden: r.nama_responden,
        Tahun_Lulus: r.tahun_lulus,
        No_HP: r.no_hp,
        Email: r.email,
        F3_Waktu_Mulai: r.f3_waktu_mulai_type,
        F3_Bulan: r.f3_bulan ?? 0,
        F3b_Sedang_Mencari: r.f3b_sedang_mencari ? 'Ya' : 'Tidak',
        F4_Cara_Mencari: Array.isArray(r.f4_cara_mencari)
          ? r.f4_cara_mencari.join('; ')
          : '',
        F4_Lainnya: r.f4_lainnya_teks || '',
        F5_Tunggu_Sebelum_Bulan: r.f5_masa_tunggu_sebelum ?? 0,
        F5_Tunggu_Sesudah_Bulan: r.f5_masa_tunggu_sesudah ?? 0,
        F6_Jumlah_Lamaran: r.f6_jumlah_lamaran ?? 0,
        F7_Jumlah_Respons: r.f7_jumlah_respons ?? 0,
        F7a_Jumlah_Wawancara: r.f7a_jumlah_wawancara ?? 0,
        F8_Bekerja_Saat_Ini: r.f8_bekerja_saat_ini ? 'Ya' : 'Tidak',
        F9_Situasi_Saat_Ini: Array.isArray(r.f9_situasi_saat_ini)
          ? r.f9_situasi_saat_ini.join('; ')
          : '',
        F9_Lainnya: r.f9_lainnya_teks || '',
        F10_Aktif_4_Minggu: r.f10_aktif_4_minggu || '',
        F11_Jenis_Instansi: r.f11_jenis_instansi || '',
        F11_Lainnya: r.f11_lainnya_teks || '',
        F12_KBLI: r.f12_kbli || '',
        F13_Gaji_Utama: r.f13_gaji_utama ?? 0,
        F13_Lembur_Tips: r.f13_lembur_tips ?? 0,
        F13_Lainnya: r.f13_lainnya ?? 0,
        F13_Total_Pendapatan:
          r.f13_total_pendapatan ??
          Number(r.f13_gaji_utama || 0) +
            Number(r.f13_lembur_tips || 0) +
            Number(r.f13_lainnya || 0),
        F14_Keeratan_Bidang: r.f14_keeratan_bidang || '',
        F15_Kesesuaian_Pendidikan: r.f15_kesesuaian_pendidikan || '',
        F16_Alasan_Tidak_Sesuai: Array.isArray(r.f16_alasan_tidak_sesuai)
          ? r.f16_alasan_tidak_sesuai.join('; ')
          : '',
        F16_Lainnya: r.f16_lainnya_teks || '',
      };

      F17_KOMPETENSI.forEach((k) => {
        base[`F17a_${k.key}`] = r.f17a_kompetensi_lulusan?.[k.key] ?? '';
        base[`F17b_${k.key}`] = r.f17b_kontribusi_pt?.[k.key] ?? '';
      });

      return base;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tracer_DIKTI');
    const dateSlug = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `TracerStudy_Unpatti_DIKTI_${dateSlug}.xlsx`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Nama Alumni, NIM, atau Nomor Tiket..."
            className="w-full min-h-[42px] pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#0A2342]"
          />
        </div>

        <button
          type="button"
          onClick={handleExportExcel}
          disabled={filteredList.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          Export .xlsx Format DIKTI ({filteredList.length})
        </button>
      </div>

      {actionError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {actionError}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-[#0A2342] text-white text-xs">
              <tr>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">
                  Nomor Tiket
                </th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">
                  NIM &amp; Nama Alumni
                </th>
                <th className="px-4 py-3 font-semibold">Program Studi</th>
                <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">
                  Lulus
                </th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">
                  Status (F8)
                </th>
                <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">
                  Pendapatan
                </th>
                <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-slate-500"
                  >
                    Memuat data responden...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-slate-500"
                  >
                    Tidak ada data responden yang sesuai dengan filter atau
                    pencarian.
                  </td>
                </tr>
              ) : (
                filteredList.map((row) => {
                  const totalGaji =
                    row.f13_total_pendapatan ??
                    Number(row.f13_gaji_utama || 0) +
                      Number(row.f13_lembur_tips || 0) +
                      Number(row.f13_lainnya || 0);

                  return (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-[#0A2342] font-semibold whitespace-nowrap">
                        {row.nomor_tiket}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">
                          {row.nama_responden}
                        </p>
                        <p className="text-xs font-mono text-slate-500 tabular-nums">
                          {row.nim} · {row.email}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-800 font-medium">
                          {row.nama_prodi}
                        </p>
                        <p className="text-xs text-slate-500">{row.fakultas}</p>
                      </td>
                      <td className="px-4 py-3 text-center font-mono tabular-nums text-slate-700">
                        {row.tahun_lulus}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {row.f8_bekerja_saat_ini ? (
                          <span className="font-semibold text-emerald-700">
                            Bekerja
                          </span>
                        ) : (
                          <span className="font-medium text-slate-500">
                            Belum Bekerja
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-800 whitespace-nowrap">
                        {row.f8_bekerja_saat_ini
                          ? formatRupiah(totalGaji)
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDetailRow(row)}
                            className="p-2 text-[#0A2342] hover:bg-slate-100 rounded-lg transition-colors"
                            title="Lihat Detail Jawaban"
                            aria-label="Lihat Detail Jawaban"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(row)}
                            className="p-2 text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Data"
                            aria-label="Hapus Data"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {detailRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-3xl max-h-[88vh] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-[#0A2342] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-mono text-[#E8CF78]">
                  {detailRow.nomor_tiket}
                </p>
                <h3 className="text-base font-bold">
                  {detailRow.nama_responden} ({detailRow.nim})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailRow(null)}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg"
                aria-label="Tutup detail"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-5 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-200">
                <div>
                  <p className="text-xs text-slate-500">Fakultas &amp; Prodi</p>
                  <p className="font-semibold text-slate-900">
                    {detailRow.fakultas} · {detailRow.nama_prodi}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Kontak &amp; Tahun Lulus</p>
                  <p className="font-medium text-slate-900">
                    {detailRow.tahun_lulus} · {detailRow.no_hp} ·{' '}
                    {detailRow.email}
                  </p>
                </div>
              </div>

              <div className="space-y-2 pb-4 border-b border-slate-200">
                <h4 className="font-bold text-[#0A2342]">
                  Transisi &amp; Pencarian Kerja (F3 – F10)
                </h4>
                <p>
                  <strong>F3 Waktu Mulai:</strong> {detailRow.f3_waktu_mulai_type}{' '}
                  ({detailRow.f3_bulan ?? 0} bulan)
                </p>
                <p>
                  <strong>F3b Mencari Kerja:</strong>{' '}
                  {detailRow.f3b_sedang_mencari ? 'Ya' : 'Tidak'}
                </p>
                {Array.isArray(detailRow.f4_cara_mencari) &&
                  detailRow.f4_cara_mencari.length > 0 && (
                    <p>
                      <strong>F4 Cara Mencari:</strong>{' '}
                      {detailRow.f4_cara_mencari.join('; ')}
                    </p>
                  )}
                <p className="tabular-nums">
                  <strong>F5 Masa Tunggu:</strong> Sebelum{' '}
                  {detailRow.f5_masa_tunggu_sebelum ?? 0} bln · Sesudah{' '}
                  {detailRow.f5_masa_tunggu_sesudah ?? 0} bln
                </p>
                <p className="tabular-nums">
                  <strong>F6/F7/F7a:</strong> Lamaran{' '}
                  {detailRow.f6_jumlah_lamaran ?? 0} · Respons{' '}
                  {detailRow.f7_jumlah_respons ?? 0} · Wawancara{' '}
                  {detailRow.f7a_jumlah_wawancara ?? 0}
                </p>
                <p>
                  <strong>F8 Bekerja Saat Ini:</strong>{' '}
                  {detailRow.f8_bekerja_saat_ini ? 'Ya' : 'Tidak'}
                </p>
                <p>
                  <strong>F9 Situasi:</strong>{' '}
                  {Array.isArray(detailRow.f9_situasi_saat_ini)
                    ? detailRow.f9_situasi_saat_ini.join('; ')
                    : '-'}
                </p>
                <p>
                  <strong>F10 Aktif 4 Minggu:</strong>{' '}
                  {detailRow.f10_aktif_4_minggu || '-'}
                </p>
              </div>

              {detailRow.f8_bekerja_saat_ini && (
                <div className="space-y-2 pb-4 border-b border-slate-200">
                  <h4 className="font-bold text-[#0A2342]">
                    Detail Pekerjaan &amp; Keselarasan (F11 – F16)
                  </h4>
                  <p>
                    <strong>F11 Jenis Instansi:</strong>{' '}
                    {detailRow.f11_jenis_instansi}{' '}
                    {detailRow.f11_lainnya_teks
                      ? `(${detailRow.f11_lainnya_teks})`
                      : ''}
                  </p>
                  <p>
                    <strong>F12 Sektor KBLI:</strong> {detailRow.f12_kbli}
                  </p>
                  <p className="tabular-nums">
                    <strong>F13 Pendapatan:</strong> Utama{' '}
                    {formatRupiah(detailRow.f13_gaji_utama)} · Lembur{' '}
                    {formatRupiah(detailRow.f13_lembur_tips)} · Lainnya{' '}
                    {formatRupiah(detailRow.f13_lainnya)} ·{' '}
                    <strong>
                      Total{' '}
                      {formatRupiah(
                        detailRow.f13_total_pendapatan ??
                          Number(detailRow.f13_gaji_utama || 0) +
                            Number(detailRow.f13_lembur_tips || 0) +
                            Number(detailRow.f13_lainnya || 0)
                      )}
                    </strong>
                  </p>
                  <p>
                    <strong>F14 Keeratan Bidang:</strong>{' '}
                    {detailRow.f14_keeratan_bidang}
                  </p>
                  <p>
                    <strong>F15 Kesesuaian Pendidikan:</strong>{' '}
                    {detailRow.f15_kesesuaian_pendidikan}
                  </p>
                  <p>
                    <strong>F16 Alasan:</strong>{' '}
                    {Array.isArray(detailRow.f16_alasan_tidak_sesuai)
                      ? detailRow.f16_alasan_tidak_sesuai.join('; ')
                      : '-'}
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-bold text-[#0A2342] mb-2">
                  Skor Kompetensi (F17a Lulusan / F17b PT)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {F17_KOMPETENSI.map((k) => (
                    <div
                      key={k.key}
                      className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100"
                    >
                      <span className="truncate pr-2">
                        {k.no}. {k.shortLabel}
                      </span>
                      <span className="font-mono font-semibold text-[#0A2342] shrink-0 tabular-nums">
                        {detailRow.f17a_kompetensi_lulusan?.[k.key] ?? '-'} /{' '}
                        {detailRow.f17b_kontribusi_pt?.[k.key] ?? '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Hapus Data Responden?"
        description={`Data milik ${deleteTarget?.nama_responden || ''} (${
          deleteTarget?.nomor_tiket || ''
        }) akan dihapus permanen dari database Tracer Study.`}
        confirmLabel="Ya, Hapus Permanen"
        cancelLabel="Batal"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
