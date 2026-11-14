import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  F11_JENIS_INSTANSI,
  F14_KEERATAN_BIDANG,
  F17_KOMPETENSI,
} from '../../data/kuesionerConstants';
import {
  MasterProdi,
  StatistikIKU1Row,
  TracerResponseRecord,
} from '../../types/tracer';
import { formatRupiah } from '../../utils/formatters';

interface AnalyticsTabProps {
  responses: TracerResponseRecord[];
  ikuStats: StatistikIKU1Row[];
  umpMaluku: number;
  selectedYear: string;
  selectedFakultas: string;
  selectedProdiId: string;
  selectedProdiObj?: MasterProdi | null;
}

const CHART_COLORS = ['#0A2342', '#1D4ED8', '#D4AF37', '#059669', '#64748B'];

export function AnalyticsTab({
  responses,
  ikuStats,
  umpMaluku,
  selectedYear,
  selectedFakultas,
  selectedProdiId,
  selectedProdiObj,
}: AnalyticsTabProps) {
  const umpThreshold = Math.round((umpMaluku || 3141699) * 1.2);

  // Filter v_statistik_iku1 rows if present
  const filteredIkuRows = useMemo(() => {
    return ikuStats.filter((row) => {
      if (selectedYear !== 'ALL' && String(row.tahun_lulus) !== selectedYear) {
        return false;
      }
      if (selectedFakultas !== 'ALL' && row.fakultas !== selectedFakultas) {
        return false;
      }
      if (selectedProdiId !== 'ALL') {
        const matchesId = row.prodi_id === selectedProdiId;
        const matchesName =
          selectedProdiObj &&
          row.fakultas === selectedProdiObj.nama_fakultas &&
          row.nama_prodi
            ?.toLowerCase()
            .includes(selectedProdiObj.nama_prodi.toLowerCase());
        if (!matchesId && !matchesName) {
          return false;
        }
      }
      return true;
    });
  }, [
    ikuStats,
    selectedYear,
    selectedFakultas,
    selectedProdiId,
    selectedProdiObj,
  ]);

  // Compute KPI metrics from v_statistik_iku1 when available, otherwise directly from filtered responses
  const kpi = useMemo(() => {
    if (filteredIkuRows.length > 0) {
      const totalResp = filteredIkuRows.reduce(
        (acc, r) => acc + Number(r.total_responden || 0),
        0
      );
      const jmlBekerja = filteredIkuRows.reduce(
        (acc, r) => acc + Number(r.jumlah_bekerja || 0),
        0
      );
      const jmlWiraswasta = filteredIkuRows.reduce(
        (acc, r) => acc + Number(r.jumlah_wiraswasta || 0),
        0
      );
      const jmlLanjutStudi = filteredIkuRows.reduce(
        (acc, r) => acc + Number(r.jumlah_lanjut_studi || 0),
        0
      );
      const jmlLayakIku1 = filteredIkuRows.reduce(
        (acc, r) => acc + Number(r.jumlah_bekerja_layak_iku1 || 0),
        0
      );

      let waitWeightedSum = 0;
      let waitWeightCount = 0;
      filteredIkuRows.forEach((r) => {
        if (
          r.rerata_masa_tunggu_bulan !== null &&
          r.rerata_masa_tunggu_bulan !== undefined &&
          Number(r.total_responden) > 0
        ) {
          waitWeightedSum +=
            Number(r.rerata_masa_tunggu_bulan) * Number(r.total_responden);
          waitWeightCount += Number(r.total_responden);
        }
      });

      const pct = (val: number) =>
        totalResp > 0 ? ((val / totalResp) * 100).toFixed(1) : '0.0';

      return {
        totalResponden: totalResp,
        pctBekerja: pct(jmlBekerja),
        pctLayakIku1: pct(jmlLayakIku1),
        pctWiraswasta: pct(jmlWiraswasta),
        pctLanjutStudi: pct(jmlLanjutStudi),
        rerataMasaTunggu:
          waitWeightCount > 0
            ? (waitWeightedSum / waitWeightCount).toFixed(1)
            : '0.0',
      };
    }

    // Fallback computation directly from tracer_responses
    const total = responses.length;
    if (total === 0) {
      return {
        totalResponden: 0,
        pctBekerja: '0.0',
        pctLayakIku1: '0.0',
        pctWiraswasta: '0.0',
        pctLanjutStudi: '0.0',
        rerataMasaTunggu: '0.0',
      };
    }

    let bekerja = 0;
    let layakIku1 = 0;
    let wiraswasta = 0;
    let lanjutStudi = 0;
    let sumTunggu = 0;
    let countTunggu = 0;

    responses.forEach((r) => {
      const isWorking = Boolean(r.f8_bekerja_saat_ini);
      if (isWorking) bekerja += 1;
      if (r.f11_jenis_instansi === 'Wiraswasta/perusahaan sendiri') {
        wiraswasta += 1;
      }
      if (
        Array.isArray(r.f9_situasi_saat_ini) &&
        r.f9_situasi_saat_ini.some((s) =>
          s.toLowerCase().includes('melanjutkan kuliah')
        )
      ) {
        lanjutStudi += 1;
      }

      const masaTunggu =
        r.f5_masa_tunggu_sesudah !== null && r.f5_masa_tunggu_sesudah !== undefined
          ? Number(r.f5_masa_tunggu_sesudah)
          : 0;
      const totalGaji =
        r.f13_total_pendapatan !== null && r.f13_total_pendapatan !== undefined
          ? Number(r.f13_total_pendapatan)
          : Number(r.f13_gaji_utama || 0) +
            Number(r.f13_lembur_tips || 0) +
            Number(r.f13_lainnya || 0);

      if (isWorking && masaTunggu <= 6 && totalGaji >= umpThreshold) {
        layakIku1 += 1;
      }

      if (
        r.f5_masa_tunggu_sesudah !== null &&
        r.f5_masa_tunggu_sesudah !== undefined
      ) {
        sumTunggu += Number(r.f5_masa_tunggu_sesudah);
        countTunggu += 1;
      }
    });

    const pct = (val: number) => ((val / total) * 100).toFixed(1);

    return {
      totalResponden: total,
      pctBekerja: pct(bekerja),
      pctLayakIku1: pct(layakIku1),
      pctWiraswasta: pct(wiraswasta),
      pctLanjutStudi: pct(lanjutStudi),
      rerataMasaTunggu:
        countTunggu > 0 ? (sumTunggu / countTunggu).toFixed(1) : '0.0',
    };
  }, [filteredIkuRows, responses, umpThreshold]);

  // F11 Jenis Instansi Chart Data
  const f11ChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    F11_JENIS_INSTANSI.forEach((opt) => {
      counts[opt.value] = 0;
    });

    responses.forEach((r) => {
      if (r.f8_bekerja_saat_ini && r.f11_jenis_instansi) {
        const key = r.f11_jenis_instansi;
        counts[key] = (counts[key] || 0) + 1;
      }
    });

    return Object.entries(counts).map(([name, jumlah]) => ({
      name: name
        .replace('Instansi pemerintah (termasuk BUMN)', 'Pemerintah / BUMN')
        .replace('Organisasi non-profit/Lembaga Swadaya Masyarakat', 'Non-Profit / LSM')
        .replace('Wiraswasta/perusahaan sendiri', 'Wiraswasta'),
      fullName: name,
      jumlah,
    }));
  }, [responses]);

  // F14 Keeratan Bidang Chart Data
  const f14ChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    F14_KEERATAN_BIDANG.forEach((k) => {
      counts[k] = 0;
    });

    responses.forEach((r) => {
      if (r.f8_bekerja_saat_ini && r.f14_keeratan_bidang) {
        counts[r.f14_keeratan_bidang] =
          (counts[r.f14_keeratan_bidang] || 0) + 1;
      }
    });

    return F14_KEERATAN_BIDANG.map((label) => ({
      name: label,
      value: counts[label] || 0,
    }));
  }, [responses]);

  // F17a vs F17b Competency Radar & Gap Analysis (sorted by largest gap)
  const competencyAnalysis = useMemo(() => {
    const rows = F17_KOMPETENSI.map((item) => {
      let sumA = 0;
      let countA = 0;
      let sumB = 0;
      let countB = 0;

      responses.forEach((r) => {
        const a = r.f17a_kompetensi_lulusan?.[item.key];
        const b = r.f17b_kontribusi_pt?.[item.key];
        if (typeof a === 'number' && a >= 1 && a <= 5) {
          sumA += a;
          countA += 1;
        }
        if (typeof b === 'number' && b >= 1 && b <= 5) {
          sumB += b;
          countB += 1;
        }
      });

      const meanA = countA > 0 ? sumA / countA : 0;
      const meanB = countB > 0 ? sumB / countB : 0;
      const gap = meanB - meanA; // Kontribusi PT minus Penguasaan Lulusan (or abs gap)

      return {
        key: item.key,
        no: item.no,
        shortLabel: item.shortLabel,
        label: item.label,
        meanA: Number(meanA.toFixed(2)),
        meanB: Number(meanB.toFixed(2)),
        gap: Number(gap.toFixed(2)),
        absGap: Number(Math.abs(meanA - meanB).toFixed(2)),
      };
    });

    const radarData = rows.map((r) => ({
      subject: `${r.no}. ${r.shortLabel}`,
      F17a: r.meanA,
      F17b: r.meanB,
    }));

    const gapSorted = [...rows].sort((a, b) => b.absGap - a.absGap);

    return { radarData, gapSorted };
  }, [responses]);

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200">
          <p className="text-xs font-medium text-slate-500">Total Responden</p>
          <p className="mt-1.5 text-2xl font-bold text-[#0A2342] font-mono tabular-nums">
            {kpi.totalResponden.toLocaleString('id-ID')}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Alumni terdata</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200">
          <p className="text-xs font-medium text-slate-500">% Bekerja</p>
          <p className="mt-1.5 text-2xl font-bold text-[#0A2342] font-mono tabular-nums">
            {kpi.pctBekerja}%
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Status F8 = Ya</p>
        </div>

        <div className="p-4 rounded-xl bg-[#0A2342] text-white border border-[#0A2342]">
          <p className="text-xs font-medium text-[#E8CF78]">
            % Bekerja Layak IKU 1
          </p>
          <p className="mt-1.5 text-2xl font-bold text-white font-mono tabular-nums">
            {kpi.pctLayakIku1}%
          </p>
          <p className="mt-1 text-[11px] text-slate-300 tabular-nums">
            Tunggu ≤ 6 bln &amp; Gaji ≥ {formatRupiah(umpThreshold)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200">
          <p className="text-xs font-medium text-slate-500">% Wiraswasta</p>
          <p className="mt-1.5 text-2xl font-bold text-[#0A2342] font-mono tabular-nums">
            {kpi.pctWiraswasta}%
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Usaha mandiri</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200">
          <p className="text-xs font-medium text-slate-500">% Lanjut Studi</p>
          <p className="mt-1.5 text-2xl font-bold text-[#0A2342] font-mono tabular-nums">
            {kpi.pctLanjutStudi}%
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Profesi / S2 / S3</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200">
          <p className="text-xs font-medium text-slate-500">
            Rerata Masa Tunggu
          </p>
          <p className="mt-1.5 text-2xl font-bold text-[#0A2342] font-mono tabular-nums">
            {kpi.rerataMasaTunggu}{' '}
            <span className="text-sm font-sans font-medium text-slate-500">
              bln
            </span>
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Setelah lulus</p>
        </div>
      </div>

      {/* Charts Row 1: F11 & F14 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-white border border-slate-200">
          <div className="mb-4">
            <h3 className="text-base font-bold text-[#0A2342]">
              Distribusi Jenis Instansi (F11)
            </h3>
            <p className="text-xs text-slate-500">
              Sebaran tempat bekerja alumni berstatus bekerja saat ini
            </p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={f11ChartData}
                margin={{ top: 10, right: 16, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#475569' }}
                  interval={0}
                  angle={-12}
                  textAnchor="end"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#475569' }}
                />
                <Tooltip
                  formatter={(value) => [`${value} Alumni`, 'Jumlah']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="jumlah" radius={[6, 6, 0, 0]} fill="#0A2342" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200">
          <div className="mb-4">
            <h3 className="text-base font-bold text-[#0A2342]">
              Keselarasan Bidang Studi &amp; Pekerjaan (F14)
            </h3>
            <p className="text-xs text-slate-500">
              Tingkat keeratan hubungan kompetensi studi dengan pekerjaan
            </p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={f14ChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="48%"
                  innerRadius={52}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {f14ChartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} Alumni`, 'Responden']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{ fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Radar Chart & Gap Analysis Table F17a vs F17b */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-6">
        <div>
          <h3 className="text-base font-bold text-[#0A2342]">
            Radar &amp; Gap Analysis 29 Kompetensi DIKTI (F17a vs F17b)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Perbandingan rerata Penguasaan Lulusan (F17a) dengan Kontribusi
            Perguruan Tinggi (F17b) untuk evaluasi kurikulum OBE.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-6 h-[440px] w-full border border-slate-100 rounded-xl p-2 bg-slate-50/40">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="68%"
                data={competencyAnalysis.radarData}
              >
                <PolarGrid stroke="#cbd5e1" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fontSize: 9.5, fill: '#334155' }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 5]}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                />
                <Radar
                  name="F17a · Penguasaan Lulusan"
                  dataKey="F17a"
                  stroke="#0A2342"
                  fill="#0A2342"
                  fillOpacity={0.28}
                />
                <Radar
                  name="F17b · Kontribusi PT"
                  dataKey="F17b"
                  stroke="#D4AF37"
                  fill="#D4AF37"
                  fillOpacity={0.32}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="xl:col-span-6 border border-slate-200 rounded-xl overflow-hidden">
            <div className="max-h-[440px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">
                      Kompetensi (Urut Gap Terbesar)
                    </th>
                    <th className="px-3 py-2.5 font-semibold text-right">
                      F17a
                    </th>
                    <th className="px-3 py-2.5 font-semibold text-right">
                      F17b
                    </th>
                    <th className="px-3 py-2.5 font-semibold text-right">
                      Gap (F17b - F17a)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {competencyAnalysis.gapSorted.map((row) => {
                    const isDeficit = row.gap < 0;
                    return (
                      <tr key={row.key} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-800">
                          <span className="font-mono text-slate-400 mr-1.5 tabular-nums">
                            {String(row.no).padStart(2, '0')}.
                          </span>
                          {row.label}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-700">
                          {row.meanA.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-700">
                          {row.meanB.toFixed(2)}
                        </td>
                        <td
                          className={`px-3 py-2 text-right font-mono font-semibold tabular-nums ${
                            isDeficit
                              ? 'text-red-700'
                              : row.gap > 0
                              ? 'text-emerald-700'
                              : 'text-slate-600'
                          }`}
                        >
                          {row.gap > 0 ? `+${row.gap.toFixed(2)}` : row.gap.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
