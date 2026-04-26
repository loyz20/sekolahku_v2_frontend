import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '@/lib/api';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Trash2, 
  User,
  Settings,
  BookOpen,
  Users,
  Filter
} from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { FormField } from '@/components/shared/FormField';
import { useAuth } from '@/contexts/AuthContext';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { showToast } from '@/lib/toast-utils';
import { PageHero } from '@/components/shared/PageHero';
import { FilterBar } from '@/components/shared/FilterBar';
import { SearchableSelect } from '@/components/shared/SearchableSelect';

interface Jadwal {
  id: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  ruangan?: string;
  mata_pelajaran_nama: string;
  rombel_nama: string;
  ptk_nama: string;
  pembelajaran_id: string;
}

interface Pembelajaran {
  id: string;
  rombel_id: string;
  mata_pelajaran_nama: string;
  ptk_nama: string;
  rombel_nama: string;
}

interface Rombel {
  id: string;
  nama: string;
}

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export default function JadwalPage() {
  const { user } = useAuth();
  const [jadwals, setJadwals] = useState<Jadwal[]>([]);
  const [pembelajarans, setPembelajarans] = useState<Pembelajaran[]>([]);
  const [rombels, setRombels] = useState<Rombel[]>([]);
  
  const [selectedRombel, setSelectedRombel] = useState('');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    pembelajaran_id: '',
    hari: 'Senin',
    jam_mulai: '',
    jam_selesai: '',
    ruangan: ''
  });

  const today = useMemo(() => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[new Date().getDay()];
  }, []);

  const fetchInitialData = useCallback(async () => {
    try {
      const [resPem, resRombel] = await Promise.all([
        api.get('/pembelajaran?limit=500'),
        api.get('/rombel?limit=100')
      ]);
      const pemList = (resPem as any).data.items;
      setPembelajarans(pemList);
      
      let filteredRombels = (resRombel as any).data.items;
      if (user?.role === 'guru') {
        const taughtRombelIds = new Set(pemList.map((p: any) => p.rombel_id));
        filteredRombels = filteredRombels.filter((r: any) => taughtRombelIds.has(r.id));
      }
      
      setRombels(filteredRombels);
      if (filteredRombels.length > 0 && !selectedRombel) {
        setSelectedRombel(filteredRombels[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  }, [user, selectedRombel]);

  const fetchJadwal = useCallback(async () => {
    if (!selectedRombel) return;
    try {
      const res = await api.get(`/jadwal?rombel_id=${selectedRombel}`);
      setJadwals((res as any).data);
    } catch (e) {
      console.error(e);
    }
  }, [selectedRombel]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    fetchJadwal();
  }, [fetchJadwal]);

  const handleSave = async () => {
    if (!formData.pembelajaran_id || !formData.jam_mulai || !formData.jam_selesai) {
      showToast.error('Mohon lengkapi mata pelajaran dan waktu');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/jadwal/${editingId}`, formData);
        showToast.success('Jadwal diperbarui');
      } else {
        await api.post('/jadwal', formData);
        showToast.success('Jadwal ditambahkan');
      }
      setIsModalOpen(false);
      fetchJadwal();
    } catch (e: any) {
      showToast.error(e.message || 'Gagal menyimpan jadwal');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (j: Jadwal) => {
    setEditingId(j.id);
    setFormData({
      pembelajaran_id: j.pembelajaran_id,
      hari: j.hari,
      jam_mulai: j.jam_mulai,
      jam_selesai: j.jam_selesai,
      ruangan: j.ruangan || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus jadwal ini?')) return;
    try {
      await api.delete(`/jadwal/${id}`);
      showToast.success('Jadwal dihapus');
      fetchJadwal();
    } catch (e) {
      showToast.error('Gagal menghapus jadwal');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      pembelajaran_id: '',
      hari: 'Senin',
      jam_mulai: '',
      jam_selesai: '',
      ruangan: ''
    });
  };

  const handleExport = () => {
    if (jadwals.length === 0) {
      showToast.error('Tidak ada data untuk diexport');
      return;
    }

    const dataToExport = jadwals.map(j => ({
      'Hari': j.hari,
      'Waktu': `${j.jam_mulai.substring(0, 5)} - ${j.jam_selesai.substring(0, 5)}`,
      'Mata Pelajaran': j.mata_pelajaran_nama,
      'Guru': j.ptk_nama,
      'Kelas': j.rombel_nama,
      'Ruangan': j.ruangan || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Jadwal Pelajaran');
    XLSX.writeFile(wb, `Jadwal_${currentRombelName}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    showToast.success('Berhasil export ke Excel');
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredJadwals = useMemo(() => {
    if (!search) return jadwals;
    const s = search.toLowerCase();
    return jadwals.filter(j => 
      j.mata_pelajaran_nama.toLowerCase().includes(s) || 
      j.ptk_nama.toLowerCase().includes(s) ||
      j.ruangan?.toLowerCase().includes(s)
    );
  }, [jadwals, search]);

  const stats = useMemo(() => {
    const totalSessions = jadwals.length;
    const uniqueTeachers = new Set(jadwals.map(j => j.ptk_nama)).size;
    const uniqueSubjects = new Set(jadwals.map(j => j.mata_pelajaran_nama)).size;
    const uniqueRooms = new Set(jadwals.filter(j => j.ruangan).map(j => j.ruangan)).size;

    return { totalSessions, uniqueTeachers, uniqueSubjects, uniqueRooms };
  }, [jadwals]);

  const currentRombelName = rombels.find(r => r.id === selectedRombel)?.nama || 'Semua Kelas';

  return (
    <div className="w-full p-6 space-y-8 mx-auto animate-in fade-in duration-700 print:p-0 print:m-0">
      <div className="print:hidden">
        <PageHero
          title="Jadwal Pembelajaran"
          description={`Manajemen waktu belajar mengajar untuk kelas ${currentRombelName}`}
          icon={<Calendar className="w-5 h-5" />}
          variant="primary"
          breadcrumb="Akademik / Jadwal Pelajaran"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 print:hidden">
        <StatsCard icon={<Clock className="w-5 h-5 text-sky-400" />} label="Total Sesi" value={stats.totalSessions} color="sky" />
        <StatsCard icon={<Users className="w-5 h-5 text-emerald-400" />} label="Guru Terlibat" value={stats.uniqueTeachers} color="emerald" />
        <StatsCard icon={<BookOpen className="w-5 h-5 text-pink-400" />} label="Mata Pelajaran" value={stats.uniqueSubjects} color="pink" />
        <StatsCard icon={<MapPin className="w-5 h-5 text-amber-400" />} label="Ruangan Digunakan" value={stats.uniqueRooms} color="amber" />
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari mapel, guru, atau ruangan..."
        onAdd={() => { resetForm(); setIsModalOpen(true); }}
        onExport={handleExport}
        onTemplate={handlePrint}
        addTooltip="Tambah Jadwal Baru"
        exportTooltip="Export ke Excel"
        templateTooltip="Cetak Jadwal"
        filters={[
          {
            label: 'Filter Kelas',
            value: selectedRombel,
            icon: Filter,
            onChange: setSelectedRombel,
            options: [
              { label: 'Semua Kelas', value: '' },
              ...rombels.map(r => ({ label: `Kelas ${r.nama}`, value: r.id }))
            ]
          }
        ]}
      />

      {/* Schedule Grid Area */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-zinc-900/60 border border-white/5 backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Kalender Akademik Kelas {currentRombelName}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6">
          {HARI.map(hari => {
            const items = filteredJadwals.filter(j => j.hari === hari);
            const isToday = hari === today;
            
            return (
              <div key={hari} className={`flex flex-col gap-4 ${isToday ? 'scale-[1.02] relative' : ''}`}>
                {isToday && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-[10px] font-black uppercase rounded-full shadow-lg shadow-primary/20 z-10 animate-bounce">
                    HARI INI
                  </div>
                )}
                <div className={`flex items-center justify-between px-2 py-1 rounded-xl transition-colors ${isToday ? 'bg-primary/10 border border-primary/20' : ''}`}>
                  <span className={`text-xs font-black uppercase tracking-widest ${isToday ? 'text-primary' : 'text-muted-foreground/60'}`}>{hari}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isToday ? 'bg-primary text-white' : 'bg-white/5 border border-white/10'}`}>{items.length} Sesi</span>
                </div>
                
                <div className="space-y-4">
                  {items.length === 0 ? (
                    <div className="p-8 rounded-3xl border border-dashed border-white/5 flex flex-col items-center justify-center gap-2 opacity-20">
                      <Clock className="w-8 h-8" />
                      <span className="text-[10px] font-bold uppercase tracking-tighter">Kosong</span>
                    </div>
                  ) : (
                    items.sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai)).map(j => (
                      <div 
                        key={j.id}
                        className={`group relative p-4 rounded-2xl border transition-all duration-300 ${
                          isToday 
                          ? 'bg-primary/10 border-primary/30 shadow-lg shadow-primary/5' 
                          : 'bg-white/[0.03] border-white/10 hover:border-primary/40 hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-all duration-300 ${isToday ? 'bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]' : 'bg-primary/20 group-hover:bg-primary/50'}`} />
                        <div className="pl-2 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary/80 uppercase tracking-wider">
                              <Clock className="w-3 h-3" />
                              <span>{j.jam_mulai.substring(0, 5)} - {j.jam_selesai.substring(0, 5)}</span>
                            </div>
                            <div className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex gap-1 print:hidden shrink-0">
                              <button onClick={() => handleEdit(j)} className="p-2 lg:p-1 hover:bg-white/10 rounded-md transition-colors"><Settings className="w-4 h-4 lg:w-3 lg:h-3 text-muted-foreground" /></button>
                              <button onClick={() => handleDelete(j.id)} className="p-2 lg:p-1 hover:bg-destructive/10 rounded-md transition-colors text-destructive"><Trash2 className="w-4 h-4 lg:w-3 lg:h-3" /></button>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                              {j.mata_pelajaran_nama}
                            </h4>
                            <div className="mt-1.5 flex items-center gap-1.5 text-[9px] text-muted-foreground font-bold">
                              <div className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                                <User className="w-2.5 h-2.5 text-primary/70" />
                              </div>
                              <span className="truncate uppercase tracking-tight">{j.ptk_nama}</span>
                            </div>
                          </div>
                          {j.ruangan && (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/5 border border-primary/10 text-[8px] font-black text-primary/60 uppercase">
                              <MapPin className="w-2.5 h-2.5" />
                              <span className="truncate">{j.ruangan}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <Modal 
          onClose={() => setIsModalOpen(false)}
          title={editingId ? "Edit Jadwal" : "Tambah Jadwal Baru"}
          icon={<Calendar className="w-5 h-5 text-primary" />}
          description="Atur detail waktu dan mata pelajaran"
          onSubmit={handleSave}
          saving={saving}
          maxWidth="2xl"
        >
          <div className="space-y-6 py-2">
            <SearchableSelect 
              id="pembelajaran"
              label="Mata Pelajaran & Guru"
              value={formData.pembelajaran_id}
              onChange={v => setFormData({ ...formData, pembelajaran_id: v })}
              placeholder="-- Pilih Mata Pelajaran & Guru --"
              options={pembelajarans.map(p => ({
                value: p.id,
                label: `${p.mata_pelajaran_nama} - ${p.ptk_nama} (${p.rombel_nama})`
              }))}
              required
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField 
                id="hari"
                label="Hari"
                type="select"
                value={formData.hari}
                onChange={v => setFormData({ ...formData, hari: v })}
                options={HARI.map(h => ({ value: h, label: h }))}
              />
              <FormField 
                id="ruangan"
                label="Ruangan (Opsional)"
                value={formData.ruangan}
                onChange={v => setFormData({ ...formData, ruangan: v })}
                placeholder="Contoh: Lab Komp 1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField 
                id="mulai"
                label="Jam Mulai"
                type="time"
                value={formData.jam_mulai}
                onChange={v => setFormData({ ...formData, jam_mulai: v })}
                required
              />
              <FormField 
                id="selesai"
                label="Jam Selesai"
                type="time"
                value={formData.jam_selesai}
                onChange={v => setFormData({ ...formData, jam_selesai: v })}
                required
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StatsCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number | string, color: string }) {
  const colorMap: any = {
    sky: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    pink: 'bg-pink-500/10 border-pink-500/20 text-pink-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  };

  return (
    <div className={`p-6 rounded-3xl border ${colorMap[color]} backdrop-blur-sm space-y-4 hover:scale-[1.02] transition-transform duration-300 group relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-3xl -mr-12 -mt-12" />
      <div className="flex items-center gap-3 relative">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/5">
          {icon}
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{label}</span>
      </div>
      <div className="text-3xl font-black tracking-tight relative">{value.toLocaleString()}</div>
    </div>
  );
}
