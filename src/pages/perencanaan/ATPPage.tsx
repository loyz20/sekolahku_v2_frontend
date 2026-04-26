import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import {
    Compass,
    Calendar,
    Save,
    Layers
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
    tp_id: string;
    minggu_ke: number;
    urutan: number;
    tp_kode?: string;
    tp_deskripsi?: string;
}

interface ATP {
    id: string;
    pembelajaran_id: string;
    nama: string;
    details: ATPDetail[];
}

interface Pembelajaran {
    id: string;
    mata_pelajaran_nama: string;
    rombel_nama: string;
}

export default function ATPPage() {
    const [pembelajarans, setPembelajarans] = useState<Pembelajaran[]>([]);
    const [selectedPembelajaran, setSelectedPembelajaran] = useState('');
    const [tpList, setTpList] = useState<TP[]>([]);
    const [atpData, setAtpData] = useState<ATP | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchPembelajaran = async () => {
        try {
            const res = await api.get<any>('/pembelajaran?limit=100');
            setPembelajarans(res.data.items || []);
        } catch (error) {
            showToast.error('Gagal mengambil data pembelajaran');
        }
    };

    const fetchData = useCallback(async () => {
        if (!selectedPembelajaran) return;
        try {
            const [resTP, resATP] = await Promise.all([
                api.get<any>(`/perencanaan/tp?pembelajaran_id=${selectedPembelajaran}`),
                api.get<any>(`/perencanaan/atp?pembelajaran_id=${selectedPembelajaran}`)
            ]);
            setTpList(resTP.data || []);
            setAtpData(resATP.data || { 
                pembelajaran_id: selectedPembelajaran, 
                nama: 'Alur Tujuan Pembelajaran Semester',
                details: [] 
            });
        } catch (error) {
            showToast.error('Gagal mengambil data');
        }
    }, [selectedPembelajaran]);

    useEffect(() => {
        fetchPembelajaran();
    }, []);

    useEffect(() => {
        if (selectedPembelajaran) {
            fetchData();
        } else {
            setTpList([]);
            setAtpData(null);
        }
    }, [selectedPembelajaran, fetchData]);

    const handleSave = async () => {
        if (!atpData) return;
        setSaving(true);
        try {
            await api.post(`/perencanaan/atp/${selectedPembelajaran}`, atpData);
            showToast.success('ATP berhasil disimpan');
            fetchData();
        } catch (error) {
            showToast.error('Gagal menyimpan ATP');
        } finally {
            setSaving(false);
        }
    };

    const addTPToTimeline = (tp: TP, minggu: number) => {
        if (!atpData) return;
        
        // Check if already in this week
        const exists = atpData.details.find(d => d.tp_id === tp.id && d.minggu_ke === minggu);
        if (exists) return;

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

    const weeks = Array.from({ length: 20 }, (_, i) => i + 1);

    return (
        <div className="p-4 md:p-8 space-y-8">
            <PageHero
                title="Alur Tujuan Pembelajaran (ATP)"
                description="Susun urutan Tujuan Pembelajaran berdasarkan timeline minggu efektif"
                icon={<Compass className="w-5 h-5" />}
                breadcrumb="Perencanaan / ATP"
                variant="emerald"
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Control Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="p-6 rounded-[2rem] bg-zinc-900/50 border border-white/5 backdrop-blur-xl space-y-6">
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Seleksi Pembelajaran</Label>
                            <SearchableSelect
                                value={selectedPembelajaran}
                                onChange={setSelectedPembelajaran}
                                options={pembelajarans.map(p => ({
                                    value: p.id,
                                    label: `${p.rombel_nama} - ${p.mata_pelajaran_nama}`
                                }))}
                                placeholder="Pilih Kelas & Mapel"
                            />
                        </div>

                        {selectedPembelajaran && (
                            <Button 
                                onClick={handleSave} 
                                loading={saving}
                                className="w-full h-12 rounded-2xl gap-2 font-black uppercase text-[11px] tracking-widest bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
                            >
                                <Save className="w-4 h-4" /> Simpan Alur
                            </Button>
                        )}
                    </div>

                    {/* Unassigned TPs */}
                    {selectedPembelajaran && (
                        <div className="p-6 rounded-[2rem] bg-zinc-900/50 border border-white/5 backdrop-blur-xl">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1 mb-4 flex items-center gap-2">
                                <Layers className="w-3.5 h-3.5" /> Daftar Tujuan (TP)
                            </h4>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {tpList.map(tp => (
                                    <div key={tp.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-primary/30 transition-all group">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <span className="text-[9px] font-black text-primary px-1.5 py-0.5 rounded bg-primary/10">{tp.kode}</span>
                                                <p className="text-[11px] font-medium text-foreground mt-2 line-clamp-2 leading-relaxed">{tp.deskripsi}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <select 
                                                className="col-span-2 text-[10px] bg-zinc-800 border-none rounded-lg p-1.5 outline-none focus:ring-1 focus:ring-primary"
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
                        {!selectedPembelajaran ? (
                             <div className="flex flex-col items-center justify-center py-32 text-center space-y-4 rounded-[3rem] border-2 border-dashed border-white/5 bg-zinc-900/20">
                                <Compass className="w-12 h-12 text-muted-foreground opacity-20" />
                                <p className="text-sm text-muted-foreground">Pilih pembelajaran untuk menyusun alur.</p>
                             </div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
                            >
                                {weeks.map(week => {
                                    const weekDetails = atpData?.details.filter(d => d.minggu_ke === week) || [];
                                    return (
                                        <div key={week} className={`p-4 rounded-3xl border transition-all ${weekDetails.length > 0 ? 'bg-emerald-500/[0.03] border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 'bg-zinc-900/30 border-white/5'}`}>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className={`w-3.5 h-3.5 ${weekDetails.length > 0 ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">M-{week}</span>
                                                </div>
                                                {weekDetails.length > 0 && (
                                                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[9px] flex items-center justify-center font-bold">
                                                        {weekDetails.length}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                {weekDetails.map((detail, idx) => (
                                                    <div key={idx} className="relative p-3 rounded-2xl bg-zinc-900 border border-emerald-500/10 group overflow-hidden">
                                                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                                                        <button 
                                                            onClick={() => removeTPFromTimeline(detail.tp_id, week)}
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
                                                ))}
                                                {weekDetails.length === 0 && (
                                                    <div className="py-4 border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center">
                                                        <span className="text-[9px] text-muted-foreground font-medium italic">Kosong</span>
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
