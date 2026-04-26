import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { 
  Layout, 
  AlertTriangle, 
  Edit2, 
  Trash2, 
  User, 
  Upload, 
  Calendar, 
  Eye,
  GraduationCap,
  Users,
  BookOpen,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { showToast } from '@/lib/toast-utils';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { Modal } from '@/components/shared/Modal';
import { FilterBar } from '@/components/shared/FilterBar';
import { FormField } from '@/components/shared/FormField';
import { PageHero } from '@/components/shared/PageHero';
import { SearchableSelect } from '@/components/shared/SearchableSelect';

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

interface RombelStats {
  totalClasses: number;
  totalStudents: number;
  activeTahunAjaran: string;
  tingkatStats: { tingkat: number; count: number }[];
}

const EMPTY_FORM = {
  nama: '',
  tingkat: 1,
  tahun_ajaran_id: '',
  wali_kelas_ptk_id: ''
};

export default function KelasPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Rombel[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 });
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<RombelStats | null>(null);

  // Selection & Sorting
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [sort, setSort] = useState<{ field: string, direction: 'ASC' | 'DESC' }>({ field: 'nama', direction: 'ASC' });

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Rombel | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importTahunAjaranId, setImportTahunAjaranId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [ptks, setPtks] = useState<PTK[]>([]);
  const [tahunAjarans, setTahunAjarans] = useState<TahunAjaran[]>([]);

  const fetchData = useCallback(async (page = 1, limit = pagination.limit) => {
    setLoading(true);
    try {
      const res = await api.get<any>(
        `/rombel?page=${page}&limit=${limit}&search=${search}&sort=${sort.field}:${sort.direction.toLowerCase()}`
      );
      setItems(res.data.items);
      setPagination(res.data.pagination);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [search, sort, pagination.limit]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get<any>('/rombel/stats');
      setStats(res.data);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { 
    fetchData(1); 
    fetchStats();
  }, [fetchData, fetchStats]);

  useEffect(() => {
    // Fetch PTK for Wali Kelas options
    api.get<any>('/ptk?limit=1000').then(res => {
      setPtks(res.data.items || (Array.isArray(res.data) ? res.data : []));
    }).catch(console.error);
    // Fetch Tahun Ajaran
    api.get<any>('/tahun-ajaran').then(res => {
      const items = res.data.items || res.data || [];
      setTahunAjarans(items);
      const active = items.find((t: any) => t.aktif);
      if (active) {
        setImportTahunAjaranId(active.id);
      }
    }).catch(console.error);
  }, []);

  const handleSort = (field: string) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'ASC' ? 'DESC' : 'ASC'
    }));
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Hapus ${selectedIds.length} data kelas terpilih?`)) return;
    
    setLoading(true);
    try {
      for (const id of selectedIds) {
        await api.delete(`/rombel/${id}`);
      }
      showToast.success(`Berhasil menghapus ${selectedIds.length} data kelas`);
      setSelectedIds([]);
      fetchData(1);
      fetchStats();
    } catch (e) {
      showToast.error("Gagal menghapus beberapa data");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const res = await api.get<any>(
        `/rombel?page=1&limit=1000&search=${search}&sort=${sort.field}:${sort.direction.toLowerCase()}`
      );
      
      const allItems = res.data.items;
      const dataToExport = (selectedIds.length > 0 
        ? allItems.filter((r: Rombel) => selectedIds.includes(r.id))
        : allItems
      ).map((r: Rombel) => ({
        'Nama Kelas': r.nama,
        'Tingkat': r.tingkat,
        'Wali Kelas': r.wali_kelas_nama || 'Belum ditentukan',
        'Tahun Ajaran': r.tahun_ajaran_nama
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Kelas');
      XLSX.writeFile(wb, `Data_Kelas_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
      showToast.success(`Berhasil meng-export ${dataToExport.length} data kelas`);
    } catch (e) {
      showToast.error("Gagal meng-export data");
    } finally {
      setLoading(false);
    }
  };

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
      showToast.success(editTarget ? 'Data kelas diperbarui' : 'Kelas baru ditambahkan');
      setModalOpen(false); 
      fetchData(pagination.page);
      fetchStats();
    } catch (e: any) { setFormError(e.message || 'Terjadi kesalahan.'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus data kelas ini?')) return;
    try { 
      await api.delete(`/rombel/${id}`); 
      showToast.success('Data kelas dihapus');
      fetchData(pagination.page); 
      fetchStats();
    } catch (e) { console.error(e); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!importTahunAjaranId) {
      showToast.error('Silakan pilih Tahun Ajaran terlebih dahulu.');
      return;
    }

    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      const items = jsonData.map(row => {
        let tingkat = Number(row['Tingkat'] || row['TINGKAT'] || row['tingkat'] || 0);
        return {
          nama: String(row['Nama'] || row['NAMA'] || row['nama'] || '').trim(),
          tingkat: tingkat,
          tahun_ajaran_id: importTahunAjaranId
        };
      }).filter(item => item.nama && item.tingkat > 0);

      if (items.length === 0) {
        showToast.error('Data kosong atau format tidak sesuai.');
        setImporting(false);
        return;
      }

      await api.post('/rombel/import', { items });
      showToast.success(`Berhasil mengimpor ${items.length} data kelas`);
      setImportModalOpen(false);
      fetchData(1);
      fetchStats();
    } catch (error: any) {
      showToast.error(error.message || 'Gagal mengimpor file Excel');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 'Nama': 'VII-A', 'Tingkat': 7 },
      { 'Nama': 'VII-B', 'Tingkat': 7 },
      { 'Nama': 'VIII-A', 'Tingkat': 8 }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Kelas');
    XLSX.writeFile(wb, 'Template_Import_Kelas.xlsx');
  };

  const columns = [
    {
      header: 'Nama Kelas', accessor: 'nama' as keyof Rombel, render: (r: Rombel) => (
        <Link to={`/kelas/${r.id}`} className="flex flex-col group/name">
          <span className="font-bold text-foreground group-hover/name:text-primary transition-colors">{r.nama}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-tight">Tingkat {r.tingkat}</span>
        </Link>
      )
    },
    {
      header: 'Wali Kelas', render: (r: Rombel) => (
        <div className="flex items-center gap-2 text-xs">
          <User className="w-3.5 h-3.5 text-primary/40" />
          <span className="font-medium text-muted-foreground">{r.wali_kelas_nama || 'Belum ditentukan'}</span>
        </div>
      )
    },
    {
      header: 'Tahun Ajaran', render: (r: Rombel) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground/40" />
          <span className="text-xs font-medium text-muted-foreground">{r.tahun_ajaran_nama || '-'}</span>
        </div>
      )
    },
    {
      header: 'Aksi', align: 'right' as const, render: (r: Rombel) => (
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 text-primary" onClick={() => navigate(`/kelas/${r.id}`)}>
            <Eye className="w-3.5 h-3.5" />
          </Button>
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
      <PageHero
        title="DATA ROMBONGAN BELAJAR"
        description="Kelola data kelas dan penempatan wali kelas"
        icon={<Layout className="w-5 h-5" />}
        variant="primary"
        breadcrumb="Akademik / Data Kelas"
      />

      {/* Statistics Section */}
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard icon={<Layout className="w-5 h-5 text-primary" />} label="Total Kelas" value={stats?.totalClasses || 0} color="primary" />
        <StatsCard icon={<Users className="w-5 h-5 text-sky-400" />} label="Total Siswa" value={stats?.totalStudents || 0} color="sky" />
        <StatsCard icon={<Calendar className="w-5 h-5 text-violet-400" />} label="Tahun Ajaran" value={stats?.activeTahunAjaran ? 1 : 0} color="violet" />
        <StatsCard icon={<GraduationCap className="w-5 h-5 text-amber-400" />} label="Tingkat Terbanyak" value={stats?.tingkatStats?.sort((a,b) => b.count - a.count)[0]?.tingkat || 0} color="amber" />
      </div>

      {/* Main Table Area */}
      <div className="space-y-4">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari kelas..."
          selectedCount={selectedIds.length}
          onBulkDelete={handleBulkDelete}
          onExport={handleExport}
          onAdd={openAdd}
          onImport={() => setImportModalOpen(true)}
          addTooltip="Tambah Kelas Baru"
          importTooltip="Import Data Kelas (Excel)"
          exportTooltip="Export Data Kelas ke Excel"
        />

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
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/15 border border-destructive/25 text-destructive text-sm font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />{formError}
              </div>
            )}

            <div className="space-y-4">
              <FormField id="nama" label="Nama Kelas" placeholder="e.g. VII-A" value={form.nama} onChange={v => setForm(f => ({ ...f, nama: v }))} required />
              <FormField id="tingkat" label="Tingkat" type="select" value={form.tingkat} onChange={v => setForm(f => ({ ...f, tingkat: Number(v) }))}
                options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(t => ({ value: t, label: `Tingkat ${t}` }))} required />

              <FormField id="tahun_ajaran_id" label="Tahun Ajaran" type="select" placeholder="-- Pilih Tahun Ajaran --" value={form.tahun_ajaran_id} onChange={v => setForm(f => ({ ...f, tahun_ajaran_id: v }))}
                options={tahunAjarans.map(t => ({ value: t.id, label: t.tahun + (t.aktif ? ' (Aktif)' : '') }))} required />

              <SearchableSelect 
                id="wali_kelas_ptk_id" 
                label="Wali Kelas" 
                placeholder="-- Pilih Wali Kelas --" 
                value={form.wali_kelas_ptk_id} 
                onChange={v => setForm(f => ({ ...f, wali_kelas_ptk_id: v }))}
                options={ptks.map(p => ({ value: p.id, label: p.nama }))} 
              />
            </div>
          </div>
        </Modal>
      )}

      {importModalOpen && (
        <Modal
          title="Import Data Kelas"
          description="Pilih tahun ajaran tujuan untuk data yang akan diimpor"
          icon={<Upload className="w-5 h-5" />}
          onClose={() => setImportModalOpen(false)}
          showFooter={false}
          maxWidth="sm"
        >
          <div className="space-y-6">
            <FormField 
              id="import_tahun_ajaran" 
              label="Tahun Ajaran Tujuan" 
              type="select" 
              value={importTahunAjaranId} 
              onChange={setImportTahunAjaranId}
              options={tahunAjarans.map(t => ({ value: t.id, label: t.tahun + (t.aktif ? ' (Aktif)' : '') }))}
              required
            />
            
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Instruksi Impor</span>
              </div>
              <ul className="text-[11px] text-muted-foreground space-y-1 list-disc pl-4 font-medium">
                <li>Pastikan file Excel memiliki kolom <strong>Nama</strong> dan <strong>Tingkat</strong>.</li>
                <li>Data akan dimasukkan ke dalam Tahun Ajaran yang Anda pilih di atas.</li>
                <li>Wali Kelas dapat diatur secara manual setelah data berhasil diimpor.</li>
              </ul>
            </div>

            <Button 
              className="w-full gap-2 h-12 text-sm font-bold shadow-lg shadow-primary/20" 
              onClick={() => fileInputRef.current?.click()}
              disabled={importing || !importTahunAjaranId}
            >
              {importing ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {importing ? 'Memproses...' : 'Pilih File & Impor Sekarang'}
            </Button>
            <input 
              type="file" 
              ref={fileInputRef}
              accept=".xlsx, .xls" 
              className="hidden" 
              onChange={handleImport} 
            />
          </div>
        </Modal>
      )}

      {importModalOpen && (
        <Modal
          title="Import Data Kelas"
          description="Impor massal data rombongan belajar dari file Excel"
          icon={<Upload className="w-5 h-5 text-primary" />}
          onClose={() => setImportModalOpen(false)}
          showFooter={false}
          maxWidth="sm"
        >
          <div className="space-y-6">
            <FormField
              id="import_tahun_ajaran"
              label="Tahun Ajaran Target"
              type="select"
              placeholder="-- Pilih Tahun Ajaran --"
              value={importTahunAjaranId}
              onChange={setImportTahunAjaranId}
              options={tahunAjarans.map(t => ({ value: t.id, label: t.tahun }))}
            />

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <BookOpen className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Panduan Impor</span>
              </div>
              <ul className="text-[11px] text-muted-foreground space-y-1 list-disc pl-4">
                <li>Gunakan template Excel yang tersedia di bawah.</li>
                <li>Kolom <strong>Nama</strong> dan <strong>Tingkat</strong> (Angka) wajib ada.</li>
                <li>Pilih tahun ajaran sebelum mengunggah file.</li>
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
                className="w-full gap-2 h-12 text-sm font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing || !importTahunAjaranId}
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
