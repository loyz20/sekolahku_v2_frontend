import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/AuthContext"
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarDays,
  Settings,
  LogOut,
  ChevronUp,
  School,
  ClipboardCheck,
  ShieldCheck,
  Building2,
  Layers,
  User,
  Sparkles,
  UserCog,
} from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"

// ─── Role helpers ─────────────────────────────────────────────────────────────
const ROLE_META: Record<string, { label: string; color: string; bg: string; initials: (r: string) => string }> = {
  superadmin: { label: 'Super Admin', color: 'text-amber-400', bg: 'bg-amber-500/15 border border-amber-500/25', initials: () => 'SA' },
  admin:      { label: 'Admin Sekolah', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border border-emerald-500/25', initials: () => 'AD' },
  guru:       { label: 'Tenaga Pendidik', color: 'text-violet-400', bg: 'bg-violet-500/15 border border-violet-500/25', initials: () => 'GR' },
  siswa:      { label: 'Peserta Didik', color: 'text-sky-400',     bg: 'bg-sky-500/15 border border-sky-500/25',       initials: () => 'SW' },
  orang_tua:  { label: 'Orang Tua', color: 'text-pink-400',        bg: 'bg-pink-500/15 border border-pink-500/25',       initials: () => 'OT' },
}

function getRoleMeta(role: string) {
  return ROLE_META[role] ?? { label: role, color: 'text-primary', bg: 'bg-primary/15 border border-primary/25', initials: () => 'U' }
}

// ─── Menu config ──────────────────────────────────────────────────────────────
type MenuItem = { title: string; url: string; icon: React.ElementType }

const COMMON: MenuItem[] = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
]

const SUPERADMIN_ITEMS: MenuItem[] = [
  { title: 'Data Sekolah',     url: '/sekolah', icon: Building2 },
]

const ADMIN_ITEMS: MenuItem[] = [
  { title: 'Data Kelas',       url: '/kelas',   icon: Layers },
  { title: 'Data Siswa',       url: '/siswa',   icon: Users },
  { title: 'Data Guru',        url: '/guru',    icon: GraduationCap },
  { title: 'Mata Pelajaran',   url: '/mapel',   icon: BookOpen },
  { title: 'Jadwal Pelajaran', url: '/jadwal',  icon: CalendarDays },
  { title: 'Absensi',          url: '/absensi', icon: ClipboardCheck },
]

const ADMIN_SYSTEM: MenuItem[] = [
  { title: 'Data Pengguna', url: '/users',    icon: UserCog },
  { title: 'Pengaturan',   url: '/settings', icon: Settings },
]

const GURU_ITEMS: MenuItem[] = [
  { title: 'Jadwal Mengajar', url: '/jadwal-mengajar', icon: CalendarDays },
  { title: 'Nilai Siswa',     url: '/nilai',           icon: BookOpen },
  { title: 'Absensi Kelas',   url: '/absensi-kelas',  icon: ClipboardCheck },
]

const SISWA_ITEMS: MenuItem[] = [
  { title: 'Jadwal Pelajaran', url: '/jadwal-siswa', icon: CalendarDays },
  { title: 'Nilai',            url: '/nilai-siswa',  icon: BookOpen },
  { title: 'Kehadiran',        url: '/kehadiran',    icon: ClipboardCheck },
]

// ─── Menu section ─────────────────────────────────────────────────────────────
function MenuSection({
  label,
  items,
  pathname,
}: {
  label?: string
  items: MenuItem[]
  pathname: string
}) {
  return (
    <SidebarGroup>
      {label && (
        <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-1">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.url || pathname.startsWith(item.url + '/')
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.title}
                  className={`
                    group relative gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-primary/15 text-primary shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
                      : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}
                  `}
                >
                  <Link to={item.url}>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
                    )}
                    <item.icon className={`size-4 shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function AppSidebar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const role = user?.role ?? ''
  const meta = getRoleMeta(role)
  const username = user?.username ?? 'Pengguna'
  const avatarInitial = username.charAt(0).toUpperCase()

  const mainItems = (() => {
    switch(role) {
      case 'superadmin': return [...COMMON, ...SUPERADMIN_ITEMS]
      case 'admin': return [...COMMON, ...ADMIN_ITEMS]
      case 'guru': return [...COMMON, ...GURU_ITEMS]
      case 'siswa': return [...COMMON, ...SISWA_ITEMS]
      case 'orang_tua': return COMMON // placeholder for orang_tua
      default: return COMMON
    }
  })()
  const systemItems = ['superadmin', 'admin'].includes(role) ? ADMIN_SYSTEM : []

  return (
    <Sidebar variant="inset" className="border-r border-white/5">
      {/* ── Logo Header ──────────────────────────────────────────────────────── */}
      <SidebarHeader className="h-16 flex items-center border-b border-white/5 px-4">
        <Link to="/dashboard" className="flex items-center gap-3 w-full overflow-hidden group">
          <div className="flex aspect-square size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_16px_rgba(0,0,0,0.3)] group-hover:scale-105 transition-transform">
            <School className="size-4" />
          </div>
          <div className="flex flex-col leading-tight overflow-hidden">
            <span className="font-bold text-base truncate">Sekolahku</span>
            <span className="text-[10px] text-muted-foreground truncate">Sistem Informasi Sekolah</span>
          </div>
        </Link>
      </SidebarHeader>

      {/* ── Navigation ───────────────────────────────────────────────────────── */}
      <SidebarContent className="gap-0 py-3 px-2">
        <MenuSection label="Menu Utama" items={mainItems} pathname={location.pathname} />
        {systemItems.length > 0 && (
          <MenuSection label="Sistem" items={systemItems} pathname={location.pathname} />
        )}
      </SidebarContent>

      {/* ── Footer / User card ───────────────────────────────────────────────── */}
      <SidebarFooter className="border-t border-white/5 p-3">
        {/* Role badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg mb-2 ${meta.bg}`}>
          <ShieldCheck className={`w-3 h-3 shrink-0 ${meta.color}`} />
          <span className={`text-[11px] font-semibold ${meta.color}`}>{meta.label}</span>
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="rounded-xl border border-white/5 bg-white/3 hover:bg-white/6 data-[state=open]:bg-white/6 transition-all"
                >
                  {/* Avatar */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/20 border border-primary/25 text-primary font-bold text-sm">
                    {avatarInitial}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight overflow-hidden">
                    <span className="truncate font-semibold">{username}</span>
                    <span className="truncate text-xs text-muted-foreground capitalize">{role}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="top"
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-xl border border-white/10 bg-card/95 backdrop-blur-xl shadow-2xl p-1"
              >
                {/* User info header in dropdown */}
                <div className="px-3 py-2.5 mb-1">
                  <p className="text-sm font-semibold">{username}</p>
                  <p className={`text-xs font-medium ${meta.color}`}>{meta.label}</p>
                </div>
                <DropdownMenuSeparator className="bg-white/5" />

                <DropdownMenuItem asChild className="gap-2.5 cursor-pointer rounded-lg my-0.5 px-3 py-2">
                  <Link to="/settings">
                    <User className="size-4 text-muted-foreground" />
                    <span>Profil Saya</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="gap-2.5 cursor-pointer rounded-lg my-0.5 px-3 py-2">
                  <Link to="/settings">
                    <Sparkles className="size-4 text-muted-foreground" />
                    <span>Pengaturan</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-white/5" />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="gap-2.5 cursor-pointer rounded-lg my-0.5 px-3 py-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="size-4" />
                  <span>Keluar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
