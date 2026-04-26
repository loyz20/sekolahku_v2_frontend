import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { 
  GraduationCap, 
  User, 
  Hash, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  BookOpen, 
  Award,
  Clock,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { PageHero } from '@/components/shared/PageHero';

interface GuruDetail {
  id: string;
  nama: string;
  nip: string;
  nuptk: string;
  jenis_kelamin: 'L' | 'P';
  tanggal_lahir: string;
  pendidikan_terakhir: string;
  created_at: string;
}

interface RiwayatPendidikan {
  id: string;
  jenjang: string;
  nama_instansi: string;
  tahun_lulus: number;
}

export default function GuruDetailPage() {
  const { id: teacherId } = useParams();
  const navigate = useNavigate();
  const [guru, setGuru] = useState<GuruDetail | null>(null);
  const [pendidikan, setPendidikan] = useState<RiwayatPendidikan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profil' | 'pendidikan' | 'riwayat'>('profil');

  const formatDate = (dateStr: string | null | undefined, pattern: string = 'dd MMMM yyyy') => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '-';
      return format(date, pattern, { locale: id });
    } catch (e) {
      return '-';
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [guruRes, pendidikanRes] = await Promise.all([
          api.get<{ data: GuruDetail }>(`/ptk/${teacherId}`),
          api.get<{ data: RiwayatPendidikan[] }>(`/ptk/${teacherId}/riwayat-pendidikan`)
        ]);
        setGuru(guruRes.data);
        setPendidikan(pendidikanRes.data);
      } catch (error) {
        console.error('Failed to fetch teacher details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teacherId]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-medium animate-pulse">Memuat data guru...</p>
        </div>
      </div>
    );
  }

  if (!guru) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Data guru tidak ditemukan.</p>
        <Button variant="link" onClick={() => navigate('/guru')} className="mt-4"> Kembali ke Daftar Guru</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <PageHero
        title={guru.nama}
        description="Informasi lengkap tenaga pendidik dan kependidikan"
        icon={<GraduationCap className="w-5 h-5" />}
        variant="violet"
        breadcrumb="Akademik / Detail Tenaga Pendidik"
        onBack={() => navigate('/guru')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Summary */}
        <div className="space-y-6">
          <Card className="overflow-hidden bg-white/5 border-white/10 backdrop-blur-xl">
            <div className="h-24 bg-gradient-to-r from-violet-600/20 to-sky-600/20 border-b border-white/10" />
            <div className="px-6 pb-6">
              <div className="relative -mt-12 mb-4">
                <div className="w-24 h-24 rounded-2xl bg-card border-4 border-background flex items-center justify-center shadow-xl">
                  <User className="w-12 h-12 text-muted-foreground/40" />
                </div>
                <div className={`absolute bottom-0 left-20 w-5 h-5 rounded-full border-4 border-background ${guru.jenis_kelamin === 'L' ? 'bg-sky-500' : 'bg-pink-500'}`} />
              </div>
              
              <div className="space-y-1 mb-6">
                <h2 className="text-xl font-bold">{guru.nama}</h2>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-tighter">{guru.pendidikan_terakhir} • PTK</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
                    <Hash className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">NIP</p>
                    <p className="text-sm font-mono font-bold tracking-tight">{guru.nip}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">NUPTK</p>
                    <p className="text-sm font-mono font-bold tracking-tight">{guru.nuptk || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Informasi Kontak</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{guru.nip.toLowerCase()}@sekolah.id</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>+62 812-XXXX-XXXX</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>Alamat belum dilengkapi</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Details & Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl w-fit">
            <button 
              onClick={() => setActiveTab('profil')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'profil' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-white/5'}`}
            >
              PROFIL DETAIL
            </button>
            <button 
              onClick={() => setActiveTab('pendidikan')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'pendidikan' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-white/5'}`}
            >
              RIWAYAT PENDIDIKAN
            </button>
            <button 
              onClick={() => setActiveTab('riwayat')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'riwayat' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-white/5'}`}
            >
              RIWAYAT KERJA
            </button>
          </div>

          {activeTab === 'profil' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 bg-white/5 border-white/10 space-y-4">
                <h3 className="flex items-center gap-2 text-sm font-bold border-b border-white/5 pb-3">
                  <User className="w-4 h-4 text-primary" />
                  Identitas Pribadi
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Nama Lengkap</p>
                    <p className="font-medium">{guru.nama}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Jenis Kelamin</p>
                    <p className="font-medium">{guru.jenis_kelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Tanggal Lahir</p>
                    <p className="font-medium">
                      {formatDate(guru.tanggal_lahir)}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white/5 border-white/10 space-y-4">
                <h3 className="flex items-center gap-2 text-sm font-bold border-b border-white/5 pb-3">
                  <Briefcase className="w-4 h-4 text-primary" />
                  Kepegawaian
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Pendidikan Terakhir</p>
                    <p className="font-medium">{guru.pendidikan_terakhir}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Terdaftar Sejak</p>
                    <p className="font-medium">
                      {formatDate(guru.created_at)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <p className="text-[10px] font-bold text-primary uppercase mb-1">Status Kepegawaian</p>
                    <p className="text-sm font-bold">AKTIF</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'pendidikan' && (
            <Card className="bg-white/5 border-white/10 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Riwayat Pendidikan
                </h3>
                <Button size="sm" className="h-8 text-[10px] font-bold px-3">TAMBAH RIWAYAT</Button>
              </div>
              <div className="divide-y divide-white/5">
                {pendidikan.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground text-sm">
                    Belum ada data riwayat pendidikan.
                  </div>
                ) : (
                  pendidikan.map((p) => (
                    <div key={p.id} className="p-6 flex items-start gap-4 hover:bg-white/3 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 font-black text-xs">
                        {p.jenjang}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-foreground">{p.nama_instansi}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 font-medium">
                          <Clock className="w-3 h-3" />
                          Lulus Tahun {p.tahun_lulus}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/30 self-center" />
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}

          {activeTab === 'riwayat' && (
            <Card className="p-12 text-center bg-white/5 border-white/10">
              <Briefcase className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-1">Riwayat Kerja</h3>
              <p className="text-sm text-muted-foreground">Fitur riwayat kerja sedang dalam pengembangan.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
