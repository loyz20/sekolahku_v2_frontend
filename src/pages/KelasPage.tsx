import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Layout, AlertTriangle, Plus, Edit2, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { Modal } from '@/components/shared/Modal';
import { FormField } from '@/components/shared/FormField';

interface PTK { id: string; nama: string; }
interface TahunAjaran { id: string; tahun: string; aktif: number; }
interface Rombel {
  id: string;
  sekolah_id: string;
  tahun_ajaran_id: string;
  nama: string;
  tingkat: number;
  wali_kelas_ptk_id?: string;
  wali_kelas_nama?: string;
  tahun_ajaran_nama?: string;
}

const EMPTY_FORM = {
  nama: '',
  tingkat: 1,
  tahun_ajaran_id: '',
  wali_kelas_ptk_id: ''
};

export default function KelasPage() {
  const [items, setItems] = useState<Rombel[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 });
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Rombel | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [ptks, setPtks] = useState<PTK[]>([]);
  const [tahunAjarans, setTahunAjarans] = useState<TahunAjaran[]>([]);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get<any>(`/rombel?page=${page}&limit=10&search=${search}`);
      setItems(res.data.items);
      setPagination(res.data.pagination);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchData(1); }, [fetchData]);

  useEffect(() => {
    // Fetch PTK for Wali Kelas options
    api.get<any>('/ptk?limit=100').then(res => setPtks(res.data.items)).catch(console.error);
    // Fetch Tahun Ajaran
    api.get<any>('/tahun-ajaran').then(res => {
      const items = res.data.items || res.data || [];
      setTahunAjarans(items);
      const active = items.find((t: any) => t.aktif);
      if (active) setForm(f => ({ ...f, tahun_ajaran_id: active.id }));
    }).catch(console.error);
  }, []);

  const openAdd = () => {
    setEditTarget(null);
    const active = tahunAjarans.find(t => t.aktif);
    setForm({ ...EMPTY_FORM, tahun_ajaran_id: active?.id || '' });
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (r: Rombel) => {
    setEditTarget(r);
    setForm({
      nama: r.nama,
      tingkat: r.tingkat,
      tahun_ajaran_id: r.tahun_ajaran_id,
      wali_kelas_ptk_id: r.wali_kelas_ptk_id || ''
    });
    setFormError(''); setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.nama || !form.tahun_ajaran_id) { setFormError('Nama kelas dan tahun ajaran wajib diisi.'); return; }
    setSaving(true); setFormError('');
    try {
      if (editTarget) await api.put(`/rombel/${editTarget.id}`, form);
      else await api.post('/rombel', form);
      setModalOpen(false); fetchData(pagination.page);
    } catch (e: any) { setFormError(e.message || 'Terjadi kesalahan.'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus data kelas ini?')) return;
    try { await api.delete(`/rombel/${id}`); fetchData(pagination.page); } catch (e) { console.error(e); }
  };

  const columns = [
    {
      header: 'Nama Kelas', render: (r: Rombel) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground">{r.nama}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-tight">Tingkat {r.tingkat}</span>
        </div>
      )
    },
    {
      header: 'Wali Kelas', render: (r: Rombel) => (
        <div className="flex items-center gap-2 text-xs">
          <User className="w-3 h-3 opacity-40" />
          <span className="font-medium text-muted-foreground">{r.wali_kelas_nama || 'Belum ditentukan'}</span>
        </div>
      )
    },
    {
      header: 'Tahun Ajaran', render: (r: Rombel) => (
        <span className="text-xs font-medium text-muted-foreground">{r.tahun_ajaran_nama || tahunAjarans.find(t => t.id === r.tahun_ajaran_id)?.tahun || '-'}</span>
      )
    },
    {
      header: 'Aksi', align: 'right' as const, render: (r: Rombel) => (
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={() => openEdit(r)}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" onClick={() => handleDelete(r.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="w-full p-6 space-y-6 mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Layout className="w-5 h-5 text-primary" />
            </div>
            DATA KELAS
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola rombongan belajar dan penugasan wali kelas</p>
        </div>
        <Button onClick={openAdd} className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> Tambah Kelas
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
          title={editTarget ? 'Edit Data Kelas' : 'Tambah Kelas Baru'}
          description="Konfigurasi rombongan belajar dan wali kelas"
          icon={<Layout className="w-5 h-5" />}
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
              <FormField id="nama" label="Nama Kelas" placeholder="e.g. VII-A" value={form.nama} onChange={v => setForm(f => ({ ...f, nama: v }))} required />
              <FormField id="tingkat" label="Tingkat" type="select" value={form.tingkat} onChange={v => setForm(f => ({ ...f, tingkat: Number(v) }))}
                options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(t => ({ value: t, label: `Tingkat ${t}` }))} required />

              <FormField id="tahun_ajaran_id" label="Tahun Ajaran" type="select" placeholder="-- Pilih Tahun Ajaran --" value={form.tahun_ajaran_id} onChange={v => setForm(f => ({ ...f, tahun_ajaran_id: v }))}
                options={tahunAjarans.map(t => ({ value: t.id, label: t.tahun + (t.aktif ? ' (Aktif)' : '') }))} required />

              <FormField id="wali_kelas_ptk_id" label="Wali Kelas" type="select" placeholder="-- Pilih Wali Kelas --" value={form.wali_kelas_ptk_id} onChange={v => setForm(f => ({ ...f, wali_kelas_ptk_id: v }))}
                options={ptks.map(p => ({ value: p.id, label: p.nama }))} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
