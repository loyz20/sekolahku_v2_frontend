import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { GraduationCap, AlertTriangle, Plus, Edit2, Trash2, Hash, Calendar, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
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
  jenis_kelamin: 'L' | 'P' | '';
  tanggal_lahir: string;
  pendidikan_terakhir: string;
}

const EMPTY_FORM: GuruForm = {
  nama: '',
  nik: '',
  nip: '',
  nuptk: '',
  jenis_kelamin: '',
  tanggal_lahir: '',
  pendidikan_terakhir: ''
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
  const [importing, setImporting] = useState(false);

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

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      const items = jsonData.map(row => {
        let jk = row['JK'] || row['Jenis Kelamin'] || row['L/P'] || '';
        if (typeof jk === 'string') {
          jk = jk.toUpperCase().startsWith('L') ? 'L' : (jk.toUpperCase().startsWith('P') ? 'P' : '');
        }

        // Format dates (Excel stores dates as numbers or MM/DD/YYYY)
        let tgl = row['Tanggal Lahir'] || row['Tgl Lahir'] || '';
        if (typeof tgl === 'number') {
          tgl = new Date((tgl - (25567 + 1)) * 86400 * 1000).toISOString().split('T')[0];
        }

        return {
          nama: String(row['Nama'] || row['NAMA'] || row['nama'] || '').trim(),
          nip: String(row['NIP'] || row['nip'] || row['Nip'] || '').trim(),
          nik: String(row['NIK'] || row['nik'] || row['Nik'] || '').trim(),
          nuptk: String(row['NUPTK'] || row['nuptk'] || row['Nuptk'] || '').trim(),
          jenis_kelamin: jk,
          tanggal_lahir: typeof tgl === 'string' && tgl.match(/^\d{4}-\d{2}-\d{2}$/) ? tgl : '',
          pendidikan_terakhir: String(row['Pendidikan'] || row['Pendidikan Terakhir'] || row['pendidikan'] || '').trim()
        };
      }).filter(item => item.nama && item.nip);

      if (items.length === 0) {
        alert('Data kosong atau format tidak sesuai. Pastikan kolom Nama dan NIP tersedia.');
        setImporting(false);
        return;
      }

      await api.post('/ptk/import', { items });
      alert(`Berhasil mengimpor ${items.length} data guru`);
      fetchData(1);
    } catch (error: any) {
      alert(error.response?.data?.message || error.message || 'Gagal mengimpor file Excel');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        'Nama': 'Budi Santoso',
        'NIP': '198001012005011001',
        'NIK': '3278012345678901',
        'NUPTK': '1234567890123456',
        'JK': 'L',
        'Tanggal Lahir': '1980-01-01',
        'Pendidikan': 'S1'
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Guru');
    XLSX.writeFile(wb, 'Template_Import_Guru.xlsx');
  };

  const handleSave = async () => {
    if (!form.nama || !form.nip) { setFormError('Nama dan NIP wajib diisi.'); return; }

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
      header: 'NIP / NUPTK', render: (g: Guru) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400">
            <Hash className="w-3 h-3" />{g.nip || '-'}
          </div>
          <span className="text-[10px] text-muted-foreground">{g.nuptk || 'NUPTK Belum Ada'}</span>
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
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2 border-violet-500/20 hover:bg-violet-500/10 text-violet-600 dark:text-violet-400" onClick={downloadTemplate}>
              <Download className="w-4 h-4" />
              Template
            </Button>
            <Button variant="outline" className="gap-2 border-violet-500/20 hover:bg-violet-500/10 text-violet-600 dark:text-violet-400" onClick={() => document.getElementById('excel-upload')?.click()} disabled={importing}>
              {importing ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
              Import Excel
            </Button>
            <input type="file" id="excel-upload" accept=".xlsx, .xls" className="hidden" onChange={handleImport} />
            <Button onClick={openAdd} className="gap-2 shadow-lg shadow-violet-500/20">
              <Plus className="w-4 h-4" /> Tambah Guru
            </Button>
          </div>
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
                <FormField id="nip" label="NIP" placeholder="e.g. 1980..." value={form.nip} onChange={v => setForm(f => ({ ...f, nip: v }))} required />
                <FormField id="nik" label="NIK (KTP) (Optional)" placeholder="16 digit angka" value={form.nik} onChange={v => setForm(f => ({ ...f, nik: v }))} />
                <FormField id="nuptk" label="NUPTK (Optional)" placeholder="16 digit NUPTK" value={form.nuptk} onChange={v => setForm(f => ({ ...f, nuptk: v }))} />
              </div>
              <div className="space-y-4">
                <FormField id="gender" label="Jenis Kelamin (Optional)" type="select" value={form.jenis_kelamin} onChange={v => setForm(f => ({ ...f, jenis_kelamin: v as 'L' | 'P' | '' }))}
                  options={[{ value: '', label: '-- Pilih --' }, { value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }]} />
                <FormField id="tgl_lahir" label="Tanggal Lahir (Optional)" type="date" value={form.tanggal_lahir} onChange={v => setForm(f => ({ ...f, tanggal_lahir: v }))} />
                <FormField id="pendidikan" label="Pendidikan Terakhir (Optional)" type="select" value={form.pendidikan_terakhir} onChange={v => setForm(f => ({ ...f, pendidikan_terakhir: v }))}
                  options={[
                    { value: '', label: '-- Pilih --' },
                    { value: 'D3', label: 'D3' },
                    { value: 'S1', label: 'S1 / D4' },
                    { value: 'S2', label: 'S2' },
                    { value: 'S3', label: 'S3' }
                  ]} />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
