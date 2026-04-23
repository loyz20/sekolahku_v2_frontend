import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { GraduationCap, AlertTriangle, Plus, Edit2, Trash2, Hash, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { Modal } from '@/components/shared/Modal';
import { FormField } from '@/components/shared/FormField';

interface Guru {
  id: string;
  sekolah_id: string;
  nama: string;
  nik: string;
  nip: string | null;
  nuptk: string | null;
  jenis_kelamin: 'L' | 'P';
  tanggal_lahir: string;
  pendidikan_terakhir: string;
}

interface GuruForm {
  nama: string;
  nik: string;
  nip: string;
  nuptk: string;
  jenis_kelamin: 'L' | 'P';
  tanggal_lahir: string;
  pendidikan_terakhir: string;
}

const EMPTY_FORM: GuruForm = {
  nama: '',
  nik: '',
  nip: '',
  nuptk: '',
  jenis_kelamin: 'L',
  tanggal_lahir: '',
  pendidikan_terakhir: 'S1'
};

export default function GuruPage() {
  const [items, setItems] = useState<Guru[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 });
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Guru | null>(null);
  const [form, setForm] = useState<GuruForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get<any>(`/ptk?page=${page}&limit=10&search=${search}`);
      setItems(res.data.items);
      setPagination(res.data.pagination);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchData(1); }, [fetchData]);

  const openAdd = () => { setEditTarget(null); setForm(EMPTY_FORM); setFormError(''); setModalOpen(true); };
  const openEdit = (g: Guru) => {
    setEditTarget(g);
    setForm({
      nama: g.nama,
      nik: g.nik,
      nip: g.nip || '',
      nuptk: g.nuptk || '',
      jenis_kelamin: g.jenis_kelamin,
      tanggal_lahir: g.tanggal_lahir ? g.tanggal_lahir.split('T')[0] : '',
      pendidikan_terakhir: g.pendidikan_terakhir
    });
    setFormError(''); setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.nama || !form.nik) { setFormError('Nama dan NIK wajib diisi.'); return; }

    setSaving(true); setFormError('');
    try {
      if (editTarget) await api.put(`/ptk/${editTarget.id}`, form);
      else await api.post('/ptk', form);
      setModalOpen(false); fetchData(pagination.page);
    } catch (e: any) { setFormError(e.message || 'Terjadi kesalahan.'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus data guru ini?')) return;
    try { await api.delete(`/ptk/${id}`); fetchData(pagination.page); } catch (e) { console.error(e); }
  };

  const columns = [
    {
      header: 'Nama Lengkap', render: (g: Guru) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center shrink-0">
            <GraduationCap className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground leading-tight">{g.nama}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-tight">{g.pendidikan_terakhir}</span>
          </div>
        </div>
      )
    },
    {
      header: 'NIK / NIP', render: (g: Guru) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400">
            <Hash className="w-3 h-3" />{g.nik}
          </div>
          <span className="text-[10px] text-muted-foreground">{g.nip || 'NIP Belum Ada'}</span>
        </div>
      )
    },
    {
      header: 'Gender', render: (g: Guru) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${g.jenis_kelamin === 'L' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-pink-500/10 text-pink-400 border-pink-500/20'}`}>
          {g.jenis_kelamin === 'L' ? 'LAKI-LAKI' : 'PEREMPUAN'}
        </span>
      )
    },
    {
      header: 'Tgl Lahir', render: (g: Guru) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <Calendar className="w-3 h-3 opacity-40" />
          {g.tanggal_lahir ? new Date(g.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
        </div>
      )
    },
    {
      header: 'Aksi', align: 'right' as const, render: (g: Guru) => (
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={() => openEdit(g)}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" onClick={() => handleDelete(g.id)}>
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
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-violet-400" />
            </div>
            DATA GURU (PTK)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manajemen data tenaga pendidik dan kependidikan</p>
        </div>
        <Button onClick={openAdd} className="gap-2 shadow-lg shadow-violet-500/20">
          <Plus className="w-4 h-4" /> Tambah Guru
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
          title={editTarget ? 'Edit Data Guru' : 'Tambah Data Guru'}
          description="Lengkapi informasi detail tenaga pendidik"
          icon={<GraduationCap className="w-5 h-5" />}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-4">
                <FormField id="nama" label="Nama Lengkap" placeholder="e.g. Budi Santoso, S.Pd" value={form.nama} onChange={v => setForm(f => ({ ...f, nama: v }))} required />
                <FormField id="nik" label="NIK (KTP)" placeholder="16 digit angka" value={form.nik} onChange={v => setForm(f => ({ ...f, nik: v }))} required />
                <FormField id="nip" label="NIP (Optional)" placeholder="e.g. 1980..." value={form.nip} onChange={v => setForm(f => ({ ...f, nip: v }))} />
                <FormField id="nuptk" label="NUPTK (Optional)" placeholder="16 digit NUPTK" value={form.nuptk} onChange={v => setForm(f => ({ ...f, nuptk: v }))} />
              </div>
              <div className="space-y-4">
                <FormField id="gender" label="Jenis Kelamin" type="select" value={form.jenis_kelamin} onChange={v => setForm(f => ({ ...f, jenis_kelamin: v as 'L' | 'P' }))}
                  options={[{ value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }]} required />
                <FormField id="tgl_lahir" label="Tanggal Lahir" type="date" value={form.tanggal_lahir} onChange={v => setForm(f => ({ ...f, tanggal_lahir: v }))} required />
                <FormField id="pendidikan" label="Pendidikan Terakhir" type="select" value={form.pendidikan_terakhir} onChange={v => setForm(f => ({ ...f, pendidikan_terakhir: v }))}
                  options={[
                    { value: 'D3', label: 'D3' },
                    { value: 'S1', label: 'S1 / D4' },
                    { value: 'S2', label: 'S2' },
                    { value: 'S3', label: 'S3' }
                  ]} required />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
