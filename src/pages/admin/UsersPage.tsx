import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { 
  UserCog, 
  Edit2, 
  Trash2, 
  ShieldCheck, 
  GraduationCap, 
  Users, 
  User, 
  Key,
  Building2,
  UserCheck,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { Modal } from '@/components/shared/Modal';
import { FilterBar } from '@/components/shared/FilterBar';
import { FormField } from '@/components/shared/FormField';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { PageHero } from '@/components/shared/PageHero';
import { showToast } from '@/lib/toast-utils';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface Sekolah { id: string; nama: string; }
interface PTK { id: string; nama: string; }
interface Siswa { id: string; nama: string; }

interface UserItem {
  id: string;
  sekolah_id?: string;
  username: string;
  role: 'superadmin' | 'admin' | 'guru' | 'guru_bk' | 'siswa' | 'orang_tua';
  ref_id?: string;
  created_at: string;
  nama_sekolah?: string;
  nama_asli?: string;
}

interface UserStats {
  total: number;
  byRole: Record<string, number>;
}

const EMPTY_FORM = { 
  username: '', 
  password: '', 
  role: 'admin' as UserItem['role'], 
  sekolah_id: '', 
  ref_id: '' 
};

export default function UsersPage() {
  const { user: actor } = useAuth();
  const [items, setItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 });
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [stats, setStats] = useState<UserStats | null>(null);
  const [sekolahs, setSekolahs] = useState<Sekolah[]>([]);
  const [ptks, setPtks] = useState<PTK[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get<any>(`/user?page=${page}&limit=10&search=${search}`);
      setItems(res.data.items);
      setPagination(res.data.pagination);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [search]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get<any>('/user/stats');
      setStats(res.data);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { 
    fetchData(1); 
    fetchStats();
  }, [fetchData, fetchStats]);
  
  useEffect(() => {
    if (actor?.role === 'superadmin') {
      api.get<any>('/sekolah?limit=500').then(res => setSekolahs(res.data.items || [])).catch(console.error);
    }
  }, [actor]);

  // Fetch References based on role
  useEffect(() => {
    const sid = actor?.role === 'admin' ? actor.sekolah_id : form.sekolah_id;
    if (!sid && form.role !== 'superadmin') return;

    if (form.role === 'guru' || form.role === 'guru_bk') {
      api.get<any>(`/ptk?sekolah_id=${sid}&limit=1000`).then(res => setPtks(res.data.items || res.data || [])).catch(console.error);
    } else if (form.role === 'siswa') {
      api.get<any>(`/siswa?sekolah_id=${sid}&limit=1000`).then(res => setSiswaList(res.data.items || res.data || [])).catch(console.error);
    }
  }, [form.role, form.sekolah_id, actor]);

  const openAdd = () => { 
    setEditTarget(null); 
    setForm({ ...EMPTY_FORM, sekolah_id: actor?.role === 'admin' ? (actor.sekolah_id || '') : '' }); 
    setFormError(''); 
    setModalOpen(true); 
  };

  const openEdit = (u: UserItem) => {
    setEditTarget(u);
    setForm({ 
      username: u.username, 
      password: '', 
      role: u.role, 
      sekolah_id: u.sekolah_id || '',
      ref_id: u.ref_id || '' 
    });
    setFormError(''); setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.username || (!editTarget && !form.password)) { 
      setFormError('Username dan password wajib diisi.'); 
      return; 
    }
    setSaving(true); setFormError('');
    try {
      if (editTarget) await api.put(`/user/${editTarget.id}`, form);
      else await api.post('/user', form);
      showToast.success(editTarget ? 'Pengguna diperbarui' : 'Pengguna baru ditambahkan');
      setModalOpen(false); 
      fetchData(pagination.page);
      fetchStats();
    } catch (e: any) { setFormError(e.message || 'Terjadi kesalahan.'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus pengguna ini? Semua hak akses akan dicabut.')) return;
    try { 
      await api.delete(`/user/${id}`); 
      showToast.success('Pengguna berhasil dihapus');
      fetchData(pagination.page); 
      fetchStats();
    } catch (e) { console.error(e); }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Hapus ${selectedIds.length} pengguna terpilih? Semua hak akses akan dicabut.`)) return;
    
    setLoading(true);
    try {
      for (const id of selectedIds) {
        await api.delete(`/user/${id}`);
      }
      showToast.success(`Berhasil menghapus ${selectedIds.length} pengguna`);
      setSelectedIds([]);
      fetchData(1);
      fetchStats();
    } catch (e) {
      showToast.error("Gagal menghapus beberapa akun");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (items.length === 0) {
      showToast.error('Tidak ada data untuk di-export');
      return;
    }

    const dataToExport = items.map(u => ({
      'Username': u.username,
      'Nama Asli': u.nama_asli,
      'Role': u.role.toUpperCase(),
      'Sekolah': u.nama_sekolah || (u.role === 'superadmin' ? 'Global' : '-'),
      'Dibuat Pada': format(new Date(u.created_at), 'dd/MM/yyyy HH:mm')
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, `Users_Export_${new Date().getTime()}.xlsx`);
    showToast.success('Berhasil export ke Excel');
  };

  const roleMeta = {
    superadmin: { icon: ShieldAlert, color: 'text-rose-400', bg: 'bg-rose-500/10', label: 'SUPER ADMIN' },
    admin: { icon: ShieldCheck, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'ADMIN SEKOLAH' },
    guru: { icon: GraduationCap, color: 'text-violet-400', bg: 'bg-violet-500/10', label: 'GURU / PTK' },
    guru_bk: { icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'GURU BK' },
    siswa: { icon: Users, color: 'text-sky-400', bg: 'bg-sky-500/10', label: 'SISWA' },
    orang_tua: { icon: User, color: 'text-pink-400', bg: 'bg-pink-500/10', label: 'WALI MURID' },
  };

  const columns = [
    {
      header: 'Identitas Akun', render: (u: UserItem) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 shadow-inner ${roleMeta[u.role]?.bg || 'bg-white/5'}`}>
            <UserCog className={`w-5 h-5 ${roleMeta[u.role]?.color || 'text-muted-foreground'}`} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-foreground tracking-tight">{u.username}</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">
              ID: {u.id.split('-')[0]}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Nama Asli / Pemilik', render: (u: UserItem) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-foreground/90">{u.nama_asli || '-'}</span>
          <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter opacity-50">Identity Linked</span>
        </div>
      )
    },
    {
      header: 'Role / Akses', render: (u: UserItem) => {
        const meta = roleMeta[u.role] || roleMeta.siswa;
        return (
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-white/5 shadow-sm ${meta.bg}`}>
            <meta.icon className={`w-3.5 h-3.5 ${meta.color}`} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${meta.color}`}>{meta.label}</span>
          </div>
        );
      }
    },
    {
      header: 'Sekolah Afiliasi', render: (u: UserItem) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-muted-foreground/40" />
          <span className="text-xs font-semibold text-muted-foreground">
            {u.nama_sekolah || (u.role === 'superadmin' ? 'GLOBAL ACCESS' : 'TANPA SEKOLAH')}
          </span>
        </div>
      )
    },
    {
      header: 'Aksi', align: 'right' as const, render: (u: UserItem) => (
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-amber-500/10 text-amber-400" onClick={() => openEdit(u)} title="Edit Account">
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 text-destructive" onClick={() => handleDelete(u.id)} title="Revoke Access">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )
    }
  ];
  const filteredRoles = actor?.role === 'superadmin'
    ? ['superadmin', 'admin']
    : ['admin', 'guru', 'guru_bk', 'siswa', 'orang_tua'];

  return (
    <div className="w-full p-6 space-y-8 mx-auto animate-in fade-in duration-700">
      <PageHero
        title="Manajemen Pengguna"
        description="Kelola akun, reset password, dan kontrol hak akses sistem secara terpusat"
        icon={<UserCog className="w-5 h-5" />}
        variant="amber"
        breadcrumb="Sistem / Manajemen Pengguna"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard icon={<Users className="w-5 h-5 text-amber-400" />} label="Total Akun" value={stats?.total || 0} color="amber" />
        <StatsCard icon={<ShieldAlert className="w-5 h-5 text-rose-400" />} label="Admin Sistem" value={stats?.byRole?.admin || 0} color="rose" />
        <StatsCard icon={<GraduationCap className="w-5 h-5 text-violet-400" />} label="Akun Guru" value={stats?.byRole?.guru || 0} color="violet" />
        <StatsCard icon={<UserCheck className="w-5 h-5 text-sky-400" />} label="Akun Siswa" value={stats?.byRole?.siswa || 0} color="sky" />
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari username atau nama..."
          selectedCount={selectedIds.length}
          onBulkDelete={handleBulkDelete}
          onExport={handleExport}
          onAdd={openAdd}
          addTooltip="Tambah Pengguna Baru"
          exportTooltip="Export Data Pengguna"
        />

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

      {/* Modal Form */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          title={editTarget ? 'Konfigurasi Akun' : 'Daftarkan Akun Baru'}
          description="Atur kredensial login dan kaitkan dengan identitas personil sekolah"
          icon={<UserCog className="w-5 h-5 text-amber-400" />}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSave}
          saving={saving}
          maxWidth="md"
        >
          <div className="space-y-6">
            {formError && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold animate-in fade-in zoom-in duration-300">
                <ShieldAlert className="w-4 h-4 shrink-0" />{formError}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField id="username" label="Username Login" placeholder="e.g. admin.sekolah" value={form.username} onChange={v => setForm(f => ({ ...f, username: v }))} required />
                <FormField 
                  id="password" 
                  label={editTarget ? "Reset Password" : "Password Login"} 
                  type="password" 
                  placeholder={editTarget ? "Isi untuk ganti..." : "*******"}
                  value={form.password} 
                  onChange={v => setForm(f => ({ ...f, password: v }))} 
                  required={!editTarget} 
                />
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-4">
                <div className="flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Otoritas & Afiliasi</span>
                </div>
                
                <FormField id="role" label="Tingkat Akses (Role)" type="select" value={form.role} onChange={v => setForm(f => ({ ...f, role: v as any, ref_id: '' }))}
                  options={filteredRoles.map(r => ({ value: r, label: r.toUpperCase() }))} required />

                {form.role !== 'superadmin' && actor?.role === 'superadmin' && (
                  <SearchableSelect 
                    id="sekolah" 
                    label="Sekolah Terkait" 
                    placeholder="Pilih Sekolah..." 
                    value={form.sekolah_id} 
                    onChange={v => setForm(f => ({ ...f, sekolah_id: v }))}
                    options={sekolahs.map(s => ({ value: s.id, label: s.nama }))} 
                    required 
                  />
                )}

                {(form.role === 'guru' || form.role === 'guru_bk') && (
                  <SearchableSelect 
                    id="ref_id" 
                    label={`Kaitkan ke Data ${form.role === 'guru_bk' ? 'Guru BK' : 'Guru'} (PTK)`} 
                    placeholder="Cari Personil..." 
                    value={form.ref_id} 
                    onChange={v => setForm(f => ({ ...f, ref_id: v }))}
                    options={ptks.map(p => ({ value: p.id, label: p.nama }))} 
                    required 
                  />
                )}

                {form.role === 'siswa' && (
                  <SearchableSelect 
                    id="ref_id" 
                    label="Kaitkan ke Data Siswa" 
                    placeholder="Cari Siswa..." 
                    value={form.ref_id} 
                    onChange={v => setForm(f => ({ ...f, ref_id: v }))}
                    options={siswaList.map(s => ({ value: s.id, label: s.nama }))} 
                    required 
                  />
                )}
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 opacity-60 hover:opacity-100 transition-opacity">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed text-muted-foreground font-medium uppercase tracking-tight">
                  Akun yang terhubung dengan data personil akan secara otomatis sinkronisasi profil dan data akademik terkait.
                </p>
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
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    violet: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
    sky: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
  };

  return (
    <div className={`p-6 rounded-3xl border ${colorMap[color]} backdrop-blur-sm space-y-4 hover:scale-[1.02] transition-all duration-300 group relative overflow-hidden shadow-lg`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-3xl -mr-12 -mt-12 group-hover:bg-white/10 transition-colors" />
      <div className="flex items-center gap-3 relative">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{label}</span>
      </div>
      <div className="text-3xl font-black tracking-tighter relative group-hover:translate-x-1 transition-transform">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
    </div>
  );
}
