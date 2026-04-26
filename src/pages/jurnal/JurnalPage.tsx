import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { 
    BookOpen, 
    Users, 
    Calendar, 
    Save, 
    Clock,
    FileText,
    History,
    ChevronRight,
    ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { PageHero } from '@/components/shared/PageHero';
import { showToast } from '@/lib/toast-utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ──────────────────────────────────────────────────────────────────
interface Pembelajaran {
    id: string;
    rombel_id: string;
    rombel_nama: string;
    mata_pelajaran_id: string;
    mata_pelajaran_nama: string;
}

interface Semester {
    id: string;
    nama: string;
    tahun: string;
    aktif: boolean;
}

interface Siswa {
    peserta_didik_id: string;
    siswa_nama: string;
    nis: string;
    status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa';
}

export default function JurnalPage() {
    const [view, setView] = useState<'SELECT' | 'FORM'>('SELECT');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Masters
    const [pembelajarans, setPembelajarans] = useState<Pembelajaran[]>([]);
    const [semesters, setSemesters] = useState<Semester[]>([]);

    // Selection
    const [selectedPemId, setSelectedPemId] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('');
    
    // Form State
    const [tanggal, setTanggal] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [jamKe, setJamKe] = useState('');
    const [materi, setMateri] = useState('');
    const [catatan, setCatatan] = useState('');
    const [siswaList, setSiswaList] = useState<Siswa[]>([]);

    // ─── Initial Fetch ────────────────────────────────────────────────────────
    useEffect(() => {
        Promise.all([
            api.get<any>('/pembelajaran?limit=200'),
            api.get<any>('/semester?limit=100')
        ]).then(([resPem, resSmt]) => {
            setPembelajarans(resPem.data.items || []);
            setSemesters(resSmt.data.items || []);
            
            const activeSmt = (resSmt.data.items || []).find((s: any) => s.aktif);
            if (activeSmt) setSelectedSemester(activeSmt.id);
        }).catch(console.error);
    }, []);

    const startJurnal = async () => {
        if (!selectedPemId) {
            showToast.error('Pilih mata pelajaran & kelas');
            return;
        }
        
        const pem = pembelajarans.find(p => p.id === selectedPemId);
        if (!pem) return;

        setLoading(true);
        try {
            const res = await api.get<any>(`/jurnal/siswa/${pem.rombel_id}`);
            setSiswaList(res.data.map((s: any) => ({ ...s, status: 'Hadir' })));
            setView('FORM');
        } catch (e) {
            showToast.error('Gagal mengambil data siswa');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!materi) {
            showToast.error('Materi harus diisi');
            return;
        }

        const pem = pembelajarans.find(p => p.id === selectedPemId);
        if (!pem) return;

        setSaving(true);
        try {
            await api.post('/jurnal', {
                rombel_id: pem.rombel_id,
                pembelajaran_id: selectedPemId,
                semester_id: selectedSemester,
                tanggal,
                jam_ke: jamKe,
                materi,
                catatan,
                kehadiran: siswaList
            });
            showToast.success('Jurnal & Absensi berhasil disimpan');
            setView('SELECT');
            // Reset form
            setMateri('');
            setCatatan('');
            setJamKe('');
        } catch (e: any) {
            showToast.error(e.message || 'Gagal menyimpan jurnal');
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = (idx: number) => {
        const statusCycle: ('Hadir' | 'Izin' | 'Sakit' | 'Alpa')[] = ['Hadir', 'Izin', 'Sakit', 'Alpa'];
        const current = siswaList[idx].status;
        const next = statusCycle[(statusCycle.indexOf(current) + 1) % statusCycle.length];
        
        const nextList = [...siswaList];
        nextList[idx].status = next;
        setSiswaList(nextList);
    };

    const setStatusAll = (status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa') => {
        setSiswaList(siswaList.map(s => ({ ...s, status })));
    };

    const stats = {
        Hadir: siswaList.filter(s => s.status === 'Hadir').length,
        Izin: siswaList.filter(s => s.status === 'Izin').length,
        Sakit: siswaList.filter(s => s.status === 'Sakit').length,
        Alpa: siswaList.filter(s => s.status === 'Alpa').length,
    };

    return (
        <div className="w-full p-4 md:p-8 space-y-6 md:space-y-8 mx-auto animate-in fade-in duration-700 relative">
            <div className="absolute top-0 right-0 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-primary/5 blur-[100px] md:blur-[180px] -z-10 rounded-full" />
            
            <PageHero
                title="JURNAL MENGAJAR"
                description="Catat materi pembelajaran dan kehadiran siswa secara cepat & efisien"
                icon={<BookOpen className="w-5 h-5" />}
                variant="primary"
                breadcrumb="Akademik / Jurnal"
            />

            <AnimatePresence mode="wait">
                {view === 'SELECT' ? (
                    <motion.div
                        key="select"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="max-w-2xl mx-auto space-y-6"
                    >
                        <div className="p-8 rounded-[2.5rem] border border-white/5 bg-zinc-900/40 backdrop-blur-md shadow-2xl space-y-8">
                            <div className="flex flex-col items-center text-center space-y-2">
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 mb-2">
                                    <Clock className="w-7 h-7 text-primary" />
                                </div>
                                <h3 className="text-xl font-black uppercase tracking-tight">Mulai Jurnal Baru</h3>
                                <p className="text-xs text-muted-foreground font-medium">Pilih kelas dan mata pelajaran untuk hari ini</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 pl-1">Mapel & Kelas</label>
                                    <SearchableSelect
                                        value={selectedPemId}
                                        onChange={setSelectedPemId}
                                        placeholder="Pilih Pembelajaran..."
                                        options={pembelajarans.map(p => ({ value: p.id, label: `${p.rombel_nama} - ${p.mata_pelajaran_nama}` }))}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 pl-1">Semester</label>
                                        <SearchableSelect
                                            value={selectedSemester}
                                            onChange={setSelectedSemester}
                                            options={semesters.map(s => ({ value: s.id, label: `${s.nama} ${s.tahun}` }))}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 pl-1">Tanggal</label>
                                        <Input
                                            type="date"
                                            value={tanggal}
                                            onChange={e => setTanggal(e.target.value)}
                                            className="h-12 rounded-xl bg-white/5 border-white/10 font-bold"
                                        />
                                    </div>
                                </div>

                                <Button 
                                    onClick={startJurnal} 
                                    loading={loading}
                                    className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest shadow-xl shadow-primary/20 gap-3"
                                >
                                    Isi Jurnal Sekarang <ChevronRight className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center gap-4 group hover:bg-white/[0.04] transition-all cursor-pointer">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500">
                                    <History className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold">Riwayat Jurnal</h4>
                                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">Lihat catatan sebelumnya</p>
                                </div>
                            </div>
                            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center gap-4 group hover:bg-white/[0.04] transition-all cursor-pointer">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold">Daftar TP</h4>
                                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">Tujuan Pembelajaran</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="space-y-8"
                    >
                        {/* Sticky Header Info */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-[2rem] bg-primary/5 border border-primary/10 gap-4">
                            <div className="flex items-center gap-4">
                                <Button variant="ghost" size="icon" onClick={() => setView('SELECT')} className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 shrink-0">
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                                <div className="min-w-0">
                                    <h3 className="font-black text-lg uppercase tracking-tight leading-none truncate">
                                        {pembelajarans.find(p => p.id === selectedPemId)?.rombel_nama} - {pembelajarans.find(p => p.id === selectedPemId)?.mata_pelajaran_nama}
                                    </h3>
                                    <p className="text-[10px] text-primary/70 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                        <Calendar className="w-3 h-3" /> {format(new Date(tanggal), 'EEEE, dd MMMM yyyy')}
                                    </p>
                                </div>
                            </div>
                            <Button onClick={handleSave} loading={saving} className="w-full md:w-auto rounded-2xl px-8 h-12 gap-3 font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20">
                                <Save className="w-4 h-4" /> Simpan Jurnal & Absensi
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left: Materi & Catatan */}
                            <div className="lg:col-span-1 space-y-6">
                                <div className="p-8 rounded-[2rem] bg-zinc-900/40 border border-white/5 space-y-6">
                                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <h4 className="font-black text-xs uppercase tracking-widest">Informasi Materi</h4>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 pl-1">Jam Ke-</label>
                                            <Input
                                                value={jamKe}
                                                onChange={e => setJamKe(e.target.value)}
                                                placeholder="Contoh: 1-2"
                                                className="h-11 rounded-xl bg-white/5 border-white/10 font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 pl-1">Materi Pembelajaran</label>
                                            <Textarea
                                                value={materi}
                                                onChange={e => setMateri(e.target.value)}
                                                placeholder="Apa yang diajarkan hari ini?"
                                                className="min-h-[120px] rounded-xl bg-white/5 border-white/10 font-medium leading-relaxed resize-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 pl-1">Catatan Tambahan (Opsional)</label>
                                            <Textarea
                                                value={catatan}
                                                onChange={e => setCatatan(e.target.value)}
                                                placeholder="Misal: Kelas agak berisik, atau ada alat peraga yang kurang"
                                                className="min-h-[80px] rounded-xl bg-white/5 border-white/10 text-xs font-medium resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Kehadiran Siswa */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="p-6 md:p-8 rounded-[2rem] bg-zinc-900/40 border border-white/5 flex flex-col h-full">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6 mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                <Users className="w-4 h-4" />
                                            </div>
                                            <h4 className="font-black text-xs uppercase tracking-widest">Kehadiran Siswa ({siswaList.length})</h4>
                                        </div>
                                        
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-white/5 border border-white/5 mr-2">
                                                <div className="text-center">
                                                    <p className="text-[8px] font-black uppercase text-emerald-400">Hadir</p>
                                                    <p className="font-black text-sm">{stats.Hadir}</p>
                                                </div>
                                                <div className="w-px h-6 bg-white/10" />
                                                <div className="text-center">
                                                    <p className="text-[8px] font-black uppercase text-rose-400">Absen</p>
                                                    <p className="font-black text-sm">{stats.Alpa + stats.Izin + stats.Sakit}</p>
                                                </div>
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => setStatusAll('Hadir')}
                                                className="h-9 rounded-lg text-[10px] font-black uppercase tracking-tighter hover:bg-emerald-500/10 hover:text-emerald-400 border-white/10"
                                            >
                                                Semua Hadir
                                            </Button>
                                        </div>
                                    </div>

                                    {/* List Siswa - Mobile Optimized Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                                        {siswaList.map((s, idx) => (
                                            <div 
                                                key={s.peserta_didik_id} 
                                                className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:border-white/20 transition-all"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-muted-foreground/50 shrink-0">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h5 className="font-bold text-xs truncate uppercase tracking-tight">{s.siswa_nama}</h5>
                                                        <p className="text-[9px] text-muted-foreground font-medium truncate uppercase tracking-widest">{s.nis}</p>
                                                    </div>
                                                </div>

                                                <button 
                                                    onClick={() => toggleStatus(idx)}
                                                    className={`
                                                        px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                                        ${s.status === 'Hadir' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                                                          s.status === 'Alpa' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
                                                          'bg-amber-500/10 text-amber-500 border border-amber-500/20'}
                                                    `}
                                                >
                                                    {s.status}
                                                </button>
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
