import { useState } from "react"
import { Outlet, useLocation, Link } from "react-router-dom"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Bell, Check, AlertTriangle, Info, CheckCircle2, X,
} from "lucide-react"
import React from "react"

// ─── Types ────────────────────────────────────────────────────────────────────
type NotifType = 'info' | 'success' | 'warning'

interface Notification {
  id: number
  type: NotifType
  title: string
  desc: string
  time: string
  read: boolean
}

// ─── Mock notifications ───────────────────────────────────────────────────────
const MOCK_NOTIFS: Notification[] = [
  { id: 1, type: 'info',    title: 'Data siswa diperbarui', desc: 'Admin menambahkan 3 siswa baru ke kelas XII-A.', time: '5 menit lalu',  read: false },
  { id: 2, type: 'success', title: 'Backup berhasil',       desc: 'Backup data otomatis selesai tanpa error.',         time: '1 jam lalu',   read: false },
  { id: 3, type: 'warning', title: 'Sesi hampir habis',     desc: 'Sesi login Anda akan berakhir dalam 30 menit.',    time: '2 jam lalu',   read: true  },
  { id: 4, type: 'info',    title: 'Jadwal diperbarui',     desc: 'Jadwal pelajaran Senin minggu depan telah diubah.', time: '1 hari lalu',  read: true  },
]

// ─── Notif icon ───────────────────────────────────────────────────────────────
function NotifIcon({ type }: { type: NotifType }) {
  if (type === 'success') return <CheckCircle2 className="w-4 h-4 text-emerald-400" />
  if (type === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-400" />
  return <Info className="w-4 h-4 text-sky-400" />
}

function notifDotColor(type: NotifType) {
  if (type === 'success') return 'bg-emerald-400'
  if (type === 'warning') return 'bg-amber-400'
  return 'bg-sky-400'
}

// ─── Notification Panel ───────────────────────────────────────────────────────
function NotificationPanel({
  notifs,
  onRead,
  onReadAll,
  onClose,
}: {
  notifs: Notification[]
  onRead: (id: number) => void
  onReadAll: () => void
  onClose: () => void
}) {
  const unread = notifs.filter(n => !n.read).length

  return (
    <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 rounded-2xl border border-white/10 bg-card/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden animate-in-up">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div>
          <h3 className="font-semibold text-sm">Notifikasi</h3>
          {unread > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">{unread} belum dibaca</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button
              onClick={onReadAll}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-lg hover:bg-primary/10"
            >
              <Check className="w-3 h-3" />
              Tandai semua
            </button>
          )}
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-[360px] overflow-y-auto">
        {notifs.length === 0 ? (
          <div className="py-10 text-center">
            <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Tidak ada notifikasi</p>
          </div>
        ) : (
          notifs.map(n => (
            <button
              key={n.id}
              onClick={() => onRead(n.id)}
              className={`w-full flex items-start gap-3 px-5 py-4 text-left border-b border-white/5 last:border-0 transition-colors hover:bg-white/4 ${n.read ? 'opacity-60' : ''}`}
            >
              <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                n.type === 'success' ? 'bg-emerald-500/15' : n.type === 'warning' ? 'bg-amber-500/15' : 'bg-sky-500/15'
              }`}>
                <NotifIcon type={n.type} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate">{n.title}</p>
                  {!n.read && (
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${notifDotColor(n.type)}`} />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.desc}</p>
                <p className="text-[11px] text-muted-foreground/50 mt-1">{n.time}</p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/5">
        <Link
          to="/notifications"
          onClick={onClose}
          className="block text-center text-xs text-primary hover:text-primary/80 transition-colors font-medium"
        >
          Lihat semua notifikasi
        </Link>
      </div>
    </div>
  )
}

// ─── Route label map ──────────────────────────────────────────────────────────
const ROUTE_LABELS: Record<string, string> = {
  dashboard:       'Dashboard',
  sekolah:         'Data Sekolah',
  kelas:           'Data Kelas',
  siswa:           'Data Siswa',
  guru:            'Data Guru',
  mapel:           'Mata Pelajaran',
  jadwal:          'Jadwal Pelajaran',
  absensi:         'Absensi',
  settings:        'Pengaturan',
  'jadwal-mengajar': 'Jadwal Mengajar',
  nilai:           'Nilai Siswa',
  'absensi-kelas': 'Absensi Kelas',
  'jadwal-siswa':  'Jadwal Pelajaran',
  'nilai-siswa':   'Nilai',
  kehadiran:       'Kehadiran',
  notifications:   'Notifikasi',
}

function routeLabel(segment: string) {
  return ROUTE_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
}

// ─── Main Layout ─────────────────────────────────────────────────────────────
export default function MainLayout() {
  const location = useLocation()
  const paths = location.pathname.split('/').filter(Boolean)

  const [notifs, setNotifs] = useState<Notification[]>(MOCK_NOTIFS)
  const [open, setOpen] = useState(false)

  const unreadCount = notifs.filter(n => !n.read).length

  const markRead = (id: number) =>
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))

  const markAllRead = () =>
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* ── Top Header ──────────────────────────────────────────────────── */}
        <header className="glass-header flex h-16 shrink-0 items-center justify-between gap-4 px-4 sm:px-6 sticky top-0 z-30 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          {/* Left: trigger + breadcrumb */}
          <div className="flex items-center gap-2 min-w-0">
            <SidebarTrigger className="-ml-1 shrink-0" />
            <Separator orientation="vertical" className="mr-1 h-4 shrink-0" />
            <Breadcrumb className="min-w-0">
              <BreadcrumbList className="flex-nowrap">
                {paths.map((segment, index) => {
                  const url = `/${paths.slice(0, index + 1).join('/')}`
                  const isLast = index === paths.length - 1
                  const label = routeLabel(segment)

                  return (
                    <React.Fragment key={url}>
                      <BreadcrumbItem className={isLast ? 'block' : 'hidden md:block'}>
                        {isLast ? (
                          <BreadcrumbPage className="font-semibold text-foreground/90 truncate max-w-[160px]">
                            {label}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link to={url} className="truncate max-w-[120px]">{label}</Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
                    </React.Fragment>
                  )
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Right: notification bell */}
          <div className="relative shrink-0">
            <button
              id="notif-bell"
              onClick={() => setOpen(v => !v)}
              className={`relative flex items-center justify-center w-9 h-9 rounded-xl border transition-all duration-200 ${
                open
                  ? 'border-primary/40 bg-primary/15 text-primary'
                  : 'border-white/8 bg-white/4 hover:bg-white/8 hover:border-white/12 text-muted-foreground hover:text-foreground'
              }`}
              aria-label="Notifikasi"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1 shadow-md">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {open && (
              <>
                {/* Click-away backdrop */}
                <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                <div className="relative z-50">
                  <NotificationPanel
                    notifs={notifs}
                    onRead={markRead}
                    onReadAll={markAllRead}
                    onClose={() => setOpen(false)}
                  />
                </div>
              </>
            )}
          </div>
        </header>

        {/* ── Page content ────────────────────────────────────────────────── */}
        <main className="flex flex-1 flex-col p-4 md:p-6 lg:p-8 bg-muted/20">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
