import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import {
  User,
  AlertTriangle,
  Edit2,
  Trash2,
  Hash,
  Upload,
  BookOpen,
  Eye,
  Users,
  Filter,
  CheckCircle2,
  XCircle,
  Layout,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { Modal } from '@/components/shared/Modal';
import { FilterBar } from '@/components/shared/FilterBar';
import { FormField } from '@/components/shared/FormField';
import { PageHero } from '@/components/shared/PageHero';
import { showToast } from '@/lib/toast-utils';

interface Rombel { id: string; nama: string; tingkat: number; }
interface Siswa {
  id: string;
  nama: string;
  tempat_lahir: string;
  nis: string;
  nisn: string;
  jenis_kelamin: 'L' | 'P' | '';
  tanggal_lahir: string;
  nama_ayah: string;
  nama_ibu: string;
  tingkat: number;
  kelas?: string;
  rombel_id?: string;
}

interface Stats {
  totalStudents: number;
  lakiLaki: number;
  perempuan: number;
  activeClasses: number;
}

const EMPTY_FORM = {
  nama: '', tempat_lahir: '', nis: '', nisn: '',
  jenis_kelamin: '' as 'L' | 'P' | '',
  tanggal_lahir: '',
  nama_ayah: '', nama_ibu: '',
  rombel_id: ''
};

export default function SiswaPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Siswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ totalStudents: 0, lakiLaki: 0, perempuan: 0, activeClasses: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 });
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ field: 'nama', direction: 'ASC' });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filters
  const [filterGender, setFilterGender] = useState('');
  const [filterRombel, setFilterRombel] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Siswa | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [rombels, setRombels] = useState<Rombel[]>([]);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importRombelId, setImportRombelId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async (page = 1, limit = pagination.limit) => {
    setLoading(true);
    try {
      const res = await api.get<any>(
        `/siswa?page=${page}&limit=${limit}&search=${search}&sort=${sort.field}:${sort.direction.toLowerCase()}&jenis_kelamin=${filterGender}&rombel_id=${filterRombel}`
      );
      setItems(res.data.items);
      setPagination(res.data.pagination);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [search, sort, filterGender, filterRombel, pagination.limit]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get<any>('/siswa/stats');
      setStats(res.data);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    fetchData(1);
    fetchStats();
  }, [fetchData, fetchStats]);

  useEffect(() => {
    api.get<any>('/rombel?limit=100').then(res => setRombels(res.data.items)).catch(console.error);
  }, []);

  const handleSort = (field: string) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'ASC' ? 'DESC' : 'ASC'
    }));
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Hapus ${selectedIds.length} data siswa yang dipilih?`)) return;

    try {
      setLoading(true);
      await Promise.all(selectedIds.map(id => api.delete(`/siswa/${id}`)));
      showToast.success(`${selectedIds.length} data siswa berhasil dihapus`);
      setSelectedIds([]);
      fetchData(pagination.page);
      fetchStats();
    } catch (e) {
      showToast.error("Gagal menghapus beberapa data");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await api.get<any>(
        `/siswa?limit=5000&search=${search}&sort=${sort.field}:${sort.direction.toLowerCase()}&jenis_kelamin=${filterGender}&rombel_id=${filterRombel}`
      );

      const allItems = res.data.items;
      const dataToExport = (selectedIds.length > 0
        ? allItems.filter((s: Siswa) => selectedIds.includes(s.id))
        : allItems
      ).map((s: Siswa) => ({
        'Nama Lengkap': s.nama,
        'NIS': s.nis,
        'NISN': s.nisn,
        'L/P': s.jenis_kelamin,
        'Tempat Lahir': s.tempat_lahir,
        'Tanggal Lahir': s.tanggal_lahir ? format(new Date(s.tanggal_lahir), 'dd-MM-yyyy') : '-',
        'Kelas': s.kelas || 'Belum Ada',
        'Ayah': s.nama_ayah,
        'Ibu': s.nama_ibu
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');
      XLSX.writeFile(wb, `Data_Siswa_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
      showToast.success(`Berhasil meng-export ${dataToExport.length} data siswa`);
    } catch (e) {
      showToast.error("Gagal meng-export data");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        'Nama': 'Budi Santoso',
        'NIS': '123456',
        'NISN': '0012345678',
        'JK': 'L',
        'Tempat, Tgl Lahir': 'Jakarta, 01-01-2010',
        'Nama Ayah': 'Slamet',
        'Nama Ibu': 'Siti'
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Siswa');
    XLSX.writeFile(wb, 'Template_Import_Siswa.xlsx');
  };

  const openAdd = () => { setEditTarget(null); setForm(EMPTY_FORM); setFormError(''); setModalOpen(true); };
  const openEdit = (s: Siswa) => {
    setEditTarget(s);
    setForm({
      nama: s.nama,
      tempat_lahir: s.tempat_lahir || '',
      nis: s.nis || '',
      nisn: s.nisn || '',
      jenis_kelamin: s.jenis_kelamin || '',
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
      showToast.success(editTarget ? 'Data siswa diperbarui' : 'Siswa baru ditambahkan');
      setModalOpen(false); fetchData(pagination.page); fetchStats();
    } catch (e: any) { setFormError(e.message || 'Terjadi kesalahan.'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus data siswa ini?')) return;
    try {
      await api.delete(`/siswa/${id}`);
      showToast.success('Data siswa dihapus');
      fetchData(pagination.page); fetchStats();
    } catch (e) { console.error(e); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { cellDates: true });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      const items = jsonData.map(row => {
        let tempatLahir = '';
        let tglLahir = '';

        const ttlRaw = row['Tempat, Tgl Lahir'] || row['TTL'] || '';
        if (ttlRaw && ttlRaw.includes(',')) {
          const parts = ttlRaw.split(',');
          tempatLahir = parts[0].trim();
          const tglPart = parts[1].trim();
          const dmyMatch = tglPart.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
          if (dmyMatch) {
            tglLahir = `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
          } else {
            tglLahir = tglPart;
          }
        }

        return {
          nama: String(row['Nama'] || row['NAMA'] || row['nama'] || '').trim(),
          tempat_lahir: tempatLahir,
          nis: String(row['NIS'] || row['nis'] || '').trim(),
          nisn: String(row['NISN'] || row['nisn'] || '').trim(),
          jenis_kelamin: (row['Jenis Kelamin'] || row['JK'] || '').toString().toUpperCase().startsWith('L') ? 'L' : 'P',
          tanggal_lahir: tglLahir,
          nama_ayah: row['Nama Ayah'] || '',
          nama_ibu: row['Nama Ibu'] || '',
          rombel_id: importRombelId || undefined
        };
      }).filter(item => item.nama && item.nis);

      if (items.length === 0) {
        showToast.error('Data kosong atau format tidak sesuai.');
        setImporting(false); return;
      }

      await api.post('/siswa/import', { items });
      showToast.success(`Berhasil mengimpor ${items.length} data siswa`);
      setImportModalOpen(false); fetchData(1); fetchStats();
    } catch (error: any) {
      showToast.error(error.message || 'Gagal mengimpor file Excel');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const columns = [
    {
      header: 'Nama Siswa', accessor: 'nama' as const, render: (s: Siswa) => (
        <Link to={`/siswa/${s.id}`} className="flex items-center gap-3 group/name">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground group-hover/name:text-sky-400 transition-colors">{s.nama}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Tingkat {s.tingkat || '-'}</span>
          </div>
        </Link>
      )
    },
    {
      header: 'Identitas', accessor: 'nis' as const, render: (s: Siswa) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400">
            <Hash className="w-3 h-3" />{s.nis || '-'}
          </div>
          <span className="text-[10px] text-muted-foreground">NISN: {s.nisn || '-'}</span>
        </div>
      )
    },
    {
      header: 'Gender', accessor: 'jenis_kelamin' as const, render: (s: Siswa) => (
        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${s.jenis_kelamin === 'L' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-pink-500/10 text-pink-400 border-pink-500/20'}`}>
          {s.jenis_kelamin === 'L' ? 'LAKI-LAKI' : 'PEREMPUAN'}
        </span>
      )
    },
    {
      header: 'Kelas', accessor: 'kelas' as const, render: (s: Siswa) => (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${s.kelas ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
          <span className="text-xs font-bold text-muted-foreground">{s.kelas || 'Belum Ada'}</span>
        </div>
      )
    },
    {
      header: 'Aksi', align: 'right' as const, render: (s: Siswa) => (
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-sky-500/10 text-sky-500" onClick={() => navigate(`/siswa/${s.id}`)}>
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 text-primary" onClick={() => openEdit(s)}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 text-destructive" onClick={() => handleDelete(s.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="w-full p-6 space-y-8 mx-auto animate-in fade-in duration-700">
      <PageHero
        title="DATA PESERTA DIDIK"
        description="Manajemen data siswa, rombongan belajar, dan keluarga"
        icon={<User className="w-5 h-5" />}
        variant="sky"
        breadcrumb="Kesiswaan / Database Peserta Didik"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard icon={<Users className="w-5 h-5 text-sky-400" />} label="Total Siswa" value={stats.totalStudents} color="sky" />
        <StatsCard icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />} label="Laki-laki" value={stats.lakiLaki} color="emerald" />
        <StatsCard icon={<XCircle className="w-5 h-5 text-pink-400" />} label="Perempuan" value={stats.perempuan} color="pink" />
        <StatsCard icon={<Layout className="w-5 h-5 text-amber-400" />} label="Kelas Aktif" value={stats.activeClasses} color="amber" />
      </div>

      {/* Main Table Area */}
      <div className="space-y-4">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari siswa..."
          selectedCount={selectedIds.length}
          onBulkDelete={handleBulkDelete}
          onExport={handleExport}
          onAdd={openAdd}
          onImport={() => setImportModalOpen(true)}
          addTooltip="Tambah Siswa Baru"
          importTooltip="Import Data Siswa (Excel)"
          exportTooltip="Export Data Siswa ke Excel"
          filters={[
            {
              label: 'Gender',
              value: filterGender,
              icon: Filter,
              onChange: setFilterGender,
              options: [
                { label: 'Semua Gender', value: '' },
                { label: 'Laki-laki', value: 'L' },
                { label: 'Perempuan', value: 'P' },
              ]
            },
            {
              label: 'Kelas',
              value: filterRombel,
              icon: Layout,
              onChange: setFilterRombel,
              options: [
                { label: 'Semua Kelas', value: '' },
                ...rombels.map(r => ({ label: r.nama, value: r.id }))
              ]
            }
          ]}
        />

        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          pagination={pagination}
          onPageChange={(p) => fetchData(p)}
          onLimitChange={(l) => fetchData(1, l)}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={(ids) => setSelectedIds(ids as string[])}
          onSort={handleSort}
          sortField={sort.field}
          sortDirection={sort.direction as 'ASC' | 'DESC'}
        />
      </div>

      {modalOpen && (
        <Modal
          title={editTarget ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
          description="Lengkapi informasi dasar dan akademik siswa"
          icon={<User className="w-5 h-5 text-sky-400" />}
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
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-sky-400/60">Identitas Siswa</p>
                <FormField id="nama" label="Nama Lengkap" value={form.nama} onChange={v => setForm(f => ({ ...f, nama: v }))} required />
                <div className="grid grid-cols-2 gap-3">
                  <FormField id="tempat_lahir" label="Tempat Lahir" value={form.tempat_lahir} onChange={v => setForm(f => ({ ...f, tempat_lahir: v }))} />
                  <FormField id="tgl" label="Tgl Lahir" type="date" value={form.tanggal_lahir} onChange={v => setForm(f => ({ ...f, tanggal_lahir: v }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField id="nis" label="NIS" value={form.nis} onChange={v => setForm(f => ({ ...f, nis: v }))} required />
                  <FormField id="nisn" label="NISN (Optional)" value={form.nisn} onChange={v => setForm(f => ({ ...f, nisn: v }))} />
                </div>
                <FormField id="jk" label="Jenis Kelamin" type="select" value={form.jenis_kelamin} onChange={v => setForm(f => ({ ...f, jenis_kelamin: v as 'L' | 'P' | '' }))}
                  options={[{ value: '', label: '-- Pilih --' }, { value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }]} />
              </div>

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

      {importModalOpen && (
        <Modal
          title="Import Data Siswa"
          description="Impor massal data siswa dari file Excel"
          icon={<Upload className="w-5 h-5 text-sky-400" />}
          onClose={() => setImportModalOpen(false)}
          showFooter={false}
          maxWidth="sm"
        >
          <div className="space-y-6">
            <FormField
              id="import_rombel"
              label="Penempatan Kelas Default"
              type="select"
              placeholder="-- Tanpa Kelas (Atur Nanti) --"
              value={importRombelId}
              onChange={setImportRombelId}
              options={rombels.map(r => ({ value: r.id, label: r.nama }))}
            />

            <div className="p-4 rounded-xl bg-sky-500/5 border border-sky-500/10 space-y-3">
              <div className="flex items-center gap-2 text-sky-400">
                <BookOpen className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Panduan Impor</span>
              </div>
              <ul className="text-[11px] text-muted-foreground space-y-1 list-disc pl-4">
                <li>Gunakan template Excel yang tersedia di bawah.</li>
                <li>Kolom <strong>Nama</strong> dan <strong>NIS</strong> wajib diisi.</li>
                <li>Format TTL: <strong>Kota, DD-MM-YYYY</strong>.</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 gap-3">
               <Button 
                variant="outline" 
                className="w-full gap-2 h-12 text-xs font-bold border-white/10 hover:bg-white/5"
                onClick={downloadTemplate}
               >
                 <Download className="w-4 h-4 text-amber-400" /> UNDUH TEMPLATE EXCEL
               </Button>

               <Button
                className="w-full gap-2 h-12 text-sm font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-900/20"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
              >
                {importing ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {importing ? 'Memproses...' : 'PILIH FILE EXCEL'}
              </Button>
            </div>
            <input type="file" ref={fileInputRef} accept=".xlsx, .xls" className="hidden" onChange={handleImport} />
          </div>
        </Modal>
      )}
    </div>
  );
}

function StatsCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) {
  const colorMap: any = {
    sky: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    pink: 'bg-pink-500/10 border-pink-500/20 text-pink-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  };

  return (
    <div className={`p-6 rounded-3xl border ${colorMap[color]} backdrop-blur-sm space-y-4 hover:scale-[1.02] transition-transform duration-300 group relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-3xl -mr-12 -mt-12" />
      <div className="flex items-center gap-3 relative">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/5">
          {icon}
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{label}</span>
      </div>
      <div className="text-3xl font-black tracking-tight relative">{value.toLocaleString()}</div>
    </div>
  );
}
