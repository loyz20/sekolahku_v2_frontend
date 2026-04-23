import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Layers, AlertTriangle, Plus, Edit2, Trash2, CheckCircle2, XCircle, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { Modal } from '@/components/shared/Modal';
import { FormField } from '@/components/shared/FormField';

interface TahunAjaran { id: string; tahun: string; }
interface Semester {
  id: string;
  tahun_ajaran_id: string;
  nama: string;
  aktif: boolean;
  tahun?: string;
}

const EMPTY_FORM = {
  tahun_ajaran_id: '',
  nama: '',
  aktif: false
};

export default function SemesterPage() {
  const [items, setItems] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 });
  const [search, setSearch] = useState('');
  const [tahunAjarans, setTahunAjarans] = useState<TahunAjaran[]>([]);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Semester | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get<any>(`/semester?page=${page}&limit=10&search=${search}`);
      setItems(res.data.items);
      setPagination(res.data.pagination);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchData(1); }, [fetchData]);

  useEffect(() => {
    api.get<any>('/tahun-ajaran?limit=100').then(res => setTahunAjarans(res.data.items)).catch(console.error);
  }, []);

  const openAdd = () => { setEditTarget(null); setForm(EMPTY_FORM); setFormError(''); setModalOpen(true); };
  const openEdit = (s: Semester) => {
    setEditTarget(s);
    setForm({ tahun_ajaran_id: s.tahun_ajaran_id, nama: s.nama, aktif: s.aktif });
    setFormError(''); setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.tahun_ajaran_id || !form.nama) { setFormError('Tahun ajaran dan nama semester wajib diisi.'); return; }
    
    setSaving(true); setFormError('');
    try {
      if (editTarget) await api.put(`/semester/${editTarget.id}`, form);
      else await api.post('/semester', form);
      setModalOpen(false); fetchData(pagination.page);
    } catch (e: any) { setFormError(e.message || 'Terjadi kesalahan.'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus semester ini?')) return;
    try { await api.delete(`/semester/${id}`); fetchData(pagination.page); } catch (e) { console.error(e); }
  };

  const columns = [
    { header: 'Nama Semester', render: (s: Semester) => (
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center shrink-0">
          <Layers className="w-3.5 h-3.5 text-violet-400" />
        </div>
        <span className="font-bold text-foreground">{s.nama}</span>
      </div>
    )},
    { header: 'Tahun Ajaran', render: (s: Semester) => (
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <CalendarDays className="w-3 h-3 opacity-40" />
        {s.tahun || '-'}
      </div>
    )},
    { header: 'Status', render: (s: Semester) => (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-white/5 ${s.aktif ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-400'}`}>
        {s.aktif ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        <span className="text-[10px] font-black uppercase tracking-wider">{s.aktif ? 'AKTIF' : 'NON-AKTIF'}</span>
      </div>
    )},
    { header: 'Aksi', align: 'right' as const, render: (s: Semester) => (
      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={() => openEdit(s)}>
          <Edit2 className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" onClick={() => handleDelete(s.id)}>
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
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
              <Layers className="w-5 h-5 text-violet-400" />
            </div>
            SEMESTER
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola pembagian periode semester akademik</p>
        </div>
        <Button onClick={openAdd} className="gap-2 shadow-lg shadow-violet-500/20">
          <Plus className="w-4 h-4" /> Tambah Semester
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
          title={editTarget ? 'Edit Semester' : 'Tambah Semester'}
          description="Konfigurasi detail semester akademik"
          icon={<Layers className="w-5 h-5" />}
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
              <FormField id="tahun_ajaran" label="Tahun Ajaran" type="select" placeholder="-- Pilih Tahun Ajaran --" value={form.tahun_ajaran_id} onChange={v => setForm(f => ({ ...f, tahun_ajaran_id: v }))}
                options={tahunAjarans.map(t => ({ value: t.id, label: t.tahun }))} required />
              
              <FormField id="nama" label="Nama Semester" placeholder="e.g. Ganjil, Genap" value={form.nama} onChange={v => setForm(f => ({ ...f, nama: v }))} required />
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold">Status Aktif</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-tight">Tandai sebagai semester berjalan</p>
                </div>
                <input type="checkbox" checked={form.aktif} onChange={e => setForm(f => ({ ...f, aktif: e.target.checked }))} className="w-5 h-5 accent-primary" />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
