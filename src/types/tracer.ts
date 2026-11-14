export type AppMode = 'UNIVERSITAS' | 'FAKULTAS';

export interface AppSettings {
  id: number;
  mode_aplikasi: AppMode;
  fakultas_aktif: string | null;
  judul_header: string;
  subjudul_header: string;
  ump_maluku: number;
  portal_url: string;
}

export interface MasterProdi {
  id: string;
  kode_fakultas: string;
  nama_fakultas: string;
  kode_prodi: string;
  nama_prodi: string;
  jenjang: string;
  is_active: boolean;
}

export type F3WaktuMulaiType = 'sebelum' | 'sesudah' | 'tidak_mencari';

export type KompetensiMap = Record<string, number>;

export interface TracerResponseRecord {
  id: string;
  nomor_tiket: string;
  created_at: string;
  fakultas: string;
  prodi_id: string;
  nama_prodi: string;
  nama_responden: string;
  nim: string;
  tahun_lulus: number;
  no_hp: string;
  email: string;
  f3_waktu_mulai_type: F3WaktuMulaiType;
  f3_bulan: number | null;
  f3b_sedang_mencari: boolean;
  f4_cara_mencari: string[];
  f4_lainnya_teks: string | null;
  f5_masa_tunggu_sebelum: number | null;
  f5_masa_tunggu_sesudah: number | null;
  f6_jumlah_lamaran: number | null;
  f7_jumlah_respons: number | null;
  f7a_jumlah_wawancara: number | null;
  f8_bekerja_saat_ini: boolean;
  f9_situasi_saat_ini: string[];
  f9_lainnya_teks: string | null;
  f10_aktif_4_minggu: string | null;
  f11_jenis_instansi: string | null;
  f11_lainnya_teks: string | null;
  f12_kbli: string | null;
  f13_gaji_utama: number | null;
  f13_lembur_tips: number | null;
  f13_lainnya: number | null;
  f13_total_pendapatan: number | null;
  f14_keeratan_bidang: string | null;
  f15_kesesuaian_pendidikan: string | null;
  f16_alasan_tidak_sesuai: string[];
  f16_lainnya_teks: string | null;
  f17a_kompetensi_lulusan: KompetensiMap;
  f17b_kontribusi_pt: KompetensiMap;
}

export interface TracerFormState {
  fakultas: string;
  prodi_id: string;
  nama_prodi: string;
  nama_responden: string;
  nim: string;
  tahun_lulus: string;
  no_hp: string;
  email: string;
  f3_waktu_mulai_type: F3WaktuMulaiType | '';
  f3_bulan: string;
  f3b_sedang_mencari: boolean | null;
  f4_cara_mencari: string[];
  f4_lainnya_teks: string;
  f5_masa_tunggu_sebelum: string;
  f5_masa_tunggu_sesudah: string;
  f6_jumlah_lamaran: string;
  f7_jumlah_respons: string;
  f7a_jumlah_wawancara: string;
  f8_bekerja_saat_ini: boolean | null;
  f9_situasi_saat_ini: string[];
  f9_lainnya_teks: string;
  f10_aktif_4_minggu: string;
  f11_jenis_instansi: string;
  f11_lainnya_teks: string;
  f12_kbli: string;
  f13_gaji_utama: number;
  f13_lembur_tips: number;
  f13_lainnya: number;
  f14_keeratan_bidang: string;
  f15_kesesuaian_pendidikan: string;
  f16_alasan_tidak_sesuai: string[];
  f16_lainnya_teks: string;
  f17a_kompetensi_lulusan: KompetensiMap;
  f17b_kontribusi_pt: KompetensiMap;
}

export type AuditKategori = 'KTS' | 'OB' | 'OF';
export type AuditStatus = 'Open' | 'In Progress' | 'Closed';

export interface TracerAuditPlorca {
  id: string;
  created_at: string;
  fakultas: string;
  prodi_id: string | null;
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

export interface StatistikIKU1Row {
  fakultas: string;
  prodi_id: string;
  nama_prodi: string;
  tahun_lulus: number;
  total_responden: number;
  jumlah_bekerja: number;
  jumlah_wiraswasta: number;
  jumlah_lanjut_studi: number;
  jumlah_bekerja_layak_iku1: number;
  rerata_masa_tunggu_bulan: number | null;
  rerata_pendapatan: number | null;
}
