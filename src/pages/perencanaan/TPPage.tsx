import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import {
    Target,
    Plus,
    Trash2,
    Edit2,
    BookOpen,
    ListChecks,
    Search,
    Sparkles,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/shared/Modal';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { PageHero } from '@/components/shared/PageHero';
import { DataTable } from '@/components/shared/DataTable';
import { showToast } from '@/lib/toast-utils';
import { motion, AnimatePresence } from 'framer-motion';

interface CP {
    id: string;
    mapel_id: string;
    fase: string;
    deskripsi: string;
}

interface TP {
    id: string;
    pembelajaran_id: string;
    cp_id: string;
    kode: string;
    deskripsi: string;
    urutan: number;
    cp_deskripsi?: string;
    fase?: string;
}

interface Pembelajaran {
    id: string;
    mata_pelajaran_id: string;
    mata_pelajaran_nama: string;
    rombel_nama: string;
}

interface AIGeneratedTP {
    kode: string;
    deskripsi: string;
    selected: boolean;
}

export default function TPPage() {
    const [pembelajarans, setPembelajarans] = useState<Pembelajaran[]>([]);
    const [selectedPembelajaran, setSelectedPembelajaran] = useState('');
    const [tpList, setTpList] = useState<TP[]>([]);
    const [cpList, setCpList] = useState<CP[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTP, setEditingTP] = useState<TP | null>(null);
    const [formData, setFormData] = useState({
        cp_id: '',
        kode: '',
        deskripsi: '',
        urutan: 0
    });

    // AI State
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [aiResults, setAiResults] = useState<AIGeneratedTP[]>([]);
    const [selectedCPForAI, setSelectedCPForAI] = useState('');

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
        setLoading(true);
        try {
            const res = await api.get<any>(`/perencanaan/tp?pembelajaran_id=${selectedPembelajaran}`);
            setTpList(res.data || []);
        } catch (error) {
            showToast.error('Gagal mengambil data TP');
        } finally {
            setLoading(false);
        }
    }, [selectedPembelajaran]);

    const fetchCP = useCallback(async () => {
        const current = pembelajarans.find(p => p.id === selectedPembelajaran);
        if (!current) return;
        try {
            const res = await api.get<any>(`/perencanaan/cp?mapel_id=${current.mata_pelajaran_id}`);
            setCpList(res.data || []);
        } catch (error) {
            console.error('Failed to fetch CP', error);
        }
    }, [selectedPembelajaran, pembelajarans]);

    useEffect(() => {
        fetchPembelajaran();
    }, []);

    useEffect(() => {
        if (selectedPembelajaran) {
            fetchTP();
            fetchCP();
        } else {
            setTpList([]);
            setCpList([]);
        }
    }, [selectedPembelajaran, fetchTP, fetchCP]);

    const handleSubmit = async () => {
        if (!formData.cp_id || !formData.kode || !formData.deskripsi) {
            showToast.error('Harap isi semua field yang wajib');
            return;
        }

        setSaving(true);
        try {
            if (editingTP) {
                await api.put(`/perencanaan/tp/${editingTP.id}`, formData);
                showToast.success('Tujuan Pembelajaran berhasil diperbarui');
            } else {
                await api.post('/perencanaan/tp', { ...formData, pembelajaran_id: selectedPembelajaran });
                showToast.success('Tujuan Pembelajaran berhasil ditambahkan');
            }
            setIsModalOpen(false);
            fetchTP();
        } catch (error: any) {
            showToast.error(error.message || 'Terjadi kesalahan');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus Tujuan Pembelajaran ini?')) return;
        try {
            await api.delete(`/perencanaan/tp/${id}`);
            showToast.success('TP berhasil dihapus');
            fetchTP();
        } catch (error) {
            showToast.error('Gagal menghapus TP');
        }
    };

    const handleGenerateAI = async () => {
        if (!selectedCPForAI) {
            showToast.error('Pilih rujukan CP terlebih dahulu');
            return;
        }

        const cp = cpList.find(c => c.id === selectedCPForAI);
        const mapel = pembelajarans.find(p => p.id === selectedPembelajaran);
        
        setGenerating(true);
        try {
            const res = await api.post<any>('/perencanaan/tp/generate', {
                cp: cp?.deskripsi,
                fase: cp?.fase,
                mapel: mapel?.mata_pelajaran_nama
            });
            
            const results = (res.data || []).map((t: any) => ({
                ...t,
                selected: true
            }));
            setAiResults(results);
        } catch (error: any) {
            showToast.error(error.message || 'Gagal generate TP');
        } finally {
            setGenerating(false);
        }
    };

    const handleSaveAIResults = async () => {
        const toSave = aiResults.filter(r => r.selected);
        if (toSave.length === 0) {
            showToast.error('Pilih minimal satu TP untuk disimpan');
            return;
        }

        setSaving(true);
        try {
            // Save one by one (or you could implement bulk save in backend)
            for (const item of toSave) {
                await api.post('/perencanaan/tp', {
                    pembelajaran_id: selectedPembelajaran,
                    cp_id: selectedCPForAI,
                    kode: item.kode,
                    deskripsi: item.deskripsi,
                    urutan: 0
                });
            }
            showToast.success(`${toSave.length} TP berhasil disimpan`);
            setIsAIModalOpen(false);
            fetchTP();
        } catch (error) {
            showToast.error('Terjadi kesalahan saat menyimpan');
        } finally {
            setSaving(false);
        }
    };

    const openEdit = (tp: TP) => {
        setEditingTP(tp);
        setFormData({
            cp_id: tp.cp_id,
            kode: tp.kode,
            deskripsi: tp.deskripsi,
            urutan: tp.urutan
        });
        setIsModalOpen(true);
    };

    const columns = [
        {
            header: 'Kode',
            render: (tp: TP) => <span className="font-black text-primary">{tp.kode}</span>
        },
        {
            header: 'Tujuan Pembelajaran',
            render: (tp: TP) => (
                <div className="flex flex-col gap-1 max-w-md">
                    <span className="text-sm font-bold text-foreground leading-relaxed">{tp.deskripsi}</span>
                    <div className="flex items-center gap-2 mt-1">
                         <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium">Fase {tp.fase}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Urutan',
            align: 'center' as const,
            render: (tp: TP) => <span className="text-xs font-bold text-muted-foreground">Minggu ke-{tp.urutan || '?'}</span>
        },
        {
            header: 'Aksi',
            align: 'right' as const,
            render: (tp: TP) => (
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(tp)} className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(tp.id)} className="h-8 w-8 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            <PageHero
                title="Tujuan Pembelajaran (TP)"
                description="Rumuskan TP dari Capaian Pembelajaran (CP) untuk setiap mata pelajaran"
                icon={<Target className="w-5 h-5" />}
                breadcrumb="Perencanaan / TP"
                variant="primary"
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                {/* Selection Sidebar */}
                <div className="lg:col-span-1 space-y-6 p-6 rounded-[2rem] bg-zinc-900/50 border border-white/5 backdrop-blur-xl">
                    <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 pl-1">Seleksi Pembelajaran</Label>
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
                        <div className="pt-4 border-t border-white/5 space-y-4">
                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                                <p className="text-[10px] font-bold text-primary uppercase mb-1">Status TP</p>
                                <p className="text-2xl font-black">{tpList.length}</p>
                                <p className="text-[10px] text-muted-foreground">Tujuan dirumuskan</p>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                <Button onClick={() => { setEditingTP(null); setFormData({ cp_id: '', kode: '', deskripsi: '', urutan: 0 }); setIsModalOpen(true); }} className="w-full h-12 rounded-2xl gap-2 font-black uppercase text-[11px] tracking-widest shadow-lg shadow-primary/20">
                                    <Plus className="w-4 h-4" /> Tambah TP
                                </Button>
                                <Button 
                                    variant="ghost"
                                    onClick={() => { setAiResults([]); setIsAIModalOpen(true); }} 
                                    className="w-full h-12 rounded-2xl gap-2 font-black uppercase text-[11px] tracking-widest text-primary hover:bg-primary/10"
                                >
                                    <Sparkles className="w-4 h-4" /> Generate AI
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3">
                    <AnimatePresence mode="wait">
                        {!selectedPembelajaran ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center justify-center py-32 text-center space-y-4 rounded-[3rem] border-2 border-dashed border-white/5 bg-zinc-900/20"
                            >
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground">
                                    <BookOpen className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground">Pilih Pembelajaran</h3>
                                    <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">Silakan pilih mata pelajaran dan kelas untuk mengelola Tujuan Pembelajaran.</p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-6"
                            >
                                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                    <div className="relative w-full md:w-96 group">
                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                                            <Search className="w-4 h-4" />
                                        </div>
                                        <Input
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Cari TP atau kode..."
                                            className="h-12 pl-12 rounded-2xl bg-zinc-900/50 border-white/5 focus:border-primary/50 transition-all"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-white/5">
                                        <ListChecks className="w-4 h-4 text-emerald-400" />
                                        <span className="text-[11px] font-black uppercase text-muted-foreground tracking-tighter">Semua TP Terhubung ke CP</span>
                                    </div>
                                </div>

                                <DataTable
                                    columns={columns}
                                    data={tpList.filter(t => t.deskripsi.toLowerCase().includes(search.toLowerCase()) || t.kode.toLowerCase().includes(search.toLowerCase()))}
                                    loading={loading}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Modal Add/Edit */}
            {isModalOpen && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleSubmit}
                    title={editingTP ? 'Edit Tujuan Pembelajaran' : 'Tambah Tujuan Pembelajaran'}
                    description="Rumuskan tujuan pembelajaran yang spesifik dan terukur"
                    icon={<Target className="w-5 h-5" />}
                    saving={saving}
                    maxWidth="2xl"
                >
                    <div className="space-y-6 py-2">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Pilih Capaian Pembelajaran (CP)</Label>
                            <SearchableSelect
                                value={formData.cp_id}
                                onChange={(v) => setFormData({ ...formData, cp_id: v })}
                                options={cpList.map(c => ({
                                    value: c.id,
                                    label: `Fase ${c.fase}: ${c.deskripsi.substring(0, 80)}...`
                                }))}
                                placeholder="Pilih CP rujukan"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="md:col-span-1 space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Kode TP</Label>
                                <Input
                                    value={formData.kode}
                                    onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                                    placeholder="Contoh: 1.1"
                                    className="h-12 rounded-xl bg-white/5 border-white/10 font-bold text-center"
                                />
                            </div>
                            <div className="md:col-span-3 space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Urutan Pembelajaran</Label>
                                <Input
                                    type="number"
                                    value={formData.urutan}
                                    onChange={(e) => setFormData({ ...formData, urutan: Number(e.target.value) })}
                                    className="h-12 rounded-xl bg-white/5 border-white/10 font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Deskripsi Tujuan Pembelajaran</Label>
                            <textarea
                                value={formData.deskripsi}
                                onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                                placeholder="Tuliskan tujuan pembelajaran secara detail..."
                                className="w-full min-h-[120px] p-4 rounded-2xl bg-white/5 border border-white/10 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                            />
                        </div>
                    </div>
                </Modal>
            )}

            {/* Modal AI Generate */}
            {isAIModalOpen && (
                <Modal
                    isOpen={isAIModalOpen}
                    onClose={() => setIsAIModalOpen(false)}
                    onSubmit={aiResults.length > 0 ? handleSaveAIResults : undefined}
                    title="Generate TP via AI"
                    description="Gunakan kekuatan AI untuk merumuskan TP yang berkualitas berdasarkan CP"
                    icon={<Sparkles className="w-5 h-5" />}
                    saving={saving}
                    maxWidth="3xl"
                    submitLabel="Simpan Data ke TP"
                >
                    <div className="space-y-6 py-2">
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Pilih CP sebagai Rujukan</Label>
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                                    <div className="flex-1 w-full max-w-full sm:max-w-[calc(100%-180px)]">
                                        <SearchableSelect
                                            value={selectedCPForAI}
                                            onChange={setSelectedCPForAI}
                                            options={cpList.map(c => ({
                                                value: c.id,
                                                label: `Fase ${c.fase}: ${c.deskripsi.substring(0, 100)}...`
                                            }))}
                                            placeholder="Pilih CP Rujukan"
                                        />
                                    </div>
                                    <Button 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleGenerateAI();
                                        }}
                                        loading={generating}
                                        disabled={!selectedCPForAI}
                                        className="w-full sm:w-auto h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20"
                                    >
                                        {generating ? 'Proses AI...' : 'Generate TP'}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {generating && (
                            <div className="py-20 flex flex-col items-center justify-center space-y-4">
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                                    <Sparkles className="absolute inset-0 m-auto w-5 h-5 text-primary animate-pulse" />
                                </div>
                                <p className="text-sm font-bold text-foreground">AI sedang menganalisis kurikulum...</p>
                                <p className="text-xs text-muted-foreground">Harap tunggu sekitar 5-10 detik.</p>
                            </div>
                        )}

                        {aiResults.length > 0 && !generating && (
                            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between px-1">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Hasil Rumusan AI</h4>
                                    <span className="text-[10px] text-primary font-bold">{aiResults.filter(r => r.selected).length} dipilih</span>
                                </div>
                                <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {aiResults.map((result, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                const newResults = [...aiResults];
                                                newResults[idx].selected = !newResults[idx].selected;
                                                setAiResults(newResults);
                                            }}
                                            className={`w-full p-4 rounded-2xl text-left border transition-all flex items-start gap-3 ${
                                                result.selected 
                                                    ? 'bg-primary/5 border-primary/30' 
                                                    : 'bg-white/[0.02] border-white/5 opacity-60 hover:opacity-100'
                                            }`}
                                        >
                                            <div className="mt-1 shrink-0">
                                                {result.selected ? (
                                                    <CheckCircle2 className="w-5 h-5 text-primary" />
                                                ) : (
                                                    <XCircle className="w-5 h-5 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[9px] font-black text-primary px-1.5 py-0.5 rounded bg-primary/10">{result.kode}</span>
                                                </div>
                                                <p className="text-sm font-medium leading-relaxed">{result.deskripsi}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
            `}</style>
        </div>
    );
}
