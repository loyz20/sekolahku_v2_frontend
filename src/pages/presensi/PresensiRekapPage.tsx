import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import { BarChart3 } from 'lucide-react';
import { DataTable } from '@/components/shared/DataTable';
import { FormField } from '@/components/shared/FormField';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { PageHero } from '@/components/shared/PageHero';
import { FilterBar } from '@/components/shared/FilterBar';

interface Pembelajaran {
  id: string;
  rombel_id: string;
  mata_pelajaran_nama: string;
  rombel_nama: string;
}

interface RekapItem {
  id: string;
  peserta_didik_id: string;
  nama_siswa: string;
  nis: string;
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
  total_pertemuan: number;
}

interface Semester {
  id: string;
  nama: string;
  aktif: boolean;
}

// ─── Hooks ──────────────────────────────────────────────────────────────────
function useMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function RekapCard({ item }: { item: RekapItem }) {
  const percentage = item.total_pertemuan > 0 ? (item.hadir / item.total_pertemuan) * 100 : 0;
  
  return (
    <div className="p-5 rounded-[2rem] bg-zinc-900/40 border border-white/5 space-y-4 relative overflow-hidden transition-all hover:border-white/10 group">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-lg shadow-inner shrink-0">
          {item.nama_siswa?.charAt(0) || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-foreground truncate uppercase">{item.nama_siswa || 'Tanpa Nama'}</h4>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">NIS: {item.nis || '-'}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-black text-foreground leading-none">{percentage.toFixed(0)}%</p>
          <p className="text-[8px] font-black uppercase text-muted-foreground mt-1">Kehadiran</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/5">
        <div className="text-center">
          <p className="text-[10px] font-black text-emerald-400">{item.hadir}</p>
          <p className="text-[7px] font-bold text-muted-foreground uppercase">Hadir</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-black text-amber-400">{item.izin}</p>
          <p className="text-[7px] font-bold text-muted-foreground uppercase">Izin</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-black text-sky-400">{item.sakit}</p>
          <p className="text-[7px] font-bold text-muted-foreground uppercase">Sakit</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-black text-rose-400">{item.alpa}</p>
          <p className="text-[7px] font-bold text-muted-foreground uppercase">Alpa</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-[8px] font-black uppercase text-muted-foreground/60">
          <span>Progres Kehadiran</span>
          <span>{item.hadir}/{item.total_pertemuan} Hari</span>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${percentage >= 80 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function PresensiRekapPage() {
  const isMobile = useMobile();
  const [pembelajarans, setPembelajarans] = useState<Pembelajaran[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedPem, setSelectedPem] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  
  const [rekap, setRekap] = useState<RekapItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/pembelajaran?limit=500').then((res: any) => setPembelajarans(res.data.items));
    api.get('/semester?limit=100').then((res: any) => {
      const list = res.data.items;
      setSemesters(list);
      const active = list.find((s: any) => s.aktif);
      if (active) setSelectedSemester(active.id);
    });
  }, []);

  const fetchRekap = useCallback(async () => {
    if (!selectedPem || !selectedSemester) return;
    setLoading(true);
    try {
      const res = await api.get(`/presensi/rekap?pembelajaran_id=${selectedPem}&semester_id=${selectedSemester}`);
      const data = (res as any).data.map((item: any) => ({
        ...item,
        id: item.peserta_didik_id
      }));
      setRekap(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedPem, selectedSemester]);

  const filteredRekap = useMemo(() => {
    if (!search) return rekap;
    const s = search.toLowerCase();
    return rekap.filter(item => 
      item.nama_siswa?.toLowerCase().includes(s)
    );
  }, [rekap, search]);

  useEffect(() => {
    fetchRekap();
  }, [fetchRekap]);

  const columns = [
    {
      header: 'Peserta Didik',
      render: (r: RekapItem) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground uppercase">{r.nama_siswa}</span>
          <span className="text-[10px] text-muted-foreground font-mono">NIS: {r.nis}</span>
        </div>
      )
    },
    {
      header: 'Hadir',
      render: (r: RekapItem) => <span className="font-bold text-emerald-400">{r.hadir}</span>
    },
    {
      header: 'Izin',
      render: (r: RekapItem) => <span className="font-bold text-amber-400">{r.izin}</span>
    },
    {
      header: 'Sakit',
      render: (r: RekapItem) => <span className="font-bold text-sky-400">{r.sakit}</span>
    },
    {
      header: 'Alpa',
      render: (r: RekapItem) => <span className="font-bold text-rose-400">{r.alpa}</span>
    },
    {
      header: 'Total',
      render: (r: RekapItem) => <span className="font-black text-foreground">{r.total_pertemuan}</span>
    },
    {
      header: '% Kehadiran',
      render: (r: RekapItem) => {
        const percentage = r.total_pertemuan > 0 ? (r.hadir / r.total_pertemuan) * 100 : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 w-16 bg-white/5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${percentage >= 80 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs font-black min-w-[40px]">{percentage.toFixed(0)}%</span>
          </div>
        );
      }
    }
  ] as any[];

  const stats = useMemo(() => {
    if (rekap.length === 0) return { avg: 0, total: 0, lowAtt: 0 };
    const avg = rekap.reduce((acc, curr) => {
      const p = curr.total_pertemuan > 0 ? (curr.hadir / curr.total_pertemuan) * 100 : 0;
      return acc + p;
    }, 0) / rekap.length;
    
    const lowAtt = rekap.filter(r => {
      const p = r.total_pertemuan > 0 ? (r.hadir / r.total_pertemuan) * 100 : 0;
      return p < 75;
    }).length;

    return { 
      avg: avg.toFixed(1), 
      total: rekap[0]?.total_pertemuan || 0,
      lowAtt
    };
  }, [rekap]);

  return (
    <div className="w-full p-4 sm:p-6 space-y-8 mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl">
      <PageHero
        title="REKAPITULASI"
        description="Statistik kehadiran satu semester."
        icon={<BarChart3 className="w-5 h-5" />}
        variant="primary"
        breadcrumb="Akademik / Laporan Presensi"
      />

      {/* Summary Row */}
      {selectedPem && rekap.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 animate-in slide-in-from-top-4 duration-500">
          <div className="p-5 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-md">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Rata-rata Kehadiran</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-black text-emerald-400 leading-none">{stats.avg}%</p>
              <p className="text-[10px] font-bold text-muted-foreground mb-1">Siswa Hadir</p>
            </div>
          </div>
          <div className="p-5 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-md">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Total Pertemuan</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-black text-sky-400 leading-none">{stats.total}</p>
              <p className="text-[10px] font-bold text-muted-foreground mb-1">Hari Efektif</p>
            </div>
          </div>
          <div className="p-5 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-md relative group">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Kehadiran Rendah</p>
            <div className="flex items-end gap-2">
              <p className={`text-3xl font-black leading-none ${Number(stats.lowAtt) > 0 ? 'text-rose-500' : 'text-emerald-400'}`}>
                {stats.lowAtt}
              </p>
              <p className="text-[10px] font-bold text-muted-foreground mb-1">Siswa &lt; 75%</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-[2.5rem] bg-zinc-900/40 border border-white/5 backdrop-blur-sm shadow-2xl">
        <SearchableSelect 
          id="pembelajaran" 
          label="Mata Pelajaran & Kelas" 
          value={selectedPem} 
          onChange={setSelectedPem}
          placeholder="-- Pilih Mata Pelajaran --"
          options={pembelajarans.map(p => ({
            value: p.id,
            label: `${p.mata_pelajaran_nama} - Kelas ${p.rombel_nama}`
          }))}
        />
        <FormField 
          id="semester" 
          label="Semester" 
          type="select"
          value={selectedSemester}
          onChange={setSelectedSemester}
          options={semesters.map(s => ({
            value: s.id,
            label: s.nama
          }))}
        />
      </div>

      {/* Data List Area */}
      {selectedPem ? (
        <div className="animate-in fade-in duration-1000 space-y-6">
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Cari nama siswa..."
            onExport={() => {}} // TODO: Implement PDF Export
            exportTooltip="Export Laporan PDF"
          />
          {isMobile ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredRekap.map(item => (
                <RekapCard key={item.id} item={item} />
              ))}
              {rekap.length === 0 && !loading && (
                <div className="py-20 text-center opacity-50 font-medium">Data rekap tidak tersedia</div>
              )}
            </div>
          ) : (
            <div className="rounded-[2.5rem] bg-zinc-900/40 border border-white/5 backdrop-blur-sm overflow-hidden shadow-2xl">
              <DataTable
                columns={columns}
                data={filteredRekap}
                loading={loading}
                searchPlaceholder="Cari siswa..."
              />
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 rounded-[3rem] bg-white/[0.02] border-2 border-dashed border-white/5 opacity-50">
          <div className="w-24 h-24 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center">
            <BarChart3 className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="font-black text-2xl uppercase tracking-tight italic">Pilih Data Rekapitulasi</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">Silakan pilih mata pelajaran dan semester untuk melihat laporan kehadiran.</p>
          </div>
        </div>
      )}
    </div>
  );
}
