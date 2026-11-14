import { CheckCircle2, Printer, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { formatDateTimeID } from '../../utils/formatters';
import { UnpattiLogo } from '../UnpattiLogo';
import { ConfettiCelebration } from './ConfettiCelebration';

export interface SubmittedReceiptData {
  nomor_tiket: string;
  nama_responden: string;
  nim: string;
  fakultas: string;
  nama_prodi: string;
  tahun_lulus: number;
  email: string;
  submitted_at: string;
}

interface TicketReceiptProps {
  receipt: SubmittedReceiptData;
  onStartNew: () => void;
}

export function TicketReceipt({ receipt, onStartNew }: TicketReceiptProps) {
  return (
    <>
      <ConfettiCelebration />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel print-card rounded-2xl shadow-2xl overflow-hidden max-w-2xl mx-auto"
      >
        <div className="bg-[#0A2342] text-white px-6 py-6 sm:px-8 flex items-center justify-between gap-4 border-b border-[#D4AF37]/40">
          <div className="flex items-center gap-4">
            <UnpattiLogo className="w-12 h-12" />
            <div>
              <p className="text-xs font-semibold tracking-wider text-[#E8CF78] uppercase">
                Universitas Pattimura · SIMPATTI
              </p>
              <h2 className="text-xl font-bold text-white">
                Bukti Pengisian Tracer Study
              </h2>
            </div>
          </div>
          <CheckCircle2 className="w-9 h-9 text-emerald-400 shrink-0" />
        </div>

      <div className="p-6 sm:p-8 space-y-6">
        <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-950">
          <p className="text-sm font-semibold">
            Terima kasih! Data Tracer Study Anda telah berhasil direkam ke basis
            data Universitas Pattimura.
          </p>
          <p className="text-xs text-emerald-800 mt-1">
            Simpan atau cetak bukti ini sebagai dokumen verifikasi keikutsertaan
            Tracer Study alumni.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-center">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Nomor Tiket Resmi
          </p>
          <p className="mt-1.5 text-xl sm:text-2xl font-mono font-bold text-[#0A2342] tracking-wide select-all">
            {receipt.nomor_tiket}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            Diterbitkan pada {formatDateTimeID(receipt.submitted_at)}
          </p>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border-t border-slate-200 pt-5">
          <div>
            <dt className="text-xs text-slate-500">Nama Alumni</dt>
            <dd className="font-semibold text-slate-900 mt-0.5">
              {receipt.nama_responden}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">NIM</dt>
            <dd className="font-mono font-semibold text-slate-900 mt-0.5 tabular-nums">
              {receipt.nim}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Fakultas</dt>
            <dd className="font-medium text-slate-900 mt-0.5">
              {receipt.fakultas}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Program Studi</dt>
            <dd className="font-medium text-slate-900 mt-0.5">
              {receipt.nama_prodi}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Tahun Lulus</dt>
            <dd className="font-mono font-semibold text-slate-900 mt-0.5 tabular-nums">
              {receipt.tahun_lulus}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Email Kontak</dt>
            <dd className="font-medium text-slate-900 mt-0.5 truncate">
              {receipt.email}
            </dd>
          </div>
        </dl>

        <div className="no-print pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0A2342] hover:bg-[#143763] text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            <Printer className="w-4 h-4 text-[#E8CF78]" />
            Cetak Bukti Pengisian
          </button>

          <button
            type="button"
            onClick={onStartNew}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" />
            Isi Kuesioner Alumni Lain
          </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
