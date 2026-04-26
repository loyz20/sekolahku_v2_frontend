import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Calendar, 
  User, 
  Clock, 
  Lock, 
  FileText,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Eye,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Edit2
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { Modal } from '@/components/shared/Modal';
import { FilterBar } from '@/components/shared/FilterBar';
import { FormField } from '@/components/shared/FormField';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { PageHero } from '@/components/shared/PageHero';
import { showToast } from '@/lib/toast-utils';
import { format } from "date-fns";
import { id } from "date-fns/locale";
import * as XLSX from 'xlsx';

interface BimbinganRecord {
  id: string;
  peserta_didik_id: string;
  nama_siswa: string;
  guru_bk_id: string;
  nama_guru: string;
  tanggal: string;
  masalah: string;
  tindakan: string;
  catatan: string;
  is_private: boolean;
  created_at: string;
}

interface Siswa { id: string; nama: string; }
interface Guru { id: string; nama: string; }

interface BimbinganFormData {
  peserta_didik_id: string;
  guru_bk_id: string;
  tanggal: string;
  masalah: string;
  tindakan: string;
  catatan: string;
  is_private: boolean;
}

const EMPTY_FORM: BimbinganFormData = {
  peserta_didik_id: '',
  guru_bk_id: '',
  tanggal: format(new Date(), 'yyyy-MM-dd'),
  masalah: '',
  tindakan: '',
  catatan: '',
  is_private: true
};

export default function BimbinganKonselingPage() {
  const [records, setRecords] = useState<BimbinganRecord[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BimbinganRecord | null>(null);
  const [viewTarget, setViewTarget] = useState<BimbinganRecord | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<any>('/bimbingan-konseling');
      setRecords(response.data);
    } catch (error) {
      showToast.error("Gagal memuat data bimbingan");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDependencies = useCallback(async () => {
    try {
      const [sRes, gRes] = await Promise.all([
        api.get<any>('/siswa?limit=1000'),
        api.get<any>('/ptk?limit=1000') 
      ]);
      setSiswaList(sRes.data.items || (Array.isArray(sRes.data) ? sRes.data : []));
      setGuruList(gRes.data.items || (Array.isArray(gRes.data) ? gRes.data : []));
    } catch (error) {
      console.error("Gagal memuat data dependencies", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchDependencies();
  }, [fetchData, fetchDependencies]);

  const handleSubmit = async () => {
    if (!formData.peserta_didik_id || !formData.masalah) {
      showToast.error("Mohon lengkapi data wajib (Siswa & Masalah)");
      return;
    }

    setSaving(true);
    try {
      if (editTarget) {
        await api.patch(`/bimbingan-konseling/${editTarget.id}`, formData);
        showToast.success("Catatan konseling berhasil diperbarui");
      } else {
        await api.post('/bimbingan-konseling', formData);
        showToast.success("Catatan konseling berhasil ditambahkan");
      }
      setModalOpen(false);
      setEditTarget(null);
      setFormData(EMPTY_FORM);
      fetchData();
    } catch (error) {
      showToast.error("Gagal menyimpan data");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus catatan ini?")) return;
    try {
      await api.delete(`/bimbingan-konseling/${id}`);
      showToast.success("Catatan berhasil dihapus");
      fetchData();
    } catch (error) {
      showToast.error("Gagal menghapus data");
    }
  };

  const handleExport = () => {
    if (records.length === 0) {
      showToast.error('Tidak ada data untuk diexport');
      return;
    }

    const dataToExport = records.map(r => ({
      'Tanggal': format(new Date(r.tanggal), 'dd/MM/yyyy'),
      'Nama Siswa': r.nama_siswa,
      'Konselor': r.nama_guru,
      'Masalah': r.masalah,
      'Tindakan': r.tindakan,
      'Catatan': r.catatan,
      'Privasi': r.is_private ? 'Private' : 'Public'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BK Records');
    XLSX.writeFile(wb, `BK_Konseling_${new Date().getTime()}.xlsx`);
    showToast.success('Berhasil export ke Excel');
  };

  const openAdd = () => {
    setEditTarget(null);
    setFormData(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (record: BimbinganRecord) => {
    setEditTarget(record);
    setFormData({
      peserta_didik_id: record.peserta_didik_id,
      guru_bk_id: record.guru_bk_id,
      tanggal: record.tanggal.split('T')[0],
      masalah: record.masalah,
      tindakan: record.tindakan,
      catatan: record.catatan,
      is_private: !!record.is_private
    });
    setModalOpen(true);
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchSearch = r.nama_siswa.toLowerCase().includes(search.toLowerCase()) ||
                          r.masalah.toLowerCase().includes(search.toLowerCase());
      const matchPrivate = filterType === 'private' ? r.is_private : filterType === 'public' ? !r.is_private : true;
      return matchSearch && matchPrivate;
    });
  }, [records, search, filterType]);

  const stats = useMemo(() => ({
    total: records.length,
    private: records.filter(r => r.is_private).length,
    public: records.filter(r => !r.is_private).length,
    today: records.filter(r => format(new Date(r.tanggal), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length
  }), [records]);

  const columns = [
    {
      header: 'Tanggal & Siswa',
      render: (r: BimbinganRecord) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-violet-400" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-foreground">{r.nama_siswa}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
              {format(new Date(r.tanggal), 'dd MMM yyyy', { locale: id })}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Permasalahan',
      render: (r: BimbinganRecord) => (
        <div className="max-w-[300px]">
          <p className="text-sm line-clamp-1 text-muted-foreground group-hover:text-foreground transition-colors italic">"{r.masalah}"</p>
        </div>
      )
    },
    {
      header: 'Konselor',
      render: (r: BimbinganRecord) => (
        <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 bg-sky-500/5 px-2.5 py-1 rounded-lg border border-sky-500/10 w-fit">
          <ShieldCheck className="w-3 h-3" />{r.nama_guru}
        </div>
      )
    },
    {
      header: 'Akses',
      render: (r: BimbinganRecord) => r.is_private ? (
        <div className="flex items-center gap-1.5 text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20 w-fit">
          <Lock className="w-3 h-3" />
          <span className="text-[9px] font-black uppercase tracking-tighter">Private</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 w-fit">
          <Eye className="w-3 h-3" />
          <span className="text-[9px] font-black uppercase tracking-tighter">Public</span>
        </div>
      )
    },
    {
      header: 'Aksi',
      align: 'right' as const,
      render: (r: BimbinganRecord) => (
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-violet-500/10 text-violet-400" onClick={() => setViewTarget(r)}>
            <FileText className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 text-primary" onClick={() => openEdit(r)}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 text-destructive" onClick={() => handleDelete(r.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="w-full p-6 space-y-8 mx-auto animate-in fade-in duration-700 max-w-7xl">
      {/* Header Section */}
      <PageHero
        title="KONSELING SISWA"
        description="Ruang aman untuk mencatat bimbingan, curhat, dan pembinaan perkembangan siswa."
        icon={<HeartHandshake className="w-5 h-5" />}
        variant="violet"
        breadcrumb="Kesiswaan / BK & Konseling"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard icon={<FileText className="w-5 h-5" />} label="Total Catatan" value={stats.total} color="violet" />
        <StatsCard icon={<Calendar className="w-5 h-5" />} label="Sesi Hari Ini" value={stats.today} color="sky" />
        <StatsCard icon={<Lock className="w-5 h-5" />} label="Private" value={stats.private} color="rose" />
        <StatsCard icon={<Eye className="w-5 h-5" />} label="Public" value={stats.public} color="emerald" />
      </div>

      {/* Main Table Area */}
      <div className="space-y-6">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari nama siswa atau masalah..."
          onAdd={openAdd}
          onExport={handleExport}
          addTooltip="Catat Sesi Konseling"
          exportTooltip="Export Laporan BK"
          filters={[
            {
              label: 'Privasi',
              value: filterType,
              onChange: setFilterType,
              options: [
                { label: 'Semua Akses', value: '' },
                { label: 'Private (Rahasia)', value: 'private' },
                { label: 'Public', value: 'public' },
              ]
            }
          ]}
        />

        <div className="rounded-[2.5rem] bg-zinc-900/40 border border-white/5 backdrop-blur-sm overflow-hidden shadow-2xl">
          <DataTable
            columns={columns}
            data={filteredRecords}
            loading={loading}
            selectable
            selectedIds={selectedIds}
            onSelectionChange={ids => setSelectedIds(ids as string[])}
          />
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editTarget ? "Edit Catatan Konseling" : "Catat Sesi Konseling Baru"}
          description="Informasi bimbingan bersifat rahasia dan humanis."
          onSubmit={handleSubmit}
          saving={saving}
          maxWidth="3xl"
        >
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SearchableSelect 
                id="siswa" 
                label="Siswa Terkait" 
                placeholder="Pilih Siswa..."
                value={formData.peserta_didik_id} 
                onChange={(val) => setFormData({...formData, peserta_didik_id: val})}
                options={siswaList.map(s => ({ value: s.id, label: s.nama }))}
                required 
              />
              <SearchableSelect 
                id="guru" 
                label="Guru BK / Konselor" 
                placeholder="Pilih Konselor (Opsional)"
                value={formData.guru_bk_id} 
                onChange={(val) => setFormData({...formData, guru_bk_id: val})}
                options={guruList.map(g => ({ value: g.id, label: g.nama }))}
              />
              <FormField 
                id="tanggal" 
                label="Tanggal Konseling" 
                type="date" 
                value={formData.tanggal} 
                onChange={(val) => setFormData({...formData, tanggal: val})}
                required 
              />
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Pengaturan Privasi</label>
                <div className="flex gap-4 p-2 bg-white/5 rounded-2xl border border-white/5">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, is_private: true})}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all ${formData.is_private ? 'bg-rose-500 text-white shadow-lg shadow-rose-900/20' : 'text-muted-foreground hover:bg-white/5'}`}
                  >
                    <Lock className="w-3.5 h-3.5" /> <span className="text-[10px] font-black uppercase">Private</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, is_private: false})}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all ${!formData.is_private ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/20' : 'text-muted-foreground hover:bg-white/5'}`}
                  >
                    <Eye className="w-3.5 h-3.5" /> <span className="text-[10px] font-black uppercase">Public</span>
                  </button>
                </div>
              </div>
            </div>

            <FormField 
              id="masalah" 
              label="Masalah / Keluhan Siswa" 
              type="textarea" 
              placeholder="Jelaskan apa yang sedang dihadapi atau dicurhatkan siswa..."
              value={formData.masalah} 
              onChange={(val) => setFormData({...formData, masalah: val})}
              required 
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
              <FormField 
                id="tindakan" 
                label="Tindakan / Solusi" 
                type="textarea" 
                placeholder="Langkah atau solusi yang diberikan saat konseling..."
                value={formData.tindakan} 
                onChange={(val) => setFormData({...formData, tindakan: val})}
              />
              <FormField 
                id="catatan" 
                label="Catatan Tambahan" 
                type="textarea" 
                placeholder="Rencana tindak lanjut atau pemantauan ke depan..."
                value={formData.catatan} 
                onChange={(val) => setFormData({...formData, catatan: val})}
              />
            </div>

            <div className="p-4 rounded-2xl bg-violet-500/5 border border-violet-500/10 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-violet-400" />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-black text-violet-200 uppercase tracking-tight">Prinsip Kerahasiaan</p>
                <p className="text-[10px] text-violet-200/60 leading-relaxed font-medium">
                  Hanya personil Bimbingan Konseling dan Admin yang dapat melihat detail catatan privat ini demi kenyamanan siswa.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* View Detail Modal */}
      {viewTarget && (
        <Modal
          isOpen={!!viewTarget}
          onClose={() => setViewTarget(null)}
          title="Detail Sesi Konseling"
          description={`Arsip digital bimbingan pada ${format(new Date(viewTarget.tanggal), 'dd MMMM yyyy', { locale: id })}`}
          icon={<FileText className="w-5 h-5 text-violet-400" />}
          maxWidth="2xl"
          submitLabel="Edit Catatan"
          onSubmit={() => {
            const t = viewTarget;
            setViewTarget(null);
            openEdit(t);
          }}
        >
          <div className="space-y-8">
            <div className="flex items-center justify-between p-5 rounded-[2rem] bg-white/5 border border-white/5 shadow-inner">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-3xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center font-black text-xl text-violet-400">
                  {viewTarget.nama_siswa.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-lg text-foreground uppercase tracking-tight">{viewTarget.nama_siswa}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-400" /> {viewTarget.nama_guru}
                  </div>
                </div>
              </div>
              <div className={`px-4 py-1.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest ${viewTarget.is_private ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'}`}>
                {viewTarget.is_private ? 'Private' : 'Public'}
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 w-fit">
                  <AlertCircle className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-violet-400">Masalah / Keluhan</span>
                </div>
                <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 text-sm text-foreground leading-relaxed italic">
                  "{viewTarget.masalah}"
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Tindakan</span>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-muted-foreground leading-relaxed min-h-[100px]">
                    {viewTarget.tindakan || 'Tidak ada catatan tindakan.'}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 w-fit">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Catatan/RTL</span>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-muted-foreground leading-relaxed min-h-[100px]">
                    {viewTarget.catatan || 'Tidak ada rencana tindak lanjut.'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StatsCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number | string, color: string }) {
  const colorMap: any = {
    violet: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    sky: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
  };

  return (
    <div className={`p-6 rounded-[2.5rem] border ${colorMap[color]} backdrop-blur-sm space-y-4 hover:scale-[1.02] transition-transform duration-300 group relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-3xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
      <div className="flex items-center gap-3 relative">
        <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/5 shadow-inner">
          {icon}
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{label}</span>
      </div>
      <div className="text-4xl font-black tracking-tighter relative">{typeof value === 'number' ? value.toLocaleString() : value}</div>
    </div>
  );
}
