import { useAuth } from '@/contexts/AuthContext';
import {
  GraduationCap, Users, BookOpen, CalendarDays,
  BellRing, TrendingUp, TrendingDown, Minus,
  Activity, Loader2, Clock, ShieldCheck, UserCog,
  ArrowUpRight,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Stat { title: string; value: number; trend: string; }
interface ActivityLog { id: string; action: string; description: string; user: string; role: string; time: string; }
interface Announcement { id?: string; title: string; desc: string; time: string; color: string; }
interface DashboardSummary {
  stats: Stat[];
  activities: { name: string; hadir: number; absen: number }[];
  recent_logs: ActivityLog[];
  announcements: Announcement[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Selamat Pagi';
  if (h < 15) return 'Selamat Siang';
  if (h < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

const STAT_MAP: Record<string, { icon: React.ElementType; color: string; bg: string; border: string; glow: string }> = {
  'Total Siswa':     { icon: Users,        color: 'text-sky-400',     bg: 'bg-sky-500/10',     border: 'border-sky-500/20',     glow: 'shadow-sky-500/20' },
  'Total Guru':      { icon: GraduationCap, color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  glow: 'shadow-violet-500/20' },
  'Mata Pelajaran':  { icon: BookOpen,      color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   glow: 'shadow-amber-500/20' },
  'Jadwal Hari Ini': { icon: CalendarDays,  color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/20' },
};

function trendIcon(trend: string) {
  const up = /^\+/.test(trend);
  const down = /^-/.test(trend);
  if (up)   return { Icon: TrendingUp,   cls: 'text-emerald-400 bg-emerald-500/10' };
  if (down) return { Icon: TrendingDown, cls: 'text-red-400 bg-red-500/10' };
  return     { Icon: Minus,              cls: 'text-muted-foreground bg-white/5' };
}

function roleIcon(role: string) {
  if (role === 'admin') return <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;
  if (role === 'guru')  return <GraduationCap className="w-3.5 h-3.5 text-violet-400" />;
  return <UserCog className="w-3.5 h-3.5 text-sky-400" />;
}

function roleBadge(role: string) {
  const map: Record<string, string> = {
    admin: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    guru:  'bg-violet-500/15 text-violet-400 border-violet-500/30',
    siswa: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  };
  const label: Record<string, string> = { admin: 'Administrator', guru: 'Tenaga Pendidik', siswa: 'Peserta Didik' };
  return { cls: map[role] ?? 'bg-primary/15 text-primary border-primary/30', label: label[role] ?? role };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/5 ${className}`} />;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ stat, delay }: { stat: Stat; delay: number }) {
  const meta = STAT_MAP[stat.title] ?? STAT_MAP['Total Siswa'];
  const { icon: Icon, color, bg, border, glow } = meta;
  const { Icon: TrendIcon, cls: trendCls } = trendIcon(stat.trend);

  return (
    <div
      className={`animate-in-up hover-card-effect group relative rounded-2xl border ${border} bg-card/50 backdrop-blur-sm p-5 shadow-lg ${glow} overflow-hidden`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* subtle corner glow */}
      <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-20 ${bg}`} />

      <div className="relative flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ${bg} ${color} shadow-inner`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg ${trendCls}`}>
          <TrendIcon className="w-3 h-3" />
          {stat.trend}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-3xl font-bold tracking-tight">{Number(stat.value).toLocaleString('id-ID')}</p>
        <p className="text-sm text-muted-foreground mt-1 font-medium">{stat.title}</p>
      </div>
    </div>
  );
}

// ─── Chart Tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-black/80 backdrop-blur-md px-4 py-3 text-sm shadow-xl">
      <p className="font-semibold mb-2 text-foreground">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mt-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium text-foreground">{p.value.toLocaleString('id-ID')}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: DashboardSummary }>('/dashboard/summary')
      .then(r => setSummary(r.data))
      .catch(e => console.error('Dashboard fetch failed', e))
      .finally(() => setIsLoading(false));
  }, []);

  const greeting = getGreeting();
  const badge = roleBadge(user?.role ?? '');
  const displayName = user?.username ?? 'Pengguna';

  return (
    <div className="flex flex-col gap-8 pb-10 relative animate-in-up">
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-primary/8 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute top-48 right-1/4 w-56 h-56 bg-violet-500/6 rounded-full blur-[100px] -z-10 pointer-events-none" />

      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br from-card/80 via-card/50 to-transparent backdrop-blur-xl p-7 sm:p-10 shadow-2xl">
        {/* decorative blob */}
        <svg className="absolute -right-20 -top-20 w-72 h-72 opacity-[0.07] fill-primary pointer-events-none" viewBox="0 0 200 200">
          <path d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.6,-46.1C91.4,-33.1,98,-16.6,97.7,-0.2C97.4,16.2,90.2,32.4,80.2,45.4C70.2,58.4,57.4,68.2,43.3,74.7C29.2,81.2,14.6,84.4,0.1,84.2C-14.4,84,-28.8,80.4,-41.8,73.4C-54.8,66.4,-66.4,56.1,-74.8,43.5C-83.2,30.9,-88.4,15.4,-88.7,-0.2C-89,-15.8,-84.4,-31.6,-75.6,-44.6C-66.8,-57.6,-53.8,-67.8,-39.8,-75C-25.8,-82.2,-12.9,-86.4,1.4,-88.8C15.7,-91.2,30.6,-83.6,44.7,-76.4Z" transform="translate(100 100)" />
        </svg>

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border ${badge.cls} mb-4`}>
              {badge.label}
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-3">
              {greeting},{' '}
              <span className="text-gradient capitalize">{displayName}</span>!
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-md">
              Berikut ringkasan informasi dan aktivitas Anda hari ini.
            </p>
          </div>

          {/* Quick date/time chip */}
          <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/8 bg-white/4 backdrop-blur-sm text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
      {user?.role === 'admin' && (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-white/5 bg-card/40 p-5 space-y-4">
                  <div className="flex justify-between">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <Skeleton className="w-16 h-6 rounded-lg" />
                  </div>
                  <Skeleton className="w-24 h-8 rounded" />
                  <Skeleton className="w-32 h-4 rounded" />
                </div>
              ))
            : summary?.stats.map((stat, i) => (
                <StatCard key={stat.title} stat={stat} delay={(i + 1) * 80} />
              ))
          }
        </div>
      )}

      {/* ── Main Grid ───────────────────────────────────────────────────────── */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">

        {/* Chart — 4 cols */}
        <div className="col-span-1 lg:col-span-4 animate-in-up delay-300 rounded-2xl border border-white/8 bg-card/50 backdrop-blur-sm shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
            <div>
              <h2 className="font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Grafik Kehadiran
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">7 hari terakhir · Hadir vs Absen/Izin</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary" />Hadir
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-destructive" />Absen
              </span>
            </div>
          </div>

          <div className="p-4 h-[280px] sm:h-[320px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : summary?.activities?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.activities} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gHadir" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(var(--primary))"     stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(var(--primary))"     stopOpacity={0}    />
                    </linearGradient>
                    <linearGradient id="gAbsen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(var(--destructive))" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dy={8} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dx={-8} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="hadir" name="Hadir"      stroke="hsl(var(--primary))"     strokeWidth={2.5} fill="url(#gHadir)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="absen" name="Absen/Izin" stroke="hsl(var(--destructive))" strokeWidth={2.5} fill="url(#gAbsen)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Belum ada data kehadiran.</p>
              </div>
            )}
          </div>
        </div>

        {/* Announcements — 3 cols */}
        <div className="col-span-1 lg:col-span-3 animate-in-up delay-400 rounded-2xl border border-white/8 bg-card/50 backdrop-blur-sm shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
            <div>
              <h2 className="font-semibold flex items-center gap-2">
                <BellRing className="w-4 h-4 text-amber-400" />
                Pengumuman
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Informasi terbaru dari sekolah</p>
            </div>
            {summary?.announcements?.length ? (
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold flex items-center justify-center">
                {summary.announcements.length}
              </span>
            ) : null}
          </div>

          <div className="p-4 space-y-2">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3 p-3">
                    <Skeleton className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4 rounded" />
                      <Skeleton className="h-3 w-full rounded" />
                      <Skeleton className="h-3 w-1/3 rounded" />
                    </div>
                  </div>
                ))
              : summary?.announcements?.length
              ? summary.announcements.map((item, i) => (
                  <div key={i} className="group flex items-start gap-3 p-3 rounded-xl hover:bg-white/4 transition-colors cursor-pointer">
                    <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${item.color} shadow-[0_0_8px_currentColor]`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground/90 group-hover:text-primary transition-colors truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{item.desc}</p>
                      <span className="text-[11px] text-muted-foreground/60 mt-1 block">{item.time}</span>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary/60 shrink-0 mt-1 transition-colors" />
                  </div>
                ))
              : (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">Belum ada pengumuman.</p>
                </div>
              )
            }
          </div>
        </div>
      </div>

      {/* ── Recent Activity Log (admin only) ────────────────────────────────── */}
      {user?.role === 'admin' && (
        <div className="animate-in-up delay-200 rounded-2xl border border-white/8 bg-card/50 backdrop-blur-sm shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
            <div>
              <h2 className="font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Log Aktivitas Terkini
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Riwayat tindakan sistem oleh pengguna</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-3 text-left font-semibold">Aksi</th>
                  <th className="px-6 py-3 text-left font-semibold">Deskripsi</th>
                  <th className="px-6 py-3 text-left font-semibold">Pengguna</th>
                  <th className="px-6 py-3 text-left font-semibold">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-b border-white/5">
                        {[1,2,3,4].map(j => (
                          <td key={j} className="px-6 py-4">
                            <Skeleton className="h-4 w-full rounded" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : summary?.recent_logs?.length
                  ? summary.recent_logs.map((log, i) => (
                      <tr key={log.id ?? i} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground max-w-xs truncate">{log.description}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            {roleIcon(log.role)}
                            <span className="text-foreground/80 font-medium">{log.user}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground text-xs whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {log.time}
                          </div>
                        </td>
                      </tr>
                    ))
                  : (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground text-sm">
                          Belum ada log aktivitas.
                        </td>
                      </tr>
                    )
                }
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
