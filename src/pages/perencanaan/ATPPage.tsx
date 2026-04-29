import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import {
    Compass,
    Calendar,
    Save,
    Layers,
    BookOpen,
    Filter,
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { PageHero } from '@/components/shared/PageHero';
import { showToast } from '@/lib/toast-utils';
import { motion, AnimatePresence } from 'framer-motion';

interface TP {
    id: string;
    kode: string;
    deskripsi: string;
    urutan: number;
}

interface ATPDetail {
    id?: string;
    tp_id: string | null;
    minggu_ke: number;
    urutan: number;
    tp_kode?: string;
    tp_deskripsi?: string;
    catatan?: string | null;
}

interface ATP {
    id?: string;
    mapel_id: string;
    fase: string;
    tahun_ajaran: string;
    nama: string;
    details: ATPDetail[];
}


export default function ATPPage() {
    interface Subject {
        id: string;
        nama: string;
        phases: string[];
    }

    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [filters, setFilters] = useState({
        mapel_id: '',
        fase: '',
        tahun_ajaran: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1)
    });
    
    const [tpList, setTpList] = useState<TP[]>([]);
    const [atpData, setAtpData] = useState<ATP | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [totalWeeks, setTotalWeeks] = useState(18);

    const fetchMapel = async () => {
        try {
            const res = await api.get<any>('/pembelajaran?limit=100');
            const items = res.data.items || [];
            
            // Ekstraksi mapel unik
            const uniqueMapels = Array.from(new Map(items.map((item: any) => [
                item.mata_pelajaran_id, 
                { id: item.mata_pelajaran_id, nama: item.mata_pelajaran_nama, phases: [] as string[] }
            ])).values()) as Subject[];

            // Masukkan fase yang tersedia untuk tiap mapel
            items.forEach((item: any) => {
                const mapel = uniqueMapels.find(m => m.id === item.mata_pelajaran_id);
                if (mapel && item.fase && !mapel.phases.includes(item.fase)) {
                    mapel.phases.push(item.fase);
                }
            });

            setSubjects(uniqueMapels);
        } catch (error) {
            showToast.error('Gagal mengambil data mata pelajaran mengajar');
        }
    };

    const fetchData = useCallback(async () => {
        if (!filters.mapel_id || !filters.fase) return;
        setLoading(true);
        try {
            const [resTP, resATP] = await Promise.all([
                api.get<any>(`/perencanaan/tp?mapel_id=${filters.mapel_id}&fase=${filters.fase}`),
                api.get<any>(`/perencanaan/atp?mapel_id=${filters.mapel_id}&fase=${filters.fase}&tahun_ajaran=${filters.tahun_ajaran}`)
            ]);
            
            setTpList(resTP.data || []);
            
            if (resATP.data) {
                setAtpData(resATP.data);
            } else {
                const mapelName = subjects.find(s => s.id === filters.mapel_id)?.nama || '';
                setAtpData({ 
                    mapel_id: filters.mapel_id,
                    fase: filters.fase,
                    tahun_ajaran: filters.tahun_ajaran,
                    nama: `Alur Tujuan Pembelajaran ${mapelName} Fase ${filters.fase}`,
                    details: [] 
                });
            }
        } catch (error) {
            showToast.error('Gagal mengambil data perencanaan');
        } finally {
            setLoading(false);
        }
    }, [filters, subjects]);

    useEffect(() => {
        fetchMapel();
    }, []);

    useEffect(() => {
        if (filters.mapel_id && filters.fase) {
            fetchData();
        } else {
            setTpList([]);
            setAtpData(null);
        }
    }, [filters.mapel_id, filters.fase, filters.tahun_ajaran, fetchData]);

    const handleSave = async () => {
        if (!atpData) return;
        setSaving(true);
        try {
            await api.post('/perencanaan/atp', atpData);
            showToast.success('ATP Kurikulum berhasil disimpan');
            fetchData();
        } catch (error) {
            showToast.error('Gagal menyimpan ATP');
        } finally {
            setSaving(false);
        }
    };

    const handleGenerateAI = async () => {
        if (!filters.mapel_id || !filters.fase || tpList.length === 0) {
            showToast.error('Lengkapi filter dan pastikan sudah ada TP');
            return;
        }

        setGenerating(true);
        try {
            const mapelName = subjects.find(s => s.id === filters.mapel_id)?.nama || '';
            const res = await api.post<any>('/perencanaan/atp/generate', {
                mapel: mapelName,
                fase: filters.fase,
                tpList: tpList.map(tp => ({ id: tp.id, kode: tp.kode, deskripsi: tp.deskripsi })),
                total_minggu: totalWeeks
            });

            const suggestions = res.data || [];
            
            // Map suggestions back to ATP details
            const newDetails: ATPDetail[] = suggestions.map((s: any) => {
                const tp = tpList.find(t => t.id === s.tp_id);
                return {
                    tp_id: s.tp_id || null,
                    minggu_ke: s.minggu_ke,
                    urutan: s.urutan,
                    tp_kode: tp?.kode,
                    tp_deskripsi: tp?.deskripsi,
                    catatan: s.catatan || null
                };
            });

            if (atpData) {
                setAtpData({
                    ...atpData,
                    details: newDetails
                });
            }
            showToast.success('AI berhasil menyusun alur pengajaran!');
        } catch (error) {
            showToast.error('Gagal merumuskan alur via AI');
        } finally {
            setGenerating(false);
        }
    };

    const addTPToTimeline = (tp: TP, minggu: number) => {
        if (!atpData) return;
        
        // Check if already in this week
        const exists = atpData.details.find(d => d.tp_id === tp.id && d.minggu_ke === minggu);
        if (exists) {
            showToast.error('TP ini sudah ada di minggu tersebut');
            return;
        }

        const newDetail: ATPDetail = {
            tp_id: tp.id,
            minggu_ke: minggu,
            urutan: (atpData.details.filter(d => d.minggu_ke === minggu).length) + 1,
            tp_kode: tp.kode,
            tp_deskripsi: tp.deskripsi
        };

        setAtpData({
            ...atpData,
            details: [...atpData.details, newDetail]
        });
    };

    const removeTPFromTimeline = (tp_id: string, minggu: number) => {
        if (!atpData) return;
        setAtpData({
            ...atpData,
            details: atpData.details.filter(d => !(d.tp_id === tp_id && d.minggu_ke === minggu))
        });
    };

    const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);

    return (
        <div className="p-4 md:p-8 space-y-8">
            <PageHero
                title="Alur Tujuan Pembelajaran (ATP)"
                description="Susun urutan Tujuan Pembelajaran kurikulum per Fase dan Mata Pelajaran"
                icon={<Compass className="w-5 h-5" />}
                breadcrumb="Perencanaan / ATP"
                variant="emerald"
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Control Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="p-6 rounded-[2rem] bg-zinc-900/50 border border-white/5 backdrop-blur-xl space-y-6 shadow-xl shadow-black/20">
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1 flex items-center gap-2">
                                <BookOpen className="w-3 h-3" /> Mata Pelajaran
                            </Label>
                            <SearchableSelect
                                value={filters.mapel_id}
                                onChange={(v) => setFilters({...filters, mapel_id: v})}
                                options={subjects.map(s => ({ value: s.id, label: s.nama }))}
                                placeholder="Pilih Mapel"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Fase</Label>
                                <select 
                                    value={filters.fase}
                                    onChange={(e) => setFilters({...filters, fase: e.target.value})}
                                    className="w-full h-11 bg-zinc-800 border-white/5 rounded-xl text-sm px-3 outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                                >
                                    <option value="" disabled>Pilih Fase</option>
                                    {(subjects.find(s => s.id === filters.mapel_id)?.phases || []).map(f => (
                                        <option key={f} value={f}>Fase {f}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Th. Ajaran</Label>
                                <input 
                                    type="text"
                                    value={filters.tahun_ajaran}
                                    onChange={(e) => setFilters({...filters, tahun_ajaran: e.target.value})}
                                    className="w-full h-11 bg-zinc-800 border-white/5 rounded-xl text-sm px-3 outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                                    placeholder="2024/2025"
                                />
                            </div>
                        </div>

                        {/* Slider Minggu Efektif */}
                        <div className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Minggu Efektif</Label>
                                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg font-black text-xs">
                                    {totalWeeks} Minggu
                                </span>
                            </div>
                            <input 
                                type="range"
                                min="10"
                                max="24"
                                value={totalWeeks}
                                onChange={(e) => setTotalWeeks(Number(e.target.value))}
                                className="w-full accent-emerald-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer hover:accent-emerald-400 transition-all"
                            />
                            <div className="flex justify-between px-1">
                                <span className="text-[9px] text-muted-foreground font-bold">10</span>
                                <span className="text-[9px] text-muted-foreground font-bold">24</span>
                            </div>
                        </div>

                        {filters.mapel_id && filters.fase && (
                            <div className="pt-4 border-t border-white/5 space-y-3">
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Progres Alur</span>
                                    <span className="text-[10px] font-black text-emerald-500">{atpData?.details.length || 0} TP</span>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    <Button 
                                        onClick={handleSave} 
                                        loading={saving}
                                        className="w-full h-12 rounded-2xl gap-2 font-black uppercase text-[11px] tracking-widest bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
                                    >
                                        <Save className="w-4 h-4" /> Simpan Kurikulum
                                    </Button>
                                    <Button 
                                        variant="outline"
                                        onClick={handleGenerateAI} 
                                        loading={generating}
                                        className="w-full h-12 rounded-2xl gap-2 font-black uppercase text-[11px] tracking-widest text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10"
                                    >
                                        <Sparkles className="w-4 h-4" /> Generate Alur AI
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Unassigned TPs */}
                    {filters.mapel_id && filters.fase && (
                        <div className="p-6 rounded-[2rem] bg-zinc-900/50 border border-white/5 backdrop-blur-xl shadow-xl shadow-black/10">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1 mb-4 flex items-center gap-2">
                                <Layers className="w-3.5 h-3.5" /> Koleksi TP (Fase {filters.fase})
                            </h4>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {tpList.length === 0 && !loading && (
                                    <p className="text-[10px] text-muted-foreground italic text-center py-4">Belum ada TP untuk fase ini.</p>
                                )}
                                {tpList.map(tp => (
                                    <div key={tp.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/30 transition-all group relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-0 bg-emerald-500 group-hover:h-full transition-all duration-300" />
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <span className="text-[9px] font-black text-emerald-500 px-1.5 py-0.5 rounded bg-emerald-500/10">{tp.kode}</span>
                                                <p className="text-[11px] font-medium text-foreground mt-2 line-clamp-2 leading-relaxed opacity-80">{tp.deskripsi}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <select 
                                                className="col-span-2 text-[10px] bg-zinc-800 border border-white/5 rounded-lg p-1.5 outline-none focus:ring-1 focus:ring-emerald-500"
                                                onChange={(e) => addTPToTimeline(tp, Number(e.target.value))}
                                                value=""
                                            >
                                                <option value="" disabled>Tambah ke minggu...</option>
                                                {weeks.map(w => (
                                                    <option key={w} value={w}>Minggu ke-{w}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Timeline View */}
                <div className="lg:col-span-3">
                    <AnimatePresence mode="wait">
                        {!filters.mapel_id || !filters.fase ? (
                             <div className="flex flex-col items-center justify-center py-40 text-center space-y-6 rounded-[3rem] border-2 border-dashed border-white/5 bg-zinc-900/10">
                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                                    <Filter className="w-10 h-10 text-muted-foreground opacity-20" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-bold text-foreground">Filter Belum Lengkap</h3>
                                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">Silakan pilih Mata Pelajaran dan Fase untuk mulai menyusun Alur Tujuan Pembelajaran.</p>
                                </div>
                             </div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                            >
                                {weeks.map(week => {
                                    const weekDetails = atpData?.details.filter(d => d.minggu_ke === week) || [];
                                    return (
                                        <div key={week} className={`p-4 rounded-3xl border transition-all ${weekDetails.length > 0 ? 'bg-emerald-500/[0.03] border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 'bg-zinc-900/30 border-white/5'}`}>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className={`w-3.5 h-3.5 ${weekDetails.length > 0 ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Minggu {week}</span>
                                                </div>
                                                {weekDetails.length > 0 && (
                                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase">
                                                        {weekDetails.length} Item
                                                    </span>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                {weekDetails.map((detail, idx) => (
                                                    detail.catatan ? (
                                                        <div key={idx} className="relative p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 group overflow-hidden animate-pulse">
                                                            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                                                            <span className="text-[8px] font-black text-amber-500 uppercase tracking-tighter">Academic Event</span>
                                                            <p className="text-xs font-black text-amber-200 mt-1 uppercase italic tracking-widest">
                                                                {detail.catatan}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div key={idx} className="relative p-3 rounded-2xl bg-zinc-900 border border-white/5 group overflow-hidden hover:border-emerald-500/30 transition-colors">
                                                            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/30 group-hover:bg-emerald-500 transition-colors" />
                                                            <button 
                                                                onClick={() => removeTPFromTimeline(detail.tp_id!, week)}
                                                                className="absolute top-2 right-2 w-5 h-5 rounded-lg bg-zinc-800 text-muted-foreground hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
                                                            >
                                                                ×
                                                            </button>
                                                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">
                                                                {detail.tp_kode}
                                                            </span>
                                                            <p className="text-[10px] font-bold text-foreground mt-1 line-clamp-3 leading-tight opacity-80">
                                                                {detail.tp_deskripsi}
                                                            </p>
                                                        </div>
                                                    )
                                                ))}
                                                {weekDetails.length === 0 && (
                                                    <div className="py-4 border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center">
                                                        <span className="text-[9px] text-muted-foreground font-medium italic opacity-30">Belum ada aktivitas</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
            `}</style>
        </div>
    );
}
