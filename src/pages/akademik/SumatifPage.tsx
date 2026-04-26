import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  Calculator,
  Plus,
  Trash2,
  Users,
  Save,
  Settings,
  TrendingUp,
  FileSpreadsheet,
  ChevronRight,
  ClipboardList,
  LayoutGrid,
  Search,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label as ShadcnLabel } from '@/components/ui/label';
import { DataTable } from '@/components/shared/DataTable';
import { Modal } from '@/components/shared/Modal';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { PageHero } from '@/components/shared/PageHero';
import { FilterBar } from '@/components/shared/FilterBar';
import { showToast } from '@/lib/toast-utils';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ──────────────────────────────────────────────────────────────────
interface Kategori {
    id: string;
    nama: string;
    bobot: number;
}

interface Pembelajaran {
    id: string;
    rombel_id: string;
    rombel_nama: string;
    mata_pelajaran_nama: string;
}

interface Semester {
    id: string;
    nama: string;
    tahun: string;
    aktif: boolean;
}

interface Penilaian {
    id: string;
    nama: string;
    kategori_id: string;
    kategori_nama: string;
    rombel_id: string;
    rombel_nama: string;
    mapel_nama: string;
    pembelajaran_id: string;
    semester_id: string;
    tanggal: string;
}

interface NilaiSiswa {
    peserta_didik_id: string;
    siswa_nama: string;
    nis: string;
    nilai: number;
}

interface RekapItem {
    peserta_didik_id: string;
    nama: string;
    nis: string;
    detail: Record<string, number>;
    nilai_akhir: number;
    [key: string]: any;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function SumatifPage() {
    const [view, setView] = useState<'LIST' | 'INPUT' | 'REKAP' | 'CONFIG'>('LIST');
    
    // Masters
    const [pembelajarans, setPembelajarans] = useState<Pembelajaran[]>([]);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [kategoris, setKategoris] = useState<Kategori[]>([]);
    
    // Selection State
    const [selectedPembelajaran, setSelectedPembelajaran] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('');
    const [selectedPenilaian, setSelectedPenilaian] = useState<Penilaian | null>(null);

    // Data State
    const [penilaianList, setPenilaianList] = useState<Penilaian[]>([]);
    const [nilaiItems, setNilaiItems] = useState<NilaiSiswa[]>([]);
    const [rekapItems, setRekapItems] = useState<RekapItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');

    // Modal State
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [newPenilaian, setNewPenilaian] = useState({
        nama: '',
        kategori_id: '',
        tanggal: format(new Date(), 'yyyy-MM-dd')
    });

    const [configModalOpen, setConfigModalOpen] = useState(false);
    const [tempKategoris, setTempKategoris] = useState<any[]>([]);

    // ─── Initial Fetch ────────────────────────────────────────────────────────
    useEffect(() => {
        Promise.all([
            api.get<any>('/pembelajaran?limit=200'),
            api.get<any>('/semester?limit=100'),
            api.get<any>('/penilaian/kategori')
        ]).then(([resPem, resSmt, resKat]) => {
            setPembelajarans(resPem.data.items || []);
            setSemesters(resSmt.data.items || []);
            setKategoris(resKat.data || []);
            
            const activeSmt = (resSmt.data.items || []).find((s: any) => s.aktif);
            if (activeSmt) setSelectedSemester(activeSmt.id);
        }).catch(console.error);
    }, []);

    // ─── Data Logic ───────────────────────────────────────────────────────────
    const fetchPenilaian = useCallback(async () => {
        if (!selectedPembelajaran || !selectedSemester) return;
        setLoading(true);
        try {
            const res = await api.get<any>(`/penilaian?pembelajaran_id=${selectedPembelajaran}&semester_id=${selectedSemester}`);
            setPenilaianList(res.data);
        } catch (e) {
            showToast.error('Gagal mengambil daftar penilaian');
        } finally {
            setLoading(false);
        }
    }, [selectedPembelajaran, selectedSemester]);

    const fetchNilai = async (p: Penilaian) => {
        setLoading(true);
        try {
            const res = await api.get<any>(`/penilaian/${p.id}/nilai`);
            const mapped = (res.data || []).map((s: any) => ({ ...s, id: s.peserta_didik_id }));
            setNilaiItems(mapped);
            setSelectedPenilaian(p);
            setView('INPUT');
        } catch (e) {
            showToast.error('Gagal mengambil data nilai siswa');
        } finally {
            setLoading(false);
        }
    };

    const fetchRekap = async () => {
        if (!selectedPembelajaran || !selectedSemester) return;
        setLoading(true);
        try {
            const current = pembelajarans.find(p => p.id === selectedPembelajaran);
            const res = await api.get<any>(`/penilaian/rekap?rombel_id=${current?.rombel_id}&pembelajaran_id=${selectedPembelajaran}&semester_id=${selectedSemester}`);
            const mapped = (res.data || []).map((s: any) => ({ ...s, id: s.peserta_didik_id }));
            setRekapItems(mapped);
            setView('REKAP');
        } catch (e) {
            showToast.error('Gagal mengambil rekap nilai');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (view === 'LIST') fetchPenilaian();
    }, [view, fetchPenilaian]);

    // ─── Handlers ──────────────────────────────────────────────────────────────
    const handleAddPenilaian = async () => {
        const current = pembelajarans.find(p => p.id === selectedPembelajaran);
        if (!current) return;

        setSaving(true);
        try {
            await api.post<any>('/penilaian', {
                ...newPenilaian,
                rombel_id: current.rombel_id,
                pembelajaran_id: selectedPembelajaran,
                semester_id: selectedSemester
            });
            showToast.success('Penilaian berhasil dibuat');
            setAddModalOpen(false);
            fetchPenilaian();
            setNewPenilaian({
                nama: '',
                kategori_id: '',
                tanggal: format(new Date(), 'yyyy-MM-dd')
            });
        } catch (e: any) {
            showToast.error(e.message || 'Gagal membuat penilaian');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveNilai = async () => {
        if (!selectedPenilaian) return;
        setSaving(true);
        try {
            await api.post(`/penilaian/${selectedPenilaian.id}/nilai`, { items: nilaiItems });
            showToast.success('Semua nilai berhasil disimpan');
            setView('LIST');
        } catch (e) {
            showToast.error('Gagal menyimpan nilai');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveConfig = async () => {
        const total = tempKategoris.reduce((acc, curr) => acc + Number(curr.bobot), 0);
        if (Math.abs(total - 100) > 0.01) {
            showToast.error('Total bobot harus 100%');
            return;
        }

        setSaving(true);
        try {
            await Promise.all(tempKategoris.map(k => 
                api.post('/penilaian/kategori' + (k.id ? `/${k.id}` : ''), k)
            ));
            const res = await api.get<any>('/penilaian/kategori');
            setKategoris(res.data);
            setConfigModalOpen(false);
            showToast.success('Konfigurasi bobot disimpan');
        } catch (e) {
            showToast.error('Gagal menyimpan konfigurasi');
        } finally {
            setSaving(false);
        }
    };

    // ─── Table Columns ────────────────────────────────────────────────────────
    const listColumns = [
        {
            header: 'Penilaian',
            render: (p: Penilaian) => (
                <div className="flex flex-col">
                    <span className="font-bold text-foreground">{p.nama}</span>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase">{format(new Date(p.tanggal), 'dd MMMM yyyy')}</span>
                </div>
            )
        },
        {
            header: 'Jenis',
            render: (p: Penilaian) => (
                <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase">
                        {p.kategori_nama}
                    </div>
                </div>
            )
        },
        {
            header: 'Aksi',
            align: 'right' as const,
            render: (p: Penilaian) => (
                <div className="flex items-center justify-end gap-2">
                <div className="flex items-center justify-end gap-1.5">
                    <Button variant="ghost" size="sm" onClick={() => fetchNilai(p)} className="h-9 md:h-8 rounded-xl gap-2 font-bold text-[10px] uppercase bg-primary/5 md:bg-transparent hover:bg-primary/10">
                        <ChevronRight className="w-4 h-4" /> Input Nilai
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                        if(confirm('Hapus penilaian ini?')) {
                            api.delete(`/penilaian/${p.id}`).then(() => fetchPenilaian()).catch(console.error);
                        }
                    }} className="h-9 w-9 md:h-8 md:w-8 text-rose-400 bg-rose-400/5 md:bg-transparent hover:bg-rose-400/10 rounded-xl shrink-0">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
                </div>
            )
        }
    ];

    const inputColumns = [
        {
            header: 'Nama Siswa',
            render: (s: any) => (
                <div className="flex flex-col">
                    <span className="font-bold text-sm">{s.siswa_nama}</span>
                    <span className="text-[10px] text-muted-foreground">NIS: {s.nis}</span>
                </div>
            )
        },
        {
            header: 'Nilai (0-100)',
            align: 'center' as const,
            render: (s: any) => (
                <div className="w-24 mx-auto">
                    <Input
                        type="number"
                        value={s.nilai}
                        onChange={(e) => {
                            const val = Math.min(100, Math.max(0, Number(e.target.value)));
                            setNilaiItems(prev => prev.map(item => 
                                item.peserta_didik_id === s.peserta_didik_id ? { ...item, nilai: val } : item
                            ));
                        }}
                        className="text-center font-bold h-10 rounded-xl bg-white/5 border-white/10 focus:border-primary/50"
                    />
                </div>
            )
        }
    ];

    const rekapColumns = [
        {
            header: 'Siswa',
            render: (s: any) => (
                <div className="flex flex-col">
                    <span className="font-bold text-sm">{s.nama}</span>
                    <span className="text-[10px] text-muted-foreground">{s.nis}</span>
                </div>
            )
        },
        ...kategoris.map(cat => ({
            header: cat.nama,
            align: 'center' as const,
            render: (s: any) => (
                <span className="font-bold text-sm opacity-80">
                    {s.detail[cat.nama]?.toFixed(1) || '0.0'}
                </span>
            )
        })),
        {
            header: 'Nilai Akhir',
            align: 'center' as const,
            render: (s: any) => (
                <div className="flex flex-col items-center">
                    <span className={`text-lg font-black ${s.nilai_akhir >= 75 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {s.nilai_akhir.toFixed(1)}
                    </span>
                    <span className="text-[8px] font-black uppercase tracking-tighter opacity-50">Weighted</span>
                </div>
            )
        }
    ];

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="w-full p-4 md:p-8 space-y-6 md:space-y-8 mx-auto animate-in fade-in duration-700 relative">
            <div className="absolute top-0 right-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-primary/5 blur-[100px] md:blur-[180px] -z-10 rounded-full" />
            
            <PageHero
                title="Penilaian Kurikulum Merdeka"
                description="Sistem penilaian berbasis aktivitas dengan pembobotan kategori fleksibel"
                icon={<Calculator className="w-5 h-5" />}
                variant="primary"
                breadcrumb="Akademik / Penilaian"
            />

            {/* Selection Bar */}
            <div className="p-8 rounded-[2.5rem] border border-white/5 bg-zinc-900/40 backdrop-blur-md shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-end">
                    <div className="space-y-4">
                        <ShadcnLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 pl-1">Seleksi Akademik</ShadcnLabel>
                        <SearchableSelect
                            id="pembelajaran"
                            label="Mapel & Kelas"
                            value={selectedPembelajaran}
                            onChange={(v) => { setSelectedPembelajaran(v); setView('LIST'); }}
                            placeholder="-- Pilih Mapel --"
                            options={pembelajarans.map(p => ({ value: p.id, label: `${p.rombel_nama} - ${p.mata_pelajaran_nama}` }))}
                        />
                    </div>
                    <div className="space-y-4">
                        <ShadcnLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 pl-1">Periode</ShadcnLabel>
                        <SearchableSelect
                            id="semester"
                            label="Semester"
                            value={selectedSemester}
                            onChange={(v) => { setSelectedSemester(v); setView('LIST'); }}
                            options={semesters.map(s => ({ value: s.id, label: `${s.nama} - ${s.tahun}` }))}
                        />
                    </div>
                    
                    <div className="lg:col-span-2 flex flex-wrap items-center justify-end gap-2 md:gap-3 pb-1">
                        <Button
                            variant="ghost"
                            className={`h-10 md:h-11 px-4 md:px-6 rounded-xl md:rounded-2xl gap-2 font-bold text-[10px] md:text-[11px] uppercase transition-all flex-1 sm:flex-none ${view === 'LIST' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground opacity-60'}`}
                            onClick={() => setView('LIST')}
                        >
                            <ClipboardList className="w-4 h-4" /> Daftar
                        </Button>
                        <Button
                            variant="ghost"
                            className={`h-10 md:h-11 px-4 md:px-6 rounded-xl md:rounded-2xl gap-2 font-bold text-[10px] md:text-[11px] uppercase transition-all flex-1 sm:flex-none ${view === 'REKAP' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'text-muted-foreground opacity-60'}`}
                            onClick={fetchRekap}
                        >
                            <LayoutGrid className="w-4 h-4" /> Rekap
                        </Button>
                    </div>
                </div>
            </div>

            {/* View Area */}
            <AnimatePresence mode="wait">
                {!selectedPembelajaran ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 0.5, y: 0 }}
                        className="flex flex-col items-center justify-center py-32 text-center space-y-6 rounded-[3rem] border-2 border-dashed border-white/5"
                    >
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                            <Search className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">Silakan pilih mata pelajaran untuk memulai penilaian.</p>
                    </motion.div>
                ) : view === 'LIST' ? (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-6"
                    >
                        <FilterBar
                            search={search}
                            onSearchChange={setSearch}
                            searchPlaceholder="Cari penilaian..."
                            onAdd={() => setAddModalOpen(true)}
                            addTooltip="Tambah Kegiatan Penilaian"
                            loading={loading}
                        />
                        {/* Desktop Table */}
                        <div className="hidden md:block">
                            <DataTable
                                columns={listColumns}
                                data={penilaianList.filter(p => p.nama.toLowerCase().includes(search.toLowerCase()))}
                                loading={loading}
                            />
                        </div>

                        {/* Mobile Cards */}
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="p-5 rounded-3xl bg-white/[0.03] border border-white/5 animate-pulse">
                                        <div className="h-4 w-2/3 bg-white/10 rounded mb-3" />
                                        <div className="h-3 w-1/2 bg-white/5 rounded" />
                                    </div>
                                ))
                            ) : penilaianList.length === 0 ? (
                                <div className="p-10 text-center rounded-3xl bg-white/[0.02] border border-dashed border-white/10">
                                    <p className="text-sm text-muted-foreground">Tidak ada data penilaian</p>
                                </div>
                            ) : (
                                penilaianList
                                    .filter(p => p.nama.toLowerCase().includes(search.toLowerCase()))
                                    .map((p) => (
                                        <div key={p.id} className="p-5 rounded-3xl bg-white/[0.03] border border-white/5 space-y-4 active:scale-[0.98] transition-all">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-black text-sm uppercase tracking-tight text-foreground">{p.nama}</h4>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-primary/10 text-primary uppercase">
                                                            {p.kategori_nama}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                                                            {format(new Date(p.tanggal), 'dd MMM yyyy')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => {
                                                        if(confirm('Hapus penilaian ini?')) {
                                                            api.delete(`/penilaian/${p.id}`).then(() => fetchPenilaian()).catch(console.error);
                                                        }
                                                    }}
                                                    className="h-8 w-8 text-rose-400 bg-rose-400/10 rounded-xl"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                            
                                            <Button 
                                                onClick={() => fetchNilai(p)}
                                                className="w-full h-11 rounded-2xl gap-2 font-black uppercase text-[10px] tracking-widest bg-primary/10 text-primary hover:bg-primary/20 border border-primary/10"
                                            >
                                                <ClipboardList className="w-4 h-4" /> Input Nilai
                                            </Button>
                                        </div>
                                    ))
                            )}
                        </div>
                    </motion.div>
                ) : view === 'INPUT' && selectedPenilaian ? (
                    <motion.div
                        key="input"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="space-y-6"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-primary/5 border border-primary/10 gap-4">
                            <div className="flex items-center gap-4">
                                <Button variant="ghost" size="icon" onClick={() => setView('LIST')} className="h-10 w-10 rounded-xl shrink-0">
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                                <div className="min-w-0">
                                    <h3 className="font-black text-base md:text-lg uppercase tracking-tight leading-none truncate">{selectedPenilaian.nama}</h3>
                                    <p className="text-[10px] text-primary/70 font-bold uppercase tracking-widest mt-1.5 truncate">{selectedPenilaian.kategori_nama} • {selectedPenilaian.rombel_nama}</p>
                                </div>
                            </div>
                            <Button onClick={handleSaveNilai} loading={saving} className="w-full md:w-auto rounded-xl md:rounded-2xl px-8 h-12 gap-2 font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20">
                                <Save className="w-4 h-4" /> Simpan Semua Nilai
                            </Button>
                        </div>
                        
                        {/* Desktop Table */}
                        <div className="hidden md:block">
                            <DataTable
                                columns={inputColumns}
                                data={nilaiItems}
                                loading={loading}
                                renderToolbar={() => (
                                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-primary/10 border border-primary/20">
                                        <Users className="w-3.5 h-3.5 text-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-tighter text-primary">
                                            {nilaiItems.length} Siswa Terdaftar
                                        </span>
                                    </div>
                                )}
                            />
                        </div>

                        {/* Mobile Cards */}
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse h-20" />
                                ))
                            ) : (
                                nilaiItems.map((s, idx) => (
                                    <div key={s.peserta_didik_id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-muted-foreground/50 w-4">{idx + 1}.</span>
                                                <h5 className="font-bold text-sm truncate">{s.siswa_nama}</h5>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground ml-6 uppercase tracking-widest mt-0.5">NIS: {s.nis}</p>
                                        </div>
                                        <div className="w-20 shrink-0">
                                            <Input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={s.nilai}
                                                onChange={e => {
                                                    const next = [...nilaiItems];
                                                    next[idx].nilai = Number(e.target.value);
                                                    setNilaiItems(next);
                                                }}
                                                className="h-10 text-center font-black text-primary bg-primary/5 border-primary/20 rounded-xl focus:ring-primary/20"
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                ) : view === 'REKAP' ? (
                    <motion.div
                        key="rekap"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                                </div>
                                <h3 className="font-black text-xl uppercase tracking-tighter">Rekap Nilai Akhir</h3>
                            </div>
                            <Button variant="ghost" onClick={() => {
                                const ws = XLSX.utils.json_to_sheet(rekapItems);
                                const wb = XLSX.utils.book_new();
                                XLSX.utils.book_append_sheet(wb, ws, 'Rekap Nilai');
                                XLSX.writeFile(wb, 'Rekap_Nilai.xlsx');
                            }} className="w-full sm:w-auto rounded-xl gap-2 font-bold text-xs h-10">
                                <FileSpreadsheet className="w-4 h-4" /> Export Excel
                            </Button>
                        </div>
                        {/* Desktop Table */}
                        <div className="hidden md:block">
                            <DataTable
                                columns={rekapColumns}
                                data={rekapItems}
                                loading={loading}
                            />
                        </div>

                        {/* Mobile Cards */}
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="p-5 rounded-3xl bg-white/[0.03] border border-white/5 animate-pulse h-24" />
                                ))
                            ) : (
                                rekapItems.map((s, idx) => (
                                    <div key={s.peserta_didik_id} className="p-5 rounded-3xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-muted-foreground/50">{idx + 1}.</span>
                                                <h5 className="font-bold text-sm truncate uppercase tracking-tight">{s.nama}</h5>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {kategoris.map(k => (
                                                    <div key={k.id} className="px-2 py-1 rounded-lg bg-white/5 border border-white/5 flex flex-col">
                                                        <span className="text-[7px] font-black uppercase text-muted-foreground/60">{k.nama}</span>
                                                        <span className="text-[10px] font-bold text-foreground">
                                                            {Number(s[k.id] || 0).toFixed(0)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-primary/5 border border-primary/10 min-w-[70px]">
                                            <span className={`text-2xl font-black tracking-tighter ${s.nilai_akhir >= 75 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {s.nilai_akhir.toFixed(1)}
                                            </span>
                                            <span className="text-[8px] font-black uppercase tracking-widest text-primary/60">Final</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            {/* Modals */}
            {addModalOpen && (
                <Modal
                    title="Kegiatan Penilaian Baru"
                    description="Buat satu kegiatan penilaian (misal: UH 1) untuk seluruh siswa di kelas ini"
                    icon={<Plus className="w-5 h-5" />}
                    onClose={() => setAddModalOpen(false)}
                    onSubmit={handleAddPenilaian}
                    submitLabel="Buat & Input Nilai"
                >
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <ShadcnLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Nama Penilaian</ShadcnLabel>
                            <Input
                                value={newPenilaian.nama}
                                onChange={e => setNewPenilaian({ ...newPenilaian, nama: e.target.value })}
                                placeholder="Contoh: Ulangan Harian Bab 1"
                                className="h-12 rounded-xl bg-white/5 border-white/10 font-bold"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <ShadcnLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Jenis / Kategori</ShadcnLabel>
                                <SearchableSelect
                                    value={newPenilaian.kategori_id}
                                    onChange={v => setNewPenilaian({ ...newPenilaian, kategori_id: v })}
                                    options={kategoris.map(k => ({ value: k.id, label: `${k.nama} (${k.bobot}%)` }))}
                                    placeholder="Pilih Kategori..."
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <ShadcnLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Tanggal</ShadcnLabel>
                                <Input
                                    type="date"
                                    value={newPenilaian.tanggal}
                                    onChange={e => setNewPenilaian({ ...newPenilaian, tanggal: e.target.value })}
                                    className="h-12 rounded-xl bg-white/5 border-white/10 font-bold"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {configModalOpen && (
                <Modal
                    title="Bobot Penilaian"
                    description="Tentukan bobot persentase untuk setiap kategori penilaian"
                    icon={<Settings className="w-5 h-5" />}
                    onClose={() => setConfigModalOpen(false)}
                    onSubmit={handleSaveConfig}
                    maxWidth="2xl"
                    submitLabel="Simpan Bobot"
                >
                    <div className="space-y-6 py-2">
                        <div className="flex items-center justify-between bg-primary/5 p-4 rounded-2xl border border-primary/10 mb-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Status Akumulasi</p>
                                <p className="text-xs text-muted-foreground font-medium">Total harus mencapai 100%</p>
                            </div>
                            <div className={`text-3xl font-black ${Math.abs(tempKategoris.reduce((a, c) => a + Number(c.bobot), 0) - 100) < 0.01 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {tempKategoris.reduce((a, c) => a + Number(c.bobot), 0)}%
                            </div>
                        </div>

                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                            {tempKategoris.map((k, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-3 items-end p-4 rounded-2xl bg-white/[0.02] border border-white/5 group hover:border-white/10 transition-all">
                                    <div className="col-span-7 space-y-1.5">
                                        <ShadcnLabel className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">Kategori</ShadcnLabel>
                                        <Input
                                            value={k.nama}
                                            onChange={e => {
                                                const next = [...tempKategoris];
                                                next[idx].nama = e.target.value;
                                                setTempKategoris(next);
                                            }}
                                            placeholder="Nama kategori..."
                                            className="h-10 rounded-xl bg-zinc-900 border-white/5 font-bold"
                                        />
                                    </div>
                                    <div className="col-span-3 space-y-1.5">
                                        <ShadcnLabel className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">Bobot %</ShadcnLabel>
                                        <Input
                                            type="number"
                                            value={k.bobot}
                                            onChange={e => {
                                                const next = [...tempKategoris];
                                                next[idx].bobot = Number(e.target.value);
                                                setTempKategoris(next);
                                            }}
                                            className="h-10 rounded-xl bg-zinc-900 border-white/5 text-center font-bold"
                                        />
                                    </div>
                                    <div className="col-span-2 flex justify-end">
                                        <Button variant="ghost" size="icon" onClick={() => setTempKategoris(tempKategoris.filter((_, i) => i !== idx))} className="h-10 w-10 text-rose-400 opacity-40 hover:opacity-100 hover:bg-rose-400/10 rounded-xl">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button
                            variant="ghost"
                            className="w-full h-12 rounded-2xl border-2 border-dashed border-white/5 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all gap-2 font-bold text-xs uppercase"
                            onClick={() => setTempKategoris([...tempKategoris, { nama: '', bobot: 0 }])}
                        >
                            <Plus className="w-4 h-4" /> Tambah Kategori
                        </Button>
                    </div>
                </Modal>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
                .text-gradient { background: linear-gradient(to right, #fff, #999); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            `}</style>
        </div>
    );
}
