import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '@/lib/api';
import { 
  ShieldAlert, 
  Trash2, 
  Edit2, 
  Filter, 
  Layers,
  ArrowUpCircle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { FormField } from '@/components/shared/FormField';
import { Modal } from '@/components/shared/Modal';
import { PageHero } from '@/components/shared/PageHero';
import { FilterBar } from '@/components/shared/FilterBar';
import { showToast } from '@/lib/toast-utils';
import * as XLSX from 'xlsx';

interface MasterPelanggaran {
  id: string;
  kategori: string;
  nama: string;
  poin: number;
}

const EMPTY_FORM = { kategori: 'Kedisiplinan', nama: '', poin: 0 };

export default function PelanggaranMasterPage() {
  const [data, setData] = useState<MasterPelanggaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MasterPelanggaran | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/pelanggaran/master');
      setData((res as any).data);
    } catch (e) {
      console.error(e);
      showToast.error('Gagal mengambil data master pelanggaran');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    if (!formData.nama) {
      showToast.error('Nama pelanggaran wajib diisi');
      return;
    }
    setSaving(true);
    try {
      if (editTarget) {
        await api.put(`/pelanggaran/master/${editTarget.id}`, formData);
        showToast.success('Jenis pelanggaran diperbarui');
      } else {
        await api.post('/pelanggaran/master', formData);
        showToast.success('Jenis pelanggaran ditambahkan');
      }
      setModalOpen(false);
      fetchData();
    } catch (e: any) {
      showToast.error(e.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus jenis pelanggaran ini?')) return;
    try {
      await api.delete(`/pelanggaran/master/${id}`);
      showToast.success('Jenis pelanggaran dihapus');
      fetchData();
    } catch (e) {
      showToast.error('Gagal menghapus data');
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Hapus ${selectedIds.length} jenis pelanggaran yang dipilih?`)) return;

    try {
      setLoading(true);
      await Promise.all(selectedIds.map(id => api.delete(`/pelanggaran/master/${id}`)));
      showToast.success(`${selectedIds.length} data berhasil dihapus`);
      setSelectedIds([]);
      fetchData();
    } catch (e) {
      showToast.error("Gagal menghapus beberapa data");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditTarget(null);
    setFormData(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (item: MasterPelanggaran) => {
    setEditTarget(item);
    setFormData({ kategori: item.kategori, nama: item.nama, poin: item.poin });
    setModalOpen(true);
  };

  const handleExport = () => {
    if (data.length === 0) {
      showToast.error('Tidak ada data untuk diexport');
      return;
    }

    const dataToExport = data.map(m => ({
      'Kategori': m.kategori,
      'Nama Pelanggaran': m.nama,
      'Poin Sanksi': m.poin
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Master Pelanggaran');
    XLSX.writeFile(wb, `Master_Pelanggaran_${new Date().getTime()}.xlsx`);
    showToast.success('Berhasil export ke Excel');
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch = item.nama.toLowerCase().includes(search.toLowerCase());
      const matchKategori = filterKategori ? item.kategori === filterKategori : true;
      return matchSearch && matchKategori;
    });
  }, [data, search, filterKategori]);

  const stats = useMemo(() => {
    const totalTypes = data.length;
    const maxPoin = data.reduce((max, item) => Math.max(max, item.poin), 0);
    const kategoriCounts = data.reduce((acc: any, item) => {
      acc[item.kategori] = (acc[item.kategori] || 0) + 1;
      return acc;
    }, {});
    const commonKategori = Object.entries(kategoriCounts).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || '-';

    return { totalTypes, maxPoin, commonKategori };
  }, [data]);

  const columns = [
    {
      header: 'Kategori',
      accessor: 'kategori' as const,
      render: (item: MasterPelanggaran) => {
        const styles: any = {
          'Berat': 'bg-rose-500/10 text-rose-500 border-rose-500/20',
          'Etika': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
          'Kerapihan': 'bg-sky-500/10 text-sky-500 border-sky-500/20',
          'Kedisiplinan': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
        };
        return (
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${styles[item.kategori] || styles['Kedisiplinan']}`}>
            {item.kategori}
          </span>
        );
      }
    },
    {
      header: 'Jenis Pelanggaran',
      accessor: 'nama' as const,
      render: (item: MasterPelanggaran) => (
        <div className="flex flex-col group/name">
          <span className="font-bold text-foreground group-hover:text-primary transition-colors">{item.nama}</span>
          <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">Kategori: {item.kategori}</span>
        </div>
      )
    },
    {
      header: 'Bobot Poin',
      accessor: 'poin' as const,
      render: (item: MasterPelanggaran) => (
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center font-black text-sm text-primary border border-white/5 shadow-inner">
            {item.poin}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter leading-none">Poin</span>
            <span className="text-[8px] text-primary/40 font-bold uppercase tracking-widest mt-0.5">Sanksi</span>
          </div>
        </div>
      )
    },
    {
      header: 'Aksi',
      align: 'right' as const,
      render: (item: MasterPelanggaran) => (
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 text-primary" onClick={() => openEdit(item)}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 text-destructive" onClick={() => handleDelete(item.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="w-full p-6 space-y-8 mx-auto animate-in fade-in duration-700">
      <PageHero
        title="Master Kedisiplinan"
        description="Konfigurasi jenis pelanggaran dan bobot poin sanksi kedisplinan"
        icon={<ShieldAlert className="w-5 h-5" />}
        variant="primary"
        breadcrumb="Kesiswaan / Master Kedisiplinan"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard icon={<ShieldAlert className="w-5 h-5 text-sky-400" />} label="Total Jenis" value={stats.totalTypes} color="sky" />
        <StatsCard icon={<ArrowUpCircle className="w-5 h-5 text-rose-400" />} label="Poin Tertinggi" value={stats.maxPoin} color="rose" />
        <StatsCard icon={<Layers className="w-5 h-5 text-emerald-400" />} label="Kategori Terbanyak" value={stats.commonKategori} color="emerald" />
        <StatsCard icon={<CheckCircle2 className="w-5 h-5 text-amber-400" />} label="Status Sistem" value="Aktif" color="amber" />
      </div>

      {/* Main Table Area */}
      <div className="space-y-4">
        {/* Bulk Action & Filter Bar */}
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari jenis pelanggaran..."
          selectedCount={selectedIds.length}
          onBulkDelete={handleBulkDelete}
          onAdd={openAdd}
          onExport={handleExport}
          addTooltip="Tambah Jenis Pelanggaran"
          exportTooltip="Export ke Excel"
          filters={[
            {
              label: 'Kategori',
              value: filterKategori,
              icon: Filter,
              onChange: setFilterKategori,
              options: [
                { label: 'Semua Kategori', value: '' },
                { label: 'Kedisiplinan', value: 'Kedisiplinan' },
                { label: 'Kerapihan', value: 'Kerapihan' },
                { label: 'Etika', value: 'Etika' },
                { label: 'Berat', value: 'Berat' },
              ]
            }
          ]}
        />

        <DataTable
          columns={columns}
          data={filteredData}
          loading={loading}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={ids => setSelectedIds(ids as string[])}
        />
      </div>

      {modalOpen && (
        <Modal
          onClose={() => setModalOpen(false)}
          title={editTarget ? "Edit Jenis Pelanggaran" : "Tambah Jenis Pelanggaran"}
          description="Atur kategori dan bobot poin sanksi untuk kedisiplinan"
          icon={<ShieldAlert className="w-5 h-5 text-primary" />}
          onSubmit={handleSave}
          saving={saving}
          maxWidth="md"
        >
          <div className="space-y-6">
            <FormField
              id="kategori"
              label="Kategori"
              type="select"
              value={formData.kategori}
              onChange={(val) => setFormData({ ...formData, kategori: val })}
              options={[
                { value: 'Kedisiplinan', label: 'Kedisiplinan' },
                { value: 'Kerapihan', label: 'Kerapihan' },
                { value: 'Etika', label: 'Etika' },
                { value: 'Berat', label: 'Pelanggaran Berat' },
              ]}
              required
            />
            <FormField
              id="nama"
              label="Nama Pelanggaran"
              placeholder="Contoh: Terlambat masuk sekolah"
              value={formData.nama}
              onChange={(val) => setFormData({ ...formData, nama: val })}
              required
            />
            <FormField
              id="poin"
              label="Poin Sanksi"
              type="number"
              value={formData.poin.toString()}
              onChange={(val) => setFormData({ ...formData, poin: parseInt(val) || 0 })}
              required
            />

            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex gap-3">
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed text-primary/60 uppercase font-bold tracking-widest">
                Poin sanksi akan diakumulasi dalam sistem skor kedisiplinan siswa untuk menentukan sanksi lanjutan.
              </p>
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
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
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
