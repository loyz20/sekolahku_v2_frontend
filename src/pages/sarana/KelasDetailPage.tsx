import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { 
  Layout, 
  ArrowLeft, 
  Users, 
  BookOpen, 
  Info, 
  User as UserIcon, 
  Hash, 
  Calendar,
  GraduationCap,
  Clock,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';

interface Rombel {
  id: string;
  nama: string;
  tingkat: number;
  wali_kelas_nama?: string;
  tahun_ajaran_nama?: string;
}

interface Anggota {
  id: string;
  peserta_didik_id: string;
  peserta_didik_nama: string;
  nis: string;
  nisn: string;
}

interface Pembelajaran {
  id: string;
  mata_pelajaran_nama: string;
  mata_pelajaran_kode: string;
  ptk_nama: string;
  jam_per_minggu: number;
}

export default function KelasDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'info' | 'siswa' | 'pembelajaran'>('info');
  const [rombel, setRombel] = useState<Rombel | null>(null);
  const [anggota, setAnggota] = useState<Anggota[]>([]);
  const [pembelajaran, setPembelajaran] = useState<Pembelajaran[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const [resRombel, resAnggota, resPembelajaran] = await Promise.all([
        api.get<any>(`/rombel/${id}`),
        api.get<any>(`/rombel/${id}/anggota`),
        api.get<any>(`/rombel/${id}/pembelajaran`)
      ]);
      
      setRombel(resRombel.data);
      setAnggota(resAnggota.data);
      setPembelajaran(resPembelajaran.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!rombel) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-bold">Data Kelas tidak ditemukan</h2>
        <Button onClick={() => navigate('/kelas')} className="mt-4">Kembali ke Daftar Kelas</Button>
      </div>
    );
  }

  return (
    <div className="w-full p-6 space-y-8 mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Button 
            variant="ghost" 
            className="group -ml-3 text-muted-foreground hover:text-foreground gap-2"
            onClick={() => navigate('/kelas')}
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Kembali ke Daftar
          </Button>
          
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0 shadow-inner">
              <Layout className="w-8 h-8 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase italic">{rombel.nama}</h1>
                <span className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest">
                  TINGKAT {rombel.tingkat}
                </span>
              </div>
              <p className="text-muted-foreground font-medium mt-1">Detail Rombongan Belajar • {rombel.tahun_ajaran_nama}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-zinc-900/50 backdrop-blur-xl border border-white/5 p-1 rounded-2xl">
          <TabButton active={activeTab === 'info'} onClick={() => setActiveTab('info')} icon={<Info className="w-4 h-4" />} label="Info Umum" />
          <TabButton active={activeTab === 'siswa'} onClick={() => setActiveTab('siswa')} icon={<Users className="w-4 h-4" />} label={`Siswa (${anggota.length})`} />
          <TabButton active={activeTab === 'pembelajaran'} onClick={() => setActiveTab('pembelajaran')} icon={<BookOpen className="w-4 h-4" />} label="Pembelajaran" />
        </div>
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 gap-8">
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
            <InfoCard 
              icon={<UserIcon className="w-5 h-5 text-sky-400" />} 
              label="Wali Kelas" 
              value={rombel.wali_kelas_nama || 'Belum Ditentukan'} 
              color="sky" 
            />
            <InfoCard 
              icon={<Calendar className="w-5 h-5 text-amber-400" />} 
              label="Tahun Ajaran" 
              value={rombel.tahun_ajaran_nama || '-'} 
              color="amber" 
            />
            <InfoCard 
              icon={<Users className="w-5 h-5 text-indigo-400" />} 
              label="Total Siswa" 
              value={`${anggota.length} Peserta Didik`} 
              color="indigo" 
            />
            
            <div className="md:col-span-3 p-8 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
               <div className="relative space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold">Informasi Akademik</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                    <DetailItem label="Nama Rombel" value={rombel.nama} />
                    <DetailItem label="Tingkat Pendidikan" value={`Kelas ${rombel.tingkat}`} />
                    <DetailItem label="Kurikulum" value="Merdeka / Nasional" />
                    <DetailItem label="Status" value="Aktif" status />
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'siswa' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <DataTable
              columns={[
                { 
                  header: 'Nama Siswa', 
                  render: (s: Anggota) => (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                        {String(s.peserta_didik_nama || '??').substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-bold text-foreground">{s.peserta_didik_nama}</span>
                    </div>
                  )
                },
                { 
                  header: 'NIS / NISN', 
                  render: (s: Anggota) => (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <Hash className="w-3 h-3" />{s.nisn || s.nis || '-'}
                    </div>
                  )
                },
                {
                  header: 'Aksi',
                  align: 'right',
                  render: (_: Anggota) => (
                    <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs" onClick={() => navigate(`/siswa`)}>
                      Lihat Profil <ChevronRight className="w-3 h-3" />
                    </Button>
                  )
                }
              ]}
              data={anggota}
              loading={false}
              searchPlaceholder="Cari siswa di kelas ini..."
            />
          </div>
        )}

        {activeTab === 'pembelajaran' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <DataTable
              columns={[
                { 
                  header: 'Mata Pelajaran', 
                  render: (p: Pembelajaran) => (
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground">{p.mata_pelajaran_nama}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">{p.mata_pelajaran_kode}</span>
                    </div>
                  )
                },
                { 
                  header: 'Guru Pengampu', 
                  render: (p: Pembelajaran) => (
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <UserIcon className="w-3.5 h-3.5 text-primary" />
                      {p.ptk_nama}
                    </div>
                  )
                },
                { 
                  header: 'Beban Jam', 
                  render: (p: Pembelajaran) => (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase">
                      <Clock className="w-3 h-3" /> {p.jam_per_minggu} JP / Minggu
                    </div>
                  )
                }
              ]}
              data={pembelajaran}
              loading={false}
              searchPlaceholder="Cari mata pelajaran..."
            />
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`
        flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300
        ${active 
          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-[1.02]' 
          : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}
      `}
    >
      {icon}
      {label}
    </button>
  );
}

function InfoCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
  const colorMap: any = {
    sky: 'bg-sky-500/10 border-sky-500/20',
    amber: 'bg-amber-500/10 border-amber-500/20',
    indigo: 'bg-indigo-500/10 border-indigo-500/20',
  };
  
  return (
    <div className={`p-6 rounded-3xl border ${colorMap[color]} backdrop-blur-sm space-y-4 hover:scale-[1.02] transition-transform duration-300 group`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-white/10 transition-colors`}>
          {icon}
        </div>
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-xl font-black tracking-tight text-foreground">{value}</div>
    </div>
  );
}

function DetailItem({ label, value, status }: { label: string, value: string, status?: boolean }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</div>
      {status ? (
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-bold text-emerald-400 uppercase tracking-tight">{value}</span>
        </div>
      ) : (
        <div className="text-sm font-bold text-foreground">{value}</div>
      )}
    </div>
  );
}
