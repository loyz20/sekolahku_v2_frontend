import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { Plus, User, Trash2, Sparkles, Users, Award, Calendar, History, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { FormField } from '@/components/shared/FormField';
import { Modal } from '@/components/shared/Modal';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { PageHero } from '@/components/shared/PageHero';
import { showToast } from '@/lib/toast-utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Student {
  id: string;
  nama: string;
  nis: string;
}

interface RewardRecord {
  id: string;
  peserta_didik_id: string;
  student_name: string;
  student_nis: string;
  nama: string;
  poin: number;
  tanggal: string;
  created_at: string;
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: 'emerald' | 'sky' | 'violet' | 'amber' }) {
  const colors = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    sky: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
  };

  return (
    <div className="relative group overflow-hidden rounded-[2.5rem] border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 transition-all duration-500 hover:border-white/10">
      <div className="flex items-center justify-between relative z-10">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{title}</p>
          <h3 className="text-3xl font-black tracking-tighter text-foreground">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-[0.03] group-hover:opacity-[0.05] transition-opacity ${color === 'emerald' ? 'bg-emerald-500' : 'bg-primary'}`} />
    </div>
  );
}

export default function PrestasiSiswaPage() {
  const [rewards, setRewards] = useState<RewardRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    peserta_didik_ids: [] as string[],
    nama: '',
    poin: 0,
    tanggal: new Date().toISOString().split('T')[0]
  });
  const [tempStudentId, setTempStudentId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resRewards, resStudents] = await Promise.all([
        api.get('/pelanggaran/reward'),
        api.get('/siswa?limit=1000')
      ]);
      setRewards((resRewards as any).data);
      setStudents((resStudents as any).data.items || []);
    } catch (e) {
      console.error(e);
      showToast.error('Gagal mengambil data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (formData.peserta_didik_ids.length === 0 || !formData.nama || formData.poin <= 0) {
      showToast.error('Mohon lengkapi data prestasi');
      return;
    }

    setSaving(true);
    try {
      await Promise.all(formData.peserta_didik_ids.map(sid => 
        api.post('/pelanggaran/reward', {
          peserta_didik_id: sid,
          nama: formData.nama,
          poin: formData.poin,
          tanggal: formData.tanggal
        })
      ));

      showToast.success('Prestasi berhasil dicatat');
      setIsModalOpen(false);
      setFormData({
        peserta_didik_ids: [],
        nama: '',
        poin: 0,
        tanggal: new Date().toISOString().split('T')[0]
      });
      fetchData();
    } catch (e: any) {
      showToast.error(e.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus data prestasi ini? Poin siswa akan kembali dikalkulasi.')) return;
    try {
      await api.delete(`/pelanggaran/reward/${id}`);
      showToast.success('Data dihapus');
      fetchData();
    } catch (e) {
      showToast.error('Gagal menghapus data');
    }
  };

  const stats = useMemo(() => {
    const totalPoin = rewards.reduce((acc, curr) => acc + Number(curr.poin || 0), 0);
    const uniqueStudents = new Set(rewards.map(r => r.peserta_didik_id)).size;
    return { totalPoin, totalPrestasi: rewards.length, uniqueStudents };
  }, [rewards]);

  const columns = [
    {
      header: 'Peserta Didik',
      render: (r: RewardRecord) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 shadow-inner font-black text-emerald-400">
            {r.student_name?.charAt(0)}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground text-sm uppercase">{r.student_name}</span>
            <span className="text-[10px] text-muted-foreground font-black tracking-widest italic">NIS: {r.student_nis}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Prestasi / Penghargaan',
      render: (r: RewardRecord) => (
        <div className="flex flex-col gap-1">
          <span className="font-bold text-foreground text-sm">{r.nama}</span>
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground font-medium">
              {format(new Date(r.tanggal), 'dd MMMM yyyy', { locale: id })}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Reward Poin',
      render: (r: RewardRecord) => (
        <div className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-black text-xs inline-block">
          -{r.poin} Poin
        </div>
      )
    },
    {
      header: 'Aksi',
      render: (r: RewardRecord) => (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => handleDelete(r.id)} 
          className="h-8 w-8 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )
    }
  ];

  return (
    <div className="w-full p-6 space-y-8 mx-auto animate-in fade-in duration-700 max-w-7xl">
      <PageHero
        title="PRESTASI & APRESIASI"
        description="Catat dan pantau pencapaian positif siswa sebagai penyeimbang poin perilaku."
        icon={<Sparkles className="w-5 h-5" />}
        variant="emerald"
        breadcrumb="Kesiswaan / Reward Siswa"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Poin Reward" value={stats.totalPoin} icon={Award} color="emerald" />
        <StatCard title="Total Sertifikat/Apresiasi" value={stats.totalPrestasi} icon={Sparkles} color="sky" />
        <StatCard title="Siswa Berprestasi" value={stats.uniqueStudents} icon={User} color="violet" />
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-black tracking-tight text-foreground flex items-center gap-3">
            <History className="w-5 h-5 text-emerald-500" /> JURNAL PRESTASI GLOBAL
          </h2>
          
          <Button 
            onClick={() => setIsModalOpen(true)} 
            className="h-11 px-8 w-full sm:w-auto gap-3 text-white shadow-xl shadow-emerald-900/20 bg-emerald-600 hover:bg-emerald-700 font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl text-[10px]"
          >
            <Plus className="w-4 h-4" /> Input Prestasi Baru
          </Button>
        </div>

        <div className="rounded-[2.5rem] bg-zinc-900/40 border border-white/5 backdrop-blur-sm overflow-hidden shadow-2xl">
          <DataTable
            columns={columns}
            data={rewards}
            loading={loading}
            searchPlaceholder="Cari berdasarkan nama siswa atau jenis prestasi..."
          />
        </div>
      </div>

      {/* Modal: Input */}
      {isModalOpen && (
        <Modal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)} 
          title="Catat Prestasi / Reward"
          description="Apresiasi setiap pencapaian siswa untuk memotivasi perilaku positif."
          onSubmit={handleSave}
          saving={saving}
          maxWidth="3xl"
        >
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Users className="w-4 h-4" /> Pilih Siswa Berprestasi
              </label>
              <SearchableSelect
                id="student_select"
                placeholder="Ketik nama atau NIS..."
                value={tempStudentId}
                onChange={(val) => {
                  if (!formData.peserta_didik_ids.includes(val)) {
                    setFormData({ ...formData, peserta_didik_ids: [...formData.peserta_didik_ids, val] });
                  }
                  setTempStudentId('');
                }}
                options={students.map(s => ({ value: s.id, label: `${s.nama} (${s.nis})` }))}
              />
              <div className="flex flex-wrap gap-2">
                {formData.peserta_didik_ids.map(sid => {
                  const s = students.find(x => x.id === sid);
                  return (
                    <div key={sid} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 animate-in zoom-in-95">
                      <span className="text-[10px] font-bold uppercase truncate max-w-[150px]">{s?.nama}</span>
                      <button onClick={() => setFormData({ ...formData, peserta_didik_ids: formData.peserta_didik_ids.filter(x => x !== sid) })} className="text-muted-foreground hover:text-rose-500">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
              <div className="space-y-6">
                <FormField 
                  id="prestasi_nama" 
                  label="Nama Prestasi / Kegiatan" 
                  placeholder="Contoh: Juara 1 Lomba Debat Bahasa Inggris" 
                  value={formData.nama} 
                  onChange={(v) => setFormData({ ...formData, nama: v })} 
                  required
                />
                <FormField 
                  id="prestasi_poin" 
                  label="Poin Pengurang (Reward)" 
                  type="number" 
                  value={formData.poin} 
                  onChange={(v) => setFormData({ ...formData, poin: Number(v) })} 
                  required
                />
              </div>
              <FormField 
                id="tanggal" 
                label="Tanggal Penghargaan" 
                type="date" 
                value={formData.tanggal} 
                onChange={(v) => setFormData({ ...formData, tanggal: v })} 
                required
              />
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-black text-emerald-200 uppercase tracking-tight">Motivasi Humanis</p>
                <p className="text-[10px] text-emerald-200/60 leading-relaxed font-medium">
                  Reward ini akan otomatis mengurangi akumulasi poin pelanggaran siswa, memberikan kesempatan untuk memperbaiki status kedisiplinan.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
