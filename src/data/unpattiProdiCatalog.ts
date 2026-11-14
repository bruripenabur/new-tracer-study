import { MasterProdi } from '../types/tracer';

interface CatalogSeedItem {
  kode_fakultas: string;
  nama_fakultas: string;
  kode_prodi: string;
  nama_prodi: string;
  jenjang: string;
}

const RAW_118_PRODI: CatalogSeedItem[] = [
  // 1. Fakultas Hukum (1)
  { kode_fakultas: 'FH', nama_fakultas: 'Fakultas Hukum', kode_prodi: 'FH-IH', nama_prodi: 'Ilmu Hukum', jenjang: 'S1' },

  // 2. Fakultas Ilmu Sosial dan Ilmu Politik (5)
  { kode_fakultas: 'FISIP', nama_fakultas: 'Fakultas Ilmu Sosial dan Ilmu Politik', kode_prodi: 'FISIP-IAP', nama_prodi: 'Ilmu Administrasi Negara', jenjang: 'S1' },
  { kode_fakultas: 'FISIP', nama_fakultas: 'Fakultas Ilmu Sosial dan Ilmu Politik', kode_prodi: 'FISIP-IP', nama_prodi: 'Ilmu Pemerintahan', jenjang: 'S1' },
  { kode_fakultas: 'FISIP', nama_fakultas: 'Fakultas Ilmu Sosial dan Ilmu Politik', kode_prodi: 'FISIP-SOS', nama_prodi: 'Sosiologi', jenjang: 'S1' },
  { kode_fakultas: 'FISIP', nama_fakultas: 'Fakultas Ilmu Sosial dan Ilmu Politik', kode_prodi: 'FISIP-IKOM', nama_prodi: 'Ilmu Komunikasi', jenjang: 'S1' },
  { kode_fakultas: 'FISIP', nama_fakultas: 'Fakultas Ilmu Sosial dan Ilmu Politik', kode_prodi: 'FISIP-PS', nama_prodi: 'Pembangunan Sosial', jenjang: 'S1' },

  // 3. Fakultas Ekonomi dan Bisnis (5)
  { kode_fakultas: 'FEB', nama_fakultas: 'Fakultas Ekonomi dan Bisnis', kode_prodi: 'FEB-MJN', nama_prodi: 'Manajemen', jenjang: 'S1' },
  { kode_fakultas: 'FEB', nama_fakultas: 'Fakultas Ekonomi dan Bisnis', kode_prodi: 'FEB-AKT', nama_prodi: 'Akuntansi', jenjang: 'S1' },
  { kode_fakultas: 'FEB', nama_fakultas: 'Fakultas Ekonomi dan Bisnis', kode_prodi: 'FEB-EP', nama_prodi: 'Ekonomi Pembangunan', jenjang: 'S1' },
  { kode_fakultas: 'FEB', nama_fakultas: 'Fakultas Ekonomi dan Bisnis', kode_prodi: 'FEB-KWU', nama_prodi: 'Kewirausahaan', jenjang: 'S1' },
  { kode_fakultas: 'FEB', nama_fakultas: 'Fakultas Ekonomi dan Bisnis', kode_prodi: 'FEB-PI', nama_prodi: 'Perdagangan Internasional', jenjang: 'S1' },

  // 4. Fakultas Kedokteran (4)
  { kode_fakultas: 'FK', nama_fakultas: 'Fakultas Kedokteran', kode_prodi: 'FK-PD', nama_prodi: 'Pendidikan Dokter', jenjang: 'S1' },
  { kode_fakultas: 'FK', nama_fakultas: 'Fakultas Kedokteran', kode_prodi: 'FK-PROF', nama_prodi: 'Profesi Dokter', jenjang: 'Profesi' },
  { kode_fakultas: 'FK', nama_fakultas: 'Fakultas Kedokteran', kode_prodi: 'FK-KG', nama_prodi: 'Kedokteran Gigi', jenjang: 'S1' },
  { kode_fakultas: 'FK', nama_fakultas: 'Fakultas Kedokteran', kode_prodi: 'FK-PROFDG', nama_prodi: 'Profesi Dokter Gigi', jenjang: 'Profesi' },

  // 5. Fakultas Perikanan dan Ilmu Kelautan (6)
  { kode_fakultas: 'FPIK', nama_fakultas: 'Fakultas Perikanan dan Ilmu Kelautan', kode_prodi: 'FPIK-BDP', nama_prodi: 'Budidaya Perairan', jenjang: 'S1' },
  { kode_fakultas: 'FPIK', nama_fakultas: 'Fakultas Perikanan dan Ilmu Kelautan', kode_prodi: 'FPIK-MSP', nama_prodi: 'Manajemen Sumberdaya Perairan', jenjang: 'S1' },
  { kode_fakultas: 'FPIK', nama_fakultas: 'Fakultas Perikanan dan Ilmu Kelautan', kode_prodi: 'FPIK-PSP', nama_prodi: 'Pemanfaatan Sumberdaya Perikanan', jenjang: 'S1' },
  { kode_fakultas: 'FPIK', nama_fakultas: 'Fakultas Perikanan dan Ilmu Kelautan', kode_prodi: 'FPIK-THP', nama_prodi: 'Teknologi Hasil Perikanan', jenjang: 'S1' },
  { kode_fakultas: 'FPIK', nama_fakultas: 'Fakultas Perikanan dan Ilmu Kelautan', kode_prodi: 'FPIK-IKL', nama_prodi: 'Ilmu Kelautan', jenjang: 'S1' },
  { kode_fakultas: 'FPIK', nama_fakultas: 'Fakultas Perikanan dan Ilmu Kelautan', kode_prodi: 'FPIK-AGB', nama_prodi: 'Agrobisnis Perikanan', jenjang: 'S1' },

  // 6. Fakultas Pertanian (10)
  { kode_fakultas: 'FAPERTA', nama_fakultas: 'Fakultas Pertanian', kode_prodi: 'FP-AGT', nama_prodi: 'Agroteknologi', jenjang: 'S1' },
  { kode_fakultas: 'FAPERTA', nama_fakultas: 'Fakultas Pertanian', kode_prodi: 'FP-AGB', nama_prodi: 'Agribisnis', jenjang: 'S1' },
  { kode_fakultas: 'FAPERTA', nama_fakultas: 'Fakultas Pertanian', kode_prodi: 'FP-THP', nama_prodi: 'Teknologi Hasil Pertanian', jenjang: 'S1' },
  { kode_fakultas: 'FAPERTA', nama_fakultas: 'Fakultas Pertanian', kode_prodi: 'FP-KHT', nama_prodi: 'Kehutanan', jenjang: 'S1' },
  { kode_fakultas: 'FAPERTA', nama_fakultas: 'Fakultas Pertanian', kode_prodi: 'FP-PTK', nama_prodi: 'Peternakan', jenjang: 'S1' },
  { kode_fakultas: 'FAPERTA', nama_fakultas: 'Fakultas Pertanian', kode_prodi: 'FP-IT', nama_prodi: 'Ilmu Tanah', jenjang: 'S1' },
  { kode_fakultas: 'FAPERTA', nama_fakultas: 'Fakultas Pertanian', kode_prodi: 'FP-PTN', nama_prodi: 'Pemuliaan Tanaman', jenjang: 'S1' },
  { kode_fakultas: 'FAPERTA', nama_fakultas: 'Fakultas Pertanian', kode_prodi: 'FP-PP', nama_prodi: 'Penyuluhan Pertanian', jenjang: 'S1' },
  { kode_fakultas: 'FAPERTA', nama_fakultas: 'Fakultas Pertanian', kode_prodi: 'FP-IL', nama_prodi: 'Ilmu Lingkungan', jenjang: 'S1' },
  { kode_fakultas: 'FAPERTA', nama_fakultas: 'Fakultas Pertanian', kode_prodi: 'FP-PH', nama_prodi: 'Pengelolaan Hutan', jenjang: 'S1' },

  // 7. Fakultas Sains dan Teknologi (11)
  { kode_fakultas: 'FST', nama_fakultas: 'Fakultas Sains dan Teknologi', kode_prodi: 'FST-BIO', nama_prodi: 'Biologi', jenjang: 'S1' },
  { kode_fakultas: 'FST', nama_fakultas: 'Fakultas Sains dan Teknologi', kode_prodi: 'FST-KIM', nama_prodi: 'Kimia', jenjang: 'S1' },
  { kode_fakultas: 'FST', nama_fakultas: 'Fakultas Sains dan Teknologi', kode_prodi: 'FST-FIS', nama_prodi: 'Fisika', jenjang: 'S1' },
  { kode_fakultas: 'FST', nama_fakultas: 'Fakultas Sains dan Teknologi', kode_prodi: 'FST-MAT', nama_prodi: 'Matematika', jenjang: 'S1' },
  { kode_fakultas: 'FST', nama_fakultas: 'Fakultas Sains dan Teknologi', kode_prodi: 'FST-STAT', nama_prodi: 'Statistika', jenjang: 'S1' },
  { kode_fakultas: 'FST', nama_fakultas: 'Fakultas Sains dan Teknologi', kode_prodi: 'FST-ILKOM', nama_prodi: 'Ilmu Komputer', jenjang: 'S1' },
  { kode_fakultas: 'FST', nama_fakultas: 'Fakultas Sains dan Teknologi', kode_prodi: 'FST-BIOTEK', nama_prodi: 'Bioteknologi', jenjang: 'S1' },
  { kode_fakultas: 'FST', nama_fakultas: 'Fakultas Sains dan Teknologi', kode_prodi: 'FST-FARM', nama_prodi: 'Farmasi', jenjang: 'S1' },
  { kode_fakultas: 'FST', nama_fakultas: 'Fakultas Sains dan Teknologi', kode_prodi: 'FST-SBM', nama_prodi: 'Sains Biomedis', jenjang: 'S1' },
  { kode_fakultas: 'FST', nama_fakultas: 'Fakultas Sains dan Teknologi', kode_prodi: 'FST-K3', nama_prodi: 'Keselamatan dan Kesehatan Kerja', jenjang: 'S1' },
  { kode_fakultas: 'FST', nama_fakultas: 'Fakultas Sains dan Teknologi', kode_prodi: 'FST-GIZI', nama_prodi: 'Ilmu Gizi', jenjang: 'S1' },

  // 8. Fakultas Teknik (15)
  { kode_fakultas: 'FT', nama_fakultas: 'Fakultas Teknik', kode_prodi: 'FT-TP', nama_prodi: 'Teknik Perkapalan', jenjang: 'S1' },
  { kode_fakultas: 'FT', nama_fakultas: 'Fakultas Teknik', kode_prodi: 'FT-TSP', nama_prodi: 'Teknik Sistem Perkapalan', jenjang: 'S1' },
  { kode_fakultas: 'FT', nama_fakultas: 'Fakultas Teknik', kode_prodi: 'FT-TM', nama_prodi: 'Teknik Mesin', jenjang: 'S1' },
  { kode_fakultas: 'FT', nama_fakultas: 'Fakultas Teknik', kode_prodi: 'FT-TI', nama_prodi: 'Teknik Industri', jenjang: 'S1' },
  { kode_fakultas: 'FT', nama_fakultas: 'Fakultas Teknik', kode_prodi: 'FT-TS', nama_prodi: 'Teknik Sipil', jenjang: 'S1' },
  { kode_fakultas: 'FT', nama_fakultas: 'Fakultas Teknik', kode_prodi: 'FT-TG', nama_prodi: 'Teknik Geologi', jenjang: 'S1' },
  { kode_fakultas: 'FT', nama_fakultas: 'Fakultas Teknik', kode_prodi: 'FT-PWK', nama_prodi: 'Perencanaan Wilayah dan Kota', jenjang: 'S1' },
  { kode_fakultas: 'FT', nama_fakultas: 'Fakultas Teknik', kode_prodi: 'FT-TB', nama_prodi: 'Teknik Biomedis', jenjang: 'S1' },
  { kode_fakultas: 'FT', nama_fakultas: 'Fakultas Teknik', kode_prodi: 'FT-TK', nama_prodi: 'Teknik Kimia', jenjang: 'S1' },
  { kode_fakultas: 'FT', nama_fakultas: 'Fakultas Teknik', kode_prodi: 'FT-TMI', nama_prodi: 'Teknik Manajemen Industri', jenjang: 'S2' },
  { kode_fakultas: 'FT', nama_fakultas: 'Fakultas Teknik', kode_prodi: 'FT-TTL', nama_prodi: 'Teknik Transportasi Laut', jenjang: 'S1' },
  { kode_fakultas: 'FT', nama_fakultas: 'Fakultas Teknik', kode_prodi: 'FT-TPM', nama_prodi: 'Teknik Perminyakan', jenjang: 'S1' },
  { kode_fakultas: 'FT', nama_fakultas: 'Fakultas Teknik', kode_prodi: 'FT-TGF', nama_prodi: 'Teknik Geofisika', jenjang: 'S1' },
  { kode_fakultas: 'FT', nama_fakultas: 'Fakultas Teknik', kode_prodi: 'FT-TE', nama_prodi: 'Teknik Elektro', jenjang: 'S1' },
  { kode_fakultas: 'FT', nama_fakultas: 'Fakultas Teknik', kode_prodi: 'FT-PPI', nama_prodi: 'Program Profesi Insinyur', jenjang: 'Profesi' },

  // 9. Fakultas Keguruan dan Ilmu Pendidikan (19)
  { kode_fakultas: 'FKIP', nama_fakultas: 'Fakultas Keguruan dan Ilmu Pendidikan', kode_prodi: 'FKIP-PBIO', nama_prodi: 'Pendidikan Biologi', jenjang: 'S1' },
  { kode_fakultas: 'FKIP', nama_fakultas: 'Fakultas Keguruan dan Ilmu Pendidikan', kode_prodi: 'FKIP-PFIS', nama_prodi: 'Pendidikan Fisika', jenjang: 'S1' },
  { kode_fakultas: 'FKIP', nama_fakultas: 'Fakultas Keguruan dan Ilmu Pendidikan', kode_prodi: 'FKIP-PKIM', nama_prodi: 'Pendidikan Kimia', jenjang: 'S1' },
  { kode_fakultas: 'FKIP', nama_fakultas: 'Fakultas Keguruan dan Ilmu Pendidikan', kode_prodi: 'FKIP-PMAT', nama_prodi: 'Pendidikan Matematika', jenjang: 'S1' },
  { kode_fakultas: 'FKIP', nama_fakultas: 'Fakultas Keguruan dan Ilmu Pendidikan', kode_prodi: 'FKIP-PGSD', nama_prodi: 'Pendidikan Guru Sekolah Dasar', jenjang: 'S1' },
  { kode_fakultas: 'FKIP', nama_fakultas: 'Fakultas Keguruan dan Ilmu Pendidikan', kode_prodi: 'FKIP-PBING', nama_prodi: 'Pendidikan Bahasa Inggris', jenjang: 'S1' },
  { kode_fakultas: 'FKIP', nama_fakultas: 'Fakultas Keguruan dan Ilmu Pendidikan', kode_prodi: 'FKIP-PSEJ', nama_prodi: 'Pendidikan Sejarah', jenjang: 'S1' },
  { kode_fakultas: 'FKIP', nama_fakultas: 'Fakultas Keguruan dan Ilmu Pendidikan', kode_prodi: 'FKIP-PGEO', nama_prodi: 'Pendidikan Geografi', jenjang: 'S1' },
  { kode_fakultas: 'FKIP', nama_fakultas: 'Fakultas Keguruan dan Ilmu Pendidikan', kode_prodi: 'FKIP-PPKN', nama_prodi: 'Pendidikan Pancasila dan Kewarganegaraan', jenjang: 'S1' },
  { kode_fakultas: 'FKIP', nama_fakultas: 'Fakultas Keguruan dan Ilmu Pendidikan', kode_prodi: 'FKIP-PEKO', nama_prodi: 'Pendidikan Ekonomi', jenjang: 'S1' },
  { kode_fakultas: 'FKIP', nama_fakultas: 'Fakultas Keguruan dan Ilmu Pendidikan', kode_prodi: 'FKIP-PAKT', nama_prodi: 'Pendidikan Akuntansi', jenjang: 'S1' },
  { kode_fakultas: 'FKIP', nama_fakultas: 'Fakultas Keguruan dan Ilmu Pendidikan', kode_prodi: 'FKIP-PBSI', nama_prodi: 'Pendidikan Bahasa dan Sastra Indonesia', jenjang: 'S1' },
  { kode_fakultas: 'FKIP', nama_fakultas: 'Fakultas Keguruan dan Ilmu Pendidikan', kode_prodi: 'FKIP-PJER', nama_prodi: 'Pendidikan Bahasa Jerman', jenjang: 'S1' },
  { kode_fakultas: 'FKIP', nama_fakultas: 'Fakultas Keguruan dan Ilmu Pendidikan', kode_prodi: 'FKIP-PJKR', nama_prodi: 'Pendidikan Jasmani, Kesehatan dan Rekreasi', jenjang: 'S1' },
  { kode_fakultas: 'FKIP', nama_fakultas: 'Fakultas Keguruan dan Ilmu Pendidikan', kode_prodi: 'FKIP-BK', nama_prodi: 'Bimbingan dan Konseling', jenjang: 'S1' },
  { kode_fakultas: 'FKIP', nama_fakultas: 'Fakultas Keguruan dan Ilmu Pendidikan', kode_prodi: 'FKIP-PLS', nama_prodi: 'Pendidikan Luar Sekolah', jenjang: 'S1' },
  { kode_fakultas: 'FKIP', nama_fakultas: 'Fakultas Keguruan dan Ilmu Pendidikan', kode_prodi: 'FKIP-ADMP', nama_prodi: 'Administrasi Pendidikan', jenjang: 'S1' },
  { kode_fakultas: 'FKIP', nama_fakultas: 'Fakultas Keguruan dan Ilmu Pendidikan', kode_prodi: 'FKIP-PGPAUD', nama_prodi: 'Pendidikan Guru Pendidikan Anak Usia Dini', jenjang: 'S1' },
  { kode_fakultas: 'FKIP', nama_fakultas: 'Fakultas Keguruan dan Ilmu Pendidikan', kode_prodi: 'FKIP-PPG', nama_prodi: 'Pendidikan Profesi Guru (PPG)', jenjang: 'Profesi' },

  // 10. Pascasarjana (30: 22 Magister S2 + 8 Doktor S3)
  { kode_fakultas: 'PASCA', nama_fakultas: 'Pascasarjana', kode_prodi: 'PASCA-S2-AP', nama_prodi: 'Administrasi Publik', jenjang: 'S2' },
  { kode_fakultas: 'PASCA', nama_fakultas: 'Pascasarjana', kode_prodi: 'PASCA-S2-AGB', nama_prodi: 'Agribisnis', jenjang: 'S2' },
  { kode_fakultas: 'PASCA', nama_fakultas: 'Pascasarjana', kode_prodi: 'PASCA-S2-ET', nama_prodi: 'Ekonomi Terapan', jenjang: 'S2' },
  { kode_fakultas: 'PASCA', nama_fakultas: 'Pascasarjana', kode_prodi: 'PASCA-S2-AKT', nama_prodi: 'Ilmu Akuntansi', jenjang: 'S2' },
  { kode_fakultas: 'PASCA', nama_fakultas: 'Pascasarjana', kode_prodi: 'PASCA-S2-IE', nama_prodi: 'Ilmu Ekonomi', jenjang: 'S2' },
  { kode_fakultas: 'PASCA', nama_fakultas: 'Pascasarjana', kode_prodi: 'PASCA-S2-IH', nama_prodi: 'Ilmu Hukum', jenjang: 'S2' },
  { kode_fakultas: 'PASCA', nama_fakultas: 'Pascasarjana', kode_prodi: 'PASCA-S2-IKL', nama_prodi: 'Ilmu Kelautan', jenjang: 'S2' },
  { kode_fakultas: 'PASCA', nama_fakultas: 'Pascasarjana', kode_prodi: 'PASCA-S2-IP', nama_prodi: 'Ilmu Pertanian', jenjang: 'S2' },
  { kode_fakultas: 'PASCA', nama_fakultas: 'Pascasarjana', kode_prodi: 'PASCA-S2-KIM', nama_prodi: 'Kimia', jenjang: 'S2' },
  { kode_fakultas: 'PASCA', nama_fakultas: 'Pascasarjana', kode_prodi: 'PASCA-S2-MJN', nama_prodi: 'Manajemen', jenjang: 'S2' },
  { kode_fakultas: 'PASCA', nama_fakultas: 'Pascasarjana', kode_prodi: 'PASCA-S2-MH', nama_prodi: 'Manajemen Hutan', jenjang: 'S2' },
  { kode_fakultas: 'PASCA', nama_fakultas: 'Pascasarjana', kode_prodi: 'PASCA-S2-MP', nama_prodi: 'Manajemen Pendidikan', jenjang: 'S2' },
  { kode_fakultas: 'PASCA', nama_fakultas: 'Pascasarjana', kode_prodi: 'PASCA-S2-MSKP', nama_prodi: 'Manajemen Sumberdaya Kelautan dan Pulau-pulau Kecil', jenjang: 'S2' },
  { kode_fakultas: 'PASCA', nama_fakultas: 'Pascasarjana', kode_prodi: 'PASCA-S2-PBING', nama_prodi: 'Pendidikan Bahasa Inggris', jenjang: 'S2' },
  { kode_fakultas: 'PASCA', nama_fakultas: 'Pascasarjana', kode_prodi: 'PASCA-S2-PJER', nama_prodi: 'Pendidikan Bahasa Jerman', jenjang: 'S2' },
  { kode_fakultas: 'PASCA', nama_fakultas: 'Pascasarjana', kode_prodi: 'PASCA-S2-PBSI', nama_prodi: 'Pendidikan Bahasa dan Sastra Indonesia', jenjang: 'S2' },
  { kode_fakultas: 'PASCA', nama_fakultas: 'Pascasarjana', kode_prodi: 'PASCA-S2-PBIO', nama_prodi: 'Pendidikan Biologi', jenjang: 'S2' },
  { kode_fakultas: 'PASCA', nama_fakultas: 'Pascasarjana', kode_prodi: 'PASCA-S2-PMAT', nama_prodi: 'Pendidikan Matematika', jenjang: 'S2' },
  { kode_fakultas: 'PASCA', nama_fakultas: 'Pascasarjana', kode_prodi: 'PASCA-S2-PPKN', nama_prodi: 'Pendidikan Pancasila dan Kewarganegaraan', jenjang: 'S2' },
  { kode_fakultas: 'PASCA', nama_fakultas: 'Pascasarjana', kode_prodi: 'PASCA-S2-PL', nama_prodi: 'Pengelolaan Lahan', jenjang: 'S2' },
  { kode_fakultas: 'PASCA', nama_fakultas: 'Pascasarjana', kode_prodi: 'PASCA-S2-RK', nama_prodi: 'Rekayasa Kelautan', jenjang: 'S2' },
  { kode_fakultas: 'PASCA', nama_fakultas: 'Pascasarjana', kode_prodi: 'PASCA-S2-SOS', nama_prodi: 'Sosiologi', jenjang: 'S2' },
  { kode_fakultas: 'PASCA', nama_fakultas: 'Pascasarjana', kode_prodi: 'PASCA-S3-ADMP', nama_prodi: 'Administrasi Pendidikan', jenjang: 'S3' },
  { kode_fakultas: 'PASCA', nama_fakultas: 'Pascasarjana', kode_prodi: 'PASCA-S3-AP', nama_prodi: 'Administrasi Publik', jenjang: 'S3' },
  { kode_fakultas: 'PASCA', nama_fakultas: 'Pascasarjana', kode_prodi: 'PASCA-S3-PBIO', nama_prodi: 'Pendidikan Biologi', jenjang: 'S3' },
  { kode_fakultas: 'PASCA', nama_fakultas: 'Pascasarjana', kode_prodi: 'PASCA-S3-IH', nama_prodi: 'Ilmu Hukum', jenjang: 'S3' },
  { kode_fakultas: 'PASCA', nama_fakultas: 'Pascasarjana', kode_prodi: 'PASCA-S3-IKL', nama_prodi: 'Ilmu Kelautan', jenjang: 'S3' },
  { kode_fakultas: 'PASCA', nama_fakultas: 'Pascasarjana', kode_prodi: 'PASCA-S3-IM', nama_prodi: 'Ilmu Manajemen', jenjang: 'S3' },
  { kode_fakultas: 'PASCA', nama_fakultas: 'Pascasarjana', kode_prodi: 'PASCA-S3-IP', nama_prodi: 'Ilmu Pertanian', jenjang: 'S3' },
  { kode_fakultas: 'PASCA', nama_fakultas: 'Pascasarjana', kode_prodi: 'PASCA-S3-PMAT', nama_prodi: 'Pendidikan Matematika', jenjang: 'S3' },

  // 11. PSDKU Kab. MBD (6)
  { kode_fakultas: 'PSDKU-MBD', nama_fakultas: 'PSDKU Kab. MBD', kode_prodi: 'MBD-IH', nama_prodi: 'Ilmu Hukum (PSDKU Kab. MBD)', jenjang: 'S1' },
  { kode_fakultas: 'PSDKU-MBD', nama_fakultas: 'PSDKU Kab. MBD', kode_prodi: 'MBD-AKT', nama_prodi: 'Akuntansi (PSDKU Kab. MBD)', jenjang: 'S1' },
  { kode_fakultas: 'PSDKU-MBD', nama_fakultas: 'PSDKU Kab. MBD', kode_prodi: 'MBD-PMAT', nama_prodi: 'Pendidikan Matematika (PSDKU Kab. MBD)', jenjang: 'S1' },
  { kode_fakultas: 'PSDKU-MBD', nama_fakultas: 'PSDKU Kab. MBD', kode_prodi: 'MBD-PBING', nama_prodi: 'Pendidikan Bahasa Inggris (PSDKU Kab. MBD)', jenjang: 'S1' },
  { kode_fakultas: 'PSDKU-MBD', nama_fakultas: 'PSDKU Kab. MBD', kode_prodi: 'MBD-PGSD', nama_prodi: 'Pendidikan Guru Sekolah Dasar (PSDKU Kab. MBD)', jenjang: 'S1' },
  { kode_fakultas: 'PSDKU-MBD', nama_fakultas: 'PSDKU Kab. MBD', kode_prodi: 'MBD-PTK', nama_prodi: 'Peternakan (PSDKU Kab. MBD)', jenjang: 'S1' },

  // 12. PSDKU Kab. Kep. Aru (6)
  { kode_fakultas: 'PSDKU-ARU', nama_fakultas: 'PSDKU Kab. Kep. Aru', kode_prodi: 'ARU-IH', nama_prodi: 'Ilmu Hukum (PSDKU Kab. Kep. Aru)', jenjang: 'S1' },
  { kode_fakultas: 'PSDKU-ARU', nama_fakultas: 'PSDKU Kab. Kep. Aru', kode_prodi: 'ARU-AKT', nama_prodi: 'Akuntansi (PSDKU Kab. Kep. Aru)', jenjang: 'S1' },
  { kode_fakultas: 'PSDKU-ARU', nama_fakultas: 'PSDKU Kab. Kep. Aru', kode_prodi: 'ARU-PMAT', nama_prodi: 'Pendidikan Matematika (PSDKU Kab. Kep. Aru)', jenjang: 'S1' },
  { kode_fakultas: 'PSDKU-ARU', nama_fakultas: 'PSDKU Kab. Kep. Aru', kode_prodi: 'ARU-PBING', nama_prodi: 'Pendidikan Bahasa Inggris (PSDKU Kab. Kep. Aru)', jenjang: 'S1' },
  { kode_fakultas: 'PSDKU-ARU', nama_fakultas: 'PSDKU Kab. Kep. Aru', kode_prodi: 'ARU-PGSD', nama_prodi: 'Pendidikan Guru Sekolah Dasar (PSDKU Kab. Kep. Aru)', jenjang: 'S1' },
  { kode_fakultas: 'PSDKU-ARU', nama_fakultas: 'PSDKU Kab. Kep. Aru', kode_prodi: 'ARU-PJKR', nama_prodi: 'Pendidikan Jasmani, Kesehatan dan Rekreasi (PSDKU Kab. Kep. Aru)', jenjang: 'S1' },
];

export const UNPATTI_118_PRODI: MasterProdi[] = RAW_118_PRODI.map((item) => ({
  id: `catalog-${item.kode_prodi}`,
  kode_fakultas: item.kode_fakultas,
  nama_fakultas: item.nama_fakultas,
  kode_prodi: item.kode_prodi,
  nama_prodi: item.nama_prodi,
  jenjang: item.jenjang,
  is_active: true,
}));

function normalizeKey(fakultas: string, prodi: string, jenjang: string): string {
  return `${fakultas.trim().toLowerCase()}::${prodi.trim().toLowerCase()}::${jenjang
    .trim()
    .toLowerCase()}`;
}

export function mergeProdiWithCatalog(dbRows: MasterProdi[]): MasterProdi[] {
  const result: MasterProdi[] = [...dbRows];
  const seenCodes = new Set(
    dbRows.map((r) => r.kode_prodi?.trim().toLowerCase()).filter(Boolean)
  );
  const seenNames = new Set(
    dbRows.map((r) => normalizeKey(r.nama_fakultas, r.nama_prodi, r.jenjang))
  );

  for (const cat of UNPATTI_118_PRODI) {
    const codeKey = cat.kode_prodi.trim().toLowerCase();
    const nameKey = normalizeKey(cat.nama_fakultas, cat.nama_prodi, cat.jenjang);
    if (!seenCodes.has(codeKey) && !seenNames.has(nameKey)) {
      result.push(cat);
      seenCodes.add(codeKey);
      seenNames.add(nameKey);
    }
  }

  return result.sort((a, b) => {
    const fCmp = a.nama_fakultas.localeCompare(b.nama_fakultas, 'id');
    if (fCmp !== 0) return fCmp;
    return a.nama_prodi.localeCompare(b.nama_prodi, 'id');
  });
}

export function getMissingCatalogProdi(dbRows: MasterProdi[]): CatalogSeedItem[] {
  const seenCodes = new Set(
    dbRows.map((r) => r.kode_prodi?.trim().toLowerCase()).filter(Boolean)
  );
  const seenNames = new Set(
    dbRows.map((r) => normalizeKey(r.nama_fakultas, r.nama_prodi, r.jenjang))
  );

  return RAW_118_PRODI.filter((cat) => {
    const codeKey = cat.kode_prodi.trim().toLowerCase();
    const nameKey = normalizeKey(cat.nama_fakultas, cat.nama_prodi, cat.jenjang);
    return !seenCodes.has(codeKey) && !seenNames.has(nameKey);
  });
}
