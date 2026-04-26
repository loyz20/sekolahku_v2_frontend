import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { Plus, User, History, AlertCircle, X, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { FormField } from '@/components/shared/FormField';
import { Modal } from '@/components/shared/Modal';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { PageHero } from '@/components/shared/PageHero';
import { showToast } from '@/lib/toast-utils';

interface Student {
  id: string;
  nama: string;
  nis: string;
  total_pelanggaran?: number;
  total_reward?: number;
  total_poin?: number;
  kelas?: string;
}

interface ViolationRecord {
  id: string;
  pelanggaran_nama: string;
  kategori: string;
  tanggal: string;
  catatan: string;
  poin_snapshot: number;
  reporter: string;
}

interface RewardRecord {
  id: string;
  nama: string;
  poin: number;
  tanggal: string;
}

interface MasterPelanggaran {
  id: string;
  nama: string;
  kategori: string;
  poin: number;
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

// ─── Sub-components ──────────────────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, color, subtext }: { title: string, value: string | number, icon: any, color: 'rose' | 'amber' | 'emerald' | 'sky' | 'violet', subtext?: string }) {
  const colors = {
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    sky: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20'
  };

  return (
    <div className="relative group overflow-hidden rounded-[2.5rem] border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 transition-all duration-500 hover:border-white/10">
      <div className="flex items-center justify-between relative z-10">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{title}</p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-black tracking-tighter text-foreground">{value}</h3>
            {subtext && <span className="text-[10px] font-bold text-muted-foreground mb-1">{subtext}</span>}
          </div>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-[0.03] group-hover:opacity-[0.05] transition-opacity ${color === 'rose' ? 'bg-rose-500' : 'bg-primary'}`} />
    </div>
  );
}

export default function PelanggaranSiswaPage() {
  const [leaderboard, setLeaderboard] = useState<Student[]>([]);
  const [masterList, setMasterList] = useState<MasterPelanggaran[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'pelanggaran' | 'reward'>('pelanggaran');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [history, setHistory] = useState<ViolationRecord[]>([]);
  const [rewards, setRewards] = useState<RewardRecord[]>([]);
  const [bkSummary, setBkSummary] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    peserta_didik_ids: [] as string[],
    master_pelanggaran_id: '',
    nama_prestasi: '',
    poin: 0,
    tanggal: new Date().toISOString().split('T')[0],
    catatan: ''
  });
  const [tempStudentId, setTempStudentId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resLeader, resMaster, resStudents] = await Promise.all([
        api.get('/pelanggaran/leaderboard'),
        api.get('/pelanggaran/master'),
        api.get('/siswa?limit=1000')
      ]);
      setLeaderboard((resLeader as any).data);
      setMasterList((resMaster as any).data);
      setStudents((resStudents as any).data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchStudentDetails = async (studentId: string) => {
    try {
      const [resHist, resRew, resSum] = await Promise.all([
        api.get(`/pelanggaran/history/${studentId}`),
        api.get(`/pelanggaran/rewards/${studentId}`),
        api.get(`/pelanggaran/summary/${studentId}`)
      ]);
      setHistory((resHist as any).data);
      setRewards((resRew as any).data);
      setBkSummary((resSum as any).data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenDetail = (student: Student) => {
    setSelectedStudent(student);
    fetchStudentDetails(student.id);
  };

  const handleSave = async () => {
    if (formData.peserta_didik_ids.length === 0) {
      showToast.error('Mohon pilih minimal 1 siswa');
      return;
    }

    setSaving(true);
    try {
      if (activeTab === 'pelanggaran') {
        if (!formData.master_pelanggaran_id) throw new Error('Pilih jenis pelanggaran');
        await api.post('/pelanggaran/incident', {
          peserta_didik_ids: formData.peserta_didik_ids,
          master_pelanggaran_id: formData.master_pelanggaran_id,
          tanggal: formData.tanggal,
          catatan: formData.catatan
        });
      } else {
        if (!formData.nama_prestasi || formData.poin <= 0) throw new Error('Isi nama prestasi dan poin');
        // Simple loop for multiple students for reward (could be optimized in backend)
        await Promise.all(formData.peserta_didik_ids.map(sid => 
          api.post('/pelanggaran/reward', {
            peserta_didik_id: sid,
            nama: formData.nama_prestasi,
            poin: formData.poin,
            tanggal: formData.tanggal
          })
        ));
      }

      showToast.success('Data berhasil disimpan');
      setIsModalOpen(false);
      setFormData({
        peserta_didik_ids: [],
        master_pelanggaran_id: '',
        nama_prestasi: '',
        poin: 0,
        tanggal: new Date().toISOString().split('T')[0],
        catatan: ''
      });
      fetchData();
    } catch (e: any) {
      showToast.error(e.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    const totalPoin = leaderboard.reduce((acc, curr) => acc + Number(curr.total_poin || 0), 0);
    const critical = leaderboard.filter(s => Number(s.total_poin || 0) > 50).length;
    const warning = leaderboard.filter(s => {
      const p = Number(s.total_poin || 0);
      return p > 20 && p <= 50;
    }).length;
    return { totalPoin, critical, warning, totalSiswa: leaderboard.length };
  }, [leaderboard]);

  const columnsLeaderboard = [
    {
      header: 'Peserta Didik',
      render: (s: Student) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 shadow-inner font-black text-primary">
            {s.nama?.charAt(0)}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground text-sm uppercase">{s.nama}</span>
            <span className="text-[10px] text-muted-foreground font-black tracking-widest italic">NIS: {s.nis}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Net Poin',
      render: (s: Student) => {
        const points = Number(s.total_poin || 0);
        let status = 'Aman';
        let color = 'emerald';
        if (points > 50) { status = 'Pembinaan'; color = 'rose'; }
        else if (points > 20) { status = 'Peringatan'; color = 'amber'; }

        return (
          <div className="flex items-center gap-4">
            <div className={`px-4 py-1 rounded-xl font-black text-base min-w-[50px] text-center ${
              color === 'rose' ? 'text-rose-500 bg-rose-500/10 border border-rose-500/20' :
              color === 'amber' ? 'text-amber-500 bg-amber-500/10 border border-amber-500/20' :
              'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20'
            }`}>
              {points}
            </div>
            <div className={`text-[10px] font-black uppercase tracking-widest ${color === 'rose' ? 'text-rose-400' : color === 'amber' ? 'text-amber-400' : 'text-emerald-400'}`}>
              {status}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Aksi',
      render: (s: Student) => (
        <Button variant="ghost" size="sm" onClick={() => handleOpenDetail(s)} className="h-9 px-4 rounded-xl gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all">
          <History className="w-3.5 h-3.5" /> Monitoring Detail
        </Button>
      )
    }
  ];

  return (
    <div className="w-full p-6 space-y-8 mx-auto animate-in fade-in duration-700 max-w-7xl">
      <PageHero
        title="MONITORING PERILAKU"
        description="Pantau kedisiplinan (pelanggaran) dan apresiasi (prestasi) secara seimbang."
        icon={<AlertCircle className="w-5 h-5" />}
        variant="rose"
        breadcrumb="Kesiswaan / Buku Saku BK"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Poin Net Global" value={stats.totalPoin} icon={AlertCircle} color="rose" />
        <StatCard title="Siswa Pembinaan" value={stats.critical} icon={User} color="rose" subtext="> 50 Poin" />
        <StatCard title="Siswa Peringatan" value={stats.warning} icon={AlertCircle} color="amber" subtext="> 20 Poin" />
        <StatCard title="Siswa Terpantau" value={stats.totalSiswa} icon={Users} color="sky" />
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex bg-zinc-900/60 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md">
            <button 
              onClick={() => setActiveTab('pelanggaran')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pelanggaran' ? 'bg-rose-500 text-white shadow-lg shadow-rose-900/20' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Catat Pelanggaran
            </button>
            <button 
              onClick={() => setActiveTab('reward')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'reward' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/20' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Catat Prestasi
            </button>
          </div>
          
          <Button 
            onClick={() => setIsModalOpen(true)} 
            className={`h-11 px-8 w-full sm:w-auto gap-3 text-white shadow-xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl text-[10px] ${activeTab === 'pelanggaran' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-900/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20'}`}
          >
            <Plus className="w-4 h-4" /> {activeTab === 'pelanggaran' ? 'Input Pelanggaran' : 'Input Prestasi'}
          </Button>
        </div>

        <div className="rounded-[2.5rem] bg-zinc-900/40 border border-white/5 backdrop-blur-sm overflow-hidden shadow-2xl">
          <DataTable
            columns={columnsLeaderboard}
            data={leaderboard}
            loading={loading}
            searchPlaceholder="Cari siswa berdasarkan nama atau NIS..."
          />
        </div>
      </div>

      {/* Modal: Input */}
      {isModalOpen && (
        <Modal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)} 
          title={activeTab === 'pelanggaran' ? "Catat Insiden Pelanggaran" : "Catat Prestasi / Reward"}
          onSubmit={handleSave}
          saving={saving}
          maxWidth="3xl"
        >
          <div className="space-y-8">
            {/* Student Picker */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Users className="w-4 h-4" /> Pilih Siswa Terlibat
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
              {activeTab === 'pelanggaran' ? (
                <SearchableSelect
                  id="v_id"
                  label="Jenis Pelanggaran"
                  value={formData.master_pelanggaran_id}
                  onChange={(v) => setFormData({ ...formData, master_pelanggaran_id: v })}
                  options={masterList.map(m => ({ value: m.id, label: `${m.nama} (${m.poin} Poin)` }))}
                />
              ) : (
                <div className="space-y-6">
                  <FormField id="prestasi_nama" label="Nama Prestasi" placeholder="Contoh: Juara 1 Lomba Catur" value={formData.nama_prestasi} onChange={(v) => setFormData({ ...formData, nama_prestasi: v })} />
                  <FormField id="prestasi_poin" label="Poin Reward" type="number" value={formData.poin} onChange={(v) => setFormData({ ...formData, poin: Number(v) })} />
                </div>
              )}
              <FormField id="tanggal" label="Tanggal Kejadian" type="date" value={formData.tanggal} onChange={(v) => setFormData({ ...formData, tanggal: v })} />
            </div>

            {activeTab === 'pelanggaran' && (
              <FormField id="catatan" label="Kronologi / Catatan" isTextArea placeholder="Detail kejadian..." value={formData.catatan} onChange={(v) => setFormData({ ...formData, catatan: v })} />
            )}
          </div>
        </Modal>
      )}

      {/* Modal: Monitoring Detail */}
      {selectedStudent && (
        <Modal isOpen={!!selectedStudent} onClose={() => setSelectedStudent(null)} title={`Monitoring: ${selectedStudent.nama}`} maxWidth="4xl" showFooter={false}>
          <div className="space-y-8 max-h-[80vh] overflow-y-auto pr-2">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-[2rem] bg-rose-500/5 border border-rose-500/10 text-center">
                <p className="text-[9px] font-black uppercase text-rose-400 mb-1">Pelanggaran</p>
                <p className="text-2xl font-black text-rose-500">{bkSummary?.violations || 0}</p>
                <p className="text-[8px] text-muted-foreground uppercase">{bkSummary?.total_kasus || 0} Kasus</p>
              </div>
              <div className="p-4 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10 text-center">
                <p className="text-[9px] font-black uppercase text-emerald-400 mb-1">Apresiasi</p>
                <p className="text-2xl font-black text-emerald-500">{bkSummary?.rewards || 0}</p>
                <p className="text-[8px] text-muted-foreground uppercase">{bkSummary?.total_prestasi || 0} Prestasi</p>
              </div>
              <div className="p-4 rounded-[2rem] bg-zinc-900 border border-white/5 text-center">
                <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Poin Net</p>
                <p className="text-2xl font-black text-white">{bkSummary?.total_poin || 0}</p>
                <p className="text-[8px] text-muted-foreground uppercase">Saldo Akhir</p>
              </div>
              <div className={`p-4 rounded-[2rem] border text-center ${bkSummary?.status === 'Pembinaan' ? 'bg-rose-500/10 border-rose-500/20' : bkSummary?.status === 'Peringatan' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                <p className="text-[9px] font-black uppercase mb-1 opacity-60">Status</p>
                <p className={`text-xl font-black ${bkSummary?.status === 'Pembinaan' ? 'text-rose-500' : bkSummary?.status === 'Peringatan' ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {bkSummary?.status || 'Aman'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* History Pelanggaran */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Riwayat Pelanggaran
                </h4>
                {history.map(h => (
                  <div key={h.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2 group hover:border-rose-500/20 transition-all">
                    <div className="flex justify-between items-start">
                      <h5 className="font-bold text-sm text-foreground">{h.pelanggaran_nama}</h5>
                      <span className="text-[10px] font-black text-rose-500">+{h.poin_snapshot}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{h.catatan}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[9px] font-bold text-muted-foreground uppercase">
                      <span>{new Date(h.tanggal).toLocaleDateString('id-ID')}</span>
                      <span>By: {h.reporter}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* History Reward */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Riwayat Prestasi
                </h4>
                {rewards.map(r => (
                  <div key={r.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2 group hover:border-emerald-500/20 transition-all">
                    <div className="flex justify-between items-start">
                      <h5 className="font-bold text-sm text-foreground">{r.nama}</h5>
                      <span className="text-[10px] font-black text-emerald-500">-{r.poin}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[9px] font-bold text-muted-foreground uppercase">
                      <span>{new Date(r.tanggal).toLocaleDateString('id-ID')}</span>
                      <span>Reward Poin</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
