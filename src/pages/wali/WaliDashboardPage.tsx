import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { PageHero } from '@/components/shared/PageHero';
import {
    LayoutDashboard,
    Users,
    ClipboardCheck,
    ShieldAlert,
    ChevronRight,
    TrendingUp,
    Cake,
    MessageSquare
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/shared/Modal';
import { FormField } from '@/components/shared/FormField';
import { showToast } from '@/lib/toast-utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function WaliDashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get<{ data: any }>('/wali-kelas/dashboard');
                setStats(res.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const handleBroadcast = async () => {
        if (!broadcastMessage.trim()) return showToast.error('Pesan tidak boleh kosong');
        setSending(true);
        try {
            await api.post('/wali-kelas/broadcast', { message: broadcastMessage });
            showToast.success('Pesan berhasil disiarkan ke seluruh siswa');
            setIsModalOpen(false);
            setBroadcastMessage('');
        } catch (e) {
            console.error(e);
            showToast.error('Gagal mengirim broadcast');
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div className="p-20 flex justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
    if (!stats) return <div className="p-20 text-center text-muted-foreground font-bold">Data tidak ditemukan</div>;

    const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1'];
    const attendanceData = [
        { name: 'Hadir', value: stats.attendance_today.Hadir },
        { name: 'Izin', value: stats.attendance_today.Izin },
        { name: 'Sakit', value: stats.attendance_today.Sakit },
        { name: 'Alpa', value: stats.attendance_today.Alpa },
    ];

    return (
        <div className="w-full p-4 md:p-6 space-y-6 md:space-y-8 mx-auto animate-in fade-in duration-700 relative">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[150px] -z-10 rounded-full" />

            <PageHero
                title={`KELAS ${stats.class_info.nama}`}
                description={`Tahun Ajaran ${stats.class_info.tahun_ajaran_nama} • Wali Kelas: ${stats.class_info.wali_kelas_nama || 'Anda'}`}
                icon={<LayoutDashboard className="w-5 h-5" />}
                variant="primary"
                breadcrumb="Wali Kelas / Dashboard"
            />

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Siswa', value: stats.total_students, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                    { label: 'Siswa Laki-laki', value: stats.gender_stats.L, icon: Users, color: 'text-sky-400', bg: 'bg-sky-400/10' },
                    { label: 'Siswa Perempuan', value: stats.gender_stats.P, icon: Users, color: 'text-pink-400', bg: 'bg-pink-500/10' },
                    { label: 'Kehadiran Hari Ini', value: `${((stats.attendance_today.Hadir / stats.total_students) * 100).toFixed(0)}%`, icon: ClipboardCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                ].map((stat, i) => (
                    <div key={i} className="p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 bg-zinc-900/40 backdrop-blur-md shadow-2xl hover:border-white/10 transition-all group">
                        <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                        <h3 className="text-3xl font-black mt-1 text-white">{stat.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Attendance Chart */}
                <div className="lg:col-span-2 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-white/5 bg-zinc-900/40 backdrop-blur-md shadow-2xl">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-tight text-white">Statistik Kehadiran Hari Ini</h3>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">Distribusi status absensi siswa</p>
                        </div>
                        <TrendingUp className="w-6 h-6 text-emerald-400 opacity-50" />
                    </div>

                    <div className="h-[250px] md:h-[300px] w-full min-h-[250px] md:min-h-[300px]">
                        <ResponsiveContainer width="99%" height="100%">
                            <BarChart data={attendanceData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                                    {attendanceData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-white/5 bg-zinc-900/40 backdrop-blur-md shadow-2xl">
                    <h3 className="text-lg font-black uppercase tracking-tight text-white mb-6">Aksi Cepat Wali Kelas</h3>
                    <div className="grid grid-cols-1 gap-4">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsModalOpen(true)}
                            className="h-16 rounded-2xl border-white/5 bg-white/3 hover:bg-white/10 gap-3 justify-start px-6"
                        >
                            <MessageSquare className="w-5 h-5 text-sky-400" />
                            <div className="text-left">
                                <p className="text-xs font-black uppercase tracking-tighter">Broadcast</p>
                                <p className="text-[9px] text-muted-foreground uppercase font-medium">Kirim Pesan Kelas</p>
                            </div>
                        </Button>
                        <Button variant="outline" className="h-16 rounded-2xl border-white/5 bg-white/3 hover:bg-white/10 gap-3 justify-start px-6">
                            <Users className="size-5 text-emerald-400" />
                            <div className="text-left">
                                <p className="text-xs font-black uppercase tracking-tighter">Panggilan</p>
                                <p className="text-[9px] text-muted-foreground uppercase font-medium">Orang Tua/Wali</p>
                            </div>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upcoming Birthdays */}
                <div className="p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-white/5 bg-zinc-900/40 backdrop-blur-md shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                            <Cake className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-white">Siswa Berulang Tahun</h3>
                    </div>
                    
                    <div className="space-y-3">
                        {stats.upcoming_birthdays && stats.upcoming_birthdays.length > 0 ? (
                            stats.upcoming_birthdays.map((student: any) => (
                                <div key={student.id} className="group p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-rose-500/[0.05] hover:border-rose-500/20 transition-all flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white font-black text-xs">
                                            {student.nama.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground group-hover:text-rose-400 transition-colors">{student.nama}</p>
                                            <p className="text-[10px] font-medium text-muted-foreground">Berulang tahun ke-{student.turning_age}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-rose-500 uppercase tracking-tighter">
                                            {format(new Date(student.tanggal_lahir), 'dd MMM', { locale: id })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-10 text-center">
                                <p className="text-xs text-muted-foreground font-black uppercase tracking-widest italic opacity-50">Tidak ada ulang tahun dalam waktu dekat</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Violations */}
                <div className="p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-white/5 bg-zinc-900/40 backdrop-blur-md shadow-2xl">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                            <ShieldAlert className="w-5 h-5 text-rose-500" />
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-white">Poin Pelanggaran</h3>
                    </div>

                    <div className="space-y-4">
                        {stats.top_violations.length === 0 ? (
                            <div className="py-20 text-center">
                                <p className="text-xs text-muted-foreground font-black uppercase tracking-[0.2em]">Kondusif</p>
                                <p className="text-[10px] text-muted-foreground/60 mt-1 uppercase">Belum ada poin pelanggaran</p>
                            </div>
                        ) : (
                            stats.top_violations.map((student: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-all group/item">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-xs font-black text-rose-400">
                                            {student.total_poin}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white group-hover/item:text-rose-400 transition-colors">{student.nama}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase font-medium">NIS: {student.nis}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl opacity-0 group-hover/item:opacity-100 transition-all">
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Broadcast Pesan Kelas"
                description="Kirim pemberitahuan penting ke seluruh siswa di kelas Anda secara instan."
                onSubmit={handleBroadcast}
                submitLabel="Siarkan Pesan"
                saving={sending}
                submitVariant="default"
            >
                <div className="space-y-6 pt-4">
                    <FormField
                        id="message"
                        label="Isi Pesan Broadcast"
                        placeholder="Tuliskan pesan atau pengumuman untuk siswa..."
                        value={broadcastMessage}
                        onChange={setBroadcastMessage}
                        isTextArea
                    />
                </div>
            </Modal>
        </div>
    );
}
