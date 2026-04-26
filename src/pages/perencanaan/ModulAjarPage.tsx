import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import {
    FileText,
    Plus,
    Save,
    Sparkles,
    Layout,
    Type,
    List,
    Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { PageHero } from '@/components/shared/PageHero';
import { showToast } from '@/lib/toast-utils';
import { motion, AnimatePresence } from 'framer-motion';

interface TP {
    id: string;
    kode: string;
    deskripsi: string;
}

interface ModulAjar {
    id?: string;
    tp_id: string;
    judul: string;
    konten_json: any;
    is_generated_ai: boolean;
}

interface Pembelajaran {
    id: string;
    mata_pelajaran_nama: string;
    rombel_nama: string;
}

export default function ModulAjarPage() {
    const [pembelajarans, setPembelajarans] = useState<Pembelajaran[]>([]);
    const [selectedPembelajaran, setSelectedPembelajaran] = useState('');
    const [tpList, setTpList] = useState<TP[]>([]);
    const [selectedTP, setSelectedTP] = useState('');
    const [modulList, setModulList] = useState<ModulAjar[]>([]);
    const [activeModul, setActiveModul] = useState<ModulAjar | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchPembelajaran = async () => {
        try {
            const res = await api.get<any>('/pembelajaran?limit=100');
            setPembelajarans(res.data.items || []);
        } catch (error) {
            showToast.error('Gagal mengambil data pembelajaran');
        }
    };

    const fetchTP = useCallback(async () => {
        if (!selectedPembelajaran) return;
        try {
            const res = await api.get<any>(`/perencanaan/tp?pembelajaran_id=${selectedPembelajaran}`);
            setTpList(res.data || []);
        } catch (error) {
            showToast.error('Gagal mengambil data TP');
        }
    }, [selectedPembelajaran]);

    const fetchModul = useCallback(async () => {
        if (!selectedTP) return;
        try {
            const res = await api.get<any>(`/perencanaan/modul-ajar?tp_id=${selectedTP}`);
            setModulList(res.data || []);
        } catch (error) {
            showToast.error('Gagal mengambil daftar modul');
        }
    }, [selectedTP]);

    useEffect(() => {
        fetchPembelajaran();
    }, []);

    useEffect(() => {
        if (selectedPembelajaran) fetchTP();
    }, [selectedPembelajaran, fetchTP]);

    useEffect(() => {
        if (selectedTP) fetchModul();
    }, [selectedTP, fetchModul]);

    const handleNewModul = () => {
        if (!selectedTP) return;
        const tp = tpList.find(t => t.id === selectedTP);
        setActiveModul({
            tp_id: selectedTP,
            judul: `Modul Ajar: ${tp?.kode}`,
            konten_json: {
                tujuan: tp?.deskripsi,
                langkah_pembelajaran: '',
                media: '',
                asesmen: ''
            },
            is_generated_ai: false
        });
    };

    const handleSave = async () => {
        if (!activeModul) return;
        setSaving(true);
        try {
            await api.post('/perencanaan/modul-ajar', activeModul);
            showToast.success('Modul Ajar berhasil disimpan');
            fetchModul();
            setActiveModul(null);
        } catch (error) {
            showToast.error('Gagal menyimpan modul');
        } finally {
            setSaving(false);
        }
    };

    const generateWithAI = () => {
        if (!activeModul) return;
        showToast.info('AI sedang merumuskan modul...', 'Mohon tunggu sebentar.');
        // Simulation
        setTimeout(() => {
            setActiveModul({
                ...activeModul,
                is_generated_ai: true,
                konten_json: {
                    ...activeModul.konten_json,
                    langkah_pembelajaran: "1. Pendahuluan (15 menit): Doa, Absensi, Apersepsi.\n2. Inti (60 menit): Eksplorasi materi menggunakan media interaktif, Diskusi Kelompok, Presentasi.\n3. Penutup (15 menit): Refleksi, Kesimpulan, dan Rencana Pertemuan Berikutnya.",
                    media: "Slide Presentasi, Video YouTube, Lembar Kerja Peserta Didik (LKPD).",
                    asesmen: "Formatif: Observasi kinerja kelompok. Sumatif: Tes tulis di akhir materi."
                }
            });
            showToast.success('Modul berhasil di-generate!');
        }, 2000);
    };

    return (
        <div className="p-4 md:p-8 space-y-8">
            <PageHero
                title="Modul Ajar"
                description="Buat detail pelaksanaan mengajar dari setiap Tujuan Pembelajaran"
                icon={<FileText className="w-5 h-5" />}
                breadcrumb="Perencanaan / Modul Ajar"
                variant="violet"
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Selector Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="p-6 rounded-[2rem] bg-zinc-900/50 border border-white/5 backdrop-blur-xl space-y-6">
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Pembelajaran</Label>
                            <SearchableSelect
                                value={selectedPembelajaran}
                                onChange={setSelectedPembelajaran}
                                options={pembelajarans.map(p => ({ value: p.id, label: `${p.rombel_nama} - ${p.mata_pelajaran_nama}` }))}
                                placeholder="Pilih Kelas & Mapel"
                            />
                        </div>
                        {selectedPembelajaran && (
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Tujuan (TP)</Label>
                                <SearchableSelect
                                    value={selectedTP}
                                    onChange={setSelectedTP}
                                    options={tpList.map(t => ({ value: t.id, label: `${t.kode} - ${t.deskripsi.substring(0, 40)}...` }))}
                                    placeholder="Pilih TP"
                                />
                            </div>
                        )}
                        {selectedTP && (
                             <Button onClick={handleNewModul} className="w-full h-12 rounded-2xl gap-2 font-black uppercase text-[11px] tracking-widest bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-600/20">
                                <Plus className="w-4 h-4" /> Buat Modul Baru
                             </Button>
                        )}
                    </div>

                    {/* Modul List for selected TP */}
                    {selectedTP && (
                        <div className="p-6 rounded-[2rem] bg-zinc-900/50 border border-white/5 backdrop-blur-xl">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1 mb-4">Modul yang ada</h4>
                            <div className="space-y-3">
                                {modulList.map(m => (
                                    <button 
                                        key={m.id} 
                                        onClick={() => setActiveModul(m)}
                                        className="w-full p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-violet-500/30 text-left transition-all group"
                                    >
                                        <h5 className="text-[11px] font-bold text-foreground group-hover:text-violet-400 transition-colors">{m.judul}</h5>
                                        <div className="flex items-center gap-2 mt-2">
                                            {m.is_generated_ai && <span className="text-[8px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 font-black uppercase">AI Generated</span>}
                                            <span className="text-[8px] text-muted-foreground uppercase">{m.id?.substring(0, 8)}</span>
                                        </div>
                                    </button>
                                ))}
                                {modulList.length === 0 && (
                                    <p className="text-[10px] text-muted-foreground text-center py-4 italic">Belum ada modul untuk TP ini.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Editor Area */}
                <div className="lg:col-span-3">
                    <AnimatePresence mode="wait">
                        {!activeModul ? (
                             <div className="flex flex-col items-center justify-center py-32 text-center space-y-4 rounded-[3rem] border-2 border-dashed border-white/5 bg-zinc-900/20">
                                <FileText className="w-12 h-12 text-muted-foreground opacity-20" />
                                <p className="text-sm text-muted-foreground">Pilih TP dan klik 'Buat Modul Baru' atau pilih modul yang ada.</p>
                             </div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-6"
                            >
                                <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-6 rounded-[2rem] bg-violet-500/5 border border-violet-500/10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-violet-600/20 flex items-center justify-center border border-violet-600/30">
                                            <FileText className="w-6 h-6 text-violet-500" />
                                        </div>
                                        <div>
                                            <Input 
                                                value={activeModul.judul}
                                                onChange={(e) => setActiveModul({...activeModul, judul: e.target.value})}
                                                className="bg-transparent border-none p-0 h-auto font-black text-xl text-foreground focus-visible:ring-0"
                                            />
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Status: {activeModul.id ? 'Tersimpan' : 'Draft Baru'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button 
                                            variant="ghost" 
                                            onClick={generateWithAI}
                                            className="h-12 rounded-2xl gap-2 font-black uppercase text-[10px] text-violet-400 hover:bg-violet-500/10"
                                        >
                                            <Sparkles className="w-4 h-4" /> Generate AI
                                        </Button>
                                        <Button onClick={handleSave} loading={saving} className="h-12 px-8 rounded-2xl gap-2 font-black uppercase text-[11px] tracking-widest bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-600/20">
                                            <Save className="w-4 h-4" /> Simpan Modul
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Left: General Info */}
                                    <div className="space-y-6">
                                        <div className="p-6 rounded-[2.5rem] bg-zinc-900/40 border border-white/5 space-y-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Target className="w-4 h-4 text-violet-400" />
                                                <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Tujuan (TP)</h4>
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed italic border-l-2 border-violet-500/30 pl-4">
                                                {activeModul.konten_json.tujuan || 'Belum ada tujuan terdefinisi.'}
                                            </p>
                                        </div>

                                        <div className="p-6 rounded-[2.5rem] bg-zinc-900/40 border border-white/5 space-y-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Layout className="w-4 h-4 text-violet-400" />
                                                <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Media & Sarana</h4>
                                            </div>
                                            <textarea 
                                                value={activeModul.konten_json.media}
                                                onChange={(e) => setActiveModul({...activeModul, konten_json: {...activeModul.konten_json, media: e.target.value}})}
                                                placeholder="Sebutkan media yang digunakan..."
                                                className="w-full min-h-[100px] bg-transparent border-none p-0 text-sm text-muted-foreground focus:ring-0 outline-none resize-none"
                                            />
                                        </div>

                                        <div className="p-6 rounded-[2.5rem] bg-zinc-900/40 border border-white/5 space-y-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <List className="w-4 h-4 text-violet-400" />
                                                <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Asesmen</h4>
                                            </div>
                                            <textarea 
                                                value={activeModul.konten_json.asesmen}
                                                onChange={(e) => setActiveModul({...activeModul, konten_json: {...activeModul.konten_json, asesmen: e.target.value}})}
                                                placeholder="Jelaskan metode asesmen..."
                                                className="w-full min-h-[100px] bg-transparent border-none p-0 text-sm text-muted-foreground focus:ring-0 outline-none resize-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Right: Main Steps */}
                                    <div className="p-8 rounded-[3rem] bg-zinc-900/40 border border-white/5 space-y-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Type className="w-4 h-4 text-violet-400" />
                                            <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Langkah Pembelajaran (Skenario)</h4>
                                        </div>
                                        <textarea 
                                            value={activeModul.konten_json.langkah_pembelajaran}
                                            onChange={(e) => setActiveModul({...activeModul, konten_json: {...activeModul.konten_json, langkah_pembelajaran: e.target.value}})}
                                            placeholder="Tuliskan skenario mengajar di sini..."
                                            className="w-full min-h-[450px] bg-transparent border-none p-0 text-sm text-muted-foreground focus:ring-0 outline-none resize-none leading-loose"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
