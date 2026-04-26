import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ClipboardCheck, Save, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { DataTable } from '@/components/shared/DataTable';
import { FormField } from '@/components/shared/FormField';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { PageHero } from '@/components/shared/PageHero';
import { FilterBar } from '@/components/shared/FilterBar';

interface Pembelajaran {
  id: string;
  rombel_id: string;
  mata_pelajaran_nama: string;
  rombel_nama: string;
}

interface Student {
  id: string;
  nama: string;
  nis: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa';
  catatan: string;
}

interface Semester {
  id: string;
  aktif: boolean;
}

// ─── Hooks ──────────────────────────────────────────────────────────────────
function useMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function AttendanceCard({ 
  student, 
  onStatusChange, 
  onNoteChange 
}: { 
  student: Student, 
  onStatusChange: (id: string, s: any) => void,
  onNoteChange: (id: string, n: string) => void
}) {
  return (
    <div className="p-5 rounded-[2rem] bg-zinc-900/40 border border-white/5 space-y-4 relative group transition-all hover:border-white/10">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-lg shadow-inner shrink-0">
          {student.nama?.charAt(0) || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-foreground truncate">{student.nama || 'Tanpa Nama'}</h4>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">NIS: {student.nis || '-'}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${
          student.status === 'Hadir' ? 'bg-emerald-500/10 text-emerald-500' :
          student.status === 'Alpa' ? 'bg-rose-500/10 text-rose-500' :
          'bg-amber-500/10 text-amber-500'
        }`}>
          {student.status}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-4 gap-2">
          {['Hadir', 'Izin', 'Sakit', 'Alpa'].map(status => (
            <button
              key={status}
              onClick={() => onStatusChange(student.id, status as any)}
              className={`h-11 rounded-xl text-[10px] font-black uppercase transition-all flex flex-col items-center justify-center gap-0.5 ${
                student.status === status
                  ? status === 'Hadir' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' :
                    status === 'Alpa' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' :
                    'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                  : 'bg-white/5 text-muted-foreground hover:bg-white/10'
              }`}
            >
              <span className="text-sm">{status.charAt(0)}</span>
              <span className="text-[7px] opacity-60 tracking-tighter">{status}</span>
            </button>
          ))}
        </div>
        
        <input 
          type="text"
          placeholder="Tambah catatan..."
          value={student.catatan}
          onChange={(e) => onNoteChange(student.id, e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-foreground focus:border-primary/50 outline-none transition-all placeholder:text-muted-foreground/30 font-medium"
        />
      </div>
    </div>
  );
}

export default function PresensiPage() {
  const isMobile = useMobile();
  const { user: _user } = useAuth();
  const [pembelajarans, setPembelajarans] = useState<Pembelajaran[]>([]);
  const [selectedPem, setSelectedPem] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [semester, setSemester] = useState<Semester | null>(null);
  
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/pembelajaran?limit=500').then((res: any) => setPembelajarans(res.data.items));
    api.get('/semester?limit=100').then((res: any) => {
      const active = res.data.items.find((s: any) => s.aktif);
      if (active) setSemester(active);
    });
  }, []);

  const fetchData = useCallback(async () => {
    if (!selectedPem || !selectedDate) return;
    setLoading(true);
    try {
      const pem = pembelajarans.find(p => p.id === selectedPem);
      if (!pem) return;
      const resMembers = await api.get(`/rombel/${pem.rombel_id}/anggota`);
      const members = (resMembers as any).data || [];
      const resPresensi = await api.get(`/presensi?pembelajaran_id=${selectedPem}&tanggal=${selectedDate}`);
      const presensiList = (resPresensi as any).data || [];
      const presensiMap = new Map(presensiList.map((p: any) => [p.peserta_didik_id, p]));
      const studentData = members.map((m: any) => {
        const existing = presensiMap.get(m.id) as any;
        return {
          id: m.id,
          nama: m.peserta_didik_nama,
          nis: m.nis,
          status: existing ? existing.status : 'Hadir',
          catatan: existing ? existing.catatan : ''
        };
      });
      setStudents(studentData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedPem, selectedDate, pembelajarans]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = (id: string, status: any) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const handleSave = async () => {
    if (!selectedPem || !semester || !selectedDate) return;
    setSaving(true);
    try {
      await api.post('/presensi', {
        pembelajaran_id: selectedPem,
        semester_id: semester.id,
        tanggal: selectedDate,
        items: students.map(s => ({
          peserta_didik_id: s.id,
          status: s.status,
          catatan: s.catatan
        }))
      });
      setMessage({ text: 'Presensi berhasil disimpan', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (e) {
      setMessage({ text: 'Gagal menyimpan presensi', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleNoteChange = (id: string, catatan: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, catatan } : s));
  };

  const filteredStudents = useMemo(() => {
    if (!search) return students;
    const s = search.toLowerCase();
    return students.filter(std => 
      std.nama?.toLowerCase().includes(s) || 
      std.nis?.toLowerCase().includes(s)
    );
  }, [students, search]);

  const stats = useMemo(() => {
    return {
      total: students.length,
      hadir: students.filter(s => s.status === 'Hadir').length,
      tidakHadir: students.filter(s => s.status !== 'Hadir').length,
      izin: students.filter(s => s.status === 'Izin').length,
      sakit: students.filter(s => s.status === 'Sakit').length,
      alpa: students.filter(s => s.status === 'Alpa').length,
    }
  }, [students]);

  return (
    <div className="w-full p-4 sm:p-6 space-y-8 mx-auto animate-in fade-in duration-700 max-w-7xl">
      <PageHero
        title="PRESENSI SISWA"
        description="Pencatatan kehadiran kelas harian."
        icon={<ClipboardCheck className="w-5 h-5" />}
        variant="primary"
        breadcrumb="Akademik / Presensi Mengajar"
      />

      {/* Summary Row */}
      {selectedPem && students.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 animate-in slide-in-from-top-4 duration-500">
          <div className="p-4 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-md">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Total Siswa</p>
            <p className="text-2xl font-black">{stats.total}</p>
          </div>
          <div className="p-4 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 backdrop-blur-md">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60">Hadir</p>
            <p className="text-2xl font-black text-emerald-400">{stats.hadir}</p>
          </div>
          <div className="p-4 rounded-3xl bg-amber-500/5 border border-amber-500/10 backdrop-blur-md">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/60">Izin/Sakit</p>
            <p className="text-2xl font-black text-amber-400">{stats.izin + stats.sakit}</p>
          </div>
          <div className="p-4 rounded-3xl bg-rose-500/5 border border-rose-500/10 backdrop-blur-md">
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-500/60">Alpa</p>
            <p className="text-2xl font-black text-rose-400">{stats.alpa}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-[2.5rem] bg-zinc-900/40 border border-white/5 backdrop-blur-sm shadow-2xl">
        <SearchableSelect 
          id="pembelajaran" 
          label="Mata Pelajaran & Kelas" 
          value={selectedPem} 
          onChange={setSelectedPem}
          placeholder="-- Pilih Mata Pelajaran & Kelas --"
          options={pembelajarans.map(p => ({
            value: p.id,
            label: `${p.mata_pelajaran_nama} - Kelas ${p.rombel_nama}`
          }))}
        />
        <FormField 
          id="tanggal" 
          label="Tanggal" 
          type="date"
          value={selectedDate}
          onChange={setSelectedDate}
        />
      </div>

      {message.text && (
        <div className={`flex items-center gap-2 px-6 py-4 rounded-2xl border ${
          message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        } animate-in slide-in-from-top-2`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="font-bold text-sm">{message.text}</span>
        </div>
      )}

      {/* Data List */}
      {selectedPem ? (
        <div className="animate-in fade-in duration-1000 space-y-6">
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Cari nama atau NIS siswa..."
            onAdd={handleSave}
            addIcon={Save}
            addTooltip="Simpan Data Kehadiran"
            loading={saving}
          />

          {isMobile ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredStudents.map(s => (
                <AttendanceCard key={s.id} student={s} onStatusChange={handleStatusChange} onNoteChange={handleNoteChange} />
              ))}
              {students.length === 0 && !loading && (
                <div className="py-20 text-center opacity-50 font-medium">Data siswa tidak tersedia</div>
              )}
            </div>
          ) : (
            <div className="rounded-[2.5rem] bg-zinc-900/40 border border-white/5 backdrop-blur-sm overflow-hidden shadow-2xl">
              <DataTable
                columns={[
                  {
                    header: 'Peserta Didik',
                    render: (s: Student) => (
                      <div className="flex items-center gap-3 py-1">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                          {s.nama?.charAt(0) || '?'}
                        </div>
                        <div className="flex flex-col min-w-[180px]">
                          <span className="font-bold text-sm text-foreground truncate">{s.nama}</span>
                          <span className="text-[10px] text-muted-foreground font-medium tracking-widest">NIS: {s.nis}</span>
                        </div>
                      </div>
                    )
                  },
                  {
                    header: 'Status Kehadiran',
                    render: (s: Student) => (
                      <div className="flex items-center gap-2">
                        {['Hadir', 'Izin', 'Sakit', 'Alpa'].map(status => (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(s.id, status as any)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                              s.status === status
                                ? status === 'Hadir' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' :
                                  status === 'Alpa' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' :
                                  'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                                : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    )
                  },
                  {
                    header: 'Catatan',
                    render: (s: Student) => (
                      <input 
                        type="text"
                        placeholder="Catatan..."
                        value={s.catatan}
                        onChange={(e) => handleNoteChange(s.id, e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-foreground focus:border-primary/50 outline-none transition-all"
                      />
                    )
                  }
                ]}
                data={filteredStudents}
                loading={loading}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 rounded-[3rem] bg-white/[0.02] border-2 border-dashed border-white/5 opacity-50">
          <div className="w-24 h-24 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center">
            <ClipboardCheck className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="font-black text-2xl uppercase tracking-tight italic">Pilih Data Pembelajaran</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">Silakan pilih mata pelajaran dan tanggal untuk mulai melakukan absensi.</p>
          </div>
        </div>
      )}
    </div>
  );
}
