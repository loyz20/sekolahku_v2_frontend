import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { DataTable } from '@/components/shared/DataTable';
import { PageHero } from '@/components/shared/PageHero';
import { ClipboardCheck, Calendar, MapPin, User, Search } from 'lucide-react';

interface Absensi {
  id: string;
  peserta_didik_id: string;
  peserta_didik_nama: string;
  tanggal: string;
  jam_masuk: string | null;
  jam_keluar: string | null;
  latitude_masuk: number | null;
  longitude_masuk: number | null;
  latitude_keluar: number | null;
  longitude_keluar: number | null;
}

export default function AbsensiPage() {
  const [items, setItems] = useState<Absensi[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 });

  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get<any>(`/absensi/rekap?page=${page}&limit=10&bulan=${bulan}&tahun=${tahun}&search=${search}`);
      setItems(res.data.items);
      setPagination(res.data.pagination);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [bulan, tahun, search]);

  useEffect(() => { fetchData(1); }, [fetchData]);

  const columns = [
    {
      header: 'Siswa', render: (a: Absensi) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <span className="font-bold text-foreground">{a.peserta_didik_nama}</span>
        </div>
      )
    },
    {
      header: 'Tanggal', render: (a: Absensi) => (
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Calendar className="w-3 h-3 opacity-40" />
          {new Date(a.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      )
    },
    {
      header: 'Presensi', render: (a: Absensi) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${a.jam_masuk ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
              MASUK: {a.jam_masuk ? new Date(a.jam_masuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </div>
            {a.jam_masuk && (
              <a href={`https://www.google.com/maps?q=${a.latitude_masuk},${a.longitude_masuk}`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <MapPin className="w-3 h-3" />
              </a>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${a.jam_keluar ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
              PULANG: {a.jam_keluar ? new Date(a.jam_keluar).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </div>
            {a.jam_keluar && (
              <a href={`https://www.google.com/maps?q=${a.latitude_keluar},${a.longitude_keluar}`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <MapPin className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Status', render: (a: Absensi) => {
        const isLate = a.jam_masuk && new Date(a.jam_masuk).getHours() >= 8;
        return (
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${isLate ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
            {isLate ? 'TERLAMBAT' : 'TEPAT WAKTU'}
          </span>
        );
      }
    }
  ];

  return (
    <div className="w-full p-6 space-y-6 mx-auto">
      <PageHero
        title="REKAP ABSENSI"
        description="Monitoring kehadiran harian peserta didik"
        icon={<ClipboardCheck className="w-5 h-5" />}
        variant="indigo"
        breadcrumb="Akademik / Presensi Kehadiran"
      />

      <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <select
              className="bg-transparent border-none text-sm font-semibold focus:ring-0"
              value={bulan}
              onChange={(e) => setBulan(parseInt(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString('id-ID', { month: 'long' })}</option>
              ))}
            </select>
            <select
              className="bg-transparent border-none text-sm font-semibold focus:ring-0"
              value={tahun}
              onChange={(e) => setTahun(parseInt(e.target.value))}
            >
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari nama siswa..."
              className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        pagination={pagination}
        onPageChange={p => fetchData(p)}
      />
    </div>
  );
}
