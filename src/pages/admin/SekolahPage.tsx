import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { 
  Building2, 
  AlertTriangle, 
  Plus, 
  Edit2, 
  Trash2, 
  Hash, 
  MapPin, 
  ShieldCheck, 
  Copy, 
  Check, 
  School,
  Landmark,
  Map,
  Search,
  Download,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { Modal } from '@/components/shared/Modal';
import { FormField } from '@/components/shared/FormField';
import { PageHero } from '@/components/shared/PageHero';
import { showToast } from '@/lib/toast-utils';
import * as XLSX from 'xlsx';

// ─── Types ──────────────────────────────────────────────────────────────────
interface Sekolah {
  id: string;
  nama: string;
  npsn: string;
  status: 'Negeri' | 'Swasta';
  alamat: string;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  desa: string;
  kode_pos: string;
  lintang: number;
  bujur: number;
}

interface SekolahStats {
  total: number;
  negeri: number;
  swasta: number;
}

const EMPTY_FORM = {
  nama: '', npsn: '', status: 'Negeri' as 'Negeri' | 'Swasta',
  alamat: '', provinsi: '', kabupaten: '', kecamatan: '', desa: '', kode_pos: '',
  lintang: 0, bujur: 0
};

// ─── Stats Card Component ──────────────────────────────────────────────────
function StatsCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) {
  const colorMap: Record<string, string> = {
    indigo: 'from-indigo-500/20 to-indigo-500/5 text-indigo-400 border-indigo-500/20',
    sky: 'from-sky-500/20 to-sky-500/5 text-sky-400 border-sky-500/20',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20',
  };

  return (
    <div className={`p-6 rounded-3xl border bg-gradient-to-br ${colorMap[color] || colorMap.indigo} backdrop-blur-sm shadow-xl`}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-black/20 flex items-center justify-center border border-white/5 shadow-inner">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{label}</p>
          <p className="text-2xl font-black tracking-tight">{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

export default function SekolahPage() {
  const [items, setItems] = useState<Sekolah[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Negeri' | 'Swasta'>('All');
  
  const [stats, setStats] = useState<SekolahStats | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Sekolah | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Sekolah | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState('');
  const [adminCredentials, setAdminCredentials] = useState<{ username: string; password: string; warning?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const statusParam = statusFilter !== 'All' ? `&status=${statusFilter}` : '';
      const res = await api.get<any>(`/sekolah?page=${page}&limit=10&search=${search}${statusParam}`);
      setItems(res.data.items);
      setPagination(res.data.pagination);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [search, statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get<any>('/sekolah/stats');
      setStats(res.data);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { 
    fetchData(1); 
    fetchStats();
  }, [fetchData, fetchStats]);

  const openAdd = () => { setEditTarget(null); setForm(EMPTY_FORM); setFormError(''); setModalOpen(true); };
  const openEdit = (s: Sekolah) => {
    setEditTarget(s);
    setForm({ ...s });
    setFormError(''); setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.nama || !form.npsn) { setFormError('Nama dan NPSN wajib diisi.'); return; }
    setSaving(true); setFormError('');
    try {
      if (editTarget) {
        await api.put(`/sekolah/${editTarget.id}`, form);
        showToast.success('Data sekolah berhasil diperbarui');
      } else {
        const res = await api.post<any>('/sekolah', form);
        const data = res.data;
        if (data.admin_user) {
          setAdminCredentials({
            username: data.admin_user.username,
            password: data.admin_user.default_password,
          });
        } else if (data.admin_warning) {
          setAdminCredentials({ username: '', password: '', warning: data.admin_warning });
        }
        showToast.success('Sekolah baru berhasil ditambahkan');
      }
      setModalOpen(false); 
      fetchData(pagination.page);
      fetchStats();
    } catch (e: any) { setFormError(e.message || 'Terjadi kesalahan.'); } finally { setSaving(false); }
  };

  const copyCredentials = () => {
    if (!adminCredentials) return;
    const text = `Username: ${adminCredentials.username}\nPassword: ${adminCredentials.password}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/sekolah/${deleteTarget.id}`);
      showToast.success('Sekolah berhasil dihapus');
      setDeleteTarget(null);
      fetchData(pagination.page);
      fetchStats();
    } catch (e) { console.error(e); } finally { setDeleting(false); }
  };

  const handleExport = () => {
    if (items.length === 0) { showToast.error('Tidak ada data untuk di-export'); return; }
    const dataToExport = items.map(s => ({
      'Nama Sekolah': s.nama,
      'NPSN': s.npsn,
      'Status': s.status,
      'Alamat': s.alamat,
      'Desa': s.desa,
      'Kecamatan': s.kecamatan,
      'Kota/Kab': s.kabupaten,
      'Provinsi': s.provinsi,
      'Kode Pos': s.kode_pos
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sekolah');
    XLSX.writeFile(wb, `Data_Sekolah_${new Date().getTime()}.xlsx`);
    showToast.success('Data berhasil di-export ke Excel');
  };

  const columns = [
    {
      header: 'Institusi', render: (s: Sekolah) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground tracking-tight leading-tight">{s.nama}</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 flex items-center gap-1">
                <Hash className="w-2.5 h-2.5" /> {s.npsn}
              </span>
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Status', render: (s: Sekolah) => (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border font-bold text-[10px] tracking-widest uppercase ${
          s.status === 'Negeri' 
            ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' 
            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        }`}>
          {s.status === 'Negeri' ? <Landmark className="w-3 h-3" /> : <School className="w-3 h-3" />}
          {s.status}
        </div>
      )
    },
    {
      header: 'Wilayah & Alamat', render: (s: Sekolah) => (
        <div className="flex items-start gap-2 max-w-[280px]">
          <MapPin className="w-3.5 h-3.5 mt-0.5 text-muted-foreground/50 shrink-0" />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-foreground/80 font-medium line-clamp-1">{s.alamat}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter opacity-70">
              {s.desa}, {s.kecamatan}, {s.kabupaten}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Geo', render: (s: Sekolah) => (
        <div className="flex items-center gap-2">
          {(s.lintang && s.bujur) ? (
            <a 
              href={`https://www.google.com/maps?q=${s.lintang},${s.bujur}`} 
              target="_blank" 
              rel="noreferrer"
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 hover:border-primary/20 transition-all"
              title="Lihat di Maps"
            >
              <Map className="w-4 h-4" />
            </a>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-white/2 border border-white/5 flex items-center justify-center text-muted-foreground/30 italic text-[10px]">
              N/A
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Aksi', align: 'right' as const, render: (s: Sekolah) => (
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-500/10 text-indigo-400" onClick={() => openEdit(s)}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-rose-500/10 text-rose-400" onClick={() => setDeleteTarget(s)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="w-full p-6 space-y-8 mx-auto animate-in fade-in duration-700">
      <PageHero
        title="DATA SEKOLAH"
        description="Manajemen multi-tenant dan registrasi institusi pendidikan"
        icon={<Building2 className="w-5 h-5" />}
        variant="indigo"
        breadcrumb="Sistem / Data Institusi"
        actions={
          <>
            <Button variant="outline" onClick={handleExport} className="gap-2 h-11 px-4 border-white/10 bg-white/5 hover:bg-white/10 font-bold uppercase tracking-tight text-xs rounded-xl">
              <Download className="w-4 h-4" /> Export Excel
            </Button>
            <Button onClick={openAdd} className="gap-2 shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 font-bold uppercase tracking-tight text-xs h-11 px-6 rounded-xl">
              <Plus className="w-4 h-4" /> TAMBAH SEKOLAH
            </Button>
          </>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatsCard icon={<Landmark className="w-5 h-5 text-indigo-400" />} label="Total Institusi" value={stats?.total || 0} color="indigo" />
        <StatsCard icon={<School className="w-5 h-5 text-sky-400" />} label="Sekolah Negeri" value={stats?.negeri || 0} color="sky" />
        <StatsCard icon={<Building2 className="w-5 h-5 text-emerald-400" />} label="Sekolah Swasta" value={stats?.swasta || 0} color="emerald" />
      </div>

      {/* Main Content Card */}
      <div className="rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-md p-1 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-indigo-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Cari nama, NPSN, atau wilayah..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-11 pl-11 pr-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:bg-white/[0.08] transition-all"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="h-11 px-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-indigo-500/50 appearance-none min-w-[140px]"
            >
              <option value="All">Semua Status</option>
              <option value="Negeri">Negeri</option>
              <option value="Swasta">Swasta</option>
            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          pagination={pagination}
          onPageChange={p => fetchData(p)}
          hideHeader
        />
      </div>

      {modalOpen && (
        <Modal
          title={editTarget ? 'Perbarui Profil Institusi' : 'Registrasi Sekolah Baru'}
          description="Lengkapi detail profil institusi untuk pendaftaran sistem"
          icon={<Building2 className="w-5 h-5" />}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSave}
          saving={saving}
          maxWidth="2xl"
        >
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {formError && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/15 border border-rose-500/25 text-rose-400 text-sm animate-shake">
                <AlertTriangle className="w-4 h-4 shrink-0" />{formError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <Landmark className="w-3.5 h-3.5 text-indigo-400" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data Utama</p>
                </div>
                <FormField id="nama" label="Nama Sekolah" placeholder="Contoh: SMA Negeri 1 Jakarta" value={form.nama} onChange={v => setForm(f => ({ ...f, nama: v }))} required />
                <FormField id="npsn" label="NPSN" placeholder="8 digit angka unik" value={form.npsn} onChange={v => setForm(f => ({ ...f, npsn: v }))} required />
                <div className="grid grid-cols-2 gap-4">
                  <FormField id="status" label="Status" type="select" value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))}
                    options={[{ value: 'Negeri', label: 'Negeri' }, { value: 'Swasta', label: 'Swasta' }]} />
                  <FormField id="kode_pos" label="Kode Pos" placeholder="12345" value={form.kode_pos} onChange={v => setForm(f => ({ ...f, kode_pos: v }))} />
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lokasi Geografis</p>
                </div>
                <FormField id="alamat" label="Alamat Lengkap" placeholder="Jalan, Blok, No. Rumah" value={form.alamat} onChange={v => setForm(f => ({ ...f, alamat: v }))} required />
                <div className="grid grid-cols-2 gap-4">
                  <FormField id="provinsi" label="Provinsi" placeholder="Jawa Barat" value={form.provinsi} onChange={v => setForm(f => ({ ...f, provinsi: v }))} />
                  <FormField id="kabupaten" label="Kota/Kab" placeholder="Bandung" value={form.kabupaten} onChange={v => setForm(f => ({ ...f, kabupaten: v }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField id="kecamatan" label="Kecamatan" value={form.kecamatan} onChange={v => setForm(f => ({ ...f, kecamatan: v }))} />
                  <FormField id="desa" label="Kelurahan/Desa" value={form.desa} onChange={v => setForm(f => ({ ...f, desa: v }))} />
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-black/20 border border-white/5 space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <Map className="w-3.5 h-3.5 text-indigo-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Koordinat Presisi (Opsional)</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <FormField id="lintang" label="Latitude (Garis Lintang)" type="number" placeholder="-6.123456" value={String(form.lintang)} onChange={v => setForm(f => ({ ...f, lintang: Number(v) }))} />
                <FormField id="bujur" label="Longitude (Garis Bujur)" type="number" placeholder="106.123456" value={String(form.bujur)} onChange={v => setForm(f => ({ ...f, bujur: Number(v) }))} />
              </div>
              <p className="text-[10px] text-muted-foreground italic">Gunakan koordinat dari Google Maps untuk akurasi lokasi yang lebih baik.</p>
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <Modal
          title="Konfirmasi Penghapusan"
          onClose={() => setDeleteTarget(null)}
          onSubmit={handleDelete}
          submitLabel="Hapus Permanen"
          submitVariant="destructive"
          submitDisabled={deleting}
          saving={deleting}
          maxWidth="sm"
        >
          <div className="flex flex-col items-center text-center gap-5 py-4">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-500 shadow-lg shadow-rose-500/10">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                Apakah Anda yakin ingin menghapus <span className="text-rose-400 font-black">{deleteTarget.nama}</span>?
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed px-4">
                Tindakan ini tidak dapat dibatalkan. Seluruh data akademik, akun pengguna, dan riwayat yang terkait dengan sekolah ini akan terhapus.
              </p>
            </div>
          </div>
        </Modal>
      )}

      {adminCredentials && (
        <Modal
          title="Admin Sekolah Terdaftar"
          icon={<ShieldCheck className="w-5 h-5" />}
          onClose={() => { setAdminCredentials(null); setCopied(false); }}
          onSubmit={() => { setAdminCredentials(null); setCopied(false); }}
          submitLabel="Selesai"
          maxWidth="sm"
        >
          <div className="space-y-5 py-2">
            {adminCredentials.warning ? (
              <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400 text-sm italic">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{adminCredentials.warning}</span>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground font-medium">
                  Sistem telah membuat akun administrator default untuk sekolah baru ini. Harap segera salin kredensial berikut:
                </p>
                <div className="rounded-2xl bg-black/40 border border-white/5 p-5 space-y-4 shadow-inner relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Sparkles className="w-12 h-12 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">Access Key (Username)</p>
                    <p className="text-base font-mono font-bold text-indigo-400">{adminCredentials.username}</p>
                  </div>
                  <div className="h-px bg-white/5" />
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">Secret Key (Password)</p>
                    <p className="text-base font-mono font-bold text-emerald-400">{adminCredentials.password}</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full h-12 gap-2 rounded-2xl border-white/10 bg-white/5 hover:bg-indigo-500/10 hover:text-indigo-400 transition-all font-bold" onClick={copyCredentials}>
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'BERHASIL DISALIN' : 'SALIN KREDENSIAL'}
                </Button>
                <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] leading-relaxed">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>Admin wajib memperbarui password ini melalui menu Pengaturan Keamanan setelah login pertama kali.</span>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

