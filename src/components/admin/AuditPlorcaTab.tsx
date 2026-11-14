import { useMemo, useState } from 'react';
import {
  Download,
  Edit3,
  Plus,
  Printer,
  Trash2,
  X,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { TAHUN_LULUS_OPTIONS } from '../../data/kuesionerConstants';
import { supabase } from '../../lib/supabaseClient';
import {
  AuditKategori,
  AuditStatus,
  MasterProdi,
  TracerAuditPlorca,
} from '../../types/tracer';
import { formatDateTimeID } from '../../utils/formatters';
import { ConfirmModal } from '../ConfirmModal';

interface AuditPlorcaTabProps {
  audits: TracerAuditPlorca[];
  prodiList: MasterProdi[];
  auditorEmail: string;
  loading: boolean;
  onRefresh: () => void;
}

interface PlorcaFormState {
  fakultas: string;
  prodi_id: string;
  nama_prodi: string;
  tahun_lulus: number;
  kategori_temuan: AuditKategori;
  problem: string;
  location: string;
  objective_evidence: string;
  reference: string;
  correction: string;
  action: string;
  status: AuditStatus;
  auditor_email: string;
}

function createEmptyAuditForm(email: string): PlorcaFormState {
  return {
    fakultas: '',
    prodi_id: '',
    nama_prodi: '',
    tahun_lulus: 2024,
    kategori_temuan: 'OB',
    problem: '',
    location: '',
    objective_evidence: '',
    reference: '',
    correction: '',
    action: '',
    status: 'Open',
    auditor_email: email,
  };
}

export function AuditPlorcaTab({
  audits,
  prodiList,
  auditorEmail,
  loading,
  onRefresh,
}: AuditPlorcaTabProps) {
  const [filterKategori, setFilterKategori] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<PlorcaFormState>(() =>
    createEmptyAuditForm(auditorEmail)
  );
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<TracerAuditPlorca | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  const fakultasOptions = useMemo(
    () =>
      Array.from(
        new Set(prodiList.map((p) => p.nama_fakultas).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b, 'id')),
    [prodiList]
  );

  const filteredProdiOptions = useMemo(() => {
    if (!formState.fakultas) return [];
    return prodiList.filter((p) => p.nama_fakultas === formState.fakultas);
  }, [prodiList, formState.fakultas]);

  const filteredAudits = useMemo(() => {
    return audits.filter((a) => {
      if (filterKategori !== 'ALL' && a.kategori_temuan !== filterKategori) {
        return false;
      }
      if (filterStatus !== 'ALL' && a.status !== filterStatus) {
        return false;
      }
      return true;
    });
  }, [audits, filterKategori, filterStatus]);

  function openCreateModal() {
    setEditingId(null);
    setFormState(createEmptyAuditForm(auditorEmail));
    setFormError('');
    setModalOpen(true);
  }

  function openEditModal(row: TracerAuditPlorca) {
    setEditingId(row.id);
    setFormState({
      fakultas: row.fakultas,
      prodi_id: row.prodi_id || '',
      nama_prodi: row.nama_prodi,
      tahun_lulus: row.tahun_lulus,
      kategori_temuan: row.kategori_temuan,
      problem: row.problem,
      location: row.location,
      objective_evidence: row.objective_evidence,
      reference: row.reference,
      correction: row.correction,
      action: row.action,
      status: row.status,
      auditor_email: row.auditor_email || auditorEmail,
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (
      !formState.fakultas ||
      !formState.nama_prodi ||
      !formState.problem.trim() ||
      !formState.location.trim() ||
      !formState.objective_evidence.trim() ||
      !formState.reference.trim() ||
      !formState.correction.trim() ||
      !formState.action.trim()
    ) {
      setFormError(
        'Seluruh elemen PLOR+CA (Problem, Location, Objective Evidence, Reference, Correction, Action) dan Unit Prodi wajib diisi.'
      );
      return;
    }

    setSaving(true);
    try {
      const resolvedProdiId = formState.prodi_id.startsWith('catalog-')
        ? null
        : formState.prodi_id || null;

      const payload = {
        fakultas: formState.fakultas,
        prodi_id: resolvedProdiId,
        nama_prodi: formState.nama_prodi,
        tahun_lulus: Number(formState.tahun_lulus),
        kategori_temuan: formState.kategori_temuan,
        problem: formState.problem.trim(),
        location: formState.location.trim(),
        objective_evidence: formState.objective_evidence.trim(),
        reference: formState.reference.trim(),
        correction: formState.correction.trim(),
        action: formState.action.trim(),
        status: formState.status,
        auditor_email: formState.auditor_email.trim() || auditorEmail,
      };

      if (editingId) {
        const { error } = await supabase
          .from('tracer_audit_plorca')
          .update(payload)
          .eq('id', editingId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from('tracer_audit_plorca')
          .insert([payload]);
        if (error) throw new Error(error.message);
      }

      setModalOpen(false);
      onRefresh();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan temuan audit PLOR+CA.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('tracer_audit_plorca')
        .delete()
        .eq('id', deleteTarget.id);
      if (error) throw new Error(error.message);
      setDeleteTarget(null);
      onRefresh();
    } finally {
      setDeleting(false);
    }
  }

  function handleExportPlorcaExcel() {
    const rows = filteredAudits.map((a, idx) => ({
      No: idx + 1,
      Tanggal: formatDateTimeID(a.created_at),
      Fakultas: a.fakultas,
      Program_Studi: a.nama_prodi,
      Tahun_Lulus: a.tahun_lulus,
      Kategori: a.kategori_temuan,
      Problem: a.problem,
      Location: a.location,
      Objective_Evidence: a.objective_evidence,
      Reference: a.reference,
      Correction: a.correction,
      Action: a.action,
      Status: a.status,
      Auditor: a.auditor_email,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Audit_PLORCA_RTM');
    const dateSlug = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Laporan_AMI_PLORCA_Tracer_${dateSlug}.xlsx`);
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="no-print flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
            aria-label="Filter kategori temuan"
            className="min-h-[40px] px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0A2342]"
          >
            <option value="ALL">Semua Kategori (KTS/OB/OF)</option>
            <option value="KTS">KTS (Ketidaksesuaian)</option>
            <option value="OB">OB (Observasi)</option>
            <option value="OF">OF (Opportunity for Improvement)</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            aria-label="Filter status audit"
            className="min-h-[40px] px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0A2342]"
          >
            <option value="ALL">Semua Status</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            Print View RTM
          </button>

          <button
            type="button"
            onClick={handleExportPlorcaExcel}
            disabled={filteredAudits.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Ekspor PLOR+CA (.xlsx)
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0A2342] hover:bg-[#143763] text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-[#E8CF78]" />
            Catat Temuan PLOR+CA
          </button>
        </div>
      </div>

      {/* Print Header for RTM */}
      <div className="hidden print-only mb-4 border-b border-slate-300 pb-3">
        <h2 className="text-lg font-bold text-slate-900">
          LAPORAN AUDIT MUTU INTERNAL (AMI) TRACER STUDY — METODE PLOR+CA
        </h2>
        <p className="text-xs text-slate-600">
          Universitas Pattimura · Bahan Rapat Tinjauan Manajemen (RTM) · Dicetak:{' '}
          {formatDateTimeID(new Date().toISOString())}
        </p>
      </div>

      {/* PLOR+CA Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="bg-[#0A2342] text-white text-xs">
              <tr>
                <th className="px-4 py-3 font-semibold">Unit / Prodi</th>
                <th className="px-3 py-3 font-semibold whitespace-nowrap">
                  Kategori
                </th>
                <th className="px-4 py-3 font-semibold">
                  PLOR (Problem, Location, Evidence, Ref)
                </th>
                <th className="px-4 py-3 font-semibold">
                  CA (Correction &amp; Action)
                </th>
                <th className="px-3 py-3 font-semibold whitespace-nowrap">
                  Status
                </th>
                <th className="no-print px-4 py-3 font-semibold text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 align-top">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Memuat catatan audit mutu PLOR+CA...
                  </td>
                </tr>
              ) : filteredAudits.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Belum ada temuan audit PLOR+CA yang tercatat. Klik "Catat
                    Temuan PLOR+CA" untuk memulai.
                  </td>
                </tr>
              ) : (
                filteredAudits.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3.5 min-w-[170px]">
                      <p className="font-semibold text-slate-900">
                        {row.nama_prodi}
                      </p>
                      <p className="text-xs text-slate-500">{row.fakultas}</p>
                      <p className="text-[11px] font-mono text-slate-500 mt-1 tabular-nums">
                        Cohorts {row.tahun_lulus} · {row.auditor_email}
                      </p>
                    </td>
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <span
                        className={`font-mono text-xs font-bold ${
                          row.kategori_temuan === 'KTS'
                            ? 'text-red-700'
                            : row.kategori_temuan === 'OB'
                            ? 'text-amber-700'
                            : 'text-[#0A2342]'
                        }`}
                      >
                        {row.kategori_temuan}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 space-y-1.5 min-w-[260px] text-xs">
                      <p>
                        <strong className="text-slate-900">P (Problem):</strong>{' '}
                        {row.problem}
                      </p>
                      <p>
                        <strong className="text-slate-900">L (Location):</strong>{' '}
                        {row.location}
                      </p>
                      <p>
                        <strong className="text-slate-900">
                          O (Objective Evidence):
                        </strong>{' '}
                        {row.objective_evidence}
                      </p>
                      <p>
                        <strong className="text-slate-900">R (Reference):</strong>{' '}
                        {row.reference}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 space-y-1.5 min-w-[240px] text-xs">
                      <p>
                        <strong className="text-slate-900">
                          C (Correction):
                        </strong>{' '}
                        {row.correction}
                      </p>
                      <p>
                        <strong className="text-slate-900">
                          A (Corrective Action):
                        </strong>{' '}
                        {row.action}
                      </p>
                    </td>
                    <td className="px-3 py-3.5 whitespace-nowrap text-xs font-semibold">
                      <span
                        className={
                          row.status === 'Closed'
                            ? 'text-emerald-700'
                            : row.status === 'In Progress'
                            ? 'text-amber-700'
                            : 'text-red-700'
                        }
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="no-print px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(row)}
                          className="p-2 text-[#0A2342] hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Temuan"
                          aria-label="Edit Temuan"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(row)}
                          className="p-2 text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Temuan"
                          aria-label="Hapus Temuan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-[#0A2342] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold">
                {editingId
                  ? 'Perbarui Catatan Audit PLOR+CA'
                  : 'Catat Temuan Audit Mutu PLOR+CA'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg"
                aria-label="Tutup modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSave}
              className="p-6 overflow-y-auto custom-scrollbar space-y-4 text-sm"
            >
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fakultas *
                  </label>
                  <select
                    value={formState.fakultas}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        fakultas: e.target.value,
                        prodi_id: '',
                        nama_prodi: '',
                      }))
                    }
                    className="w-full min-h-[42px] px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="">-- Pilih Fakultas --</option>
                    {fakultasOptions.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Program Studi *
                  </label>
                  <select
                    value={formState.prodi_id}
                    onChange={(e) => {
                      const found = filteredProdiOptions.find(
                        (p) => p.id === e.target.value
                      );
                      setFormState((prev) => ({
                        ...prev,
                        prodi_id: e.target.value,
                        nama_prodi: found
                          ? `${found.jenjang ? `${found.jenjang} ` : ''}${
                              found.nama_prodi
                            }`
                          : '',
                      }));
                    }}
                    className="w-full min-h-[42px] px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="">-- Pilih Program Studi --</option>
                    {filteredProdiOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.jenjang ? `${p.jenjang} - ` : ''}
                        {p.nama_prodi}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tahun Lulus Audit *
                  </label>
                  <select
                    value={formState.tahun_lulus}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        tahun_lulus: Number(e.target.value),
                      }))
                    }
                    className="w-full min-h-[42px] px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono tabular-nums"
                  >
                    {TAHUN_LULUS_OPTIONS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kategori *
                    </label>
                    <select
                      value={formState.kategori_temuan}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          kategori_temuan: e.target.value as AuditKategori,
                        }))
                      }
                      className="w-full min-h-[42px] px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold"
                    >
                      <option value="KTS">KTS</option>
                      <option value="OB">OB</option>
                      <option value="OF">OF</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Status *
                    </label>
                    <select
                      value={formState.status}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          status: e.target.value as AuditStatus,
                        }))
                      }
                      className="w-full min-h-[42px] px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold"
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    P · Problem (Permasalahan / Temuan) *
                  </label>
                  <textarea
                    rows={2}
                    value={formState.problem}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        problem: e.target.value,
                      }))
                    }
                    placeholder="Contoh: Rerata kompetensi Bahasa Inggris (F17a) di bawah 3.0..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    L · Location (Lokasi / Lingkup Standar) *
                  </label>
                  <textarea
                    rows={2}
                    value={formState.location}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    placeholder="Contoh: Kurikulum Prodi / Matriks F17a-F17b..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    O · Objective Evidence (Bukti Objektif) *
                  </label>
                  <textarea
                    rows={2}
                    value={formState.objective_evidence}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        objective_evidence: e.target.value,
                      }))
                    }
                    placeholder="Contoh: Data responden Tracer 2024 menunjukkan skor F17b 2.75 dari 42 alumni..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    R · Reference (Acuan Standar / IKU / BAN-PT) *
                  </label>
                  <textarea
                    rows={2}
                    value={formState.reference}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        reference: e.target.value,
                      }))
                    }
                    placeholder="Contoh: Standar SPMI Unpatti 01.2 & Permendikbudristek IKU 1..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    C · Correction (Tindakan Koreksi Langsung) *
                  </label>
                  <textarea
                    rows={2}
                    value={formState.correction}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        correction: e.target.value,
                      }))
                    }
                    placeholder="Contoh: Mengadakan workshop persiapan karier dan sertifikasi TOEFL..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    A · Action (Tindakan Pencegahan / Revisi Kurikulum) *
                  </label>
                  <textarea
                    rows={2}
                    value={formState.action}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        action: e.target.value,
                      }))
                    }
                    placeholder="Contoh: Revisi RPS mata kuliah Bahasa Inggris Terapan pada Kurikulum OBE 2025..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#0A2342] hover:bg-[#143763] rounded-lg disabled:opacity-60"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Temuan PLOR+CA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Hapus Temuan Audit PLOR+CA?"
        description={`Temuan untuk program studi ${
          deleteTarget?.nama_prodi || ''
        } akan dihapus dari log Audit Mutu Internal.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
