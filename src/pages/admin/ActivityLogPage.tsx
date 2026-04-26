import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { 
  History, 
  User, 
  Clock, 
  Activity, 
  Users,
  Calendar,
  Sparkles,
  ShieldAlert,
  Terminal,
  MousePointer2
} from 'lucide-react';
import { DataTable } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { PageHero } from '@/components/shared/PageHero';
import { showToast } from '@/lib/toast-utils';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface ActivityLog {
  id: string;
  username: string;
  action: string;
  entity_type: string;
  entity_id: string;
  description: string;
  created_at: string;
}

interface LogStats {
  today: number;
  critical: number;
  uniqueUsers: number;
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 1 });
  const [stats, setStats] = useState<LogStats | null>(null);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get<any>(`/activity-log?page=${page}&limit=10&search=${search}`);
      setLogs(res.data.items);
      setPagination({
        page,
        limit: 10,
        total: res.data.total,
        total_pages: Math.ceil(res.data.total / 10)
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get<any>('/activity-log/stats');
      setStats(res.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchData(1);
    fetchStats();
  }, [fetchData, fetchStats]);

  const handleExport = () => {
    if (logs.length === 0) {
      showToast.error('Tidak ada log untuk di-export');
      return;
    }

    const dataToExport = logs.map(l => ({
      'Waktu': format(new Date(l.created_at), 'dd/MM/yyyy HH:mm:ss'),
      'Pengguna': l.username,
      'Aksi': l.action,
      'Entitas': l.entity_type,
      'Keterangan': l.description
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Activity Logs');
    XLSX.writeFile(wb, `Activity_Logs_${new Date().getTime()}.xlsx`);
    showToast.success('Berhasil export ke Excel');
  };

  const getActionStyles = (action: string) => {
    if (action.startsWith('CREATE')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (action.startsWith('UPDATE')) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    if (action.startsWith('DELETE')) return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    if (action.startsWith('LOGIN') || action.startsWith('AUTH')) return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
    return 'text-violet-400 bg-violet-500/10 border-violet-500/20';
  };

  const columns = [
    {
      header: 'Timestamp',
      render: (log: ActivityLog) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground tracking-tight">
            <Clock className="w-3 h-3 text-primary" />
            {format(new Date(log.created_at), 'HH:mm:ss')}
          </div>
          <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest pl-4.5">
            {format(new Date(log.created_at), 'dd MMM yyyy', { locale: id })}
          </div>
        </div>
      )
    },
    {
      header: 'Actor',
      render: (log: ActivityLog) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
            <User className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground">{log.username}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-tighter opacity-60">System Identity</span>
          </div>
        </div>
      )
    },
    {
      header: 'Operation',
      render: (log: ActivityLog) => (
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border shadow-sm ${getActionStyles(log.action)}`}>
          <Terminal className="w-3 h-3" />
          <span className="text-[10px] font-black uppercase tracking-widest">
            {log.action.replace(/_/g, ' ')}
          </span>
        </div>
      )
    },
    {
      header: 'Activity Description',
      render: (log: ActivityLog) => (
        <div className="flex items-start gap-3 max-w-xl group/desc">
          <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover/desc:bg-primary/10 transition-colors">
            <MousePointer2 className="w-3 h-3 text-muted-foreground group-hover/desc:text-primary transition-colors" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm text-foreground/80 leading-relaxed font-medium line-clamp-2">
              {log.description}
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
              <Sparkles className="w-2.5 h-2.5" />
              Entity: {log.entity_type}
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="w-full p-6 space-y-8 mx-auto animate-in fade-in duration-700">
      {/* Header Section */}
      <PageHero
        title="Audit Trail & Logs"
        description="Rekaman jejak aktivitas sistem untuk menjaga keamanan dan akuntabilitas data"
        icon={<History className="w-5 h-5" />}
        variant="primary"
        breadcrumb="Sistem / Audit Trail"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard icon={<Activity className="w-5 h-5 text-primary" />} label="Total Record" value={pagination.total} color="primary" />
        <StatsCard icon={<Calendar className="w-5 h-5 text-emerald-400" />} label="Aktivitas Hari Ini" value={stats?.today || 0} color="emerald" />
        <StatsCard icon={<ShieldAlert className="w-5 h-5 text-rose-400" />} label="Tindakan Kritis" value={stats?.critical || 0} color="rose" />
        <StatsCard icon={<Users className="w-5 h-5 text-sky-400" />} label="User Aktif" value={stats?.uniqueUsers || 0} color="sky" />
      </div>

      {/* Main Table Area */}
      <div className="space-y-4">
        {/* Search Bar */}
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari aktivitas, username, atau deskripsi..."
          onExport={handleExport}
          exportTooltip="Download Audit Logs"
        />

        <DataTable
          columns={columns}
          data={logs}
          loading={loading}
          pagination={pagination}
          onPageChange={p => fetchData(p)}
        />
      </div>
    </div>
  );
}

function StatsCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number | string, color: string }) {
  const colorMap: any = {
    primary: 'bg-primary/10 border-primary/20 text-primary',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    sky: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
  };

  return (
    <div className={`p-6 rounded-3xl border ${colorMap[color]} backdrop-blur-sm space-y-4 hover:scale-[1.02] transition-all duration-300 group relative overflow-hidden shadow-lg`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-3xl -mr-12 -mt-12 group-hover:bg-white/10 transition-colors" />
      <div className="flex items-center gap-3 relative">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/5 group-hover:rotate-12 transition-transform duration-500">
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
