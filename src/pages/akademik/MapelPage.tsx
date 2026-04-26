import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { api } from '@/lib/api';
import { 
  BookOpen, 
  AlertTriangle, 
  Edit2, 
  Trash2, 
  Hash, 
  Sparkles, 
  Users,
  Layout,
  Download,
  Upload
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { Modal } from '@/components/shared/Modal';
import { FilterBar } from '@/components/shared/FilterBar';
import { FormField } from '@/components/shared/FormField';
import { PageHero } from '@/components/shared/PageHero';
import { showToast } from '@/lib/toast-utils';

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Mapel | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get<any>(`/mata-pelajaran?page=${page}&limit=10&search=${search}&kelompok=${filterKategori}`);
      setItems(res.data.items);
      setPagination(res.data.pagination);
    } catch (e) { 
      console.error(e);
      showToast.error('Gagal mengambil data mata pelajaran');
    } finally { 
      setLoading(false); 
    }
  }, [search]);

  useEffect(() => { 
    fetchData(1); 
  }, [fetchData]);

  const openAdd = () => { 
    setEditTarget(null); 
    setForm(EMPTY_FORM); 
    setFormError(''); 
    setModalOpen(true); 
  };

  const openEdit = (m: Mapel) => {
    setEditTarget(m);
    setForm({ nama: m.nama, kode: m.kode });
    setFormError(''); 
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.nama || !form.kode) { 
      setFormError('Nama dan Kode mata pelajaran wajib diisi.'); 
      return; 
    }
    
    setSaving(true); 
    setFormError('');
    try {
      if (editTarget) {
        await api.put(`/mata-pelajaran/${editTarget.id}`, form);
        showToast.success('Mata pelajaran diperbarui');
      } else {
        await api.post('/mata-pelajaran', form);
        showToast.success('Mata pelajaran ditambahkan');
      }
      setModalOpen(false); 
      fetchData(pagination.page);
    } catch (e: any) { 
      setFormError(e.message || 'Terjadi kesalahan.'); 
      showToast.error(e.message || 'Gagal menyimpan data');
    } finally { 
      setSaving(false); 
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus mata pelajaran ini?')) return;
    try { 
      await api.delete(`/mata-pelajaran/${id}`); 
      showToast.success('Mata pelajaran dihapus');
      fetchData(pagination.page); 
    } catch (e) { 
      console.error(e);
      showToast.error('Gagal menghapus mata pelajaran');
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Hapus ${selectedIds.length} mata pelajaran yang dipilih?`)) return;

    try {
      setLoading(true);
      await Promise.all(selectedIds.map(id => api.delete(`/mata-pelajaran/${id}`)));
      showToast.success(`${selectedIds.length} mata pelajaran berhasil dihapus`);
      setSelectedIds([]);
      fetchData(1);
    } catch (e) {
      showToast.error("Gagal menghapus beberapa data");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (items.length === 0) {
      showToast.error('Tidak ada data untuk diexport');
      return;
    }

    const dataToExport = items.map(m => ({
      'Nama Mata Pelajaran': m.nama,
      'Kode Mapel': m.kode
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Mapel');
    XLSX.writeFile(wb, `Data_Mapel_${new Date().getTime()}.xlsx`);
    showToast.success('Berhasil export ke Excel');
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

      const items = jsonData.map(row => ({
        nama: String(row['Nama'] || row['NAMA'] || row['nama'] || '').trim(),
        kode: String(row['Kode'] || row['KODE'] || row['kode'] || '').trim()
      })).filter(item => item.nama && item.kode);

      if (items.length === 0) {
        showToast.error('Data kosong atau format tidak sesuai.');
        return;
      }

      await api.post('/mata-pelajaran/import', { items });
      showToast.success(`Berhasil mengimpor ${items.length} mata pelajaran`);
      setImportModalOpen(false);
      fetchData(1);
    } catch (error: any) {
      showToast.error(error.response?.data?.message || error.message || 'Gagal mengimpor file Excel');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 'Nama': 'Matematika', 'Kode': 'MAT-01' },
      { 'Nama': 'Bahasa Indonesia', 'Kode': 'BIND-01' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Mapel');
    XLSX.writeFile(wb, 'Template_Import_Mapel.xlsx');
  };

  const stats = useMemo(() => ({
    totalMapel: pagination.total,
    totalKode: new Set(items.map(m => m.kode)).size,
    // Mock stats for aesthetic
    activeKurikulum: 'Merdeka',
    totalKategori: 2
  }), [pagination.total, items]);

  const columns = [
    { 
      header: 'Nama Mata Pelajaran', 
      accessor: 'nama' as const,
      render: (m: Mapel) => (
        <div className="flex items-center gap-3 group/item">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground group-hover/item:text-sky-400 transition-colors">{m.nama}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Nasional</span>
          </div>
        </div>
      )
    },
    { 
      header: 'Kode Mapel', 
      accessor: 'kode' as const,
      render: (m: Mapel) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400">
          <Hash className="w-3.5 h-3.5" />{m.kode}
        </div>
      )
    },
    { 
      header: 'Status', 
      render: () => (
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Aktif</span>
        </div>
      )
    },
    { 
      header: 'Aksi', 
      align: 'right' as const, 
      render: (m: Mapel) => (
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 text-primary" onClick={() => openEdit(m)}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 text-destructive" onClick={() => handleDelete(m.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="w-full p-6 space-y-8 mx-auto animate-in fade-in duration-700">
      {/* Header Section */}
      <PageHero
        title="Daftar Mata Pelajaran"
        description="Konfigurasi kurikulum dan bank data mata pelajaran sekolah"
        icon={<BookOpen className="w-5 h-5" />}
        variant="sky"
        breadcrumb="Akademik / Kurikulum"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard icon={<BookOpen className="w-5 h-5 text-sky-400" />} label="Total Mapel" value={stats.totalMapel} color="sky" />
        <StatsCard icon={<Hash className="w-5 h-5 text-emerald-400" />} label="Kode Unik" value={stats.totalKode} color="emerald" />
        <StatsCard icon={<Layout className="w-5 h-5 text-pink-400" />} label="Kurikulum" value={stats.activeKurikulum} color="pink" />
        <StatsCard icon={<Users className="w-5 h-5 text-amber-400" />} label="Kelompok" value={stats.totalKategori} color="amber" />
      </div>

      {/* Main Table Area */}
      <div className="space-y-4">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari mata pelajaran..."
          selectedCount={selectedIds.length}
          onBulkDelete={handleBulkDelete}
          onAdd={openAdd}
          onImport={() => setImportModalOpen(true)}
          onExport={handleExport} 
          addTooltip="Tambah Mata Pelajaran Baru"
          importTooltip="Import Data Mapel (Excel)"
          exportTooltip="Export Data Mapel"
          filters={[
            {
              label: 'Kategori',
              value: filterKategori,
              onChange: setFilterKategori,
              options: [
                { label: 'Semua Kategori', value: '' },
                { label: 'Muatan Nasional (A)', value: 'A' },
                { label: 'Muatan Kewilayahan (B)', value: 'B' },
                { label: 'Muatan Peminatan (C)', value: 'C' },
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
          selectable
          selectedIds={selectedIds}
          onSelectionChange={ids => setSelectedIds(ids as string[])}
        />
      </div>

      {modalOpen && (
        <Modal
          title={editTarget ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
          description="Konfigurasi detail kurikulum mata pelajaran sekolah"
          icon={<BookOpen className="w-5 h-5 text-sky-400" />}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSave}
          saving={saving}
          maxWidth="md"
        >
          <div className="space-y-6">
            {formError && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/15 border border-destructive/25 text-destructive text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />{formError}
              </div>
            )}

            <div className="space-y-4">
              <FormField 
                id="nama" 
                label="Nama Mata Pelajaran" 
                placeholder="Contoh: Matematika, Bahasa Indonesia" 
                value={form.nama} 
                onChange={v => setForm(f => ({ ...f, nama: v }))} 
                required 
              />
              <FormField 
                id="kode" 
                label="Kode Mapel" 
                placeholder="Contoh: MAT-01, BIND-01" 
                value={form.kode} 
                onChange={v => setForm(f => ({ ...f, kode: v }))} 
                required 
              />
              
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-3">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed text-amber-200/60 uppercase font-bold tracking-widest">
                  Gunakan kode unik untuk setiap mata pelajaran untuk mempermudah pemetaan kurikulum dan nilai.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {importModalOpen && (
        <Modal
          title="Import Data Mapel"
          description="Impor massal data mata pelajaran dari file Excel"
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
                <li>Gunakan template Excel yang tersedia di bawah.</li>
                <li>Kolom <strong>Nama</strong> dan <strong>Kode</strong> wajib ada.</li>
                <li>Pastikan kode mata pelajaran belum terdaftar.</li>
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
      <div className="text-3xl font-black tracking-tight relative">{typeof value === 'number' ? value.toLocaleString() : value}</div>
    </div>
  );
}
