import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { 
    History, 
    Search, 
    Calendar, 
    ChevronRight,
    ArrowLeft,
    Users,
    FileText,
    BookOpen,
    Trash2,
    FileSpreadsheet,
    Edit3,
    Save,
    X,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
    UserX,
    PieChart,
    BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DataTable } from '@/components/shared/DataTable';
import { PageHero } from '@/components/shared/PageHero';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { showToast } from '@/lib/toast-utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';

// ─── Types ──────────────────────────────────────────────────────────────────
interface JurnalEntry {
    id: string;
    rombel_nama: string;
    mapel_nama: string;
    tanggal: string;
    jam_ke: string;
    materi: string;
    count_hadir: number;
    count_izin: number;
    count_alpa: number;
    total_siswa: number;
}

interface RekapItem {
    id: string;
    peserta_didik_id: string;
    siswa_nama: string;
    nis: string;
    hadir: number;
    izin: number;
    sakit: number;
    alpa: number;
    total_pertemuan: number;
}

export default function JurnalRiwayatPage() {
    const navigate = useNavigate();
    const [view, setView] = useState<'LIST' | 'DETAIL'>('LIST');
    const [activeTab, setActiveTab] = useState<'HISTORY' | 'REKAP'>('HISTORY');
    
    // History State
    const [entries, setEntries] = useState<JurnalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedJurnal, setSelectedJurnal] = useState<any>(null);
    const [search, setSearch] = useState('');
    
    // Rekap State
    const [rekapItems, setRekapItems] = useState<RekapItem[]>([]);
    const [rekapLoading, setRekapLoading] = useState(false);
    const [pembelajarans, setPembelajarans] = useState<any[]>([]);
    const [selectedPemId, setSelectedPemId] = useState('');

    // Edit Mode State
    const [isEditMode, setIsEditMode] = useState(false);
    const [editData, setEditData] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    // ─── Initial Fetch ────────────────────────────────────────────────────────
    useEffect(() => {
        api.get<any>('/pembelajaran?limit=200')
            .then(res => setPembelajarans(res.data.items || []))
            .catch(console.error);
    }, []);

    const fetchRiwayat = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get<any>('/jurnal');
            setEntries(res.data || []);
        } catch (e) {
            showToast.error('Gagal mengambil riwayat jurnal');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'HISTORY') fetchRiwayat();
    }, [activeTab, fetchRiwayat]);

    const fetchRekap = useCallback(async () => {
        if (!selectedPemId) return;
        setRekapLoading(true);
        try {
            const pem = pembelajarans.find(p => p.id === selectedPemId);
            const res = await api.get<any>(`/jurnal/rekap?rombel_id=${pem.rombel_id}&pembelajaran_id=${selectedPemId}`);
            const mapped = (res.data || []).map((item: any) => ({
                ...item,
                id: item.peserta_didik_id
            }));
            setRekapItems(mapped);
        } catch (e) {
            showToast.error('Gagal mengambil rekap kehadiran');
        } finally {
            setRekapLoading(false);
        }
    }, [selectedPemId, pembelajarans]);

    useEffect(() => {
        if (activeTab === 'REKAP') fetchRekap();
    }, [activeTab, fetchRekap]);

    const fetchDetail = async (id: string) => {
        setLoading(true);
        try {
            const res = await api.get<any>(`/jurnal/${id}`);
            setSelectedJurnal(res.data);
            setEditData(JSON.parse(JSON.stringify(res.data))); // Deep clone for editing
            setView('DETAIL');
            setIsEditMode(false);
        } catch (e) {
            showToast.error('Gagal mengambil detail jurnal');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEdit = async () => {
        setSaving(true);
        try {
            await api.post('/jurnal', {
                id: editData.id,
                materi: editData.materi,
                catatan: editData.catatan,
                jam_ke: editData.jam_ke,
                kehadiran: editData.kehadiran
            });
            showToast.success('Jurnal berhasil diperbarui');
            setIsEditMode(false);
            fetchDetail(editData.id); // Refresh data
            fetchRiwayat(); // Refresh list
        } catch (e: any) {
            showToast.error(e.message || 'Gagal memperbarui jurnal');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus jurnal ini? Data kehadiran juga akan terhapus.')) return;
        try {
            await api.delete(`/jurnal/${id}`);
            showToast.success('Jurnal berhasil dihapus');
            fetchRiwayat();
        } catch (e) {
            showToast.error('Gagal menghapus jurnal');
        }
    };

    const exportToExcel = (data: any) => {
        const rows = data.kehadiran.map((s: any, idx: number) => ({
            No: idx + 1,
            Nama: s.siswa_nama,
            NIS: s.nis,
            Status: s.status,
            Catatan: s.catatan || '-'
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Presensi');
        
        // Add Header Info
        XLSX.utils.sheet_add_aoa(ws, [
            [`Jurnal Mengajar: ${data.rombel_nama} - ${data.mapel_nama}`],
            [`Tanggal: ${format(new Date(data.tanggal), 'dd MMMM yyyy')}`],
            [`Materi: ${data.materi}`],
            ['']
        ], { origin: 'A1' });

        XLSX.writeFile(wb, `Jurnal_${data.rombel_nama}_${format(new Date(data.tanggal), 'yyyyMMdd')}.xlsx`);
    };

    const exportRekapExcel = () => {
        const rows = rekapItems.map((s, idx) => ({
            No: idx + 1,
            Nama: s.siswa_nama,
            NIS: s.nis,
            Hadir: s.hadir,
            Izin: s.izin,
            Sakit: s.sakit,
            Alpa: s.alpa,
            Total_Pertemuan: s.total_pertemuan,
            Persentase: ((s.hadir / s.total_pertemuan) * 100).toFixed(1) + '%'
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Rekap Kehadiran');
        XLSX.writeFile(wb, `Rekap_Kehadiran_Overall.xlsx`);
    };

    const historyColumns = [
        {
            header: 'Tanggal & Jam',
            render: (row: JurnalEntry) => (
                <div className="flex flex-col">
                    <span className="font-bold text-sm">{format(new Date(row.tanggal), 'dd MMM yyyy')}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Jam: {row.jam_ke || '-'}</span>
                </div>
            )
        },
        {
            header: 'Kelas & Mapel',
            render: (row: JurnalEntry) => (
                <div className="flex flex-col">
                    <span className="font-bold text-sm">{row.rombel_nama}</span>
                    <span className="text-[10px] text-primary/70 font-black uppercase tracking-widest">{row.mapel_nama}</span>
                </div>
            )
        },
        {
            header: 'Ringkasan Kehadiran',
            render: (row: JurnalEntry) => (
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center px-2 border-r border-white/5">
                        <span className="text-[9px] font-black text-emerald-400 uppercase">H</span>
                        <span className="text-xs font-bold">{row.count_hadir}</span>
                    </div>
                    <div className="flex flex-col items-center px-2 border-r border-white/5">
                        <span className="text-[9px] font-black text-amber-400 uppercase">I/S</span>
                        <span className="text-xs font-bold">{row.count_izin}</span>
                    </div>
                    <div className="flex flex-col items-center px-2">
                        <span className="text-[9px] font-black text-rose-400 uppercase">A</span>
                        <span className="text-xs font-bold">{row.count_alpa}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Aksi',
            align: 'right' as const,
            render: (row: JurnalEntry) => (
                <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => fetchDetail(row.id)} className="h-8 rounded-xl gap-2 font-black text-[10px] uppercase">
                        Detail <ChevronRight className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(row.id)} className="h-8 w-8 text-rose-400 hover:bg-rose-400/10 rounded-xl">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            )
        }
    ];

    const rekapColumns = [
        {
            header: 'Nama Siswa',
            render: (row: RekapItem) => (
                <div className="flex flex-col">
                    <span className="font-bold text-sm uppercase tracking-tight">{row.siswa_nama}</span>
                    <span className="text-[9px] text-muted-foreground uppercase">{row.nis}</span>
                </div>
            )
        },
        {
            header: 'Kehadiran (H/I/S/A)',
            render: (row: RekapItem) => (
                <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-black">{row.hadir}</span>
                    <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-[10px] font-black">{row.izin}</span>
                    <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-400 text-[10px] font-black">{row.sakit}</span>
                    <span className="px-2 py-1 rounded bg-rose-500/10 text-rose-400 text-[10px] font-black">{row.alpa}</span>
                </div>
            )
        },
        {
            header: '% Hadir',
            render: (row: RekapItem) => {
                const pct = row.total_pertemuan > 0 ? (row.hadir / row.total_pertemuan) * 100 : 0;
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-black">{pct.toFixed(0)}%</span>
                    </div>
                );
            }
        },
        {
            header: 'Total',
            render: (row: RekapItem) => <span className="text-xs font-bold text-muted-foreground">{row.total_pertemuan} Sesi</span>
        }
    ];

    const filtered = entries.filter(e => 
        e.materi.toLowerCase().includes(search.toLowerCase()) || 
        e.mapel_nama.toLowerCase().includes(search.toLowerCase()) ||
        e.rombel_nama.toLowerCase().includes(search.toLowerCase())
    );

    const toggleStatus = (idx: number) => {
        if (!isEditMode) return;
        const statusCycle: ('Hadir' | 'Izin' | 'Sakit' | 'Alpa')[] = ['Hadir', 'Izin', 'Sakit', 'Alpa'];
        const current = editData.kehadiran[idx].status;
        const next = statusCycle[(statusCycle.indexOf(current) + 1) % statusCycle.length];
        
        const nextData = { ...editData };
        nextData.kehadiran[idx].status = next;
        setEditData(nextData);
    };

    return (
        <div className="w-full p-4 md:p-8 space-y-8 mx-auto animate-in fade-in duration-700 relative">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 blur-[180px] -z-10 rounded-full" />
            
            <PageHero
                title="JURNAL & KEHADIRAN"
                description="Kelola riwayat pengajaran dan pantau rekapitulasi kehadiran siswa"
                icon={<History className="w-5 h-5" />}
                variant="primary"
                breadcrumb="Akademik / Jurnal"
            />

            {/* Tab Navigation */}
            {view === 'LIST' && (
                <div className="flex items-center p-1 bg-zinc-900/40 border border-white/5 rounded-2xl w-fit">
                    <button
                        onClick={() => setActiveTab('HISTORY')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'HISTORY' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <History className="w-4 h-4" /> Riwayat Jurnal
                    </button>
                    <button
                        onClick={() => setActiveTab('REKAP')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'REKAP' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <BarChart3 className="w-4 h-4" /> Rekap Kehadiran
                    </button>
                </div>
            )}

            <AnimatePresence mode="wait">
                {view === 'LIST' ? (
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {activeTab === 'HISTORY' ? (
                            <>
                                <div className="flex items-center gap-4 px-6 py-4 rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md shadow-xl">
                                    <div className="relative flex-1 max-w-md">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Cari materi, kelas, atau mapel..."
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                            className="pl-9 h-11 bg-white/5 border-white/10 rounded-xl"
                                        />
                                    </div>
                                </div>

                                {/* Desktop Table */}
                                <div className="hidden md:block">
                                    <DataTable
                                        columns={historyColumns}
                                        data={filtered}
                                        loading={loading}
                                    />
                                </div>

                                {/* Mobile Cards */}
                                <div className="grid grid-cols-1 gap-4 md:hidden">
                                    {loading ? (
                                        Array.from({ length: 3 }).map((_, i) => (
                                            <div key={i} className="p-5 rounded-3xl bg-white/[0.03] border border-white/5 animate-pulse h-40" />
                                        ))
                                    ) : filtered.length === 0 ? (
                                        <div className="p-12 text-center rounded-3xl border border-dashed border-white/10">
                                            <p className="text-sm text-muted-foreground">Tidak ada riwayat ditemukan</p>
                                        </div>
                                    ) : (
                                        filtered.map(e => (
                                            <div key={e.id} className="p-5 rounded-3xl bg-white/[0.03] border border-white/5 space-y-4" onClick={() => fetchDetail(e.id)}>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-sm uppercase tracking-tight">{e.mapel_nama}</h4>
                                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">{e.rombel_nama}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-black">{format(new Date(e.tanggal), 'dd/MM/yy')}</p>
                                                        <p className="text-[9px] text-primary font-bold uppercase">Jam: {e.jam_ke}</p>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-2 italic">"{e.materi}"</p>
                                                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                                    <Button variant="ghost" size="sm" className="h-8 rounded-lg text-[10px] font-bold uppercase gap-2 px-0">
                                                        Lihat Detail <ChevronRight className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex flex-col md:flex-row items-center gap-4 px-6 py-5 rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md shadow-xl">
                                    <div className="w-full md:w-80">
                                        <SearchableSelect
                                            value={selectedPemId}
                                            onChange={setSelectedPemId}
                                            placeholder="Pilih Kelas & Mapel..."
                                            options={pembelajarans.map(p => ({ value: p.id, label: `${p.rombel_nama} - ${p.mata_pelajaran_nama}` }))}
                                        />
                                    </div>
                                    {selectedPemId && (
                                        <Button 
                                            variant="outline" 
                                            onClick={exportRekapExcel}
                                            className="h-11 rounded-xl bg-white/5 border-white/10 gap-2 font-black text-[10px] uppercase tracking-widest"
                                        >
                                            <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Export Excel
                                        </Button>
                                    )}
                                </div>

                                {selectedPemId ? (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <DataTable
                                            columns={rekapColumns}
                                            data={rekapItems}
                                            loading={rekapLoading}
                                        />
                                    </div>
                                ) : (
                                    <div className="p-20 text-center rounded-[3rem] border border-dashed border-white/10 bg-white/[0.01]">
                                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                                            <PieChart className="w-8 h-8 text-primary" />
                                        </div>
                                        <h3 className="text-lg font-black uppercase tracking-tight mb-2">Pilih Pembelajaran</h3>
                                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">Pilih kelas dan mata pelajaran untuk melihat rekapitulasi kehadiran siswa secara keseluruhan.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                ) : selectedJurnal && (
                    <motion.div
                        key="detail"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="space-y-6"
                    >
                        {/* Header Detail */}
                        <div className="flex flex-col md:flex-row items-center justify-between p-6 rounded-[2rem] bg-zinc-900/40 border border-white/5 gap-4 shadow-2xl">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <Button variant="ghost" size="icon" onClick={() => setView('LIST')} className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 shrink-0">
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                                <div className="min-w-0">
                                    <h3 className="font-black text-lg uppercase tracking-tight leading-none truncate">{selectedJurnal.rombel_nama} - {selectedJurnal.mapel_nama}</h3>
                                    <p className="text-[10px] text-primary/70 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                        <Calendar className="w-3 h-3" /> {format(new Date(selectedJurnal.tanggal), 'EEEE, dd MMMM yyyy')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 w-full md:w-auto">
                                {!isEditMode ? (
                                    <>
                                        <Button variant="outline" onClick={() => exportToExcel(selectedJurnal)} className="flex-1 md:flex-none h-11 rounded-xl bg-white/5 border-white/10 gap-2 font-bold text-[10px] uppercase tracking-widest">
                                            <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Export Excel
                                        </Button>
                                        <Button onClick={() => setIsEditMode(true)} className="flex-1 md:flex-none h-11 rounded-xl gap-2 font-bold text-[10px] uppercase tracking-widest">
                                            <Edit3 className="w-4 h-4" /> Edit Jurnal
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button variant="ghost" onClick={() => setIsEditMode(false)} className="flex-1 md:flex-none h-11 rounded-xl gap-2 font-bold text-[10px] uppercase tracking-widest">
                                            <X className="w-4 h-4" /> Batal
                                        </Button>
                                        <Button onClick={handleSaveEdit} loading={saving} className="flex-1 md:flex-none h-11 rounded-xl gap-2 font-bold text-[10px] uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600">
                                            <Save className="w-4 h-4" /> Simpan Perubahan
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left: Info Jurnal */}
                            <div className="lg:col-span-1 space-y-6">
                                <div className="p-8 rounded-[2rem] bg-zinc-900/40 border border-white/5 space-y-8 shadow-xl">
                                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                                        <FileText className="w-5 h-5 text-primary" />
                                        <h4 className="font-black text-xs uppercase tracking-widest">Detail Pertemuan</h4>
                                    </div>

                                    {isEditMode ? (
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Jam Ke-</label>
                                                <Input 
                                                    value={editData.jam_ke} 
                                                    onChange={e => setEditData({...editData, jam_ke: e.target.value})}
                                                    className="h-11 rounded-xl bg-white/5 border-white/10 font-bold"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Materi Pembelajaran</label>
                                                <Textarea 
                                                    value={editData.materi} 
                                                    onChange={e => setEditData({...editData, materi: e.target.value})}
                                                    className="min-h-[120px] rounded-xl bg-white/5 border-white/10 font-medium leading-relaxed resize-none"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Catatan Guru</label>
                                                <Textarea 
                                                    value={editData.catatan} 
                                                    onChange={e => setEditData({...editData, catatan: e.target.value})}
                                                    className="min-h-[100px] rounded-xl bg-white/5 border-white/10 text-xs font-medium resize-none"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-8">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 text-primary">
                                                    <BookOpen className="w-4 h-4" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Materi</span>
                                                </div>
                                                <p className="text-sm font-bold leading-relaxed">{selectedJurnal.materi}</p>
                                            </div>
                                            <div className="space-y-3 pt-6 border-t border-white/5">
                                                <div className="flex items-center gap-3 text-muted-foreground/60">
                                                    <FileText className="w-4 h-4" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Catatan Guru</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground italic leading-relaxed">{selectedJurnal.catatan || 'Tidak ada catatan khusus untuk pertemuan ini.'}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: Daftar Siswa */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="p-8 rounded-[2rem] bg-zinc-900/40 border border-white/5 space-y-8 shadow-xl">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
                                        <div className="flex items-center gap-3">
                                            <Users className="w-5 h-5 text-primary" />
                                            <h4 className="font-black text-xs uppercase tracking-widest">Kehadiran Siswa</h4>
                                        </div>
                                        <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                                            <div className="text-center">
                                                <p className="text-[8px] font-black uppercase text-emerald-400">Hadir</p>
                                                <p className="font-black text-sm">{isEditMode ? editData.kehadiran.filter((s:any) => s.status === 'Hadir').length : selectedJurnal.kehadiran.filter((s:any) => s.status === 'Hadir').length}</p>
                                            </div>
                                            <div className="w-px h-6 bg-white/10 mx-1" />
                                            <div className="text-center">
                                                <p className="text-[8px] font-black uppercase text-rose-400">Absen</p>
                                                <p className="font-black text-sm">{isEditMode ? editData.kehadiran.filter((s:any) => s.status !== 'Hadir').length : selectedJurnal.kehadiran.filter((s:any) => s.status !== 'Hadir').length}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {(isEditMode ? editData.kehadiran : selectedJurnal.kehadiran)?.map((s: any, idx: number) => (
                                            <div 
                                                key={s.id || idx} 
                                                className={`p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between group transition-all ${isEditMode ? 'hover:border-primary/50 cursor-pointer' : ''}`}
                                                onClick={() => toggleStatus(idx)}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                                        <span className="text-[10px] font-black text-muted-foreground/40">{idx + 1}</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <h5 className="font-bold text-xs uppercase tracking-tight truncate">{s.siswa_nama}</h5>
                                                            {!isEditMode && (
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); navigate(`/siswa/${s.peserta_didik_id}`); }}
                                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:text-primary/80"
                                                                >
                                                                    <ExternalLink className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest">{s.nis}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-2">
                                                    {s.status === 'Hadir' ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : 
                                                     s.status === 'Alpa' ? <UserX className="w-3 h-3 text-rose-500" /> : 
                                                     <AlertCircle className="w-3 h-3 text-amber-500" />}
                                                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${
                                                        s.status === 'Hadir' ? 'bg-emerald-500/10 text-emerald-400' : 
                                                        s.status === 'Alpa' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-500'
                                                    }`}>
                                                        {s.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
