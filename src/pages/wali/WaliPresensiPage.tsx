import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { PageHero } from '@/components/shared/PageHero';
import {
    ClipboardCheck,
    Download,
    Filter,
    User,
    CheckCircle2,
    Clock,
    AlertCircle,
    XCircle,
    SortAsc,
    SortDesc
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MONTHS = [
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
];

export default function WaliPresensiPage() {
    const [recap, setRecap] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().getMonth() + 1 + '');
    const [year, setYear] = useState(new Date().getFullYear() + '');

    // Sorting State
    const [sortField, setSortField] = useState('nama');
    const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('ASC');

    const fetchRecap = async () => {
        setLoading(true);
        try {
            const res = await api.get<{ data: any[] }>(`/wali-kelas/attendance-recap?month=${month}&year=${year}`);
            setRecap(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecap();
    }, [month, year]);

    const stats = {
        totalHadir: recap.reduce((acc, curr) => acc + Number(curr.Hadir), 0),
        totalIzin: recap.reduce((acc, curr) => acc + Number(curr.Izin), 0),
        totalSakit: recap.reduce((acc, curr) => acc + Number(curr.Sakit), 0),
        totalAlpa: recap.reduce((acc, curr) => acc + Number(curr.Alpa), 0),
    };

    const sortedRecap = [...recap].sort((a, b) => {
        let valA, valB;

        if (sortField === 'percent') {
            const totalA = Number(a.Hadir) + Number(a.Izin) + Number(a.Sakit) + Number(a.Alpa);
            const totalB = Number(b.Hadir) + Number(b.Izin) + Number(b.Sakit) + Number(b.Alpa);
            valA = totalA > 0 ? (Number(a.Hadir) / totalA) * 100 : 0;
            valB = totalB > 0 ? (Number(b.Hadir) / totalB) * 100 : 0;
        } else {
            valA = a[sortField];
            valB = b[sortField];
        }

        if (typeof valA === 'string') {
            return sortDirection === 'ASC'
                ? valA.localeCompare(valB as string)
                : (valB as string).localeCompare(valA);
        }

        return sortDirection === 'ASC'
            ? (valA as number) - (valB as number)
            : (valB as number) - (valA as number);
    });

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'ASC' ? 'DESC' : 'ASC');
        } else {
            setSortField(field);
            setSortDirection('ASC');
        }
    };

    return (
        <div className="w-full p-4 md:p-6 space-y-6 md:space-y-8 mx-auto animate-in fade-in duration-700 relative">
            <PageHero
                title="Rekap Presensi Kelas"
                description="Laporan akumulasi kehadiran siswa per bulan"
                icon={<ClipboardCheck className="w-5 h-5" />}
                variant="emerald"
                breadcrumb="Wali Kelas / Presensi"
            />

            <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Filters */}
                <div className="w-full lg:w-72 space-y-6">
                    <div className="p-6 rounded-[2rem] bg-zinc-900/40 border border-white/5 backdrop-blur-md space-y-6">
                        <div className="flex items-center gap-2 text-emerald-400">
                            <Filter className="w-4 h-4" />
                            <h3 className="text-xs font-black uppercase tracking-widest">Filter Laporan</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Pilih Bulan</label>
                                <Select value={month} onValueChange={setMonth}>
                                    <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10">
                                        <SelectValue placeholder="Pilih Bulan" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-white/10 bg-zinc-900 shadow-2xl">
                                        {MONTHS.map(m => (
                                            <SelectItem key={m.value} value={m.value} className="rounded-lg">{m.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Pilih Tahun</label>
                                <Select value={year} onValueChange={setYear}>
                                    <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10">
                                        <SelectValue placeholder="Pilih Tahun" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-white/10 bg-zinc-900 shadow-2xl">
                                        {[2024, 2025, 2026].map(y => (
                                            <SelectItem key={y} value={y + ''} className="rounded-lg">{y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Button className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-emerald-900/20">
                            <Download className="w-4 h-4" />
                            Export Excel
                        </Button>

                        <div className="lg:hidden space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Urutkan Berdasarkan</label>
                            <Select value={sortField} onValueChange={(val) => { setSortField(val); setSortDirection('ASC'); }}>
                                <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10">
                                    <SelectValue placeholder="Urutkan" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-white/10 bg-zinc-900 shadow-2xl">
                                    <SelectItem value="nama" className="rounded-lg">Nama Siswa</SelectItem>
                                    <SelectItem value="Hadir" className="rounded-lg">Jumlah Hadir</SelectItem>
                                    <SelectItem value="Alpa" className="rounded-lg">Jumlah Alpa</SelectItem>
                                    <SelectItem value="percent" className="rounded-lg">Persentase</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="ghost"
                                onClick={() => setSortDirection(sortDirection === 'ASC' ? 'DESC' : 'ASC')}
                                className="w-full h-10 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest gap-2"
                            >
                                {sortDirection === 'ASC' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                                {sortDirection === 'ASC' ? 'Ascending' : 'Descending'}
                            </Button>
                        </div>
                    </div>

                    {/* Summary Mini Cards */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-center">
                            <p className="text-[8px] font-black uppercase text-emerald-500/60 mb-1">Hadir</p>
                            <h4 className="text-xl font-black text-emerald-400">{stats.totalHadir}</h4>
                        </div>
                        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-center">
                            <p className="text-[8px] font-black uppercase text-amber-500/60 mb-1">Izin/Sakit</p>
                            <h4 className="text-xl font-black text-amber-400">{stats.totalIzin + stats.totalSakit}</h4>
                        </div>
                        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 text-center col-span-2">
                            <p className="text-[8px] font-black uppercase text-rose-500/60 mb-1">Total Alpa (Tanpa Keterangan)</p>
                            <h4 className="text-xl font-black text-rose-400">{stats.totalAlpa}</h4>
                        </div>
                    </div>
                </div>

                {/* Table Area */}
                <div className="flex-1 w-full overflow-hidden">
                    {/* Desktop View */}
                    <div className="hidden lg:block">
                        <DataTable
                            loading={loading}
                            data={sortedRecap}
                            sortField={sortField}
                            sortDirection={sortDirection}
                            onSort={handleSort}
                            columns={[
                                {
                                    header: 'Peserta Didik',
                                    accessor: 'nama',
                                    render: (item) => (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-muted-foreground/60">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white text-sm uppercase">{item.nama}</span>
                                                <span className="text-[10px] text-muted-foreground font-black tracking-tighter">NIS: {item.nis}</span>
                                            </div>
                                        </div>
                                    )
                                },
                                {
                                    header: 'Hadir',
                                    accessor: 'Hadir',
                                    align: 'center',
                                    render: (item) => (
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            </div>
                                            <span className="text-xs font-black text-emerald-400">{item.Hadir}</span>
                                        </div>
                                    )
                                },
                                {
                                    header: 'Izin',
                                    accessor: 'Izin',
                                    align: 'center',
                                    render: (item) => (
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
                                                <Clock className="w-4 h-4 text-sky-400" />
                                            </div>
                                            <span className="text-xs font-black text-sky-400">{item.Izin}</span>
                                        </div>
                                    )
                                },
                                {
                                    header: 'Sakit',
                                    accessor: 'Sakit',
                                    align: 'center',
                                    render: (item) => (
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                                <AlertCircle className="w-4 h-4 text-amber-500" />
                                            </div>
                                            <span className="text-xs font-black text-amber-400">{item.Sakit}</span>
                                        </div>
                                    )
                                },
                                {
                                    header: 'Alpa',
                                    accessor: 'Alpa',
                                    align: 'center',
                                    render: (item) => (
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                                                <XCircle className="w-4 h-4 text-rose-500" />
                                            </div>
                                            <span className="text-xs font-black text-rose-400">{item.Alpa}</span>
                                        </div>
                                    )
                                },
                                {
                                    header: 'Persentase',
                                    accessor: 'percent' as any,
                                    align: 'right',
                                    render: (item) => {
                                        const total = Number(item.Hadir) + Number(item.Izin) + Number(item.Sakit) + Number(item.Alpa);
                                        const percent = total > 0 ? (Number(item.Hadir) / total) * 100 : 0;
                                        return (
                                            <div className="flex flex-col items-end gap-1.5">
                                                <span className={`text-sm font-black ${percent >= 90 ? 'text-emerald-400' : percent >= 75 ? 'text-amber-400' : 'text-rose-400'}`}>
                                                    {percent.toFixed(1)}%
                                                </span>
                                                <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-1000 ${percent >= 90 ? 'bg-emerald-500' : percent >= 75 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    }
                                }
                            ]}
                            hideHeader
                        />
                    </div>

                    {/* Mobile View */}
                    <div className="lg:hidden space-y-4">
                        {loading ? (
                            <div className="py-20 flex justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
                        ) : sortedRecap.length === 0 ? (
                            <div className="py-20 text-center text-muted-foreground font-bold uppercase tracking-widest opacity-50">Data tidak ditemukan</div>
                        ) : (
                            sortedRecap.map((item) => {
                                const total = Number(item.Hadir) + Number(item.Izin) + Number(item.Sakit) + Number(item.Alpa);
                                const percent = total > 0 ? (Number(item.Hadir) / total) * 100 : 0;
                                return (
                                    <div key={item.id} className="p-5 rounded-[2rem] bg-zinc-900/40 border border-white/5 backdrop-blur-md space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
                                                    <User className="w-5 h-5 text-muted-foreground/60" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-white text-sm uppercase">{item.nama}</span>
                                                    <span className="text-[10px] text-muted-foreground font-black tracking-tighter">NIS: {item.nis}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-lg font-black ${percent >= 90 ? 'text-emerald-400' : percent >= 75 ? 'text-amber-400' : 'text-rose-400'}`}>
                                                    {percent.toFixed(0)}%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-4 gap-2">
                                            <div className="p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
                                                <p className="text-[8px] font-black text-emerald-500/60 uppercase">H</p>
                                                <p className="text-xs font-black text-emerald-400">{item.Hadir}</p>
                                            </div>
                                            <div className="p-2 rounded-xl bg-sky-500/5 border border-sky-500/10 text-center">
                                                <p className="text-[8px] font-black text-sky-500/60 uppercase">I</p>
                                                <p className="text-xs font-black text-sky-400">{item.Izin}</p>
                                            </div>
                                            <div className="p-2 rounded-xl bg-amber-500/5 border border-amber-500/10 text-center">
                                                <p className="text-[8px] font-black text-amber-500/60 uppercase">S</p>
                                                <p className="text-xs font-black text-amber-400">{item.Sakit}</p>
                                            </div>
                                            <div className="p-2 rounded-xl bg-rose-500/5 border border-rose-500/10 text-center">
                                                <p className="text-[8px] font-black text-rose-500/60 uppercase">A</p>
                                                <p className="text-xs font-black text-rose-400">{item.Alpa}</p>
                                            </div>
                                        </div>

                                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-1000 ${percent >= 90 ? 'bg-emerald-500' : percent >= 75 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
