import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { 
  User, 
  Calendar, 
  Users, 
  Heart, 
  BookOpen, 
  MapPin, 
  Phone,
  GraduationCap,
  Layout
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHero } from '@/components/shared/PageHero';

interface Siswa {
  id: string;
  nama: string;
  tempat_lahir: string;
  nis: string;
  nisn: string;
  jenis_kelamin: 'L' | 'P';
  tanggal_lahir: string;
  nama_ayah: string;
  nama_ibu: string;
  kelas?: string;
  tingkat?: number;
}

export default function SiswaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [siswa, setSiswa] = useState<Siswa | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>(`/siswa/${id}`);
      setSiswa(res.data);
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

  if (!siswa) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-bold">Data Siswa tidak ditemukan</h2>
        <Button onClick={() => navigate(-1)} className="mt-4">Kembali ke Halaman Sebelumnya</Button>
      </div>
    );
  }

  return (
    <div className="w-full p-6 space-y-8 mx-auto animate-in fade-in duration-500">
      <PageHero
        title={siswa.nama}
        description={`Identitas lengkap peserta didik - NIS: ${siswa.nis}`}
        icon={<User className="w-5 h-5" />}
        variant="sky"
        breadcrumb="Kesiswaan / Detail Peserta Didik"
        onBack={() => navigate(-1)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Info */}
        <div className="space-y-6">
           <div className="p-6 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-md space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl -mr-16 -mt-16" />
              
              <div className="flex items-center gap-3 text-sky-400">
                <GraduationCap className="w-5 h-5" />
                <h3 className="text-sm font-black uppercase tracking-widest">Informasi Kelas</h3>
              </div>

              <div className="space-y-4 relative">
                <SidebarItem icon={<Layout className="w-4 h-4 text-muted-foreground" />} label="Kelas Aktif" value={siswa.kelas || 'Belum Ditempatkan'} highlight={!!siswa.kelas} />
                <SidebarItem icon={<Users className="w-4 h-4 text-muted-foreground" />} label="Tingkat" value={siswa.tingkat ? `Tingkat ${siswa.tingkat}` : '-'} />
                <SidebarItem icon={<Calendar className="w-4 h-4 text-muted-foreground" />} label="Status" value="Aktif" status />
              </div>
           </div>

           <div className="p-6 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-md space-y-4">
              <div className="flex items-center gap-3 text-pink-400">
                <Heart className="w-5 h-5" />
                <h3 className="text-sm font-black uppercase tracking-widest">Keluarga</h3>
              </div>
              <div className="space-y-4">
                <SidebarItem label="Nama Ayah" value={siswa.nama_ayah || 'Tidak Ada Data'} />
                <SidebarItem label="Nama Ibu" value={siswa.nama_ibu || 'Tidak Ada Data'} />
              </div>
           </div>
        </div>

        {/* Main Content Info */}
        <div className="lg:col-span-2 space-y-8">
           <div className="p-8 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mb-32 -mr-32" />
              
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Profil Lengkap</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                <ProfileDetail label="Nama Lengkap" value={siswa.nama} />
                <ProfileDetail label="Nomor Induk Siswa (NIS)" value={siswa.nis} />
                <ProfileDetail label="Nomor Induk Siswa Nasional (NISN)" value={siswa.nisn || '-'} />
                <ProfileDetail label="Tempat, Tanggal Lahir" value={`${siswa.tempat_lahir || '-'}, ${siswa.tanggal_lahir ? new Date(siswa.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}`} />
                <ProfileDetail label="Jenis Kelamin" value={siswa.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ContactCard icon={<MapPin className="w-5 h-5" />} label="Alamat Tempat Tinggal" value="Jl. Pendidikan No. 123, Kota Sekolah" />
              <ContactCard icon={<Phone className="w-5 h-5" />} label="Kontak Orang Tua" value="+62 812-3456-7890" />
           </div>
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, value, highlight, status }: { icon?: React.ReactNode, label: string, value: string, highlight?: boolean, status?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
        {icon}
        {label}
      </div>
      {status ? (
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-bold text-emerald-400 uppercase tracking-tight">{value}</span>
        </div>
      ) : (
        <div className={`text-sm font-bold ${highlight ? 'text-sky-400' : 'text-foreground'}`}>{value}</div>
      )}
    </div>
  );
}

function ProfileDetail({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-1.5 border-l-2 border-white/5 pl-4 hover:border-primary/40 transition-colors">
      <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</div>
      <div className="text-base font-bold text-foreground">{value}</div>
    </div>
  );
}

function ContactCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="p-6 rounded-3xl bg-zinc-900/40 border border-white/5 flex gap-4 hover:bg-white/5 transition-colors">
      <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-muted-foreground">
        {icon}
      </div>
      <div className="space-y-1">
        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</div>
        <div className="text-sm font-medium text-foreground">{value}</div>
      </div>
    </div>
  );
}
