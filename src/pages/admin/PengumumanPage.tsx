import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { 
    Megaphone, 
    Plus, 
    Search, 
    Edit3, 
    Trash2, 
    Eye,
    EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/shared/DataTable';
import { PageHero } from '@/components/shared/PageHero';
import { Modal } from '@/components/shared/Modal';
import { FormField } from '@/components/shared/FormField';
import { showToast } from '@/lib/toast-utils';

interface Pengumuman {
    id: string;
    title: string;
    content: string;
    type: 'info' | 'warning' | 'success' | 'danger';
    target_role: 'all' | 'guru' | 'siswa' | 'admin';
    is_active: boolean;
    creator_name: string;
    created_at: string;
}

export default function PengumumanPage() {
    const [items, setItems] = useState<Pengumuman[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        id: '',
        title: '',
        content: '',
        type: 'info',
        target_role: 'all',
        is_active: true
    });

    const fetchPengumuman = async () => {
        setLoading(true);
        try {
            const res = await api.get<any>('/pengumuman');
            setItems(res.data || []);
        } catch (e) {
            showToast.error('Gagal mengambil data pengumuman');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPengumuman();
    }, []);

    const handleSave = async () => {
        if (!formData.title || !formData.content) {
            showToast.error('Judul dan konten wajib diisi');
            return;
        }
        setSaving(true);
        try {
            await api.post('/pengumuman', formData);
            showToast.success(formData.id ? 'Pengumuman diperbarui' : 'Pengumuman berhasil dipublikasi');
            setIsModalOpen(false);
            fetchPengumuman();
        } catch (e) {
            showToast.error('Gagal menyimpan pengumuman');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus pengumuman ini?')) return;
        try {
            await api.delete(`/pengumuman/${id}`);
            showToast.success('Pengumuman dihapus');
            fetchPengumuman();
        } catch (e) {
            showToast.error('Gagal menghapus pengumuman');
        }
    };

    const openCreateModal = () => {
        setFormData({
            id: '',
            title: '',
            content: '',
            type: 'info',
            target_role: 'all',
            is_active: true
        });
        setIsModalOpen(true);
    };

    const openEditModal = (p: Pengumuman) => {
        setFormData({
            id: p.id,
            title: p.title,
            content: p.content,
            type: p.type,
            target_role: p.target_role,
            is_active: !!p.is_active
        });
        setIsModalOpen(true);
    };

    const columns = [
        {
            header: 'Pengumuman',
            render: (p: Pengumuman) => (
                <div className="flex flex-col max-w-md">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${
                            p.type === 'danger' ? 'bg-rose-500' :
                            p.type === 'warning' ? 'bg-amber-500' :
                            p.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                        }`} />
                        <h4 className="font-bold text-sm uppercase tracking-tight truncate">{p.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 italic">"{p.content}"</p>
                </div>
            )
        },
        {
            header: 'Target',
            render: (p: Pengumuman) => (
                <span className="text-[10px] font-black uppercase px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-muted-foreground">
                    {p.target_role === 'all' ? '📢 SEMUA' : 
                     p.target_role === 'guru' ? '👨‍🏫 GURU' : 
                     p.target_role === 'siswa' ? '🎓 SISWA' : '🔐 ADMIN'}
                </span>
            )
        },
        {
            header: 'Status',
            render: (p: Pengumuman) => (
                <div className="flex items-center gap-2">
                    {p.is_active ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
                            <Eye className="w-3 h-3" /> AKTIF
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                            <EyeOff className="w-3 h-3" /> NONAKTIF
                        </span>
                    )}
                </div>
            )
        },
        {
            header: 'Aksi',
            align: 'right' as const,
            render: (p: Pengumuman) => (
                <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(p)} className="h-8 w-8 rounded-xl hover:bg-white/10">
                        <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="h-8 w-8 rounded-xl hover:bg-rose-500/10 text-rose-400">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            )
        }
    ];

    const filtered = items.filter(p => 
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.content.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="w-full p-4 md:p-8 space-y-8 mx-auto animate-in fade-in duration-700 relative">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[150px] -z-10 rounded-full" />
            
            <PageHero
                title="PENGUMUMAN SEKOLAH"
                description="Kelola informasi dan berita penting untuk seluruh warga sekolah"
                icon={<Megaphone className="w-5 h-5" />}
                variant="primary"
                breadcrumb="Admin / Pengumuman"
            />

            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari pengumuman..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 h-11 bg-white/5 border-white/10 rounded-xl"
                    />
                </div>
                <Button onClick={openCreateModal} className="w-full md:w-auto h-11 px-6 rounded-xl gap-2 font-black text-[10px] uppercase tracking-widest">
                    <Plus className="w-4 h-4" /> Buat Pengumuman
                </Button>
            </div>

            <div className="rounded-[2.5rem] bg-zinc-900/40 border border-white/5 backdrop-blur-sm overflow-hidden shadow-2xl">
                <DataTable
                    columns={columns}
                    data={filtered}
                    loading={loading}
                />
            </div>

            {isModalOpen && (
                <Modal 
                    onClose={() => setIsModalOpen(false)} 
                    title={formData.id ? "Edit Pengumuman" : "Buat Pengumuman Baru"}
                    onSubmit={handleSave}
                    submitLabel={formData.id ? "Perbarui" : "Publikasikan"}
                    saving={saving}
                >
                    <div className="space-y-6">
                        <FormField 
                            id="title" 
                            label="Judul Pengumuman" 
                            placeholder="Contoh: Libur Hari Raya"
                            value={formData.title}
                            onChange={v => setFormData({...formData, title: v})}
                        />
                        <FormField 
                            id="content" 
                            label="Konten / Isi" 
                            placeholder="Tuliskan detail informasi di sini..."
                            type="textarea"
                            value={formData.content}
                            onChange={v => setFormData({...formData, content: v})}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField 
                                id="type" 
                                label="Tipe Visual" 
                                type="select"
                                value={formData.type}
                                onChange={v => setFormData({...formData, type: v as any})}
                                options={[
                                    { value: 'info', label: 'Info (Biru)' },
                                    { value: 'warning', label: 'Peringatan (Kuning)' },
                                    { value: 'danger', label: 'Penting (Merah)' },
                                    { value: 'success', label: 'Berhasil (Hijau)' }
                                ]}
                            />
                            <FormField 
                                id="target_role" 
                                label="Target Audiens" 
                                type="select"
                                value={formData.target_role}
                                onChange={v => setFormData({...formData, target_role: v as any})}
                                options={[
                                    { value: 'all', label: 'Semua Warga' },
                                    { value: 'guru', label: 'Khusus Guru' },
                                    { value: 'siswa', label: 'Khusus Siswa' },
                                    { value: 'admin', label: 'Khusus Admin' }
                                ]}
                            />
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                            <input 
                                type="checkbox" 
                                id="is_active"
                                checked={formData.is_active}
                                onChange={e => setFormData({...formData, is_active: e.target.checked})}
                                className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/20"
                            />
                            <label htmlFor="is_active" className="text-xs font-bold uppercase tracking-widest cursor-pointer">Tampilkan Pengumuman (Aktif)</label>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
