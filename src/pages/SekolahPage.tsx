import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Building2, AlertTriangle, Plus, Edit2, Trash2, Hash, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { Modal } from '@/components/shared/Modal';
import { FormField } from '@/components/shared/FormField';

interface Sekolah {
  id: string;
  nama: string;
  npsn: string;
  status: 'Negeri' | 'Swasta';
  alamat: string;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  desa: string;
  kode_pos: string;
  lintang: number;
  bujur: number;
}

const EMPTY_FORM = {
  nama: '', npsn: '', status: 'Negeri' as 'Negeri' | 'Swasta',
  alamat: '', provinsi: '', kabupaten: '', kecamatan: '', desa: '', kode_pos: '',
  lintang: 0, bujur: 0
};

export default function SekolahPage() {
  const [items, setItems] = useState<Sekolah[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 });
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Sekolah | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Sekolah | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get<any>(`/sekolah?page=${page}&limit=10&search=${search}`);
      setItems(res.data.items);
      setPagination(res.data.pagination);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchData(1); }, [fetchData]);

  const openAdd = () => { setEditTarget(null); setForm(EMPTY_FORM); setFormError(''); setModalOpen(true); };
  const openEdit = (s: Sekolah) => {
    setEditTarget(s);
    setForm({ ...s });
    setFormError(''); setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.nama || !form.npsn) { setFormError('Nama dan NPSN wajib diisi.'); return; }
    setSaving(true); setFormError('');
    try {
      if (editTarget) await api.put(`/sekolah/${editTarget.id}`, form);
      else await api.post('/sekolah', form);
      setModalOpen(false); fetchData(pagination.page);
    } catch (e: any) { setFormError(e.message || 'Terjadi kesalahan.'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/sekolah/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchData(pagination.page);
    } catch (e) { console.error(e); } finally { setDeleting(false); }
  };

  const columns = [
    {
      header: 'Nama Sekolah', render: (s: Sekolah) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
            <Building2 className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-bold text-foreground">{s.nama}</span>
        </div>
      )
    },
    {
      header: 'NPSN', render: (s: Sekolah) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400">
          <Hash className="w-3 h-3" />{s.npsn}
        </div>
      )
    },
    {
      header: 'Status', render: (s: Sekolah) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.status === 'Negeri' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
          {s.status}
        </span>
      )
    },
    {
      header: 'Alamat', render: (s: Sekolah) => (
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground leading-snug">
          <MapPin className="w-3 h-3 mt-0.5 shrink-0 opacity-50" />
          <span className="line-clamp-1">{s.alamat}, {s.desa}, {s.kecamatan}</span>
        </div>
      )
    },
    {
      header: 'Aksi', align: 'right' as const, render: (s: Sekolah) => (
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={() => openEdit(s)}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" onClick={() => setDeleteTarget(s)}>
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
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            DATA SEKOLAH
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manajemen profil dan lokasi sekolah dalam sistem</p>
        </div>
        <Button onClick={openAdd} className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> Tambah Sekolah
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
          title={editTarget ? 'Edit Profil Sekolah' : 'Tambah Sekolah Baru'}
          description="Isi kolom profil sekolah dengan lengkap"
          icon={<Building2 className="w-5 h-5" />}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSave}
          saving={saving}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {formError && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/15 border border-destructive/25 text-destructive text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />{formError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Identitas</p>
                <FormField id="nama" label="Nama Sekolah" value={form.nama} onChange={v => setForm(f => ({ ...f, nama: v }))} required />
                <FormField id="npsn" label="NPSN" value={form.npsn} onChange={v => setForm(f => ({ ...f, npsn: v }))} required />
                <FormField id="status" label="Status Sekolah" type="select" value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))}
                  options={[{ value: 'Negeri', label: 'Negeri' }, { value: 'Swasta', label: 'Swasta' }]} />
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Lokasi</p>
                <FormField id="alamat" label="Alamat" value={form.alamat} onChange={v => setForm(f => ({ ...f, alamat: v }))} required />
                <div className="grid grid-cols-2 gap-3">
                  <FormField id="provinsi" label="Provinsi" value={form.provinsi} onChange={v => setForm(f => ({ ...f, provinsi: v }))} />
                  <FormField id="kabupaten" label="Kota/Kab" value={form.kabupaten} onChange={v => setForm(f => ({ ...f, kabupaten: v }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField id="kecamatan" label="Kecamatan" value={form.kecamatan} onChange={v => setForm(f => ({ ...f, kecamatan: v }))} />
                  <FormField id="desa" label="Desa" value={form.desa} onChange={v => setForm(f => ({ ...f, desa: v }))} />
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <Modal
          title="Hapus Sekolah?"
          onClose={() => setDeleteTarget(null)}
          onSubmit={handleDelete}
          submitLabel="Ya, Hapus"
          submitDisabled={deleting}
          saving={deleting}
          maxWidth="sm"
        >
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-destructive/15 border border-destructive/25 flex items-center justify-center text-destructive">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <p className="text-sm text-muted-foreground">
              Data <span className="font-semibold text-foreground">{deleteTarget.nama}</span> akan dihapus permanen.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}

