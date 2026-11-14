import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  RefreshCw,
  RotateCcw,
  Send,
} from 'lucide-react';
import {
  F10_AKTIF_4_MINGGU,
  F11_JENIS_INSTANSI,
  F12_KBLI,
  F14_KEERATAN_BIDANG,
  F15_KESESUAIAN_PENDIDIKAN,
  F16_ALASAN_TIDAK_SESUAI,
  F17_KOMPETENSI,
  F4_CARA_MENCARI,
  F9_SITUASI_SAAT_INI,
  NAMA_PT_RESMI,
  SKALA_KOMPETENSI_LABELS,
  TAHUN_LULUS_OPTIONS,
} from '../../data/kuesionerConstants';
import { supabase } from '../../lib/supabaseClient';
import {
  AppSettings,
  MasterProdi,
  TracerFormState,
} from '../../types/tracer';
import {
  formatRupiah,
  formatThousandSeparator,
  generateTicketNumber,
  isValidEmail,
  parseThousandNumber,
} from '../../utils/formatters';
import { ConfirmModal } from '../ConfirmModal';
import { SearchableSelect } from '../SearchableSelect';
import { LpmppUpdatesPanel } from './LpmppUpdatesPanel';
import { StepDefinition, Stepper } from './Stepper';
import { SubmittedReceiptData, TicketReceipt } from './TicketReceipt';

const DRAFT_STORAGE_KEY = 'tracer_unpatti_draft';

const ALL_STEPS: StepDefinition[] = [
  { id: 1, title: 'Identitas Alumni', subtitle: 'F1 – F2d Data Diri' },
  { id: 2, title: 'Pencarian Kerja', subtitle: 'F3 – F7a Transisi' },
  { id: 3, title: 'Status Saat Ini', subtitle: 'F8 – F10 Aktivitas' },
  { id: 4, title: 'Detail Pekerjaan', subtitle: 'F11 – F16 Keselarasan' },
  { id: 5, title: 'Kompetensi', subtitle: 'F17a – F17b & Kirim' },
];

function createEmptyFormState(defaultFakultas = ''): TracerFormState {
  return {
    fakultas: defaultFakultas,
    prodi_id: '',
    nama_prodi: '',
    nama_responden: '',
    nim: '',
    tahun_lulus: '',
    no_hp: '',
    email: '',
    f3_waktu_mulai_type: '',
    f3_bulan: '',
    f3b_sedang_mencari: null,
    f4_cara_mencari: [],
    f4_lainnya_teks: '',
    f5_masa_tunggu_sebelum: '',
    f5_masa_tunggu_sesudah: '',
    f6_jumlah_lamaran: '',
    f7_jumlah_respons: '',
    f7a_jumlah_wawancara: '',
    f8_bekerja_saat_ini: null,
    f9_situasi_saat_ini: [],
    f9_lainnya_teks: '',
    f10_aktif_4_minggu: '',
    f11_jenis_instansi: '',
    f11_lainnya_teks: '',
    f12_kbli: '',
    f13_gaji_utama: 0,
    f13_lembur_tips: 0,
    f13_lainnya: 0,
    f14_keeratan_bidang: '',
    f15_kesesuaian_pendidikan: '',
    f16_alasan_tidak_sesuai: [],
    f16_lainnya_teks: '',
    f17a_kompetensi_lulusan: {},
    f17b_kontribusi_pt: {},
  };
}

function generateCaptchaPair(): { a: number; b: number } {
  return {
    a: Math.floor(Math.random() * 9) + 2,
    b: Math.floor(Math.random() * 9) + 1,
  };
}

interface TracerFormProps {
  settings: AppSettings;
  prodiList: MasterProdi[];
  loadingConfig: boolean;
}

export function TracerForm({
  settings,
  prodiList,
  loadingConfig,
}: TracerFormProps) {
  const isFakultasMode =
    settings.mode_aplikasi === 'FAKULTAS' && Boolean(settings.fakultas_aktif);

  const [form, setForm] = useState<TracerFormState>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            ...createEmptyFormState(
              isFakultasMode ? settings.fakultas_aktif || '' : ''
            ),
            ...parsed,
          };
        }
      }
    } catch {
      // Ignore malformed localStorage draft
    }
    return createEmptyFormState(
      isFakultasMode ? settings.fakultas_aktif || '' : ''
    );
  });

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [receipt, setReceipt] = useState<SubmittedReceiptData | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  const [captcha, setCaptcha] = useState<{ a: number; b: number }>(() =>
    generateCaptchaPair()
  );
  const [captchaAnswer, setCaptchaAnswer] = useState<string>('');

  // Enforce FAKULTAS mode lock automatically
  useEffect(() => {
    if (isFakultasMode && settings.fakultas_aktif) {
      setForm((prev) => {
        if (prev.fakultas === settings.fakultas_aktif) return prev;
        return {
          ...prev,
          fakultas: settings.fakultas_aktif || '',
          prodi_id: '',
          nama_prodi: '',
        };
      });
    }
  }, [isFakultasMode, settings.fakultas_aktif]);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (receipt) return;
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form));
    } catch {
      // Ignore storage quota errors
    }
  }, [form, receipt]);

  const activeProdiList = useMemo(
    () => prodiList.filter((p) => p.is_active !== false),
    [prodiList]
  );

  const fakultasOptions = useMemo(() => {
    const unique = Array.from(
      new Set(activeProdiList.map((p) => p.nama_fakultas).filter(Boolean))
    );
    return unique.sort((a, b) => a.localeCompare(b, 'id'));
  }, [activeProdiList]);

  const filteredProdiOptions = useMemo(() => {
    const targetFakultas = isFakultasMode
      ? settings.fakultas_aktif || ''
      : form.fakultas;
    if (!targetFakultas) return [];
    return activeProdiList
      .filter((p) => p.nama_fakultas === targetFakultas)
      .sort((a, b) => a.nama_prodi.localeCompare(b.nama_prodi, 'id'));
  }, [activeProdiList, form.fakultas, isFakultasMode, settings.fakultas_aktif]);

  // Visible steps: hide Step 4 when F8 === false
  const visibleSteps = useMemo(() => {
    if (form.f8_bekerja_saat_ini === false) {
      return ALL_STEPS.filter((s) => s.id !== 4);
    }
    return ALL_STEPS;
  }, [form.f8_bekerja_saat_ini]);

  // Ensure currentStep isn't stranded on Step 4 if F8 switches to false
  useEffect(() => {
    if (currentStep === 4 && form.f8_bekerja_saat_ini === false) {
      setCurrentStep(5);
    }
  }, [currentStep, form.f8_bekerja_saat_ini]);

  const kbliOptions = useMemo(
    () => F12_KBLI.map((k) => ({ value: k.label, label: k.label })),
    []
  );

  const totalPendapatan =
    (form.f13_gaji_utama || 0) +
    (form.f13_lembur_tips || 0) +
    (form.f13_lainnya || 0);

  const kompetensiFilledCount = useMemo(() => {
    return F17_KOMPETENSI.filter(
      (item) =>
        Boolean(form.f17a_kompetensi_lulusan[item.key]) &&
        Boolean(form.f17b_kontribusi_pt[item.key])
    ).length;
  }, [form.f17a_kompetensi_lulusan, form.f17b_kontribusi_pt]);

  function clearFieldError(key: string) {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function updateField<K extends keyof TracerFormState>(
    key: K,
    value: TracerFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    clearFieldError(String(key));
  }

  function toggleMultiCheck(
    field: 'f4_cara_mencari' | 'f9_situasi_saat_ini' | 'f16_alasan_tidak_sesuai',
    label: string
  ) {
    setForm((prev) => {
      const current = prev[field];
      const exists = current.includes(label);
      const next = exists
        ? current.filter((x) => x !== label)
        : [...current, label];
      return { ...prev, [field]: next };
    });
    clearFieldError(field);
  }

  function validateStep(stepId: number): boolean {
    const newErrors: Record<string, string> = {};

    if (stepId === 1) {
      if (!form.fakultas) newErrors.fakultas = 'Pilih Fakultas terlebih dahulu.';
      if (!form.prodi_id) newErrors.prodi_id = 'Pilih Program Studi.';
      if (!form.nama_responden.trim())
        newErrors.nama_responden = 'Nama lengkap wajib diisi.';
      if (!form.nim.trim()) newErrors.nim = 'NIM wajib diisi.';
      if (!form.tahun_lulus) newErrors.tahun_lulus = 'Pilih tahun lulus.';
      if (!form.no_hp.trim() || form.no_hp.replace(/\D/g, '').length < 8) {
        newErrors.no_hp = 'Masukkan nomor HP/WhatsApp yang valid (min. 8 digit).';
      }
      if (!form.email.trim() || !isValidEmail(form.email)) {
        newErrors.email = 'Masukkan alamat email yang valid.';
      }
    }

    if (stepId === 2) {
      if (!form.f3_waktu_mulai_type) {
        newErrors.f3_waktu_mulai_type = 'Pilih kapan Anda mulai mencari pekerjaan.';
      } else if (
        form.f3_waktu_mulai_type !== 'tidak_mencari' &&
        (form.f3_bulan === '' || Number(form.f3_bulan) < 0)
      ) {
        newErrors.f3_bulan = 'Isi perkiraan jumlah bulan (>= 0).';
      }

      if (form.f3b_sedang_mencari === null) {
        newErrors.f3b_sedang_mencari =
          'Pilih Ya atau Tidak pada pertanyaan status mencari kerja.';
      }

      if (form.f3b_sedang_mencari === true) {
        if (form.f4_cara_mencari.length === 0) {
          newErrors.f4_cara_mencari =
            'Pilih minimal satu cara Anda mencari pekerjaan.';
        }
        if (
          form.f4_cara_mencari.includes('Lainnya') &&
          !form.f4_lainnya_teks.trim()
        ) {
          newErrors.f4_lainnya_teks = 'Tuliskan cara lainnya yang Anda gunakan.';
        }
      }

      const f6 = Number(form.f6_jumlah_lamaran || 0);
      const f7 = Number(form.f7_jumlah_respons || 0);
      const f7a = Number(form.f7a_jumlah_wawancara || 0);

      if (form.f6_jumlah_lamaran === '' || f6 < 0) {
        newErrors.f6_jumlah_lamaran = 'Isi jumlah lamaran (>= 0).';
      }
      if (form.f7_jumlah_respons === '' || f7 < 0) {
        newErrors.f7_jumlah_respons = 'Isi jumlah respons (>= 0).';
      } else if (f7 > f6) {
        newErrors.f7_jumlah_respons =
          'Jumlah respons (F7) tidak boleh melebihi jumlah lamaran (F6).';
      }

      if (form.f7a_jumlah_wawancara === '' || f7a < 0) {
        newErrors.f7a_jumlah_wawancara = 'Isi jumlah wawancara (>= 0).';
      } else if (f7a > f7) {
        newErrors.f7a_jumlah_wawancara =
          'Jumlah undangan wawancara (F7a) tidak boleh melebihi jumlah respons (F7).';
      }
    }

    if (stepId === 3) {
      if (form.f8_bekerja_saat_ini === null) {
        newErrors.f8_bekerja_saat_ini =
          'Pilih Ya atau Tidak untuk status bekerja saat ini.';
      }
      if (form.f9_situasi_saat_ini.length === 0) {
        newErrors.f9_situasi_saat_ini =
          'Pilih minimal satu kondisi yang menggambarkan situasi Anda saat ini.';
      }
      if (
        form.f9_situasi_saat_ini.includes('Lainnya') &&
        !form.f9_lainnya_teks.trim()
      ) {
        newErrors.f9_lainnya_teks = 'Jelaskan situasi lainnya pada kolom teks.';
      }
      if (!form.f10_aktif_4_minggu) {
        newErrors.f10_aktif_4_minggu =
          'Pilih status pencarian pekerjaan dalam 4 minggu terakhir.';
      }
    }

    if (stepId === 4 && form.f8_bekerja_saat_ini === true) {
      if (!form.f11_jenis_instansi) {
        newErrors.f11_jenis_instansi = 'Pilih jenis perusahaan/instansi.';
      }
      if (
        form.f11_jenis_instansi === 'Lainnya' &&
        !form.f11_lainnya_teks.trim()
      ) {
        newErrors.f11_lainnya_teks = 'Tuliskan jenis instansi lainnya.';
      }
      if (!form.f12_kbli) {
        newErrors.f12_kbli = 'Pilih kategori bidang usaha (KBLI).';
      }
      if (form.f13_gaji_utama <= 0) {
        newErrors.f13_gaji_utama =
          'Masukkan penghasilan utama per bulan (> Rp 0).';
      }
      if (!form.f14_keeratan_bidang) {
        newErrors.f14_keeratan_bidang = 'Pilih tingkat keeratan hubungan bidang.';
      }
      if (!form.f15_kesesuaian_pendidikan) {
        newErrors.f15_kesesuaian_pendidikan =
          'Pilih tingkat pendidikan yang paling sesuai.';
      }
      if (form.f16_alasan_tidak_sesuai.length === 0) {
        newErrors.f16_alasan_tidak_sesuai =
          'Pilih minimal satu opsi (atau opsi pertama jika sudah sesuai).';
      }
      if (
        form.f16_alasan_tidak_sesuai.includes('Lainnya') &&
        !form.f16_lainnya_teks.trim()
      ) {
        newErrors.f16_lainnya_teks = 'Tuliskan alasan lainnya pada kolom teks.';
      }
    }

    if (stepId === 5) {
      if (kompetensiFilledCount < F17_KOMPETENSI.length) {
        newErrors.f17_matrix = `Masih ada ${
          F17_KOMPETENSI.length - kompetensiFilledCount
        } butir kompetensi yang belum lengkap skala F17a & F17b-nya.`;
      }
      const expected = captcha.a + captcha.b;
      if (captchaAnswer.trim() === '' || Number(captchaAnswer.trim()) !== expected) {
        newErrors.captcha =
          'Jawaban verifikasi matematika belum tepat. Silakan periksa kembali.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleNext() {
    if (!validateStep(currentStep)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setCompletedSteps((prev) =>
      prev.includes(currentStep) ? prev : [...prev, currentStep]
    );

    if (currentStep === 3 && form.f8_bekerja_saat_ini === false) {
      // Skip Logic Utama: langsung ke Step 5
      setCurrentStep(5);
    } else {
      const nextStep = Math.min(5, currentStep + 1);
      setCurrentStep(nextStep);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBack() {
    setErrors({});
    if (currentStep === 5 && form.f8_bekerja_saat_ini === false) {
      setCurrentStep(3);
    } else {
      setCurrentStep((prev) => Math.max(1, prev - 1));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');

    if (!validateStep(5)) {
      return;
    }

    setSubmitting(true);
    try {
      const nomorTiket = generateTicketNumber(form.tahun_lulus);
      const isWorking = form.f8_bekerja_saat_ini === true;
      const resolvedProdiId = form.prodi_id.startsWith('catalog-')
        ? null
        : form.prodi_id || null;

      const payload = {
        nomor_tiket: nomorTiket,
        fakultas: form.fakultas,
        prodi_id: resolvedProdiId,
        nama_prodi: form.nama_prodi,
        nama_responden: form.nama_responden.trim(),
        nim: form.nim.trim(),
        tahun_lulus: Number(form.tahun_lulus),
        no_hp: form.no_hp.trim(),
        email: form.email.trim(),
        f3_waktu_mulai_type: form.f3_waktu_mulai_type,
        f3_bulan:
          form.f3_waktu_mulai_type === 'tidak_mencari'
            ? 0
            : Number(form.f3_bulan || 0),
        f3b_sedang_mencari: form.f3b_sedang_mencari === true,
        f4_cara_mencari:
          form.f3b_sedang_mencari === true ? form.f4_cara_mencari : [],
        f4_lainnya_teks:
          form.f3b_sedang_mencari === true &&
          form.f4_cara_mencari.includes('Lainnya')
            ? form.f4_lainnya_teks.trim()
            : null,
        f5_masa_tunggu_sebelum:
          form.f5_masa_tunggu_sebelum === ''
            ? 0
            : Number(form.f5_masa_tunggu_sebelum),
        f5_masa_tunggu_sesudah:
          form.f5_masa_tunggu_sesudah === ''
            ? 0
            : Number(form.f5_masa_tunggu_sesudah),
        f6_jumlah_lamaran: Number(form.f6_jumlah_lamaran || 0),
        f7_jumlah_respons: Number(form.f7_jumlah_respons || 0),
        f7a_jumlah_wawancara: Number(form.f7a_jumlah_wawancara || 0),
        f8_bekerja_saat_ini: isWorking,
        f9_situasi_saat_ini: form.f9_situasi_saat_ini,
        f9_lainnya_teks: form.f9_situasi_saat_ini.includes('Lainnya')
          ? form.f9_lainnya_teks.trim()
          : null,
        f10_aktif_4_minggu: form.f10_aktif_4_minggu,
        f11_jenis_instansi: isWorking ? form.f11_jenis_instansi : null,
        f11_lainnya_teks:
          isWorking && form.f11_jenis_instansi === 'Lainnya'
            ? form.f11_lainnya_teks.trim()
            : null,
        f12_kbli: isWorking ? form.f12_kbli : null,
        f13_gaji_utama: isWorking ? form.f13_gaji_utama : null,
        f13_lembur_tips: isWorking ? form.f13_lembur_tips : null,
        f13_lainnya: isWorking ? form.f13_lainnya : null,
        f14_keeratan_bidang: isWorking ? form.f14_keeratan_bidang : null,
        f15_kesesuaian_pendidikan: isWorking
          ? form.f15_kesesuaian_pendidikan
          : null,
        f16_alasan_tidak_sesuai: isWorking ? form.f16_alasan_tidak_sesuai : [],
        f16_lainnya_teks:
          isWorking && form.f16_alasan_tidak_sesuai.includes('Lainnya')
            ? form.f16_lainnya_teks.trim()
            : null,
        f17a_kompetensi_lulusan: form.f17a_kompetensi_lulusan,
        f17b_kontribusi_pt: form.f17b_kontribusi_pt,
      };

      const { error } = await supabase.from('tracer_responses').insert([payload]);

      if (error) {
        throw new Error(error.message);
      }

      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setReceipt({
        nomor_tiket: nomorTiket,
        nama_responden: payload.nama_responden,
        nim: payload.nim,
        fakultas: payload.fakultas,
        nama_prodi: payload.nama_prodi,
        tahun_lulus: payload.tahun_lulus,
        email: payload.email,
        submitted_at: new Date().toISOString(),
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Gagal mengirim data ke server Supabase.';
      setSubmitError(
        `Terjadi kendala saat menyimpan data: ${msg}. Periksa koneksi internet Anda dan coba kembali.`
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleConfirmReset() {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setForm(
      createEmptyFormState(isFakultasMode ? settings.fakultas_aktif || '' : '')
    );
    setCurrentStep(1);
    setCompletedSteps([]);
    setErrors({});
    setSubmitError('');
    setCaptcha(generateCaptchaPair());
    setCaptchaAnswer('');
    setShowResetConfirm(false);
  }

  function handleStartNewAfterSubmit() {
    setReceipt(null);
    handleConfirmReset();
  }

  if (receipt) {
    return (
      <TicketReceipt
        receipt={receipt}
        onStartNew={handleStartNewAfterSubmit}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* LPMPP Real-time Search Grounding Utility */}
      <LpmppUpdatesPanel portalUrl={settings.portal_url} />

      {/* Stepper Card */}
      <div className="glass-panel rounded-2xl shadow-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 mb-4 border-b border-slate-200/80">
          <div>
            <p className="text-xs font-semibold text-[#0A2342] uppercase tracking-wider">
              Kuesioner Tracer Study Alumni
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Isian otomatis tersimpan sebagai draf di peramban Anda hingga
              dikirim.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-700 bg-slate-100 hover:bg-red-50 rounded-lg transition-colors self-start sm:self-auto whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Ulangi Isian
          </button>
        </div>

        <Stepper
          steps={visibleSteps}
          currentStepId={currentStep}
          completedStepIds={completedSteps}
          onStepClick={(stepId) => {
            setErrors({});
            setCurrentStep(stepId);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>

      {/* Main Form Card */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="glass-panel rounded-2xl shadow-xl p-5 sm:p-8 space-y-6"
      >
        {Object.keys(errors).length > 0 && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">
                Mohon lengkapi atau perbaiki isian yang ditandai merah sebelum
                melanjutkan.
              </p>
            </div>
          </div>
        )}

        {/* ================= STEP 1: IDENTITAS ================= */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-xl font-bold text-[#0A2342]">
                Bagian 1 · Identitas Alumni (F1 – F2d)
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Lengkapi data diri dan program studi kelulusan Anda di
                Universitas Pattimura.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* F1 PT */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Perguruan Tinggi (F1)
                </label>
                <input
                  type="text"
                  readOnly
                  value={NAMA_PT_RESMI}
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm font-semibold text-[#0A2342] cursor-not-allowed"
                />
              </div>

              {/* Fakultas */}
              <div>
                <label
                  htmlFor="fakultas"
                  className="block text-sm font-semibold text-slate-800 mb-1.5"
                >
                  Fakultas <span className="text-red-600">*</span>
                </label>
                {isFakultasMode ? (
                  <input
                    id="fakultas"
                    type="text"
                    readOnly
                    value={settings.fakultas_aktif || ''}
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 cursor-not-allowed"
                  />
                ) : (
                  <select
                    id="fakultas"
                    value={form.fakultas}
                    disabled={loadingConfig}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        fakultas: val,
                        prodi_id: '',
                        nama_prodi: '',
                      }));
                      clearFieldError('fakultas');
                      clearFieldError('prodi_id');
                    }}
                    className={`w-full min-h-[44px] px-3.5 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2342]/20 ${
                      errors.fakultas
                        ? 'border-red-500'
                        : 'border-slate-300 focus:border-[#0A2342]'
                    }`}
                  >
                    <option value="">
                      {loadingConfig
                        ? 'Memuat daftar fakultas...'
                        : '-- Pilih Fakultas --'}
                    </option>
                    {fakultasOptions.map((fak) => (
                      <option key={fak} value={fak}>
                        {fak}
                      </option>
                    ))}
                  </select>
                )}
                {errors.fakultas && (
                  <p className="mt-1 text-xs text-red-600">{errors.fakultas}</p>
                )}
              </div>

              {/* Program Studi */}
              <div>
                <label
                  htmlFor="prodi_id"
                  className="block text-sm font-semibold text-slate-800 mb-1.5"
                >
                  Program Studi <span className="text-red-600">*</span>
                </label>
                <select
                  id="prodi_id"
                  value={form.prodi_id}
                  disabled={!form.fakultas || loadingConfig}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const found = filteredProdiOptions.find(
                      (p) => p.id === selectedId
                    );
                    setForm((prev) => ({
                      ...prev,
                      prodi_id: selectedId,
                      nama_prodi: found
                        ? `${found.jenjang ? `${found.jenjang} ` : ''}${found.nama_prodi}`
                        : '',
                    }));
                    clearFieldError('prodi_id');
                  }}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2342]/20 disabled:bg-slate-100 disabled:text-slate-400 ${
                    errors.prodi_id
                      ? 'border-red-500'
                      : 'border-slate-300 focus:border-[#0A2342]'
                  }`}
                >
                  <option value="">
                    {form.fakultas
                      ? '-- Pilih Program Studi --'
                      : 'Pilih Fakultas terlebih dahulu'}
                  </option>
                  {filteredProdiOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.jenjang ? `${p.jenjang} - ` : ''}
                      {p.nama_prodi}
                    </option>
                  ))}
                </select>
                {errors.prodi_id && (
                  <p className="mt-1 text-xs text-red-600">{errors.prodi_id}</p>
                )}
              </div>

              {/* Nama Responden */}
              <div>
                <label
                  htmlFor="nama_responden"
                  className="block text-sm font-semibold text-slate-800 mb-1.5"
                >
                  Nama Lengkap Alumni <span className="text-red-600">*</span>
                </label>
                <input
                  id="nama_responden"
                  type="text"
                  value={form.nama_responden}
                  onChange={(e) =>
                    updateField('nama_responden', e.target.value)
                  }
                  placeholder="Contoh: Hendra Pattinama, S.Kom."
                  className={`w-full min-h-[44px] px-3.5 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2342]/20 ${
                    errors.nama_responden
                      ? 'border-red-500'
                      : 'border-slate-300 focus:border-[#0A2342]'
                  }`}
                />
                {errors.nama_responden && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.nama_responden}
                  </p>
                )}
              </div>

              {/* NIM */}
              <div>
                <label
                  htmlFor="nim"
                  className="block text-sm font-semibold text-slate-800 mb-1.5"
                >
                  Nomor Induk Mahasiswa (NIM){' '}
                  <span className="text-red-600">*</span>
                </label>
                <input
                  id="nim"
                  type="text"
                  value={form.nim}
                  onChange={(e) => updateField('nim', e.target.value)}
                  placeholder="Contoh: 201955201024"
                  className={`w-full min-h-[44px] px-3.5 py-2.5 bg-white border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0A2342]/20 ${
                    errors.nim
                      ? 'border-red-500'
                      : 'border-slate-300 focus:border-[#0A2342]'
                  }`}
                />
                {errors.nim && (
                  <p className="mt-1 text-xs text-red-600">{errors.nim}</p>
                )}
              </div>

              {/* Tahun Lulus */}
              <div>
                <label
                  htmlFor="tahun_lulus"
                  className="block text-sm font-semibold text-slate-800 mb-1.5"
                >
                  Tahun Lulus (Yudisium){' '}
                  <span className="text-red-600">*</span>
                </label>
                <select
                  id="tahun_lulus"
                  value={form.tahun_lulus}
                  onChange={(e) => updateField('tahun_lulus', e.target.value)}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 bg-white border rounded-lg text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0A2342]/20 ${
                    errors.tahun_lulus
                      ? 'border-red-500'
                      : 'border-slate-300 focus:border-[#0A2342]'
                  }`}
                >
                  <option value="">-- Pilih Tahun Lulus --</option>
                  {TAHUN_LULUS_OPTIONS.map((yr) => (
                    <option key={yr} value={String(yr)}>
                      {yr}
                    </option>
                  ))}
                </select>
                {errors.tahun_lulus && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.tahun_lulus}
                  </p>
                )}
              </div>

              {/* No HP */}
              <div>
                <label
                  htmlFor="no_hp"
                  className="block text-sm font-semibold text-slate-800 mb-1.5"
                >
                  Nomor Telepon / WhatsApp{' '}
                  <span className="text-red-600">*</span>
                </label>
                <input
                  id="no_hp"
                  type="tel"
                  value={form.no_hp}
                  onChange={(e) => updateField('no_hp', e.target.value)}
                  placeholder="Contoh: 08124700xxxx"
                  className={`w-full min-h-[44px] px-3.5 py-2.5 bg-white border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0A2342]/20 ${
                    errors.no_hp
                      ? 'border-red-500'
                      : 'border-slate-300 focus:border-[#0A2342]'
                  }`}
                />
                {errors.no_hp && (
                  <p className="mt-1 text-xs text-red-600">{errors.no_hp}</p>
                )}
              </div>

              {/* Email */}
              <div className="md:col-span-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-800 mb-1.5"
                >
                  Alamat Email Aktif <span className="text-red-600">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="nama.alumni@domain.com"
                  className={`w-full min-h-[44px] px-3.5 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2342]/20 ${
                    errors.email
                      ? 'border-red-500'
                      : 'border-slate-300 focus:border-[#0A2342]'
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: PENCARIAN KERJA (F3 - F7a) ================= */}
        {currentStep === 2 && (
          <div className="space-y-7">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-xl font-bold text-[#0A2342]">
                Bagian 2 · Pencarian Kerja & Masa Tunggu (F3 – F7a)
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Informasi waktu mulai mencari kerja, metode pencarian, dan
                intensitas lamaran kerja Anda.
              </p>
            </div>

            {/* F3 */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-800">
                F3. Kapan Anda mulai mencari pekerjaan? (Mohon pekerjaan sambilan
                tidak dimasukkan) <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: 'sebelum', label: 'Sebelum lulus' },
                  { value: 'sesudah', label: 'Sesudah lulus' },
                  {
                    value: 'tidak_mencari',
                    label: 'Saya tidak mencari kerja',
                  },
                ].map((opt) => {
                  const active = form.f3_waktu_mulai_type === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        updateField(
                          'f3_waktu_mulai_type',
                          opt.value as TracerFormState['f3_waktu_mulai_type']
                        );
                        if (opt.value === 'tidak_mencari') {
                          updateField('f3_bulan', '0');
                        }
                      }}
                      className={`min-h-[44px] px-4 py-2.5 rounded-lg border text-sm font-medium text-left transition-colors flex items-center justify-between ${
                        active
                          ? 'bg-[#0A2342] text-white border-[#0A2342]'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-[#0A2342]/50'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {active && <Check className="w-4 h-4 text-[#E8CF78]" />}
                    </button>
                  );
                })}
              </div>
              {errors.f3_waktu_mulai_type && (
                <p className="text-xs text-red-600">
                  {errors.f3_waktu_mulai_type}
                </p>
              )}

              {(form.f3_waktu_mulai_type === 'sebelum' ||
                form.f3_waktu_mulai_type === 'sesudah') && (
                <div className="pt-2 max-w-xs">
                  <label
                    htmlFor="f3_bulan"
                    className="block text-xs font-medium text-slate-600 mb-1"
                  >
                    Kira-kira berapa bulan {form.f3_waktu_mulai_type} lulus?
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="f3_bulan"
                      type="number"
                      min={0}
                      max={60}
                      value={form.f3_bulan}
                      onChange={(e) => updateField('f3_bulan', e.target.value)}
                      placeholder="0"
                      className={`w-28 min-h-[42px] px-3 py-2 bg-white border rounded-lg text-sm font-mono tabular-nums focus:outline-none focus:border-[#0A2342] ${
                        errors.f3_bulan ? 'border-red-500' : 'border-slate-300'
                      }`}
                    />
                    <span className="text-sm text-slate-600">bulan</span>
                  </div>
                  {errors.f3_bulan && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.f3_bulan}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* F3b */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="block text-sm font-semibold text-slate-800">
                F3b. Apakah Anda sementara mencari kerja atau pernah mencari
                kerja? <span className="text-red-600">*</span>
              </label>
              <div className="flex flex-wrap gap-3">
                {[
                  { val: true, label: 'Ya' },
                  { val: false, label: 'Tidak' },
                ].map((opt) => {
                  const active = form.f3b_sedang_mencari === opt.val;
                  return (
                    <button
                      key={String(opt.val)}
                      type="button"
                      onClick={() => {
                        updateField('f3b_sedang_mencari', opt.val);
                        if (!opt.val) {
                          updateField('f4_cara_mencari', []);
                          updateField('f4_lainnya_teks', '');
                        }
                      }}
                      className={`min-h-[44px] px-6 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                        active
                          ? 'bg-[#0A2342] text-white border-[#0A2342]'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-[#0A2342]/50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {errors.f3b_sedang_mencari && (
                <p className="text-xs text-red-600">
                  {errors.f3b_sedang_mencari}
                </p>
              )}
            </div>

            {/* F4 (Skipped when F3b === false) */}
            {form.f3b_sedang_mencari === true && (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <label className="block text-sm font-semibold text-slate-800">
                  F4. Bagaimana Anda mencari pekerjaan tersebut? (Jawaban bisa
                  lebih dari satu) <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {F4_CARA_MENCARI.map((item) => {
                    const checked = form.f4_cara_mencari.includes(item.label);
                    return (
                      <label
                        key={item.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors text-sm ${
                          checked
                            ? 'bg-[#0A2342]/5 border-[#0A2342] text-slate-900 font-medium'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            toggleMultiCheck('f4_cara_mencari', item.label)
                          }
                          className="mt-0.5 w-4 h-4 accent-[#0A2342] rounded shrink-0"
                        />
                        <span>
                          <span className="font-mono text-xs text-slate-400 mr-1.5 tabular-nums">
                            {String(item.id).padStart(2, '0')}.
                          </span>
                          {item.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {form.f4_cara_mencari.includes('Lainnya') && (
                  <div className="pt-1">
                    <input
                      type="text"
                      value={form.f4_lainnya_teks}
                      onChange={(e) =>
                        updateField('f4_lainnya_teks', e.target.value)
                      }
                      placeholder="Tuliskan cara mencari kerja lainnya..."
                      className={`w-full min-h-[42px] px-3.5 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:border-[#0A2342] ${
                        errors.f4_lainnya_teks
                          ? 'border-red-500'
                          : 'border-slate-300'
                      }`}
                    />
                    {errors.f4_lainnya_teks && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.f4_lainnya_teks}
                      </p>
                    )}
                  </div>
                )}
                {errors.f4_cara_mencari && (
                  <p className="text-xs text-red-600">
                    {errors.f4_cara_mencari}
                  </p>
                )}
              </div>
            )}

            {/* F5 */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="block text-sm font-semibold text-slate-800">
                F5. Berapa bulan waktu yang dihabiskan (sebelum dan sesudah
                kelulusan) untuk memperoleh pekerjaan pertama?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="f5_sebelum"
                    className="block text-xs font-medium text-slate-600 mb-1"
                  >
                    Kira-kira ... bulan sebelum lulus ujian
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="f5_sebelum"
                      type="number"
                      min={0}
                      max={60}
                      value={form.f5_masa_tunggu_sebelum}
                      onChange={(e) =>
                        updateField('f5_masa_tunggu_sebelum', e.target.value)
                      }
                      placeholder="0"
                      className="w-28 min-h-[42px] px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono tabular-nums focus:outline-none focus:border-[#0A2342]"
                    />
                    <span className="text-sm text-slate-600">bulan</span>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="f5_sesudah"
                    className="block text-xs font-medium text-slate-600 mb-1"
                  >
                    Kira-kira ... bulan setelah lulus ujian
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="f5_sesudah"
                      type="number"
                      min={0}
                      max={60}
                      value={form.f5_masa_tunggu_sesudah}
                      onChange={(e) =>
                        updateField('f5_masa_tunggu_sesudah', e.target.value)
                      }
                      placeholder="0"
                      className="w-28 min-h-[42px] px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono tabular-nums focus:outline-none focus:border-[#0A2342]"
                    />
                    <span className="text-sm text-slate-600">bulan</span>
                  </div>
                </div>
              </div>
            </div>

            {/* F6, F7, F7a */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <div>
                <label
                  htmlFor="f6_lamaran"
                  className="block text-sm font-semibold text-slate-800 mb-1.5"
                >
                  F6. Jumlah lamaran kerja yang dikirim{' '}
                  <span className="text-red-600">*</span>
                </label>
                <input
                  id="f6_lamaran"
                  type="number"
                  min={0}
                  value={form.f6_jumlah_lamaran}
                  onChange={(e) =>
                    updateField('f6_jumlah_lamaran', e.target.value)
                  }
                  placeholder="0"
                  className={`w-full min-h-[44px] px-3.5 py-2 bg-white border rounded-lg text-sm font-mono tabular-nums focus:outline-none focus:border-[#0A2342] ${
                    errors.f6_jumlah_lamaran
                      ? 'border-red-500'
                      : 'border-slate-300'
                  }`}
                />
                {errors.f6_jumlah_lamaran && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.f6_jumlah_lamaran}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="f7_respons"
                  className="block text-sm font-semibold text-slate-800 mb-1.5"
                >
                  F7. Jumlah perusahaan yang merespons{' '}
                  <span className="text-red-600">*</span>
                </label>
                <input
                  id="f7_respons"
                  type="number"
                  min={0}
                  value={form.f7_jumlah_respons}
                  onChange={(e) =>
                    updateField('f7_jumlah_respons', e.target.value)
                  }
                  placeholder="0"
                  className={`w-full min-h-[44px] px-3.5 py-2 bg-white border rounded-lg text-sm font-mono tabular-nums focus:outline-none focus:border-[#0A2342] ${
                    errors.f7_jumlah_respons
                      ? 'border-red-500'
                      : 'border-slate-300'
                  }`}
                />
                {errors.f7_jumlah_respons && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.f7_jumlah_respons}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="f7a_wawancara"
                  className="block text-sm font-semibold text-slate-800 mb-1.5"
                >
                  F7a. Jumlah undangan wawancara{' '}
                  <span className="text-red-600">*</span>
                </label>
                <input
                  id="f7a_wawancara"
                  type="number"
                  min={0}
                  value={form.f7a_jumlah_wawancara}
                  onChange={(e) =>
                    updateField('f7a_jumlah_wawancara', e.target.value)
                  }
                  placeholder="0"
                  className={`w-full min-h-[44px] px-3.5 py-2 bg-white border rounded-lg text-sm font-mono tabular-nums focus:outline-none focus:border-[#0A2342] ${
                    errors.f7a_jumlah_wawancara
                      ? 'border-red-500'
                      : 'border-slate-300'
                  }`}
                />
                {errors.f7a_jumlah_wawancara && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.f7a_jumlah_wawancara}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: STATUS & SITUASI SAAT INI (F8 - F10) ================= */}
        {currentStep === 3 && (
          <div className="space-y-7">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-xl font-bold text-[#0A2342]">
                Bagian 3 · Status & Situasi Saat Ini (F8 – F10)
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Status pekerjaan Anda saat ini menentukan alur pertanyaan
                selanjutnya.
              </p>
            </div>

            {/* F8 */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-800">
                F8. Apakah Anda bekerja saat ini (termasuk kerja sambilan dan
                wirausaha)? <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                {[
                  {
                    val: true,
                    title: 'Ya, saya bekerja / wirausaha',
                    desc: 'Lanjut ke bagian detail pekerjaan (F11 – F16)',
                  },
                  {
                    val: false,
                    title: 'Tidak bekerja saat ini',
                    desc: 'Langsung menuju penilaian kompetensi (F17a – F17b)',
                  },
                ].map((opt) => {
                  const active = form.f8_bekerja_saat_ini === opt.val;
                  return (
                    <button
                      key={String(opt.val)}
                      type="button"
                      onClick={() => updateField('f8_bekerja_saat_ini', opt.val)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        active
                          ? 'bg-[#0A2342] text-white border-[#0A2342] shadow-md'
                          : 'bg-white text-slate-800 border-slate-300 hover:border-[#0A2342]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold">
                          {opt.title}
                        </span>
                        {active && (
                          <Check className="w-4 h-4 text-[#E8CF78] shrink-0" />
                        )}
                      </div>
                      <p
                        className={`text-xs mt-1 ${
                          active ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {opt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
              {errors.f8_bekerja_saat_ini && (
                <p className="text-xs text-red-600">
                  {errors.f8_bekerja_saat_ini}
                </p>
              )}
            </div>

            {/* F9 */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="block text-sm font-semibold text-slate-800">
                F9. Bagaimana Anda menggambarkan situasi Anda saat ini? (Jawaban
                bisa lebih dari satu) <span className="text-red-600">*</span>
              </label>
              <div className="space-y-2.5">
                {F9_SITUASI_SAAT_INI.map((item) => {
                  const checked = form.f9_situasi_saat_ini.includes(item.label);
                  return (
                    <label
                      key={item.id}
                      className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors text-sm ${
                        checked
                          ? 'bg-[#0A2342]/5 border-[#0A2342] text-slate-900 font-medium'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          toggleMultiCheck('f9_situasi_saat_ini', item.label)
                        }
                        className="mt-0.5 w-4 h-4 accent-[#0A2342] rounded shrink-0"
                      />
                      <span>{item.label}</span>
                    </label>
                  );
                })}
              </div>
              {form.f9_situasi_saat_ini.includes('Lainnya') && (
                <div className="pt-1">
                  <input
                    type="text"
                    value={form.f9_lainnya_teks}
                    onChange={(e) =>
                      updateField('f9_lainnya_teks', e.target.value)
                    }
                    placeholder="Tuliskan situasi Anda saat ini..."
                    className={`w-full min-h-[42px] px-3.5 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:border-[#0A2342] ${
                      errors.f9_lainnya_teks
                        ? 'border-red-500'
                        : 'border-slate-300'
                    }`}
                  />
                  {errors.f9_lainnya_teks && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.f9_lainnya_teks}
                    </p>
                  )}
                </div>
              )}
              {errors.f9_situasi_saat_ini && (
                <p className="text-xs text-red-600">
                  {errors.f9_situasi_saat_ini}
                </p>
              )}
            </div>

            {/* F10 */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="block text-sm font-semibold text-slate-800">
                F10. Apakah Anda aktif mencari pekerjaan dalam 4 minggu
                terakhir? <span className="text-red-600">*</span>
              </label>
              <div className="space-y-2">
                {F10_AKTIF_4_MINGGU.map((opt) => {
                  const checked = form.f10_aktif_4_minggu === opt;
                  return (
                    <label
                      key={opt}
                      className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors text-sm ${
                        checked
                          ? 'bg-[#0A2342]/5 border-[#0A2342] text-slate-900 font-medium'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="f10_aktif_4_minggu"
                        checked={checked}
                        onChange={() => updateField('f10_aktif_4_minggu', opt)}
                        className="w-4 h-4 accent-[#0A2342] shrink-0"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
              {errors.f10_aktif_4_minggu && (
                <p className="text-xs text-red-600">
                  {errors.f10_aktif_4_minggu}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ================= STEP 4: DETAIL PEKERJAAN (F11 - F16) ================= */}
        {currentStep === 4 && form.f8_bekerja_saat_ini === true && (
          <div className="space-y-7">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-xl font-bold text-[#0A2342]">
                Bagian 4 · Detail Pekerjaan & Keselarasan (F11 – F16)
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Informasi jenis instansi, sektor KBLI, pendapatan bulanan, serta
                kesesuaian pekerjaan dengan bidang studi Anda.
              </p>
            </div>

            {/* F11 */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-800">
                F11. Apa jenis perusahaan/instansi/institusi tempat Anda bekerja
                sekarang? <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {F11_JENIS_INSTANSI.map((opt) => {
                  const checked = form.f11_jenis_instansi === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors text-sm ${
                        checked
                          ? 'bg-[#0A2342]/5 border-[#0A2342] text-slate-900 font-medium'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="f11_jenis_instansi"
                        checked={checked}
                        onChange={() =>
                          updateField('f11_jenis_instansi', opt.value)
                        }
                        className="w-4 h-4 accent-[#0A2342] shrink-0"
                      />
                      <span>{opt.label}</span>
                    </label>
                  );
                })}
              </div>
              {form.f11_jenis_instansi === 'Lainnya' && (
                <input
                  type="text"
                  value={form.f11_lainnya_teks}
                  onChange={(e) =>
                    updateField('f11_lainnya_teks', e.target.value)
                  }
                  placeholder="Tuliskan jenis instansi tempat bekerja..."
                  className={`w-full min-h-[42px] px-3.5 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:border-[#0A2342] ${
                    errors.f11_lainnya_teks
                      ? 'border-red-500'
                      : 'border-slate-300'
                  }`}
                />
              )}
              {errors.f11_jenis_instansi && (
                <p className="text-xs text-red-600">
                  {errors.f11_jenis_instansi}
                </p>
              )}
              {errors.f11_lainnya_teks && (
                <p className="text-xs text-red-600">
                  {errors.f11_lainnya_teks}
                </p>
              )}
            </div>

            {/* F12 Searchable KBLI */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <label
                htmlFor="f12_kbli"
                className="block text-sm font-semibold text-slate-800"
              >
                F12. Kategori Bidang Usaha / Sektor Pekerjaan (KBLI A–U){' '}
                <span className="text-red-600">*</span>
              </label>
              <SearchableSelect
                id="f12_kbli"
                options={kbliOptions}
                value={form.f12_kbli}
                onChange={(val) => updateField('f12_kbli', val)}
                placeholder="Pilih atau cari kategori bidang usaha (KBLI)..."
                searchPlaceholder="Cari kode atau nama sektor (mis. Pendidikan, Informasi)..."
                hasError={Boolean(errors.f12_kbli)}
              />
              {errors.f12_kbli && (
                <p className="text-xs text-red-600">{errors.f12_kbli}</p>
              )}
            </div>

            {/* F13 Pendapatan */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-sm font-semibold text-slate-800">
                  F13. Kira-kira berapa pendapatan Anda setiap bulannya?{' '}
                  <span className="text-red-600">*</span>
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  Referensi UMP Provinsi Maluku:{' '}
                  <span className="font-mono font-semibold text-slate-700">
                    {formatRupiah(settings.ump_maluku)}
                  </span>{' '}
                  (Ambang IKU 1 Layak ≥ 1,2× UMP:{' '}
                  <span className="font-mono font-semibold text-[#0A2342]">
                    {formatRupiah(Math.round((settings.ump_maluku || 3141699) * 1.2))}
                  </span>
                  )
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="f13_utama"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Dari Pekerjaan Utama (Rp){' '}
                    <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">
                      Rp
                    </span>
                    <input
                      id="f13_utama"
                      type="text"
                      inputMode="numeric"
                      value={formatThousandSeparator(form.f13_gaji_utama || '')}
                      onChange={(e) =>
                        updateField(
                          'f13_gaji_utama',
                          parseThousandNumber(e.target.value)
                        )
                      }
                      placeholder="0"
                      className={`w-full min-h-[44px] pl-9 pr-3 py-2 bg-white border rounded-lg text-sm font-mono tabular-nums focus:outline-none focus:border-[#0A2342] ${
                        errors.f13_gaji_utama
                          ? 'border-red-500'
                          : 'border-slate-300'
                      }`}
                    />
                  </div>
                  {errors.f13_gaji_utama && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.f13_gaji_utama}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="f13_lembur"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Dari Lembur &amp; Tips (Rp)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">
                      Rp
                    </span>
                    <input
                      id="f13_lembur"
                      type="text"
                      inputMode="numeric"
                      value={formatThousandSeparator(form.f13_lembur_tips || '')}
                      onChange={(e) =>
                        updateField(
                          'f13_lembur_tips',
                          parseThousandNumber(e.target.value)
                        )
                      }
                      placeholder="0"
                      className="w-full min-h-[44px] pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono tabular-nums focus:outline-none focus:border-[#0A2342]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="f13_lainnya"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Dari Pekerjaan Lainnya (Rp)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">
                      Rp
                    </span>
                    <input
                      id="f13_lainnya"
                      type="text"
                      inputMode="numeric"
                      value={formatThousandSeparator(form.f13_lainnya || '')}
                      onChange={(e) =>
                        updateField(
                          'f13_lainnya',
                          parseThousandNumber(e.target.value)
                        )
                      }
                      placeholder="0"
                      className="w-full min-h-[44px] pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono tabular-nums focus:outline-none focus:border-[#0A2342]"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0A2342]/5 border border-[#0A2342]/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-xs font-semibold text-[#0A2342] uppercase tracking-wider">
                  Total Estimasi Pendapatan Bulanan (Otomatis)
                </span>
                <span className="text-lg font-mono font-bold text-[#0A2342] tabular-nums">
                  {formatRupiah(totalPendapatan)}
                </span>
              </div>
            </div>

            {/* F14 */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="block text-sm font-semibold text-slate-800">
                F14. Seberapa erat hubungan antara bidang studi dengan pekerjaan
                Anda? <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {F14_KEERATAN_BIDANG.map((opt) => {
                  const active = form.f14_keeratan_bidang === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => updateField('f14_keeratan_bidang', opt)}
                      className={`min-h-[44px] px-3 py-2 rounded-lg border text-xs sm:text-sm font-medium transition-colors ${
                        active
                          ? 'bg-[#0A2342] text-white border-[#0A2342]'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-[#0A2342]/50'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {errors.f14_keeratan_bidang && (
                <p className="text-xs text-red-600">
                  {errors.f14_keeratan_bidang}
                </p>
              )}
            </div>

            {/* F15 */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="block text-sm font-semibold text-slate-800">
                F15. Tingkat pendidikan apa yang paling tepat/sesuai untuk
                pekerjaan Anda saat ini? <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {F15_KESESUAIAN_PENDIDIKAN.map((opt) => {
                  const active = form.f15_kesesuaian_pendidikan === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        updateField('f15_kesesuaian_pendidikan', opt)
                      }
                      className={`min-h-[44px] px-3 py-2.5 rounded-lg border text-xs sm:text-sm font-medium transition-colors ${
                        active
                          ? 'bg-[#0A2342] text-white border-[#0A2342]'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-[#0A2342]/50'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {errors.f15_kesesuaian_pendidikan && (
                <p className="text-xs text-red-600">
                  {errors.f15_kesesuaian_pendidikan}
                </p>
              )}
            </div>

            {/* F16 */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="block text-sm font-semibold text-slate-800">
                F16. Jika menurut Anda pekerjaan Anda saat ini tidak sesuai
                dengan pendidikan Anda, mengapa Anda mengambilnya? (Jawaban bisa
                lebih dari satu) <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {F16_ALASAN_TIDAK_SESUAI.map((item) => {
                  const checked = form.f16_alasan_tidak_sesuai.includes(
                    item.label
                  );
                  return (
                    <label
                      key={item.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors text-sm ${
                        checked
                          ? 'bg-[#0A2342]/5 border-[#0A2342] text-slate-900 font-medium'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          toggleMultiCheck('f16_alasan_tidak_sesuai', item.label)
                        }
                        className="mt-0.5 w-4 h-4 accent-[#0A2342] rounded shrink-0"
                      />
                      <span>
                        <span className="font-mono text-xs text-slate-400 mr-1.5 tabular-nums">
                          {String(item.id).padStart(2, '0')}.
                        </span>
                        {item.label}
                      </span>
                    </label>
                  );
                })}
              </div>
              {form.f16_alasan_tidak_sesuai.includes('Lainnya') && (
                <div className="pt-1">
                  <input
                    type="text"
                    value={form.f16_lainnya_teks}
                    onChange={(e) =>
                      updateField('f16_lainnya_teks', e.target.value)
                    }
                    placeholder="Tuliskan alasan lainnya..."
                    className={`w-full min-h-[42px] px-3.5 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:border-[#0A2342] ${
                      errors.f16_lainnya_teks
                        ? 'border-red-500'
                        : 'border-slate-300'
                    }`}
                  />
                  {errors.f16_lainnya_teks && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.f16_lainnya_teks}
                    </p>
                  )}
                </div>
              )}
              {errors.f16_alasan_tidak_sesuai && (
                <p className="text-xs text-red-600">
                  {errors.f16_alasan_tidak_sesuai}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ================= STEP 5: MATRIKS KOMPETENSI & CAPTCHA ================= */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#0A2342]">
                  Bagian 5 · Matriks Kompetensi (F17a &amp; F17b)
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Bandingkan tingkat kompetensi yang Anda kuasai saat lulus
                  (F17a) dengan kontribusi pembelajaran di Universitas Pattimura
                  (F17b).
                </p>
              </div>
              <div className="px-3.5 py-2 rounded-lg bg-[#0A2342] text-white text-xs font-semibold shrink-0 tabular-nums self-start sm:self-auto">
                Progres: {kompetensiFilledCount}/{F17_KOMPETENSI.length} terisi
              </div>
            </div>

            {/* Scale Legend */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-700">
              <span className="font-semibold text-[#0A2342]">
                Keterangan Skala:
              </span>
              {SKALA_KOMPETENSI_LABELS.map((s) => (
                <span key={s.value} className="tabular-nums">
                  <strong className="font-mono text-[#0A2342]">{s.value}</strong>{' '}
                  = {s.label}
                </span>
              ))}
            </div>

            {errors.f17_matrix && (
              <p className="text-xs font-medium text-red-600">
                {errors.f17_matrix}
              </p>
            )}

            {/* Desktop Matrix Table + Mobile Stacked Rows */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="hidden lg:grid grid-cols-12 bg-[#0A2342] text-white text-xs font-semibold">
                <div className="col-span-4 px-4 py-3">
                  Butir Kompetensi (29 Aspek DIKTI)
                </div>
                <div className="col-span-4 px-4 py-3 text-center border-l border-white/15">
                  F17a · Penguasaan Lulusan (1–5)
                </div>
                <div className="col-span-4 px-4 py-3 text-center border-l border-white/15">
                  F17b · Kontribusi Perguruan Tinggi (1–5)
                </div>
              </div>

              <div className="divide-y divide-slate-200 bg-white">
                {F17_KOMPETENSI.map((item) => {
                  const valA = form.f17a_kompetensi_lulusan[item.key];
                  const valB = form.f17b_kontribusi_pt[item.key];
                  const isMissing = !valA || !valB;

                  return (
                    <div
                      key={item.key}
                      className={`grid grid-cols-1 lg:grid-cols-12 items-center gap-3 p-4 lg:p-0 ${
                        isMissing && errors.f17_matrix
                          ? 'bg-red-50/50'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      {/* Competency Title */}
                      <div className="lg:col-span-4 lg:px-4 lg:py-3 text-sm text-slate-800">
                        <span className="font-mono text-xs font-semibold text-slate-400 mr-2 tabular-nums">
                          {String(item.no).padStart(2, '0')}
                        </span>
                        <span className="font-medium">{item.label}</span>
                      </div>

                      {/* F17a */}
                      <div className="lg:col-span-4 lg:px-3 lg:py-2.5 lg:border-l border-slate-200">
                        <p className="lg:hidden text-xs font-semibold text-slate-500 mb-1.5">
                          F17a · Penguasaan Lulusan:
                        </p>
                        <div className="grid grid-cols-5 gap-1.5">
                          {[1, 2, 3, 4, 5].map((score) => {
                            const selected = valA === score;
                            return (
                              <button
                                key={score}
                                type="button"
                                onClick={() => {
                                  setForm((prev) => ({
                                    ...prev,
                                    f17a_kompetensi_lulusan: {
                                      ...prev.f17a_kompetensi_lulusan,
                                      [item.key]: score,
                                    },
                                  }));
                                  clearFieldError('f17_matrix');
                                }}
                                aria-label={`${item.label} F17a skala ${score}`}
                                className={`min-h-[38px] rounded-lg text-xs font-mono font-semibold border transition-colors tabular-nums ${
                                  selected
                                    ? 'bg-[#0A2342] text-[#E8CF78] border-[#0A2342]'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-[#0A2342]/40'
                                }`}
                              >
                                {score}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* F17b */}
                      <div className="lg:col-span-4 lg:px-3 lg:py-2.5 lg:border-l border-slate-200">
                        <p className="lg:hidden text-xs font-semibold text-slate-500 mb-1.5">
                          F17b · Kontribusi Perguruan Tinggi:
                        </p>
                        <div className="grid grid-cols-5 gap-1.5">
                          {[1, 2, 3, 4, 5].map((score) => {
                            const selected = valB === score;
                            return (
                              <button
                                key={score}
                                type="button"
                                onClick={() => {
                                  setForm((prev) => ({
                                    ...prev,
                                    f17b_kontribusi_pt: {
                                      ...prev.f17b_kontribusi_pt,
                                      [item.key]: score,
                                    },
                                  }));
                                  clearFieldError('f17_matrix');
                                }}
                                aria-label={`${item.label} F17b skala ${score}`}
                                className={`min-h-[38px] rounded-lg text-xs font-mono font-semibold border transition-colors tabular-nums ${
                                  selected
                                    ? 'bg-[#D4AF37] text-[#0A2342] border-[#D4AF37]'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-[#D4AF37]'
                                }`}
                              >
                                {score}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Math Captcha */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-[#0A2342]">
                    Verifikasi Pengiriman (Captcha Matematika)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Jawab perhitungan sederhana berikut sebelum mengirimkan data
                    borang.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCaptcha(generateCaptchaPair());
                    setCaptchaAnswer('');
                    clearFieldError('captcha');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-[#0A2342] bg-white border border-slate-300 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Ganti Soal
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="px-4 py-2.5 rounded-lg bg-[#0A2342] text-white font-mono text-base font-bold tabular-nums select-none">
                  {captcha.a} + {captcha.b} = ?
                </div>
                <input
                  type="number"
                  value={captchaAnswer}
                  onChange={(e) => {
                    setCaptchaAnswer(e.target.value);
                    clearFieldError('captcha');
                  }}
                  placeholder="Hasil penjumlahan"
                  className={`w-44 min-h-[44px] px-3.5 py-2 bg-white border rounded-lg text-sm font-mono tabular-nums focus:outline-none focus:border-[#0A2342] ${
                    errors.captcha ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
              </div>
              {errors.captcha && (
                <p className="text-xs text-red-600">{errors.captcha}</p>
              )}
            </div>

            {submitError && (
              <div
                role="alert"
                className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800"
              >
                {submitError}
              </div>
            )}
          </div>
        )}

        {/* Navigation Footer */}
        <div className="pt-6 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4" />
              Sebelumnya
            </button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0A2342] hover:bg-[#143763] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm whitespace-nowrap"
            >
              <span>Selanjutnya</span>
              <ArrowRight className="w-4 h-4 text-[#E8CF78]" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#D4AF37] hover:bg-[#c39e2b] text-[#0A2342] text-sm font-bold rounded-lg transition-colors shadow-sm disabled:opacity-60 whitespace-nowrap"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Mengirim Data...' : 'Kirim Borang Tracer Study'}
            </button>
          )}
        </div>
      </form>

      <ConfirmModal
        open={showResetConfirm}
        title="Ulangi Pengisian Borang?"
        description="Seluruh draf jawaban yang tersimpan di peramban akan dihapus dan Anda akan kembali ke Langkah 1."
        confirmLabel="Ya, Ulangi"
        cancelLabel="Batal"
        destructive
        onConfirm={handleConfirmReset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}
