import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { PageHero } from '@/components/shared/PageHero';
import { 
    Users, 
    Search, 
    ShieldAlert, 
    Eye,
    Filter,
    User
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CheckCircle2, AlertTriangle, ListFilter } from 'lucide-react';
import { DataTable } from '@/components/shared/DataTable';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Modal } from '@/components/shared/Modal';
import { FormField } from '@/components/shared/FormField';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { showToast } from '@/lib/toast-utils';

export default function WaliSiswaPage() {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Reporting State
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportingStudent, setReportingStudent] = useState<any>(null);
    const [masterPelanggaran, setMasterPelanggaran] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        master_pelanggaran_id: '',
        tanggal: new Date().toISOString().split('T')[0],
        catatan: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resStudents, resMaster] = await Promise.all([
                    api.get<{ data: any[] }>('/wali-kelas/students'),
                    api.get<{ data: any[] }>('/pelanggaran/master')
                ]);
                setStudents(resStudents.data);
                setMasterPelanggaran(resMaster.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleReportViolation = (student: any) => {
        setReportingStudent(student);
        setIsReportModalOpen(true);
        setFormData({
            master_pelanggaran_id: '',
            tanggal: new Date().toISOString().split('T')[0],
            catatan: ''
        });
    };

    const submitViolation = async () => {
        if (!formData.master_pelanggaran_id) {
            showToast.error('Pilih jenis pelanggaran');
            return;
        }
        setSaving(true);
        try {
            await api.post('/pelanggaran/incident', {
                peserta_didik_ids: [reportingStudent.id],
                ...formData
            });
            showToast.success('Pelanggaran berhasil dicatat');
            setIsReportModalOpen(false);
            
            // Refresh student data to update points
            const res = await api.get<{ data: any[] }>('/wali-kelas/students');
            setStudents(res.data);
        } catch (e) {
            console.error(e);
            showToast.error('Gagal mencatat pelanggaran');
        } finally {
            setSaving(false);
        }
    };

    const filteredStudents = students.filter(s => {
        const matchesSearch = s.nama.toLowerCase().includes(search.toLowerCase()) || s.nis.includes(search);
        const totalPoin = s.total_poin || 0;
        
        if (statusFilter === 'high-violations') return matchesSearch && totalPoin > 50;
        if (statusFilter === 'safe') return matchesSearch && totalPoin <= 50;
        
        return matchesSearch;
    });

    if (loading) return <div className="p-20 flex justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <TooltipProvider>
            <div className="w-full p-6 space-y-8 mx-auto animate-in fade-in duration-700 relative">
            <PageHero
                title="Daftar Siswa Kelas"
                description="Manajemen data dan pemantauan profil siswa di kelas Anda"
                icon={<Users className="w-5 h-5" />}
                variant="primary"
                breadcrumb="Wali Kelas / Siswa"
            />

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-zinc-900/40 p-6 rounded-[2rem] border border-white/5 backdrop-blur-md">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                        placeholder="Cari nama atau NIS..." 
                        className="pl-11 h-12 rounded-xl bg-white/5 border-white/10 focus:border-primary/50 transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="rounded-xl border-white/5 bg-white/3 gap-2 min-w-[160px] justify-between">
                                <div className="flex items-center gap-2">
                                    <ListFilter className="w-4 h-4 text-primary" />
                                    <span className="text-xs font-bold uppercase tracking-tighter">
                                        {statusFilter === 'all' && 'Semua Siswa'}
                                        {statusFilter === 'high-violations' && 'Pelanggaran Tinggi'}
                                        {statusFilter === 'safe' && 'Kondusif'}
                                    </span>
                                </div>
                                <Filter className="w-3 h-3 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 rounded-2xl border-white/10 bg-zinc-900/95 backdrop-blur-xl shadow-2xl p-2">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 px-3 py-2">
                                Filter Berdasarkan Status
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                                <DropdownMenuRadioItem value="all" className="rounded-xl cursor-pointer py-3 focus:bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                            <Users className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <span className="text-sm font-bold">Semua Siswa</span>
                                    </div>
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="high-violations" className="rounded-xl cursor-pointer py-3 focus:bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                                            <AlertTriangle className="w-4 h-4 text-rose-500" />
                                        </div>
                                        <span className="text-sm font-bold">Pelanggaran Tinggi</span>
                                    </div>
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="safe" className="rounded-xl cursor-pointer py-3 focus:bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <span className="text-sm font-bold">Kondusif / Aman</span>
                                    </div>
                                </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="hidden lg:block">
                <DataTable 
                    data={filteredStudents}
                    columns={[
                        {
                            header: 'Nama Siswa',
                            render: (student) => (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xs">
                                        {student.nama.charAt(0)}
                                    </div>
                                    <span className="font-bold text-white">{student.nama}</span>
                                </div>
                            )
                        },
                        {
                            header: 'Identitas',
                            render: (student) => (
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-bold text-white">NIS: {student.nis}</span>
                                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">NISN: {student.nisn || '-'}</span>
                                </div>
                            )
                        },
                        {
                            header: 'Gender',
                            render: (student) => (
                                <span className="text-xs font-bold text-muted-foreground">
                                    {student.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                                </span>
                            )
                        },
                        {
                            header: 'Kedisiplinan',
                            align: 'center',
                            render: (student) => (
                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${student.total_poin > 50 ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                                    {student.total_poin || 0} Poin
                                </div>
                            )
                        },
                        {
                            header: 'Aksi',
                            align: 'right',
                            render: (student) => (
                                <div className="flex items-center justify-end gap-2">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button asChild variant="ghost" size="sm" className="h-8 rounded-lg hover:bg-white/5">
                                                <Link to={`/siswa/${student.id}`}>
                                                    <Eye className="w-4 h-4 text-primary" />
                                                </Link>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="bg-zinc-900 border border-white/10 text-white font-bold py-1.5 px-3 rounded-xl shadow-2xl">
                                            Lihat Detail Siswa
                                        </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-8 rounded-lg hover:bg-white/5"
                                                onClick={() => handleReportViolation(student)}
                                            >
                                                <ShieldAlert className="w-4 h-4 text-rose-400" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="bg-zinc-900 border border-white/10 text-white font-bold py-1.5 px-3 rounded-xl shadow-2xl">
                                            Laporkan Pelanggaran
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            )
                        }
                    ]}
                    hideHeader
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:hidden">
                {filteredStudents.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-muted-foreground font-bold uppercase tracking-widest opacity-50">
                        Siswa tidak ditemukan
                    </div>
                ) : (
                    filteredStudents.map((student) => (
                        <div key={student.id} className="group relative p-6 rounded-[2.5rem] border border-white/5 bg-zinc-900/40 backdrop-blur-md hover:border-primary/30 transition-all duration-500 overflow-hidden">
                            {/* Decorative background */}
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 blur-2xl rounded-full group-hover:bg-primary/10 transition-all" />
                            
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xl group-hover:scale-110 transition-transform">
                                        {student.nama.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-white text-lg leading-tight group-hover:text-primary transition-colors">{student.nama}</h3>
                                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">NIS: {student.nis}</p>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${student.total_poin > 50 ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                                    {student.total_poin || 0} Poin
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">NISN</p>
                                    <p className="text-xs font-bold text-white mt-0.5">{student.nisn || '-'}</p>
                                </div>
                                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Gender</p>
                                    <p className="text-xs font-bold text-white mt-0.5">{student.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button asChild variant="outline" className="flex-1 rounded-xl border-white/5 bg-white/3 hover:bg-white/10 gap-2 text-xs font-bold uppercase tracking-tighter">
                                            <Link to={`/siswa/${student.id}`}>
                                                <Eye className="w-4 h-4" />
                                                Detail
                                            </Link>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="bg-zinc-900 border border-white/10 text-white font-bold py-1.5 px-3 rounded-xl shadow-2xl">
                                        Buka Profil Lengkap Siswa
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button 
                                            variant="outline" 
                                            className="rounded-xl border-white/5 bg-white/3 hover:bg-white/10 px-3"
                                            onClick={() => handleReportViolation(student)}
                                        >
                                            <ShieldAlert className="w-4 h-4 text-rose-400" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="bg-zinc-900 border border-white/10 text-white font-bold py-1.5 px-3 rounded-xl shadow-2xl">
                                        Laporkan Pelanggaran Baru
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    ))
                )}
            </div>
            </div>

            {/* Report Violation Modal */}
            {isReportModalOpen && reportingStudent && (
                <Modal
                    isOpen={isReportModalOpen}
                    title="Laporkan Pelanggaran"
                    onClose={() => setIsReportModalOpen(false)}
                    onSubmit={submitViolation}
                    submitLabel="Kirim Laporan"
                    saving={saving}
                >
                    <div className="space-y-6">
                        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                                <User className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-rose-500/50 uppercase tracking-widest">Siswa Terlapor</p>
                                <h4 className="font-black text-foreground uppercase">{reportingStudent.nama}</h4>
                                <p className="text-[10px] font-bold text-muted-foreground">NIS: {reportingStudent.nis}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SearchableSelect
                                id="master_pelanggaran_id"
                                label="Jenis Pelanggaran"
                                placeholder="Pilih jenis pelanggaran..."
                                value={formData.master_pelanggaran_id}
                                onChange={(val) => setFormData({ ...formData, master_pelanggaran_id: val })}
                                options={masterPelanggaran.map(m => ({
                                    value: m.id,
                                    label: `${m.nama} (${m.poin} Poin)`
                                }))}
                            />
                            <FormField 
                                id="tanggal" 
                                label="Tanggal Kejadian" 
                                type="date"
                                value={formData.tanggal}
                                onChange={(val) => setFormData({...formData, tanggal: val})}
                            />
                        </div>

                        <FormField 
                            id="catatan" 
                            label="Keterangan / Kronologi" 
                            placeholder="Jelaskan detail kejadian..."
                            value={formData.catatan}
                            onChange={(val) => setFormData({...formData, catatan: val})}
                            isTextArea
                        />
                    </div>
                </Modal>
            )}
        </TooltipProvider>
    );
}
