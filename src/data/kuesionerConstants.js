export const NAMA_PT_RESMI = 'UNIVERSITAS PATTIMURA';

export const TAHUN_LULUS_OPTIONS = [
  2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018,
];

export const F4_CARA_MENCARI = [
  { id: 1, label: 'Melalui iklan di koran/majalah, brosur' },
  { id: 2, label: 'Melamar ke perusahaan tanpa mengetahui lowongan yang ada' },
  { id: 3, label: 'Pergi ke bursa/pameran kerja' },
  { id: 4, label: 'Mencari lewat internet/iklan online/milis' },
  { id: 5, label: 'Dihubungi oleh perusahaan' },
  { id: 6, label: 'Menghubungi Kemenakertrans' },
  { id: 7, label: 'Menghubungi agen tenaga kerja komersial/swasta' },
  {
    id: 8,
    label:
      'Memeroleh informasi dari pusat/kantor pengembangan karir fakultas/universitas',
  },
  { id: 9, label: 'Menghubungi kantor kemahasiswaan/hubungan alumni' },
  { id: 10, label: 'Membangun jejaring (network) sejak masih kuliah' },
  {
    id: 11,
    label: 'Melalui relasi (misalnya dosen, orang tua, saudara, teman, dll.)',
  },
  { id: 12, label: 'Membangun bisnis sendiri' },
  { id: 13, label: 'Melalui penempatan kerja atau magang' },
  {
    id: 14,
    label: 'Bekerja di tempat yang sama dengan tempat kerja semasa kuliah',
  },
  { id: 15, label: 'Lainnya', isOther: true },
];

export const F9_SITUASI_SAAT_INI = [
  {
    id: 1,
    label: 'Saya masih belajar/melanjutkan kuliah profesi atau pascasarjana',
  },
  { id: 2, label: 'Saya menikah' },
  { id: 3, label: 'Saya sibuk dengan keluarga dan anak-anak' },
  { id: 4, label: 'Saya sekarang sedang mencari pekerjaan' },
  { id: 5, label: 'Lainnya', isOther: true },
];

export const F10_AKTIF_4_MINGGU = [
  'Tidak',
  'Tidak, tapi saya sedang menunggu hasil lamaran kerja',
  'Ya, saya akan mulai bekerja dalam 2 minggu ke depan',
  'Ya, tapi saya belum pasti akan bekerja dalam 2 minggu ke depan',
  'Lainnya',
];

export const F11_JENIS_INSTANSI = [
  { value: 'Instansi pemerintah (termasuk BUMN)', label: 'Instansi pemerintah (termasuk BUMN)' },
  {
    value: 'Organisasi non-profit/Lembaga Swadaya Masyarakat',
    label: 'Organisasi non-profit/Lembaga Swadaya Masyarakat',
  },
  { value: 'Perusahaan swasta', label: 'Perusahaan swasta' },
  { value: 'Wiraswasta/perusahaan sendiri', label: 'Wiraswasta/perusahaan sendiri' },
  { value: 'Lainnya', label: 'Lainnya, tuliskan:', isOther: true },
];

export const F12_KBLI = [
  { code: 'A', label: 'A - Pertanian, Kehutanan dan Perikanan' },
  { code: 'B', label: 'B - Pertambangan dan Penggalian' },
  { code: 'C', label: 'C - Industri Pengolahan' },
  {
    code: 'D',
    label: 'D - Pengadaan Listrik, Gas, Uap/Air Panas dan Udara Dingin',
  },
  {
    code: 'E',
    label: 'E - Treatment Air, Air Limbah, Pemulihan Material Sampah',
  },
  { code: 'F', label: 'F - Konstruksi' },
  { code: 'G', label: 'G - Perdagangan Besar dan Eceran' },
  { code: 'H', label: 'H - Pengangkutan dan Pergudangan' },
  { code: 'I', label: 'I - Penyediaan Akomodasi dan Makan Minum' },
  { code: 'J', label: 'J - Informasi dan Komunikasi' },
  { code: 'K', label: 'K - Aktivitas Keuangan dan Asuransi' },
  { code: 'L', label: 'L - Real Estat' },
  { code: 'M', label: 'M - Aktivitas Profesional, Ilmiah dan Teknis' },
  {
    code: 'N',
    label: 'N - Aktivitas Penyewaan, Ketenagakerjaan, Agen Perjalanan',
  },
  {
    code: 'O',
    label: 'O - Administrasi Pemerintahan, Pertahanan dan Jaminan Sosial Wajib',
  },
  { code: 'P', label: 'P - Pendidikan' },
  { code: 'Q', label: 'Q - Aktivitas Kesehatan Manusia dan Aktivitas Sosial' },
  { code: 'R', label: 'R - Kesenian, Hiburan dan Rekreasi' },
  { code: 'S', label: 'S - Aktivitas Jasa Lainnya' },
  { code: 'T', label: 'T - Aktivitas Rumah Tangga Sebagai Pemberi Kerja' },
  { code: 'U', label: 'U - Aktivitas Badan Internasional' },
];

export const F14_KEERATAN_BIDANG = [
  'Sangat Erat',
  'Erat',
  'Cukup Erat',
  'Kurang Erat',
  'Tidak Sama Sekali',
];

export const F15_KESESUAIAN_PENDIDIKAN = [
  'Setingkat Lebih Tinggi',
  'Tingkat yang Sama',
  'Setingkat Lebih Rendah',
  'Tidak Perlu Pendidikan Tinggi',
];

export const F16_ALASAN_TIDAK_SESUAI = [
  {
    id: 1,
    label:
      'Pertanyaan tidak sesuai, pekerjaan saya sekarang sudah sesuai dengan pendidikan saya',
  },
  { id: 2, label: 'Saya belum mendapatkan pekerjaan yang lebih sesuai' },
  {
    id: 3,
    label: 'Di pekerjaan ini saya memeroleh prospek karir yang baik',
  },
  {
    id: 4,
    label:
      'Saya lebih suka bekerja di area pekerjaan yang tidak ada hubungannya dengan pendidikan saya',
  },
  {
    id: 5,
    label:
      'Saya dipromosikan ke posisi yang kurang berhubungan dengan pendidikan saya dibanding posisi sebelumnya',
  },
  {
    id: 6,
    label: 'Saya dapat memeroleh pendapatan yang lebih tinggi di pekerjaan ini',
  },
  {
    id: 7,
    label: 'Pekerjaan saya saat ini lebih aman/terjamin/secure',
  },
  { id: 8, label: 'Pekerjaan saya saat ini lebih menarik' },
  {
    id: 9,
    label:
      'Pekerjaan saya saat ini lebih memungkinkan saya mengambil pekerjaan tambahan/jadwal yang fleksibel, dll.',
  },
  {
    id: 10,
    label: 'Pekerjaan saya saat ini lokasinya lebih dekat dari rumah saya',
  },
  {
    id: 11,
    label:
      'Pekerjaan saya saat ini dapat lebih menjamin kebutuhan keluarga saya',
  },
  {
    id: 12,
    label:
      'Pada awal meniti karir ini, saya harus menerima pekerjaan yang tidak berhubungan dengan pendidikan saya',
  },
  { id: 13, label: 'Lainnya', isOther: true },
];

export const F17_KOMPETENSI = [
  {
    key: 'item_1',
    no: 1,
    shortLabel: 'Pengetahuan Bidang',
    label: 'Pengetahuan di bidang atau disiplin ilmu anda',
  },
  {
    key: 'item_2',
    no: 2,
    shortLabel: 'Pengetahuan Luar Bidang',
    label: 'Pengetahuan di luar bidang atau disiplin ilmu anda',
  },
  { key: 'item_3', no: 3, shortLabel: 'Pengetahuan Umum', label: 'Pengetahuan umum' },
  { key: 'item_4', no: 4, shortLabel: 'Bahasa Inggris', label: 'Bahasa Inggris' },
  {
    key: 'item_5',
    no: 5,
    shortLabel: 'Ketrampilan Internet',
    label: 'Ketrampilan internet',
  },
  {
    key: 'item_6',
    no: 6,
    shortLabel: 'Ketrampilan Komputer',
    label: 'Ketrampilan komputer',
  },
  { key: 'item_7', no: 7, shortLabel: 'Berpikir Kritis', label: 'Berpikir kritis' },
  { key: 'item_8', no: 8, shortLabel: 'Ketrampilan Riset', label: 'Ketrampilan riset' },
  { key: 'item_9', no: 9, shortLabel: 'Kemampuan Belajar', label: 'Kemampuan belajar' },
  {
    key: 'item_10',
    no: 10,
    shortLabel: 'Kemampuan Komunikasi',
    label: 'Kemampuan berkomunikasi',
  },
  {
    key: 'item_11',
    no: 11,
    shortLabel: 'Kerja di Bawah Tekanan',
    label: 'Bekerja di bawah tekanan',
  },
  { key: 'item_12', no: 12, shortLabel: 'Manajemen Waktu', label: 'Manajemen waktu' },
  { key: 'item_13', no: 13, shortLabel: 'Kerja Mandiri', label: 'Bekerja secara mandiri' },
  {
    key: 'item_14',
    no: 14,
    shortLabel: 'Kerja dalam Tim',
    label: 'Bekerja dalam tim/bekerjasama dengan orang lain',
  },
  {
    key: 'item_15',
    no: 15,
    shortLabel: 'Pemecahan Masalah',
    label: 'Kemampuan dalam memecahkan masalah',
  },
  { key: 'item_16', no: 16, shortLabel: 'Negosiasi', label: 'Negosiasi' },
  { key: 'item_17', no: 17, shortLabel: 'Kemampuan Analisis', label: 'Kemampuan analisis' },
  { key: 'item_18', no: 18, shortLabel: 'Toleransi', label: 'Toleransi' },
  { key: 'item_19', no: 19, shortLabel: 'Kemampuan Adaptasi', label: 'Kemampuan adaptasi' },
  { key: 'item_20', no: 20, shortLabel: 'Loyalitas', label: 'Loyalitas' },
  { key: 'item_21', no: 21, shortLabel: 'Integritas', label: 'Integritas' },
  {
    key: 'item_22',
    no: 22,
    shortLabel: 'Keragaman Budaya',
    label: 'Bekerja dengan orang yang berbeda budaya maupun latar belakang',
  },
  { key: 'item_23', no: 23, shortLabel: 'Kepemimpinan', label: 'Kepemimpinan' },
  {
    key: 'item_24',
    no: 24,
    shortLabel: 'Tanggung Jawab',
    label: 'Kemampuan dalam memegang tanggungjawab',
  },
  { key: 'item_25', no: 25, shortLabel: 'Inisiatif', label: 'Inisiatif' },
  {
    key: 'item_26',
    no: 26,
    shortLabel: 'Manajemen Proyek',
    label: 'Manajemen proyek/program',
  },
  {
    key: 'item_27',
    no: 27,
    shortLabel: 'Presentasi Ide',
    label: 'Kemampuan untuk memresentasikan ide/produk/laporan',
  },
  {
    key: 'item_28',
    no: 28,
    shortLabel: 'Menulis Laporan',
    label: 'Kemampuan dalam menulis laporan, memo dan dokumen',
  },
  {
    key: 'item_29',
    no: 29,
    shortLabel: 'Belajar Sepanjang Hayat',
    label: 'Kemampuan untuk terus belajar sepanjang hayat',
  },
];

export const SKALA_KOMPETENSI_LABELS = [
  { value: 1, label: 'Sangat Rendah' },
  { value: 2, label: 'Rendah' },
  { value: 3, label: 'Cukup' },
  { value: 4, label: 'Tinggi' },
  { value: 5, label: 'Sangat Tinggi' },
];
