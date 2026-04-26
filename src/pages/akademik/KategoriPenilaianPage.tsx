import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  Calculator,
  Plus,
  Edit2,
  Trash2,
  Settings,
  Target,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { Modal } from '@/components/shared/Modal';
import { FormField } from '@/components/shared/FormField';
import { PageHero } from '@/components/shared/PageHero';
import { showToast } from '@/lib/toast-utils';

// ─── Types ──────────────────────────────────────────────────────────────────
interface Kategori {
  id: string;
  nama: string;
  bobot: number;
}

const EMPTY_FORM = {
  nama: '',
  bobot: 0
};

export default function KategoriPenilaianPage() {
  const [items, setItems] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Kategori | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/penilaian/kategori');
      setItems(res.data || []);
    } catch (e) {
      console.error(e);
      showToast.error('Gagal mengambil data kategori penilaian');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (k: Kategori) => {
    setEditTarget(k);
    setForm({ nama: k.nama, bobot: k.bobot });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.nama) {
      showToast.error('Nama kategori wajib diisi');
      return;
    }

    setSaving(true);
    try {
      if (editTarget) {
        await api.put(`/penilaian/kategori/${editTarget.id}`, form);
        showToast.success('Kategori penilaian berhasil diperbarui');
      } else {
        await api.post('/penilaian/kategori', form);
        showToast.success('Kategori penilaian baru berhasil ditambahkan');
      }
      setModalOpen(false);
      fetchData();
    } catch (e: any) {
      showToast.error(e.message || 'Terjadi kesalahan saat menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kategori ini?')) return;

    try {
      await api.delete(`/penilaian/kategori/${id}`);
      showToast.success('Kategori berhasil dihapus');
      fetchData();
    } catch (e) {
      showToast.error('Gagal menghapus kategori');
    }
  };

  const totalBobot = items.reduce((acc, curr) => acc + Number(curr.bobot), 0);

  const columns = [
    {
      header: 'Kategori Penilaian',
      render: (k: Kategori) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
            {k.nama.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground tracking-tight leading-tight">{k.nama}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">Komponen Penilaian</span>
          </div>
        </div>
      )
    },
    {
      header: 'Bobot Persentase',
      align: 'center' as const,
      render: (k: Kategori) => (
        <div className="flex items-center justify-center gap-2">
          <div className="px-4 py-1.5 rounded-2xl bg-white/5 border border-white/10 font-black text-lg text-primary">
            {k.bobot}%
          </div>
        </div>
      )
    },
    {
      header: 'Aksi',
      align: 'right' as const,
      render: (k: Kategori) => (
        <div className="flex items-center justify-end gap-1 md:opacity-0 group-hover:opacity-100 transition-all">
          <Button variant="ghost" size="icon" className="h-9 w-9 md:h-8 md:w-8 hover:bg-primary/10 text-primary" onClick={() => openEdit(k)}>
            <Edit2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 md:h-8 md:w-8 hover:bg-rose-500/10 text-rose-400" onClick={() => handleDelete(k.id)}>
            <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="w-full p-4 md:p-8 space-y-6 md:space-y-8 mx-auto animate-in fade-in duration-700 relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[150px] -z-10 rounded-full" />

      <PageHero
        title="KATEGORI PENILAIAN"
        description="Konfigurasi standar bobot penilaian Kurikulum Merdeka untuk seluruh mata pelajaran"
        icon={<Calculator className="w-5 h-5" />}
        variant="primary"
        breadcrumb="Sistem / Pengaturan Kurikulum"
        actions={
          <Button onClick={openAdd} className="gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/hover font-bold uppercase tracking-tight text-xs h-11 px-6 rounded-xl">
            <Plus className="w-4 h-4" /> TAMBAH KATEGORI
          </Button>
        }
      />

      {/* Summary / Total Bobot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-white/5 bg-zinc-900/40 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Total Akumulasi Bobot</p>
              <div className="flex items-baseline gap-2">
                <h4 className={`text-3xl font-black tracking-tighter ${Math.abs(totalBobot - 100) < 0.01 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {totalBobot}%
                </h4>
                <span className="text-xs font-medium text-muted-foreground">/ 100%</span>
              </div>
            </div>
          </div>
          {Math.abs(totalBobot - 100) > 0.01 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase animate-pulse">
              <AlertTriangle className="w-3 h-3" /> Harus 100%
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-md overflow-hidden">
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          hideHeader
        />
      </div>

      {modalOpen && (
        <Modal
          title={editTarget ? 'Edit Kategori Penilaian' : 'Tambah Kategori Penilaian'}
          description="Tentukan nama kategori dan bobot persentasenya"
          icon={<Settings className="w-5 h-5" />}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSave}
          saving={saving}
          maxWidth="sm"
        >
          <div className="space-y-6 py-2">
            <FormField
              id="nama"
              label="Nama Kategori"
              placeholder="Contoh: Tugas, Ulangan Harian, UAS"
              value={form.nama}
              onChange={v => setForm(f => ({ ...f, nama: v }))}
              required
            />
            <div className="space-y-2">
              <FormField
                id="bobot"
                label="Bobot Persentase (%)"
                type="number"
                placeholder="0-100"
                value={String(form.bobot)}
                onChange={v => setForm(f => ({ ...f, bobot: Number(v) }))}
                required
              />
              <p className="text-[10px] text-muted-foreground italic px-1">
                Bobot ini akan digunakan sebagai pengali dalam perhitungan nilai akhir rapor.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
