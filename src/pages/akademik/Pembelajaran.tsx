import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import { 
  CalendarDays, 
  AlertTriangle, 
  Plus, 
  Edit2, 
  Trash2, 
  BookOpen, 
  User, 
  Clock, 
  Users, 
  Sparkles,
  Search,
  Download,
  Layout
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { Modal } from '@/components/shared/Modal';
import { FormField } from '@/components/shared/FormField';
import { PageHero } from '@/components/shared/PageHero';
import { showToast } from '@/lib/toast-utils';
import * as XLSX from 'xlsx';
import { SearchableSelect } from '@/components/shared/SearchableSelect';

// ─── Hooks ──────────────────────────────────────────────────────────────────
function useMobile() {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  return isMobile;
}
import * as React from 'react';

interface Rombel { id: string; nama: string; }
interface Mapel { id: string; nama: string; }
interface Guru { id: string; nama: string; }
interface Pembelajaran {
  id: string;
  rombel_id: string;
  mata_pelajaran_id: string;
  ptk_id: string;
  jam_per_minggu: number;
  mata_pelajaran_nama: string;
  mata_pelajaran_kode: string;
  ptk_nama: string;
}

const EMPTY_FORM = {
  rombel_id: '',
  mata_pelajaran_id: '',
  ptk_id: '',
  jam_per_minggu: 1
};

export default function PembelajaranPage() {
  const isMobile = useMobile();
  const [items, setItems] = useState<Pembelajaran[]>([]);
  const [loading, setLoading] = useState(false);
  const [rombels, setRombels] = useState<Rombel[]>([]);
  const [mapels, setMapels] = useState<Mapel[]>([]);
  const [gurus, setGurus] = useState<Guru[]>([]);
  const [selectedRombel, setSelectedRombel] = useState('');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Pembelajaran | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchRombels = useCallback(async () => {
    try {
      const res = await api.get<any>('/rombel?limit=100');
      setRombels(res.data.items);
      if (res.data.items.length > 0 && !selectedRombel) {
        setSelectedRombel(res.data.items[0].id);
      }
    } catch (e) { 
      console.error(e);
      showToast.error('Gagal mengambil data rombel');
    }
  }, [selectedRombel]);

  const fetchDependencies = useCallback(async () => {
    try {
      const [mRes, gRes] = await Promise.all([
        api.get<any>('/mata-pelajaran?limit=500'),
        api.get<any>('/ptk?limit=500')
      ]);
      setMapels(mRes.data.items);
      setGurus(gRes.data.items);
    } catch (e) { console.error(e); }
  }, []);

  const fetchData = useCallback(async () => {
    if (!selectedRombel) return;
    setLoading(true);
    try {
      const res = await api.get<any>(`/pembelajaran/rombel/${selectedRombel}`);
      setItems(res.data);
    } catch (e) { 
      console.error(e);
      showToast.error('Gagal mengambil data pembelajaran');
    } finally { 
      setLoading(false); 
    }
  }, [selectedRombel]);

  useEffect(() => { 
    fetchRombels(); 
    fetchDependencies(); 
  }, [fetchRombels, fetchDependencies]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const openAdd = () => {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, rombel_id: selectedRombel });
    setFormError(''); 
    setModalOpen(true);
  };

  const openEdit = (p: Pembelajaran) => {
    setEditTarget(p);
    setForm({
      rombel_id: p.rombel_id,
      mata_pelajaran_id: p.mata_pelajaran_id,
      ptk_id: p.ptk_id,
      jam_per_minggu: p.jam_per_minggu
    });
    setFormError(''); 
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.mata_pelajaran_id || !form.ptk_id || !form.rombel_id) {
      setFormError('Lengkapi semua data yang diperlukan.');
      return;
    }

    setSaving(true); 
    setFormError('');
    try {
      if (editTarget) {
        await api.put(`/pembelajaran/${editTarget.id}`, form);
        showToast.success('Pembelajaran diperbarui');
      } else {
        await api.post('/pembelajaran', form);
        showToast.success('Pembelajaran ditambahkan');
      }
      setModalOpen(false); 
      fetchData();
    } catch (e: any) { 
      setFormError(e.message || 'Terjadi kesalahan.'); 
      showToast.error(e.message || 'Gagal menyimpan data');
    } finally { 
      setSaving(false); 
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus jadwal pembelajaran ini?')) return;
    try { 
      await api.delete(`/pembelajaran/${id}`); 
      showToast.success('Pembelajaran dihapus');
      fetchData(); 
    } catch (e) { 
      console.error(e);
      showToast.error('Gagal menghapus data');
    }
  };

  const handleExport = () => {
    if (items.length === 0) {
      showToast.error('Tidak ada data untuk diexport');
      return;
    }

    const rombelName = rombels.find(r => r.id === selectedRombel)?.nama || 'Rombel';
    const dataToExport = items.map(p => ({
      'Mata Pelajaran': p.mata_pelajaran_nama,
      'Kode': p.mata_pelajaran_kode,
      'Guru Pengampu': p.ptk_nama,
      'Jam/Minggu': p.jam_per_minggu
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Pembelajaran');
    XLSX.writeFile(wb, `Pembelajaran_${rombelName}_${new Date().getTime()}.xlsx`);
    showToast.success('Berhasil export ke Excel');
  };

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const s = search.toLowerCase();
    return items.filter(i => 
      i.mata_pelajaran_nama.toLowerCase().includes(s) || 
      i.ptk_nama.toLowerCase().includes(s) ||
      i.mata_pelajaran_kode.toLowerCase().includes(s)
    );
  }, [items, search]);

  const stats = useMemo(() => ({
    totalMapel: items.length,
    totalGuru: new Set(items.map(i => i.ptk_id)).size,
    totalJP: items.reduce((acc, curr) => acc + curr.jam_per_minggu, 0),
    activeRombel: rombels.find(r => r.id === selectedRombel)?.nama || '-'
  }), [items, rombels, selectedRombel]);

  const columns = [
    {
      header: 'Mata Pelajaran', 
      accessor: 'mata_pelajaran_nama' as const,
      render: (p: Pembelajaran) => (
        <div className="flex items-center gap-3 group/item">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground group-hover/item:text-emerald-400 transition-colors">{p.mata_pelajaran_nama}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{p.mata_pelajaran_kode}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Guru Pengampu', 
      accessor: 'ptk_nama' as const,
      render: (p: Pembelajaran) => (
        <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 bg-sky-500/5 px-2.5 py-1 rounded-lg border border-sky-500/10 w-fit">
          <User className="w-3 h-3" />{p.ptk_nama}
        </div>
      )
    },
    {
      header: 'Beban Belajar', 
      render: (p: Pembelajaran) => (
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
            <Clock className="w-3.5 h-3.5 opacity-60" />
          </div>
          {p.jam_per_minggu} JP / MINGGU
        </div>
      )
    },
    {
      header: 'Aksi', 
      align: 'right' as const, 
      render: (p: Pembelajaran) => (
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 text-primary" onClick={() => openEdit(p)}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 text-destructive" onClick={() => handleDelete(p.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )
    }
  ];

  const currentRombelName = rombels.find(r => r.id === selectedRombel)?.nama || 'Pilih Rombel';

  return (
    <div className="w-full p-6 space-y-8 mx-auto animate-in fade-in duration-700">
      <PageHero
        title="PEMBAGIAN TUGAS"
        description="Konfigurasi beban mengajar guru dan kurikulum rombel."
        icon={<CalendarDays className="w-5 h-5" />}
        variant="emerald"
        breadcrumb="Akademik / Manajemen Pembelajaran"
      />

      {/* Control Section (Moved here for better UX) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 bg-zinc-900/40 p-5 rounded-[2.5rem] border border-white/5 backdrop-blur-md shadow-xl">
        <div className="lg:col-span-8">
          <SearchableSelect 
            id="rombel"
            label="Pilih Rombongan Belajar (Kelas)"
            placeholder="Cari Rombel..."
            value={selectedRombel}
            onChange={setSelectedRombel}
            options={rombels.map(r => ({ value: r.id, label: `KELAS ${r.nama}` }))}
          />
        </div>
        <div className="lg:col-span-4 flex items-end">
          <Button 
            onClick={openAdd} 
            disabled={!selectedRombel} 
            className="h-10 px-8 w-full gap-3 shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" /> Tambah Tugas Baru
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard icon={<BookOpen className="w-5 h-5 text-emerald-400" />} label="Total Mapel" value={stats.totalMapel} color="emerald" />
        <StatsCard icon={<Users className="w-5 h-5 text-sky-400" />} label="Guru Terlibat" value={stats.totalGuru} color="sky" />
        <StatsCard icon={<Clock className="w-5 h-5 text-pink-400" />} label="Total JP/Minggu" value={stats.totalJP} color="pink" />
        <StatsCard icon={<Layout className="w-5 h-5 text-amber-400" />} label="Rombel Aktif" value={stats.activeRombel} color="amber" />
      </div>

      {/* Main Table Area */}
      <div className="space-y-4">
        {/* Bulk Action & Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/40 p-4 rounded-3xl border border-white/5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari mapel atau guru..."
                className="bg-transparent border-none text-sm focus:ring-0 w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 border-white/10 bg-white/5 hover:bg-white/10 rounded-2xl px-4 text-[11px] font-bold uppercase"
              onClick={handleExport}
            >
              <Download className="w-3.5 h-3.5" />
              EXPORT
            </Button>
          </div>
        </div>

        {isMobile ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredItems.map(p => (
              <div key={p.id} className="p-5 rounded-[2rem] bg-zinc-900/40 border border-white/5 space-y-4 group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-foreground truncate uppercase">{p.mata_pelajaran_nama}</h4>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{p.mata_pelajaran_kode}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-white/5 border border-white/5" onClick={() => openEdit(p)}>
                      <Edit2 className="w-4 h-4 text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-white/5 border border-white/5" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-400 bg-sky-500/5 px-3 py-2 rounded-xl border border-sky-500/10 w-full">
                    <User className="w-3.5 h-3.5" />{p.ptk_nama}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 opacity-60" /> BEBAN BELAJAR
                    </div>
                    <span className="text-emerald-400">{p.jam_per_minggu} JP / MINGGU</span>
                  </div>
                </div>
              </div>
            ))}
            {filteredItems.length === 0 && !loading && (
              <div className="py-20 text-center opacity-50 font-medium">Data tidak ditemukan.</div>
            )}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredItems}
            loading={loading}
            emptyMessage={selectedRombel ? 'Belum ada tugas pembelajaran untuk rombel ini.' : 'Silakan pilih rombel terlebih dahulu.'}
            selectable
            selectedIds={selectedIds}
            onSelectionChange={ids => setSelectedIds(ids as string[])}
          />
        )}
      </div>

      {modalOpen && (
        <Modal
          title={editTarget ? 'Edit Tugas Pembelajaran' : 'Tambah Tugas Pembelajaran'}
          description={`Tentukan guru dan beban jam untuk rombel ${currentRombelName}`}
          icon={<CalendarDays className="w-5 h-5 text-emerald-400" />}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSave}
          saving={saving}
          maxWidth="md"
        >
          <div className="space-y-6">
            {formError && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/15 border border-destructive/25 text-destructive text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />{formError}
              </div>
            )}

            <div className="space-y-5">
              <SearchableSelect 
                id="mapel" 
                label="Mata Pelajaran" 
                placeholder="Cari Mata Pelajaran..." 
                value={form.mata_pelajaran_id} 
                onChange={v => setForm(f => ({ ...f, mata_pelajaran_id: v }))}
                options={mapels.map(m => ({ value: m.id, label: m.nama }))} 
                required 
              />

              <SearchableSelect 
                id="guru" 
                label="Guru Pengampu" 
                placeholder="Cari Guru..." 
                value={form.ptk_id} 
                onChange={v => setForm(f => ({ ...f, ptk_id: v }))}
                options={gurus.map(g => ({ value: g.id, label: g.nama }))} 
                required 
              />

              <FormField 
                id="jam" 
                label="Beban Belajar (JP per Minggu)" 
                type="number" 
                value={String(form.jam_per_minggu)} 
                onChange={v => setForm(f => ({ ...f, jam_per_minggu: parseInt(v) || 0 }))} 
                required 
              />
              
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex gap-3">
                <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed text-emerald-200/60 uppercase font-bold tracking-widest">
                  Setiap rombel hanya diperbolehkan memiliki satu penugasan guru per mata pelajaran untuk menghindari tumpang tindih.
                </p>
              </div>
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
      <div className="text-3xl font-black tracking-tight relative">{typeof value === 'number' ? value.toLocaleString() : value}</div>
    </div>
  );
}
