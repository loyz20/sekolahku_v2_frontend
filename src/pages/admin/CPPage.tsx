import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
    BookOpen,
    Plus,
    Trash2,
    Edit2,
    Search,
    BookMarked
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/shared/Modal';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { PageHero } from '@/components/shared/PageHero';
import { DataTable } from '@/components/shared/DataTable';
import { showToast } from '@/lib/toast-utils';

interface CP {
    id: string;
    mapel_id: string;
    mapel_nama?: string;
    fase: string;
    deskripsi: string;
}

interface Mapel {
    id: string;
    nama: string;
}

export default function CPPage() {
    const [cpList, setCpList] = useState<CP[]>([]);
    const [mapelList, setMapelList] = useState<Mapel[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [filterFase, setFilterFase] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCP, setEditingCP] = useState<CP | null>(null);
    const [formData, setFormData] = useState({
        mapel_id: '',
        fase: 'E',
        deskripsi: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resCP, resMapel] = await Promise.all([
                api.get<any>('/perencanaan/cp'),
                api.get<any>('/mata-pelajaran?limit=100')
            ]);
            
            // Map mapel names to CP
            const mapels = resMapel.data.items || [];
            setMapelList(mapels);
            
            const cps = (resCP.data || []).map((c: any) => ({
                ...c,
                mapel_nama: mapels.find((m: any) => m.id === c.mapel_id)?.nama || 'Unknown'
            }));
            setCpList(cps);
        } catch (error) {
            showToast.error('Gagal mengambil data CP');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async () => {
        if (!formData.mapel_id || !formData.deskripsi) {
            showToast.error('Harap isi mata pelajaran dan deskripsi');
            return;
        }

        setSaving(true);
        try {
            // Kita butuh endpoint POST/PUT /perencanaan/cp di backend
            // Saya akan pastikan controller backend sudah siap menerimanya
            if (editingCP) {
                await api.put(`/perencanaan/cp/${editingCP.id}`, formData);
                showToast.success('CP berhasil diperbarui');
            } else {
                await api.post('/perencanaan/cp', formData);
                showToast.success('CP berhasil ditambahkan');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error: any) {
            showToast.error(error.message || 'Gagal menyimpan CP');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus Capaian Pembelajaran ini?')) return;
        try {
            await api.delete(`/perencanaan/cp/${id}`);
            showToast.success('CP berhasil dihapus');
            fetchData();
        } catch (error) {
            showToast.error('Gagal menghapus CP');
        }
    };

    const openEdit = (cp: CP) => {
        setEditingCP(cp);
        setFormData({
            mapel_id: cp.mapel_id,
            fase: cp.fase,
            deskripsi: cp.deskripsi
        });
        setIsModalOpen(true);
    };

    const columns = [
        {
            header: 'Mata Pelajaran',
            render: (cp: CP) => (
                <div className="flex flex-col">
                    <span className="font-bold text-foreground">{cp.mapel_nama}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-black">Fase {cp.fase}</span>
                </div>
            )
        },
        {
            header: 'Deskripsi Capaian',
            render: (cp: CP) => (
                <p className="text-xs leading-relaxed text-muted-foreground max-w-xl line-clamp-3">
                    {cp.deskripsi}
                </p>
            )
        },
        {
            header: 'Aksi',
            align: 'right' as const,
            render: (cp: CP) => (
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(cp)} className="h-8 w-8 rounded-lg">
                        <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(cp.id)} className="h-8 w-8 rounded-lg hover:text-rose-500">
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            )
        }
    ];

    const filteredData = cpList.filter(c => {
        const matchSearch = c.mapel_nama?.toLowerCase().includes(search.toLowerCase()) || 
                           c.deskripsi.toLowerCase().includes(search.toLowerCase());
        const matchFase = filterFase ? c.fase === filterFase : true;
        return matchSearch && matchFase;
    });

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            <PageHero
                title="Master Capaian Pembelajaran (CP)"
                description="Kelola standar Capaian Pembelajaran nasional untuk setiap fase dan mata pelajaran"
                icon={<BookMarked className="w-5 h-5" />}
                breadcrumb="Admin / Master CP"
                variant="violet"
            />

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-1 gap-4 w-full">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari mapel atau deskripsi..."
                            className="h-12 pl-12 rounded-2xl bg-zinc-900/50 border-white/5"
                        />
                    </div>
                    <select
                        value={filterFase}
                        onChange={(e) => setFilterFase(e.target.value)}
                        className="h-12 px-4 rounded-2xl bg-zinc-900/50 border border-white/5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="">Semua Fase</option>
                        {['A', 'B', 'C', 'D', 'E', 'F'].map(f => <option key={f} value={f}>Fase {f}</option>)}
                    </select>
                </div>
                <Button onClick={() => { setEditingCP(null); setFormData({ mapel_id: '', fase: 'E', deskripsi: '' }); setIsModalOpen(true); }} className="h-12 rounded-2xl gap-2 px-6 bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-600/20">
                    <Plus className="w-4 h-4" /> Tambah CP
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={filteredData}
                loading={loading}
            />

            {/* Modal Add/Edit */}
            {isModalOpen && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleSubmit}
                    title={editingCP ? 'Edit Capaian Pembelajaran' : 'Tambah Capaian Pembelajaran'}
                    description="Masukkan deskripsi CP sesuai dengan standar kurikulum"
                    icon={<BookOpen className="w-5 h-5" />}
                    saving={saving}
                >
                    <div className="space-y-6 py-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Mata Pelajaran</Label>
                                <SearchableSelect
                                    value={formData.mapel_id}
                                    onChange={(v) => setFormData({ ...formData, mapel_id: v })}
                                    options={mapelList.map(m => ({ value: m.id, label: m.nama }))}
                                    placeholder="Pilih Mapel"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Fase</Label>
                                <select
                                    value={formData.fase}
                                    onChange={(e) => setFormData({ ...formData, fase: e.target.value })}
                                    className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    {['A', 'B', 'C', 'D', 'E', 'F'].map(f => <option key={f} value={f}>Fase {f}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Deskripsi CP</Label>
                            <textarea
                                value={formData.deskripsi}
                                onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                                placeholder="Tuliskan deskripsi capaian pembelajaran..."
                                className="w-full min-h-[200px] p-4 rounded-2xl bg-white/5 border border-white/10 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                            />
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
