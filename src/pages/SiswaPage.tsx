import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { User, AlertTriangle, Plus, Edit2, Trash2, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { Modal } from '@/components/shared/Modal';
import { FormField } from '@/components/shared/FormField';

interface Rombel { id: string; nama: string; tingkat: number; }
interface Siswa {
  id: string;
  nama: string;
  nis: string;
  nisn: string;
  nik: string;
  jenis_kelamin: 'L' | 'P';
  tanggal_lahir: string;
  nama_ayah: string;
  nama_ibu: string;
  tingkat: number;
  kelas?: string;
  rombel_id?: string;
}

const EMPTY_FORM = {
  nama: '', nis: '', nisn: '', nik: '',
  jenis_kelamin: 'L' as 'L' | 'P',
  tanggal_lahir: '',
  nama_ayah: '', nama_ibu: '',
  rombel_id: ''
};

export default function SiswaPage() {
  const [items, setItems] = useState<Siswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 });
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Siswa | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Siswa | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState('');
  const [rombels, setRombels] = useState<Rombel[]>([]);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get<any>(`/siswa?page=${page}&limit=10&search=${search}`);
      setItems(res.data.items);
      setPagination(res.data.pagination);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchData(1); }, [fetchData]);

  useEffect(() => {
    api.get<any>('/rombel?limit=100').then(res => setRombels(res.data.items)).catch(console.error);
  }, []);

  const openAdd = () => { setEditTarget(null); setForm(EMPTY_FORM); setFormError(''); setModalOpen(true); };
  const openEdit = (s: Siswa) => {
    setEditTarget(s);
    setForm({
      nama: s.nama,
      nis: s.nis || '',
      nisn: s.nisn || '',
      nik: s.nik || '',
      jenis_kelamin: s.jenis_kelamin,
      tanggal_lahir: s.tanggal_lahir?.slice(0, 10) || '',
      nama_ayah: s.nama_ayah || '',
      nama_ibu: s.nama_ibu || '',
      rombel_id: s.rombel_id || ''
    });
    setFormError(''); setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.nama || !form.nis) { setFormError('Nama dan NIS wajib diisi.'); return; }
    setSaving(true); setFormError('');
    try {
      if (editTarget) await api.put(`/siswa/${editTarget.id}`, form);
      else await api.post('/siswa', form);
      setModalOpen(false); fetchData(pagination.page);
    } catch (e: any) { setFormError(e.message || 'Terjadi kesalahan.'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/siswa/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchData(pagination.page);
    } catch (e) { console.error(e); } finally { setDeleting(false); }
  };

  const columns = [
    {
      header: 'Nama Siswa', render: (s: Siswa) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/20 flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <span className="font-bold text-foreground">{s.nama}</span>
        </div>
      )
    },
    {
      header: 'NIS / NISN', render: (s: Siswa) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400">
            <Hash className="w-3 h-3" />{s.nis || '-'}
          </div>
          <span className="text-[10px] text-muted-foreground">{s.nisn || '-'}</span>
        </div>
      )
    },
    {
      header: 'Gender', render: (s: Siswa) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.jenis_kelamin === 'L' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-pink-500/10 text-pink-400 border-pink-500/20'}`}>
          {s.jenis_kelamin === 'L' ? 'LAKI-LAKI' : 'PEREMPUAN'}
        </span>
      )
    },
    {
      header: 'Kelas', render: (s: Siswa) => (
        <span className="text-xs font-medium text-muted-foreground">{s.kelas || 'Belum Ada'}</span>
      )
    },
    {
      header: 'Aksi', align: 'right' as const, render: (s: Siswa) => (
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
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center">
              <User className="w-5 h-5 text-sky-400" />
            </div>
            DATA SISWA
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manajemen data peserta didik dan riwayat akademik</p>
        </div>
        <Button onClick={openAdd} className="gap-2 shadow-lg shadow-sky-500/20">
          <Plus className="w-4 h-4" /> Tambah Siswa
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
          title={editTarget ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
          description="Lengkapi informasi dasar dan akademik siswa"
          icon={<User className="w-5 h-5" />}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSave}
          saving={saving}
          maxWidth="3xl"
        >
          <div className="space-y-6">
            {formError && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/15 border border-destructive/25 text-destructive text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />{formError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Identitas */}
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-sky-400/60">Identitas Siswa</p>
                <FormField id="nama" label="Nama Lengkap" value={form.nama} onChange={v => setForm(f => ({ ...f, nama: v }))} required />
                <div className="grid grid-cols-2 gap-3">
                  <FormField id="nis" label="NIS" value={form.nis} onChange={v => setForm(f => ({ ...f, nis: v }))} required />
                  <FormField id="nisn" label="NISN" value={form.nisn} onChange={v => setForm(f => ({ ...f, nisn: v }))} />
                </div>
                <FormField id="nik" label="NIK" value={form.nik} onChange={v => setForm(f => ({ ...f, nik: v }))} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField id="jk" label="Jenis Kelamin" type="select" value={form.jenis_kelamin} onChange={v => setForm(f => ({ ...f, jenis_kelamin: v }))}
                    options={[{ value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }]} />
                  <FormField id="tgl" label="Tgl Lahir" type="date" value={form.tanggal_lahir} onChange={v => setForm(f => ({ ...f, tanggal_lahir: v }))} />
                </div>
              </div>

              {/* Akademik & Orang Tua */}
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-sky-400/60">Akademik & Keluarga</p>
                <FormField id="rombel" label="Penempatan Kelas" type="select" placeholder="-- Pilih Kelas --" value={form.rombel_id} onChange={v => setForm(f => ({ ...f, rombel_id: v }))}
                  options={rombels.map(r => ({ value: r.id, label: `${r.nama} (Tingkat ${r.tingkat})` }))} />
                <div className="border-t border-white/5 my-2" />
                <FormField id="ayah" label="Nama Ayah" value={form.nama_ayah} onChange={v => setForm(f => ({ ...f, nama_ayah: v }))} />
                <FormField id="ibu" label="Nama Ibu" value={form.nama_ibu} onChange={v => setForm(f => ({ ...f, nama_ibu: v }))} />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <Modal
          title="Hapus Data Siswa?"
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
