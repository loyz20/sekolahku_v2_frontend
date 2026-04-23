import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { BookOpen, AlertTriangle, Plus, Edit2, Trash2, Hash, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { Modal } from '@/components/shared/Modal';
import { FormField } from '@/components/shared/FormField';

interface Mapel {
  id: string;
  sekolah_id: string;
  nama: string;
  kode: string;
}

const EMPTY_FORM = {
  nama: '',
  kode: ''
};

export default function MapelPage() {
  const [items, setItems] = useState<Mapel[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 });
  const [search, setSearch] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Mapel | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get<any>(`/mata-pelajaran?page=${page}&limit=10&search=${search}`);
      setItems(res.data.items);
      setPagination(res.data.pagination);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchData(1); }, [fetchData]);

  const openAdd = () => { setEditTarget(null); setForm(EMPTY_FORM); setFormError(''); setModalOpen(true); };
  const openEdit = (m: Mapel) => {
    setEditTarget(m);
    setForm({ nama: m.nama, kode: m.kode });
    setFormError(''); setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.nama || !form.kode) { setFormError('Nama dan Kode mata pelajaran wajib diisi.'); return; }
    
    setSaving(true); setFormError('');
    try {
      if (editTarget) await api.put(`/mata-pelajaran/${editTarget.id}`, form);
      else await api.post('/mata-pelajaran', form);
      setModalOpen(false); fetchData(pagination.page);
    } catch (e: any) { setFormError(e.message || 'Terjadi kesalahan.'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus mata pelajaran ini?')) return;
    try { await api.delete(`/mata-pelajaran/${id}`); fetchData(pagination.page); } catch (e) { console.error(e); }
  };

  const columns = [
    { header: 'Nama Mata Pelajaran', render: (m: Mapel) => (
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/20 flex items-center justify-center shrink-0">
          <BookOpen className="w-3.5 h-3.5 text-sky-400" />
        </div>
        <span className="font-bold text-foreground">{m.nama}</span>
      </div>
    )},
    { header: 'Kode Mapel', render: (m: Mapel) => (
      <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400">
        <Hash className="w-3 h-3" />{m.kode}
      </div>
    )},
    { header: 'Aksi', align: 'right' as const, render: (m: Mapel) => (
      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={() => openEdit(m)}>
          <Edit2 className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" onClick={() => handleDelete(m.id)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    )}
  ];

  return (
    <div className="w-full p-6 space-y-6 mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-sky-400" />
            </div>
            MATA PELAJARAN
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola kurikulum dan mata pelajaran sekolah</p>
        </div>
        <Button onClick={openAdd} className="gap-2 shadow-lg shadow-sky-500/20">
          <Plus className="w-4 h-4" /> Tambah Mapel
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        pagination={pagination}
        onPageChange={p => fetchData(p)}
        search={search}
        onSearchChange={setSearch}
      />

      {modalOpen && (
        <Modal
          title={editTarget ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
          description="Konfigurasi detail kurikulum mata pelajaran"
          icon={<BookOpen className="w-5 h-5" />}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSave}
          saving={saving}
          maxWidth="md"
        >
          <div className="space-y-5">
            {formError && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/15 border border-destructive/25 text-destructive text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />{formError}
              </div>
            )}

            <div className="space-y-4">
              <FormField id="nama" label="Nama Mata Pelajaran" placeholder="e.g. Matematika, Bahasa Indonesia" value={form.nama} onChange={v => setForm(f => ({ ...f, nama: v }))} required />
              <FormField id="kode" label="Kode Mapel" placeholder="e.g. MAT-01, BIND-01" value={form.kode} onChange={v => setForm(f => ({ ...f, kode: v }))} required />
              
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex gap-3">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed text-amber-200/60 uppercase font-bold tracking-wider">
                  Pastikan kode mata pelajaran bersifat unik di dalam sekolah untuk menghindari konflik data kurikulum.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
