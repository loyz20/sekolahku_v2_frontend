import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { CalendarDays, AlertTriangle, Plus, Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { Modal } from '@/components/shared/Modal';
import { FormField } from '@/components/shared/FormField';
import { PageHero } from '@/components/shared/PageHero';

interface TahunAjaran {
  id: string;
  sekolah_id: string;
  tahun: string;
  aktif: boolean;
  sekolah_nama?: string;
}

const EMPTY_FORM = {
  tahun: '',
  aktif: false
};

export default function TahunAjaranPage() {
  const [items, setItems] = useState<TahunAjaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 });
  const [search, setSearch] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TahunAjaran | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get<any>(`/tahun-ajaran?page=${page}&limit=10&search=${search}`);
      setItems(res.data.items);
      setPagination(res.data.pagination);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchData(1); }, [fetchData]);

  const openAdd = () => { setEditTarget(null); setForm(EMPTY_FORM); setFormError(''); setModalOpen(true); };
  const openEdit = (t: TahunAjaran) => {
    setEditTarget(t);
    setForm({ tahun: t.tahun, aktif: t.aktif });
    setFormError(''); setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.tahun) { setFormError('Tahun ajaran wajib diisi.'); return; }
    if (!/^\d{4}\/\d{4}$/.test(form.tahun)) { setFormError('Format tahun ajaran harus YYYY/YYYY (e.g. 2023/2024).'); return; }
    
    setSaving(true); setFormError('');
    try {
      if (editTarget) await api.put(`/tahun-ajaran/${editTarget.id}`, form);
      else await api.post('/tahun-ajaran', form);
      setModalOpen(false); fetchData(pagination.page);
    } catch (e: any) { setFormError(e.message || 'Terjadi kesalahan.'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus tahun ajaran ini?')) return;
    try { await api.delete(`/tahun-ajaran/${id}`); fetchData(pagination.page); } catch (e) { console.error(e); }
  };

  const columns = [
    { header: 'Tahun Ajaran', render: (t: TahunAjaran) => (
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0">
          <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <span className="font-bold text-foreground">{t.tahun}</span>
      </div>
    )},
    { header: 'Status', render: (t: TahunAjaran) => (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-white/5 ${t.aktif ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-400'}`}>
        {t.aktif ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        <span className="text-[10px] font-black uppercase tracking-wider">{t.aktif ? 'AKTIF' : 'NON-AKTIF'}</span>
      </div>
    )},
    { header: 'Aksi', align: 'right' as const, render: (t: TahunAjaran) => (
      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={() => openEdit(t)}>
          <Edit2 className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" onClick={() => handleDelete(t.id)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    )}
  ];

  return (
    <div className="w-full p-6 space-y-6 mx-auto">
      <PageHero
        title="TAHUN AJARAN"
        description="Konfigurasi periode akademik sekolah"
        icon={<CalendarDays className="w-5 h-5" />}
        variant="amber"
        breadcrumb="Sistem / Konfigurasi Akademik"
        actions={
          <Button onClick={openAdd} className="gap-2 shadow-lg shadow-amber-500/20 bg-amber-600 hover:bg-amber-700 font-bold uppercase tracking-tight text-xs h-11 px-6">
            <Plus className="w-4 h-4" /> Tambah Tahun
          </Button>
        }
      />

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
          title={editTarget ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran'}
          description="Atur periode tahun ajaran aktif"
          icon={<CalendarDays className="w-5 h-5" />}
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
              <FormField id="tahun" label="Tahun Ajaran" placeholder="e.g. 2023/2024" value={form.tahun} onChange={v => setForm(f => ({ ...f, tahun: v }))} required />
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold">Status Aktif</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-tight">Tandai sebagai tahun ajaran berjalan</p>
                </div>
                <input type="checkbox" checked={form.aktif} onChange={e => setForm(f => ({ ...f, aktif: e.target.checked }))} className="w-5 h-5 accent-primary" />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
