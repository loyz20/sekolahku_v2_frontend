import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { CalendarDays, AlertTriangle, Plus, Edit2, Trash2, BookOpen, User, Clock, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { Modal } from '@/components/shared/Modal';
import { FormField } from '@/components/shared/FormField';

interface Rombel { id: string; nama: string; }
interface Mapel { id: string; nama: string; }
interface Guru { id: string; nama: string; }
interface Pembelajaran {
  id: string;
  rombel_id: string;
  mata_pelajaran_id: string;
  ptk_id: string;
  jam_per_minggu: number;
  mata_pelajaran_nama: string;
  mata_pelajaran_kode: string;
  ptk_nama: string;
}

const EMPTY_FORM = {
  rombel_id: '',
  mata_pelajaran_id: '',
  ptk_id: '',
  jam_per_minggu: 1
};

export default function JadwalPage() {
  const [items, setItems] = useState<Pembelajaran[]>([]);
  const [loading, setLoading] = useState(false);
  const [rombels, setRombels] = useState<Rombel[]>([]);
  const [mapels, setMapels] = useState<Mapel[]>([]);
  const [gurus, setGurus] = useState<Guru[]>([]);
  const [selectedRombel, setSelectedRombel] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Pembelajaran | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchRombels = useCallback(async () => {
    try {
      const res = await api.get<any>('/rombel?limit=100');
      setRombels(res.data.items);
      if (res.data.items.length > 0 && !selectedRombel) {
        setSelectedRombel(res.data.items[0].id);
      }
    } catch (e) { console.error(e); }
  }, [selectedRombel]);

  const fetchDependencies = useCallback(async () => {
    try {
      const [mRes, gRes] = await Promise.all([
        api.get<any>('/mata-pelajaran?limit=100'),
        api.get<any>('/ptk?limit=100')
      ]);
      setMapels(mRes.data.items);
      setGurus(gRes.data.items);
    } catch (e) { console.error(e); }
  }, []);

  const fetchJadwal = useCallback(async () => {
    if (!selectedRombel) return;
    setLoading(true);
    try {
      const res = await api.get<any>(`/pembelajaran/rombel/${selectedRombel}`);
      setItems(res.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [selectedRombel]);

  useEffect(() => { fetchRombels(); fetchDependencies(); }, [fetchRombels, fetchDependencies]);
  useEffect(() => { fetchJadwal(); }, [fetchJadwal]);

  const openAdd = () => {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, rombel_id: selectedRombel });
    setFormError(''); setModalOpen(true);
  };

  const openEdit = (p: Pembelajaran) => {
    setEditTarget(p);
    setForm({
      rombel_id: p.rombel_id,
      mata_pelajaran_id: p.mata_pelajaran_id,
      ptk_id: p.ptk_id,
      jam_per_minggu: p.jam_per_minggu
    });
    setFormError(''); setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.mata_pelajaran_id || !form.ptk_id || !form.rombel_id) {
      setFormError('Lengkapi semua data yang diperlukan.');
      return;
    }
    
    setSaving(true); setFormError('');
    try {
      if (editTarget) await api.put(`/pembelajaran/${editTarget.id}`, form);
      else await api.post('/pembelajaran', form);
      setModalOpen(false); fetchJadwal();
    } catch (e: any) { setFormError(e.message || 'Terjadi kesalahan.'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus jadwal pembelajaran ini?')) return;
    try { await api.delete(`/pembelajaran/${id}`); fetchJadwal(); } catch (e) { console.error(e); }
  };

  const columns = [
    { header: 'Mata Pelajaran', render: (p: Pembelajaran) => (
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
          <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-foreground leading-tight">{p.mata_pelajaran_nama}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-tight">{p.mata_pelajaran_kode}</span>
        </div>
      </div>
    )},
    { header: 'Guru Pengampu', render: (p: Pembelajaran) => (
      <div className="flex items-center gap-2 text-xs font-semibold text-sky-400">
        <User className="w-3 h-3" />{p.ptk_nama}
      </div>
    )},
    { header: 'Beban Belajar', render: (p: Pembelajaran) => (
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Clock className="w-3 h-3 opacity-40" />
        {p.jam_per_minggu} JP / Minggu
      </div>
    )},
    { header: 'Aksi', align: 'right' as const, render: (p: Pembelajaran) => (
      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={() => openEdit(p)}>
          <Edit2 className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10" onClick={() => handleDelete(p.id)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    )}
  ];

  return (
    <div className="w-full p-6 space-y-6 mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-emerald-400" />
            </div>
            PEMBELAJARAN
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Atur pembagian mata pelajaran dan guru per rombel</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 min-w-[200px]">
            <Layers className="w-4 h-4 text-muted-foreground" />
            <select 
              className="bg-transparent border-none text-sm font-semibold focus:ring-0 w-full"
              value={selectedRombel}
              onChange={(e) => setSelectedRombel(e.target.value)}
            >
              <option value="" disabled>-- Pilih Rombel --</option>
              {rombels.map(r => <option key={r.id} value={r.id}>{r.nama}</option>)}
            </select>
          </div>
          <Button onClick={openAdd} disabled={!selectedRombel} className="gap-2 shadow-lg shadow-emerald-500/20">
            <Plus className="w-4 h-4" /> Tambah Jadwal
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        emptyMessage={selectedRombel ? 'Belum ada jadwal untuk rombel ini.' : 'Silakan pilih rombel terlebih dahulu.'}
      />

      {modalOpen && (
        <Modal
          title={editTarget ? 'Edit Jadwal Pembelajaran' : 'Tambah Jadwal Pembelajaran'}
          description="Tentukan guru dan beban jam pelajaran"
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
              <FormField id="rombel" label="Rombongan Belajar" type="select" value={form.rombel_id} onChange={v => setForm(f => ({ ...f, rombel_id: v }))}
                options={rombels.map(r => ({ value: r.id, label: r.nama }))} required disabled />
              
              <FormField id="mapel" label="Mata Pelajaran" type="select" placeholder="-- Pilih Mapel --" value={form.mata_pelajaran_id} onChange={v => setForm(f => ({ ...f, mata_pelajaran_id: v }))}
                options={mapels.map(m => ({ value: m.id, label: m.nama }))} required />
              
              <FormField id="guru" label="Guru Pengampu" type="select" placeholder="-- Pilih Guru --" value={form.ptk_id} onChange={v => setForm(f => ({ ...f, ptk_id: v }))}
                options={gurus.map(g => ({ value: g.id, label: g.nama }))} required />
              
              <FormField id="jam" label="Jam Pelajaran per Minggu" type="number" value={String(form.jam_per_minggu)} onChange={v => setForm(f => ({ ...f, jam_per_minggu: parseInt(v) || 0 }))} required />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
