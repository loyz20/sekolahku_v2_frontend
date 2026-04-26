import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { showToast } from '@/lib/toast-utils';
import { api } from '@/lib/api';
import { 
  GraduationCap, 
  Edit2, 
  Trash2, 
  Eye,
  Info,
  Filter,
  Hash,
  Calendar,
  Users,
  AlertTriangle,
  BookOpen,
  Download,
  Upload
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { Modal } from '@/components/shared/Modal';
import { FilterBar } from '@/components/shared/FilterBar';
import { FormField } from '@/components/shared/FormField';
import { PageHero } from '@/components/shared/PageHero';

interface Guru {
  id: string;
  sekolah_id: string;
  nama: string;
  nip: string | null;
  nuptk: string | null;
  jenis_kelamin: 'L' | 'P';
  tanggal_lahir: string;
  pendidikan_terakhir: string;
}

interface GuruForm {
  nama: string;
  nip: string;
  nuptk: string;
  jenis_kelamin: 'L' | 'P' | '';
  tanggal_lahir: string;
  pendidikan_terakhir: string;
}

const EMPTY_FORM: GuruForm = {
  nama: '',
  nip: '',
  nuptk: '',
  jenis_kelamin: '',
  tanggal_lahir: '',
  pendidikan_terakhir: ''
};

interface GuruStats {
  total: number;
  gender: { jenis_kelamin: string, count: number }[];
  pendidikan: { pendidikan_terakhir: string, count: number }[];
}

export default function GuruPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Guru[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 });
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<GuruStats | null>(null);
  const [saving, setSaving] = useState(false);

  // Selection & Sorting
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [sort, setSort] = useState<{ field: string, direction: 'ASC' | 'DESC' }>({ field: 'nama', direction: 'ASC' });

  // Filters
  const [filterGender, setFilterGender] = useState<string>('');
  const [filterPendidikan, setFilterPendidikan] = useState<string>('');

  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Guru | null>(null);
  const [form, setForm] = useState<GuruForm>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async (page = 1, limit = pagination.limit) => {
    setLoading(true);
    try {
      const res = await api.get<any>(
        `/ptk?page=${page}&limit=${limit}&search=${search}&sort=${sort.field}:${sort.direction.toLowerCase()}&jenis_kelamin=${filterGender}&pendidikan_terakhir=${filterPendidikan}`
      );
      setItems(res.data.items);
      setPagination(res.data.pagination);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [search, sort, filterGender, filterPendidikan, pagination.limit]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get<any>('/ptk/stats');
      setStats(res.data);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { 
    fetchData(1); 
    fetchStats();
  }, [fetchData, fetchStats]);

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Hapus ${selectedIds.length} data guru yang dipilih?`)) return;

    try {
      setLoading(true);
      for (const id of selectedIds) {
        await api.delete(`/ptk/${id}`);
      }
      showToast.success(`${selectedIds.length} data guru berhasil dihapus`);
      setSelectedIds([]);
      fetchData(pagination.page);
      fetchStats();
    } catch (e) {
      showToast.error("Gagal menghapus beberapa data");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'ASC' ? 'DESC' : 'ASC'
    }));
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const res = await api.get<any>(
        `/ptk?page=1&limit=1000&search=${search}&sort=${sort.field}:${sort.direction.toLowerCase()}&jenis_kelamin=${filterGender}&pendidikan_terakhir=${filterPendidikan}`
      );
      
      const allItems = res.data.items;
      
      const dataToExport = (selectedIds.length > 0 
        ? allItems.filter((g: Guru) => selectedIds.includes(g.id))
        : allItems
      ).map((g: Guru) => ({
        'Nama Lengkap': g.nama,
        'NIP': g.nip,
        'NUPTK': g.nuptk,
        'Jenis Kelamin': g.jenis_kelamin === 'L' ? 'Laki-Laki' : 'Perempuan',
        'Tanggal Lahir': g.tanggal_lahir ? format(new Date(g.tanggal_lahir), 'yyyy-MM-dd') : '-',
        'Pendidikan': g.pendidikan_terakhir
      }));

      if (dataToExport.length === 0) {
        showToast.error("Tidak ada data untuk di-export");
        return;
      }

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Guru');
      XLSX.writeFile(wb, `Data_Guru_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
      showToast.success(`Berhasil meng-export ${dataToExport.length} data guru`);
    } catch (e) {
      showToast.error("Gagal meng-export data");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => { setEditTarget(null); setForm(EMPTY_FORM); setFormError(''); setModalOpen(true); };
  const openEdit = (g: Guru) => {
    setEditTarget(g);
    setForm({
      nama: g.nama,
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

        let tgl = row['Tanggal Lahir'] || row['Tgl Lahir'] || '';
        if (typeof tgl === 'number') {
          tgl = new Date((tgl - (25567 + 1)) * 86400 * 1000).toISOString().split('T')[0];
        }

        return {
          nama: String(row['Nama'] || row['NAMA'] || row['nama'] || '').trim(),
          nip: String(row['NIP'] || row['nip'] || row['Nip'] || '').trim(),
          nuptk: String(row['NUPTK'] || row['nuptk'] || row['Nuptk'] || '').trim(),
          jenis_kelamin: jk,
          tanggal_lahir: typeof tgl === 'string' && tgl.match(/^\d{4}-\d{2}-\d{2}$/) ? tgl : '',
          pendidikan_terakhir: String(row['Pendidikan'] || row['Pendidikan Terakhir'] || row['pendidikan'] || '').trim()
        };
      }).filter(item => item.nama && item.nip);

      if (items.length === 0) {
        showToast.error('Data kosong atau format tidak sesuai. Pastikan kolom Nama dan NIP tersedia.');
        return;
      }

      await api.post('/ptk/import', { items });
      showToast.success(`Berhasil mengimpor ${items.length} data guru`);
      setImportModalOpen(false);
      fetchData(1);
      fetchStats();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || error.message || 'Gagal mengimpor file Excel');
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
      showToast.success(editTarget ? 'Data guru diperbarui' : 'Guru baru ditambahkan');
      setModalOpen(false); fetchData(pagination.page); fetchStats();
    } catch (e: any) { setFormError(e.message || 'Terjadi kesalahan.'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus data guru ini?')) return;
    try { await api.delete(`/ptk/${id}`); showToast.success('Data guru dihapus'); fetchData(pagination.page); fetchStats(); } catch (e) { console.error(e); }
  };

  const columns = [
    {
      header: 'Nama Lengkap', accessor: 'nama' as const, render: (g: Guru) => (
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
      header: 'NIP / NUPTK', accessor: 'nip' as const, render: (g: Guru) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400">
            <Hash className="w-3 h-3" />{g.nip || '-'}
          </div>
          <span className="text-[10px] text-muted-foreground">{g.nuptk || 'NUPTK Belum Ada'}</span>
        </div>
      )
    },
    {
      header: 'Gender', accessor: 'jenis_kelamin' as const, render: (g: Guru) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${g.jenis_kelamin === 'L' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-pink-500/10 text-pink-400 border-pink-500/20'}`}>
          {g.jenis_kelamin === 'L' ? 'LAKI-LAKI' : 'PEREMPUAN'}
        </span>
      )
    },
    {
      header: 'Tgl Lahir', accessor: 'tanggal_lahir' as const, render: (g: Guru) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <Calendar className="w-3 h-3 opacity-40" />
          {g.tanggal_lahir ? new Date(g.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
        </div>
      )
    },
    {
      header: 'Aksi', align: 'right' as const, render: (g: Guru) => (
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={() => navigate(`/guru/${g.id}`)}>
            <Eye className="w-3.5 h-3.5" />
          </Button>
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
      <PageHero
        title="DATA TENAGA PENDIDIK"
        description="Kelola informasi guru dan staf administrasi sekolah"
        icon={<GraduationCap className="w-5 h-5" />}
        variant="violet"
        breadcrumb="Akademik / Kepegawaian"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard icon={<Users className="w-5 h-5 text-violet-400" />} label="Total Guru" value={stats?.total || 0} color="violet" />
        <StatsCard icon={<Info className="w-5 h-5 text-sky-400 rotate-180" />} label="Laki-laki" value={stats?.gender.find(g => g.jenis_kelamin === 'L')?.count || 0} color="sky" />
        <StatsCard icon={<Info className="w-5 h-5 text-pink-400" />} label="Perempuan" value={stats?.gender.find(g => g.jenis_kelamin === 'P')?.count || 0} color="pink" />
        <StatsCard icon={<GraduationCap className="w-5 h-5 text-amber-400" />} label="S1 / Keatas" value={stats?.pendidikan.filter(p => ['S1', 'S2', 'S3'].includes(p.pendidikan_terakhir)).reduce((a, b) => a + b.count, 0) || 0} color="amber" />
      </div>

      {/* Main Table Area */}
      <div className="space-y-4">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari guru..."
          selectedCount={selectedIds.length}
          onBulkDelete={handleBulkDelete}
          onExport={handleExport}
          onAdd={openAdd}
          onImport={() => setImportModalOpen(true)}
          addTooltip="Tambah Guru Baru"
          importTooltip="Import Data Guru (Excel)"
          exportTooltip="Export Data Guru ke Excel"
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
              label: 'Pendidikan',
              value: filterPendidikan,
              icon: GraduationCap,
              onChange: setFilterPendidikan,
              options: [
                { label: 'Semua Pendidikan', value: '' },
                { label: 'SMA/SMK', value: 'SMA' },
                { label: 'D3', value: 'D3' },
                { label: 'S1', value: 'S1' },
                { label: 'S2', value: 'S2' },
                { label: 'S3', value: 'S3' },
              ]
            }
          ]}
        />

        <input type="file" ref={fileInputRef} accept=".xlsx, .xls" className="hidden" onChange={handleImport} />

        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          pagination={pagination}
          onPageChange={p => fetchData(p)}
          onLimitChange={l => fetchData(1, l)}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={(ids) => setSelectedIds(ids as string[])}
          sortField={sort.field}
          sortDirection={sort.direction}
          onSort={handleSort}
        />
      </div>

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
          {/* ... Modal content ... (unchanged) */}
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

            {!editTarget && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                <div className="flex items-center gap-2 text-amber-400">
                  <Info className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Informasi Akun Pengguna</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Akun guru akan dibuat secara otomatis saat Anda menyimpan data ini.
                </p>
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Username</p>
                    <p className="text-sm font-mono text-foreground">{form.nip || '(Menunggu NIP...)'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Password Default</p>
                    <p className="text-sm font-mono text-foreground">guru123</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
      
      {importModalOpen && (
        <Modal
          title="Import Data Guru"
          description="Impor massal data tenaga pendidik dari file Excel"
          icon={<Upload className="w-5 h-5 text-sky-400" />}
          onClose={() => setImportModalOpen(false)}
          showFooter={false}
          maxWidth="sm"
        >
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-sky-500/5 border border-sky-500/10 space-y-3">
              <div className="flex items-center gap-2 text-sky-400">
                <BookOpen className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Panduan Impor</span>
              </div>
              <ul className="text-[11px] text-muted-foreground space-y-1 list-disc pl-4">
                <li>Gunakan template Excel yang standar.</li>
                <li>Kolom <strong>Nama</strong> dan <strong>NIP</strong> wajib diisi.</li>
                <li>Sistem akan otomatis membuat akun pengguna.</li>
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
          </div>
        </Modal>
      )}
    </div>
  );
}
function StatsCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number | string, color: string }) {
  const colorMap: any = {
    primary: 'bg-primary/10 border-primary/20 text-primary',
    sky: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    pink: 'bg-pink-500/10 border-pink-500/20 text-pink-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    violet: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
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
