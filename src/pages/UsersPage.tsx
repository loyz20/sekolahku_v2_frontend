import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { UserCog, AlertTriangle, Plus, Edit2, Trash2, ShieldCheck, GraduationCap, Users, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { Modal } from '@/components/shared/Modal';
import { FormField } from '@/components/shared/FormField';

interface Sekolah { id: string; nama: string; }
interface UserItem {
  id: string;
  sekolah_id?: string;
  username: string;
  role: 'superadmin' | 'admin' | 'guru' | 'siswa' | 'orang_tua';
  created_at: string;
  nama_sekolah?: string;
}

const EMPTY_FORM = { username: '', password: '', role: 'admin' as UserItem['role'], sekolah_id: '' };

export default function UsersPage() {
  const { user: actor } = useAuth();
  const [items, setItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 });
  const [search, setSearch] = useState('');
  const [sekolahs, setSekolahs] = useState<Sekolah[]>([]);

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

  useEffect(() => { fetchData(1); }, [fetchData]);
  useEffect(() => {
    api.get<any>('/sekolah?limit=100').then(res => setSekolahs(res.data.items)).catch(console.error);
  }, []);

  const openAdd = () => { setEditTarget(null); setForm(EMPTY_FORM); setFormError(''); setModalOpen(true); };
  const openEdit = (u: UserItem) => {
    setEditTarget(u);
    setForm({ username: u.username, password: '', role: u.role, sekolah_id: u.sekolah_id || '' });
    setFormError(''); setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.username || (!editTarget && !form.password)) { setFormError('Username dan password wajib diisi.'); return; }
    setSaving(true); setFormError('');
    try {
      if (editTarget) await api.put(`/user/${editTarget.id}`, form);
      else await api.post('/user', form);
      setModalOpen(false); fetchData(pagination.page);
    } catch (e: any) { setFormError(e.message || 'Terjadi kesalahan.'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus pengguna ini?')) return;
    try { await api.delete(`/user/${id}`); fetchData(pagination.page); } catch (e) { console.error(e); }
  };

  const roleMeta = {
    superadmin: { icon: ShieldCheck, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    admin: { icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    guru: { icon: GraduationCap, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    siswa: { icon: Users, color: 'text-sky-400', bg: 'bg-sky-500/10' },
    orang_tua: { icon: User, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  };

  const columns = [
    {
      header: 'Username', render: (u: UserItem) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
            <UserCog className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-bold text-foreground">{u.username}</span>
        </div>
      )
    },
    {
      header: 'Role', render: (u: UserItem) => {
        const meta = roleMeta[u.role] || roleMeta.siswa;
        return (
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-white/5 ${meta.bg}`}>
            <meta.icon className={`w-3 h-3 ${meta.color}`} />
            <span className={`text-[10px] font-black uppercase tracking-wider ${meta.color}`}>{u.role}</span>
          </div>
        );
      }
    },
    {
      header: 'Sekolah', render: (u: UserItem) => (
        <span className="text-xs font-medium text-muted-foreground">{u.nama_sekolah || (u.role === 'superadmin' ? 'Global Access' : '-')}</span>
      )
    },
    {
      header: 'Aksi', align: 'right' as const, render: (u: UserItem) => (
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={() => openEdit(u)}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" onClick={() => handleDelete(u.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )
    }
  ];

  const filteredRoles = actor?.role === 'superadmin'
    ? ['superadmin', 'admin']
    : ['admin', 'guru', 'siswa', 'orang_tua'];

  return (
    <div className="w-full p-6 space-y-6 mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
              <UserCog className="w-5 h-5 text-primary" />
            </div>
            DATA PENGGUNA
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manajemen akun dan hak akses sistem</p>
        </div>
        <Button onClick={openAdd} className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> Tambah Pengguna
        </Button>
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
          title={editTarget ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
          description="Kelola kredensial dan hak akses pengguna"
          icon={<UserCog className="w-5 h-5" />}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSave}
          saving={saving}
          maxWidth="md"
        >
          <div className="space-y-5">
            {formError && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/15 border border-destructive/25 text-destructive text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />{formError}
              </div>
            )}

            <div className="space-y-4">
              <FormField id="username" label="Username" value={form.username} onChange={v => setForm(f => ({ ...f, username: v }))} required />
              <FormField id="password" label={editTarget ? "Password Baru (Kosongkan jika tidak ganti)" : "Password"} type="password" value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} required={!editTarget} />

              <FormField id="role" label="Hak Akses / Role" type="select" value={form.role} onChange={v => setForm(f => ({ ...f, role: v }))}
                options={filteredRoles.map(r => ({ value: r, label: r.toUpperCase() }))} required />

              {form.role !== 'superadmin' && (
                <FormField id="sekolah" label="Sekolah" type="select" placeholder="-- Pilih Sekolah --" value={form.sekolah_id} onChange={v => setForm(f => ({ ...f, sekolah_id: v }))}
                  options={sekolahs.map(s => ({ value: s.id, label: s.nama }))} required />
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
