import React, { useState, useEffect } from 'react';
import { 
    Plus, 
    Sparkles, 
    Save, 
    List, 
    Target, 
    BookOpen,
    Trash2,
    Search,
    Filter,
    FileText,
    History,
    Download,
    Menu,
    X,
    Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { showToast } from '@/lib/toast-utils';
import { api } from '@/lib/api';

interface ModulAjarDetail {
    id?: string;
    tp_id: string;
    judul: string;
    konten_json: any;
    langkah_pembelajaran: string;
    media: string;
    asesmen: string;
    is_generated_ai: boolean;
}

interface TP {
    id: string;
    kode: string;
    deskripsi: string;
}

import { SearchableSelect } from '@/components/shared/SearchableSelect';

const ModulAjarPage: React.FC = () => {
    const [mapels, setMapels] = useState<any[]>([]);
    const [selectedMapel, setSelectedMapel] = useState('');
    const [selectedFase, setSelectedFase] = useState('');
    const [tpList, setTpList] = useState<TP[]>([]);
    const [selectedTP, setSelectedTP] = useState('');
    const [modulList, setModulList] = useState<ModulAjarDetail[]>([]);
    const [activeModul, setActiveModul] = useState<ModulAjarDetail | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showMobileKoleksi, setShowMobileKoleksi] = useState(false);

    useEffect(() => {
        fetchMapel();
    }, []);

    useEffect(() => {
        if (selectedMapel && selectedFase) {
            setSelectedTP(''); // Reset TP saat mapel/fase ganti
            fetchTP();
            fetchModul();
        }
    }, [selectedMapel, selectedFase]);

    const fetchMapel = async () => {
        try {
            // Ambil mata pelajaran yang diajar oleh guru ini
            const res = await api.get<any>('/pembelajaran?limit=100');
            const items = res.data?.items || [];
            
            const uniqueMapels = Array.from(new Map(items.map((item: any) => [
                item.mata_pelajaran_id, 
                { id: item.mata_pelajaran_id, nama: item.mata_pelajaran_nama, phases: [] as string[] }
            ])).values()) as { id: string, nama: string, phases: string[] }[];

            items.forEach((item: any) => {
                const mapel = uniqueMapels.find(m => m.id === item.mata_pelajaran_id);
                if (mapel && item.fase && !mapel.phases.includes(item.fase)) {
                    mapel.phases.push(item.fase);
                }
            });

            setMapels(uniqueMapels);
        } catch (error) {
            showToast.error('Gagal mengambil data mata pelajaran mengajar');
        }
    };

    const fetchTP = async () => {
        try {
            const res = await api.get<any>(`/perencanaan/tp?mapel_id=${selectedMapel}&fase=${selectedFase}`);
            setTpList(res.data || []);
        } catch (error) {
            showToast.error('Gagal mengambil data TP');
        }
    };

    const fetchModul = async () => {
        try {
            const res = await api.get<any>(`/perencanaan/modul-ajar?mapel=${selectedMapel}&fase=${selectedFase}`);
            setModulList(res.data || []);
        } catch (error) {
            showToast.error('Gagal mengambil daftar modul');
        }
    };

    const handleGenerateAI = async () => {
        if (!selectedTP) return showToast.error('Pilih Tujuan Pembelajaran terlebih dahulu');
        const tp = tpList.find(t => t.id === selectedTP);
        const mapelObj = mapels.find(m => m.id === selectedMapel);
        
        setIsGenerating(true);
        try {
            const res = await api.post<any>('/perencanaan/modul-ajar/generate', {
                mapel: mapelObj?.nama,
                fase: selectedFase,
                tp_deskripsi: tp?.deskripsi
            });
            
            const generated = res.data;
            setActiveModul({
                tp_id: selectedTP,
                judul: generated.judul || `Modul Ajar - ${tp?.kode}`,
                langkah_pembelajaran: generated.langkah_pembelajaran,
                media: generated.media,
                asesmen: generated.asesmen,
                konten_json: generated,
                is_generated_ai: true
            });
            showToast.success('Modul Ajar berhasil disusun oleh AI');
        } catch (error: any) {
            showToast.error(error.response?.data?.message || 'Gagal generate modul');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!activeModul) return;
        setIsSaving(true);
        try {
            await api.post('/perencanaan/modul-ajar', {
                ...activeModul,
                konten_json: {
                    langkah_pembelajaran: activeModul.langkah_pembelajaran,
                    media: activeModul.media,
                    asesmen: activeModul.asesmen
                }
            });
            showToast.success('Modul Ajar berhasil disimpan');
            fetchModul();
        } catch (error) {
            showToast.error('Gagal menyimpan modul');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSelectModul = (m: ModulAjarDetail) => {
        let safeKonten = m.konten_json;
        if (typeof safeKonten === 'string') {
            try { safeKonten = JSON.parse(safeKonten); } catch (e) { safeKonten = {}; }
        }

        const safeModul = {
            ...m,
            langkah_pembelajaran: m.langkah_pembelajaran || safeKonten?.langkah_pembelajaran || '',
            media: m.media || safeKonten?.media || '',
            asesmen: m.asesmen || safeKonten?.asesmen || '',
            konten_json: safeKonten
        };
        setActiveModul(safeModul);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Hapus Modul Ajar ini?')) return;
        try {
            await api.delete(`/perencanaan/modul-ajar/${id}`);
            showToast.success('Modul Ajar berhasil dihapus');
            if (activeModul?.id === id) setActiveModul(null);
            fetchModul();
        } catch (error) {
            showToast.error('Gagal menghapus modul');
        }
    };

    const handleNewModul = () => {
        if (!selectedTP) return;
        const tp = tpList.find(t => t.id === selectedTP);
        setActiveModul({
            tp_id: selectedTP,
            judul: `Modul Baru - ${tp?.kode}`,
            langkah_pembelajaran: '',
            media: '',
            asesmen: '',
            konten_json: {},
            is_generated_ai: false
        });
    };

    const filteredModulList = modulList.filter(m => 
        m.judul.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col md:flex-row h-full md:h-[calc(100vh-120px)] gap-4 md:gap-6 p-2 animate-in fade-in duration-700 relative overflow-hidden">
            {/* MOBILE TOGGLE OVERLAY */}
            <AnimatePresence>
                {showMobileKoleksi && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowMobileKoleksi(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[40] md:hidden"
                    />
                )}
            </AnimatePresence>

            <div className={`
                fixed md:relative inset-y-0 left-0 z-[50] md:z-0
                w-[280px] md:w-80 
                transform transition-transform duration-300 ease-in-out
                ${showMobileKoleksi ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                flex flex-col gap-4 p-4 md:p-0 bg-slate-950 md:bg-transparent
            `}>
                <div className="relative group h-full">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                    <div className="relative flex flex-col bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 h-full overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <History className="w-4 h-4 text-violet-400" />
                                <h3 className="text-sm font-bold text-foreground tracking-tight">Koleksi Modul</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-bold">
                                    {modulList.length}
                                </span>
                                <button onClick={() => setShowMobileKoleksi(false)} className="md:hidden p-1 hover:bg-white/10 rounded-lg">
                                    <X className="w-4 h-4 text-muted-foreground" />
                                </button>
                            </div>
                        </div>

                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <input 
                                type="text"
                                placeholder="Cari modul..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-foreground focus:outline-none focus:border-violet-500/50 transition-all"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                            {filteredModulList.map((m) => (
                                <button 
                                    key={m.id}
                                    onClick={() => { handleSelectModul(m); setShowMobileKoleksi(false); }}
                                    className={`w-full text-left p-3 rounded-xl border transition-all group relative overflow-hidden ${activeModul?.id === m.id ? 'bg-violet-500/10 border-violet-500/30' : 'bg-white/[0.03] border-white/5 hover:border-violet-500/30'}`}
                                >
                                    <div className="relative z-10">
                                        <h5 className={`text-[11px] font-bold transition-colors line-clamp-2 ${activeModul?.id === m.id ? 'text-violet-400' : 'text-foreground group-hover:text-violet-400'}`}>
                                            {m.judul}
                                        </h5>
                                        <div className="flex items-center justify-between mt-2">
                                            {m.is_generated_ai && (
                                                <span className="flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 font-black tracking-tighter">
                                                    <Zap className="w-2 h-2" /> AI
                                                </span>
                                            )}
                                            <button onClick={(e) => handleDelete(e, m.id!)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-3 md:p-4">
                    <div className="flex flex-wrap items-center gap-3 md:gap-4">
                        <button onClick={() => setShowMobileKoleksi(true)} className="md:hidden p-2 bg-white/5 rounded-xl border border-white/10 text-violet-400">
                            <Menu className="w-5 h-5" />
                        </button>
                        
                        <div className="flex-1 min-w-[200px]">
                            <SearchableSelect
                                options={mapels.map(m => ({ value: m.id, label: m.nama }))}
                                value={selectedMapel}
                                onChange={setSelectedMapel}
                                placeholder="Pilih Mapel"
                            />
                        </div>

                        <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/10 min-w-[110px] flex-1 md:flex-none">
                            <Filter className="w-4 h-4 text-violet-400" />
                            <select 
                                className="bg-transparent border-none text-xs font-bold focus:ring-0 w-full"
                                value={selectedFase}
                                onChange={(e) => setSelectedFase(e.target.value)}
                                disabled={!selectedMapel}
                            >
                                <option value="" disabled>Fase</option>
                                {mapels.find(m => m.id === selectedMapel)?.phases.map((f: string) => (
                                    <option key={f} value={f}>{f}</option>
                                ))}
                            </select>
                        </div>

                        <div className="w-full lg:max-w-xs order-last lg:order-none">
                            <SearchableSelect
                                options={tpList.map(tp => ({ value: tp.id, label: `[${tp.kode}] ${tp.deskripsi}` }))}
                                value={selectedTP}
                                onChange={setSelectedTP}
                                placeholder="Pilih TP"
                            />
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                                <Button onClick={handleNewModul} disabled={!selectedTP} variant="outline" className="h-10 border-white/10 bg-white/5 text-xs gap-2">
                                    <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Baru</span>
                                </Button>
                                <Button onClick={handleGenerateAI} disabled={!selectedTP || isGenerating} className="h-10 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs gap-2 shadow-lg shadow-violet-500/20">
                                    <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                                    {isGenerating ? 'AI Processing...' : 'Generate AI'}
                                </Button>
                            </div>
                        </div>
                    </div>

                {/* EDITOR AREA */}
                {activeModul ? (
                    <div className="flex-1 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden flex flex-col relative group/editor shadow-2xl">
                        <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/5 bg-white/[0.02]">
                            <div className="flex-1">
                                <input 
                                    type="text"
                                    value={activeModul.judul}
                                    onChange={(e) => setActiveModul({...activeModul, judul: e.target.value})}
                                    className="w-full bg-transparent border-none p-0 text-xl font-black text-foreground focus:ring-0 placeholder:text-muted-foreground/30"
                                    placeholder="Judul Modul Ajar..."
                                />
                                {activeModul.is_generated_ai && (
                                    <p className="text-[10px] text-violet-400 font-black tracking-widest uppercase flex items-center gap-1.5 mt-1">
                                        <Zap className="w-2.5 h-2.5" /> Hasil Optimasi AI
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="hidden md:flex bg-white/5 border-white/10 hover:bg-white/10 rounded-xl h-10 px-4"
                                >
                                    <Download className="w-4 h-4 mr-2" /> Export
                                </Button>
                                <Button 
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="bg-violet-600 hover:bg-violet-500 rounded-xl h-10 px-6 font-bold shadow-lg shadow-violet-500/20"
                                >
                                    {isSaving ? 'Menyimpan...' : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Simpan</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                            {/* Section 1: Informasi Umum */}
                            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                                <label className="text-[11px] font-black text-violet-400/80 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <div className="w-8 h-[1px] bg-violet-400/30" />
                                    1. Informasi Umum (Identitas, P5, Sarana)
                                </label>
                                <div className="relative">
                                    <BookOpen className="absolute left-4 top-4 w-4 h-4 text-muted-foreground/30" />
                                    <textarea 
                                        value={activeModul.media}
                                        onChange={(e) => setActiveModul({...activeModul, media: e.target.value})}
                                        className="w-full min-h-[160px] bg-white/[0.03] border border-white/5 hover:border-white/10 focus:border-violet-500/30 rounded-2xl p-6 pl-12 text-sm text-foreground/90 focus:outline-none transition-all leading-relaxed shadow-inner"
                                        placeholder="Tuliskan identitas modul, dimensi Profil Pelajar Pancasila, sarana prasarana, target peserta didik, dan model pembelajaran di sini..."
                                    />
                                </div>
                            </div>

                            {/* Section 2: Komponen Inti */}
                            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-700">
                                <label className="text-[11px] font-black text-violet-400/80 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <div className="w-8 h-[1px] bg-violet-400/30" />
                                    2. Komponen Inti (Tujuan, Langkah, Asesmen)
                                </label>
                                <div className="relative">
                                    <List className="absolute left-4 top-4 w-4 h-4 text-muted-foreground/30" />
                                    <textarea 
                                        value={activeModul.langkah_pembelajaran}
                                        onChange={(e) => setActiveModul({...activeModul, langkah_pembelajaran: e.target.value})}
                                        className="w-full min-h-[350px] bg-white/[0.03] border border-white/5 hover:border-white/10 focus:border-violet-500/30 rounded-2xl p-6 pl-12 text-sm text-foreground/90 focus:outline-none transition-all leading-relaxed shadow-inner"
                                        placeholder="Tuliskan tujuan pembelajaran, pemahaman bermakna, pertanyaan pemantik, langkah-langkah pembelajaran detail (Pendahuluan, Inti, Penutup), dan asesmen di sini..."
                                    />
                                </div>
                            </div>

                            {/* Section 3: Lampiran */}
                            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-1000">
                                <label className="text-[11px] font-black text-violet-400/80 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <div className="w-8 h-[1px] bg-violet-400/30" />
                                    3. Lampiran (LKPD, Glosarium, Pustaka)
                                </label>
                                <div className="relative">
                                    <Target className="absolute left-4 top-4 w-4 h-4 text-muted-foreground/30" />
                                    <textarea 
                                        value={activeModul.asesmen}
                                        onChange={(e) => setActiveModul({...activeModul, asesmen: e.target.value})}
                                        className="w-full min-h-[160px] bg-white/[0.03] border border-white/5 hover:border-white/10 focus:border-violet-500/30 rounded-2xl p-6 pl-12 text-sm text-foreground/90 focus:outline-none transition-all leading-relaxed shadow-inner"
                                        placeholder="Tuliskan Lembar Kerja Peserta Didik (LKPD), bahan bacaan guru & siswa, glosarium, dan daftar pustaka di sini..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-xl border border-dashed border-white/10 rounded-3xl p-12 text-center group">
                        <div className="w-24 h-24 rounded-full bg-violet-500/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                            <Zap className="w-10 h-10 text-violet-400/20" />
                        </div>
                        <h4 className="text-lg font-bold text-foreground mb-2">Pilih atau Buat Modul Ajar</h4>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                            Pilih modul dari koleksi di sebelah kiri untuk mengedit, atau gunakan bantuan AI untuk menyusun modul ajar baru secara otomatis dalam hitungan detik.
                        </p>
                        <div className="flex items-center gap-4 mt-8 opacity-50">
                            <div className="flex flex-col items-center gap-1">
                                <div className="p-3 rounded-xl bg-white/5"><History className="w-4 h-4" /></div>
                                <span className="text-[10px] font-bold">History</span>
                            </div>
                            <div className="w-8 h-[1px] bg-white/10" />
                            <div className="flex flex-col items-center gap-1">
                                <div className="p-3 rounded-xl bg-white/5"><Sparkles className="w-4 h-4" /></div>
                                <span className="text-[10px] font-bold">AI Power</span>
                            </div>
                            <div className="w-8 h-[1px] bg-white/10" />
                            <div className="flex flex-col items-center gap-1">
                                <div className="p-3 rounded-xl bg-white/5"><Save className="w-4 h-4" /></div>
                                <span className="text-[10px] font-bold">Cloud Save</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(139, 92, 246, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(139, 92, 246, 0.3);
                }
            `}} />
        </div>
    );
};

export default ModulAjarPage;
