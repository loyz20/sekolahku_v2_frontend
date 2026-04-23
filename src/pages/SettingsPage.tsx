import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  User, Shield, Bell, Palette, KeyRound, LogOut,
  MonitorSmartphone, Sun, Laptop2, Camera, Check,
  Eye, EyeOff, Smartphone, Globe, Clock, AlertTriangle,
  Mail, MessageSquare, BookOpen, ChevronRight,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────
type Tab = 'profile' | 'security' | 'notifications' | 'appearance';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const map = [
    { score: 1, label: 'Lemah', color: '#ef4444' },
    { score: 2, label: 'Cukup', color: '#f97316' },
    { score: 3, label: 'Baik', color: '#eab308' },
    { score: 4, label: 'Kuat', color: '#22c55e' },
  ];
  return map[score - 1] ?? { score: 0, label: '', color: '' };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function NavItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${active
          ? 'bg-primary/15 text-primary'
          : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
        }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
      )}
      <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
      <span>{label}</span>
      {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-primary/60" />}
    </button>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-card/50 backdrop-blur-sm shadow-lg overflow-hidden">
      <div className="px-6 py-5 border-b border-white/5">
        <h3 className="text-base font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function NotificationRow({
  icon: Icon,
  iconColor,
  title,
  desc,
  defaultChecked = false,
}: {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  desc: string;
  defaultChecked?: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-black/20 hover:bg-white/3 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0`} style={{ background: `${iconColor}18` }}>
          <Icon className="w-4 h-4" style={{ color: iconColor }} />
        </div>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={setChecked} />
    </div>
  );
}

// ─── Tab Panels ──────────────────────────────────────────────────────────────

function ProfileTab({ user }: { user: { id?: string; username?: string; role?: string } | null }) {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in-up">
      {/* Avatar Hero */}
      <div className="rounded-2xl border border-white/8 bg-gradient-to-br from-primary/10 via-card/60 to-card/30 backdrop-blur-sm p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative shrink-0">
          <div className="w-24 h-24 rounded-2xl bg-primary/20 border-2 border-primary/30 flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.3)]">
            <User className="w-10 h-10 text-primary" />
          </div>
          <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg hover:bg-primary/80 transition-colors">
            <Camera className="w-3.5 h-3.5 text-primary-foreground" />
          </button>
        </div>
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-bold">{user?.username || 'Administrator'}</h2>
          <span className="inline-flex items-center gap-1.5 mt-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/20">
            {user?.role?.toUpperCase() || 'ADMIN'}
          </span>
          <p className="text-sm text-muted-foreground mt-2">
            JPG, GIF, atau PNG. Maks. 1MB.
          </p>
        </div>
      </div>

      {/* Info form */}
      <SectionCard title="Informasi Pribadi" description="Perbarui detail informasi akun Anda.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="s-username" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Username</Label>
            <Input id="s-username" defaultValue={user?.username} className="bg-black/20 border-white/10 h-11" readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-role" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Peran / Role</Label>
            <Input id="s-role" defaultValue={user?.role?.toUpperCase()} className="bg-black/20 border-white/10 h-11 text-primary font-semibold" readOnly />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="s-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alamat Email</Label>
            <Input id="s-email" type="email" placeholder="contoh@sekolah.id" className="bg-black/20 border-white/10 h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nama Lengkap</Label>
            <Input id="s-name" placeholder="Nama lengkap Anda" className="bg-black/20 border-white/10 h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-phone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">No. Telepon</Label>
            <Input id="s-phone" type="tel" placeholder="+62 8xx xxxx xxxx" className="bg-black/20 border-white/10 h-11" />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSave}
            className="gap-2 min-w-[140px] transition-all"
            style={saved ? { background: '#22c55e' } : {}}
          >
            {saved ? <><Check className="w-4 h-4" /> Tersimpan!</> : 'Simpan Perubahan'}
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}

function SecurityTab() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newPwd, setNewPwd] = useState('');
  const strength = getPasswordStrength(newPwd);

  const sessions = [
    { device: 'Chrome · Windows', icon: Globe, location: 'Jakarta, Indonesia', time: 'Aktif sekarang', current: true },
    { device: 'Firefox · macOS', icon: Laptop2, location: 'Bandung, Indonesia', time: '2 jam lalu', current: false },
    { device: 'Mobile App · Android', icon: Smartphone, location: 'Surabaya, Indonesia', time: '1 hari lalu', current: false },
  ];

  return (
    <div className="space-y-6 animate-in-up">
      {/* Password */}
      <SectionCard title="Ubah Kata Sandi" description="Gunakan kata sandi yang kuat dan unik.">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="s-cur-pwd" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kata Sandi Saat Ini</Label>
            <div className="relative">
              <Input id="s-cur-pwd" type={showCurrent ? 'text' : 'password'} className="bg-black/20 border-white/10 h-11 pr-10" />
              <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="s-new-pwd" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kata Sandi Baru</Label>
            <div className="relative">
              <Input
                id="s-new-pwd"
                type={showNew ? 'text' : 'password'}
                value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
                className="bg-black/20 border-white/10 h-11 pr-10"
              />
              <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Strength meter */}
            {newPwd && (
              <div className="space-y-1.5 pt-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className="h-1.5 flex-1 rounded-full transition-all duration-300"
                      style={{ background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.1)' }}
                    />
                  ))}
                </div>
                <p className="text-xs" style={{ color: strength.color }}>{strength.label}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="s-confirm-pwd" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Konfirmasi Kata Sandi Baru</Label>
            <Input id="s-confirm-pwd" type="password" className="bg-black/20 border-white/10 h-11" />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button className="gap-2">Perbarui Kata Sandi</Button>
        </div>
      </SectionCard>

      {/* 2FA */}
      <SectionCard title="Autentikasi Dua Faktor" description="Tambahkan lapisan keamanan ekstra ke akun Anda.">
        <div className="flex items-start gap-4 p-4 rounded-xl bg-amber-500/8 border border-amber-500/20">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-400">2FA Belum Aktif</p>
            <p className="text-xs text-muted-foreground mt-1">
              Aktifkan autentikasi dua faktor untuk melindungi akun dari akses tidak sah.
            </p>
            <Button variant="outline" size="sm" className="mt-3 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-2">
              <Shield className="w-3.5 h-3.5" />
              Aktifkan 2FA
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* Active Sessions */}
      <SectionCard title="Sesi Aktif" description="Kelola perangkat yang sedang login ke akun Anda.">
        <div className="space-y-3">
          {sessions.map((s, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-black/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                  <s.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{s.device}</p>
                    {s.current && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20 font-semibold">Ini</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground">{s.location}</p>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {s.time}
                    </div>
                  </div>
                </div>
              </div>
              {!s.current && (
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs">
                  Cabut
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-white/5">
          <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2 text-sm">
            <LogOut className="w-4 h-4" />
            Logout dari semua perangkat lain
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}

function NotificationsTab() {
  return (
    <div className="space-y-6 animate-in-up">
      <SectionCard title="Notifikasi Email" description="Kontrol pemberitahuan yang dikirim ke email Anda.">
        <div className="space-y-3">
          <NotificationRow icon={Mail} iconColor="#818cf8" title="Ringkasan Harian" desc="Terima ringkasan aktivitas setiap pagi." defaultChecked />
          <NotificationRow icon={AlertTriangle} iconColor="#f97316" title="Peringatan Keamanan" desc="Notifikasi login baru atau aktivitas mencurigakan." defaultChecked />
          <NotificationRow icon={BookOpen} iconColor="#22c55e" title="Pembaruan Sistem" desc="Info pemeliharaan dan pembaruan aplikasi." />
        </div>
      </SectionCard>

      <SectionCard title="Notifikasi In-App" description="Kontrol notifikasi yang muncul di dalam aplikasi.">
        <div className="space-y-3">
          <NotificationRow icon={MessageSquare} iconColor="#a78bfa" title="Pesan Baru" desc="Notifikasi ketika ada pesan masuk." defaultChecked />
          <NotificationRow icon={Bell} iconColor="#fb923c" title="Pengumuman Sekolah" desc="Pengumuman penting dari admin sekolah." defaultChecked />
          <NotificationRow icon={User} iconColor="#38bdf8" title="Aktivitas Absensi" desc="Update rekap absensi siswa dan guru." />
        </div>
      </SectionCard>
    </div>
  );
}

function AppearanceTab() {
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');

  const themes = [
    { key: 'dark' as const, label: 'Dark Mode', icon: MonitorSmartphone, preview: 'bg-slate-900', iconColor: 'text-slate-300' },
    { key: 'light' as const, label: 'Light Mode', icon: Sun, preview: 'bg-slate-100', iconColor: 'text-slate-600', soon: true },
    { key: 'system' as const, label: 'Ikuti Sistem', icon: Laptop2, preview: 'bg-gradient-to-br from-slate-900 to-slate-400', iconColor: 'text-white' },
  ];

  const accents = [
    { name: 'Indigo', color: '#6366f1' },
    { name: 'Violet', color: '#8b5cf6' },
    { name: 'Cyan', color: '#06b6d4' },
    { name: 'Emerald', color: '#10b981' },
    { name: 'Rose', color: '#f43f5e' },
    { name: 'Amber', color: '#f59e0b' },
  ];
  const [accent, setAccent] = useState('#6366f1');

  return (
    <div className="space-y-6 animate-in-up">
      {/* Theme picker */}
      <SectionCard title="Tema Warna" description="Pilih tampilan antarmuka yang Anda sukai.">
        <div className="grid grid-cols-3 gap-4">
          {themes.map(t => (
            <button
              key={t.key}
              onClick={() => !t.soon && setTheme(t.key)}
              disabled={t.soon}
              className={`relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${theme === t.key
                  ? 'border-primary bg-primary/10'
                  : 'border-white/5 bg-black/20 hover:border-white/15'
                } ${t.soon ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {theme === t.key && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
              <div className={`w-12 h-12 rounded-xl ${t.preview} border border-white/10 flex items-center justify-center`}>
                <t.icon className={`w-6 h-6 ${t.iconColor}`} />
              </div>
              <span className="text-sm font-medium">{t.label}</span>
              {t.soon && <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/40 text-muted-foreground">Segera</span>}
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Accent color */}
      <SectionCard title="Warna Aksen" description="Kustomisasi warna utama antarmuka.">
        <div className="flex flex-wrap gap-3">
          {accents.map(a => (
            <button
              key={a.name}
              onClick={() => setAccent(a.color)}
              title={a.name}
              className="relative w-9 h-9 rounded-xl transition-transform hover:scale-110 border-2"
              style={{
                background: a.color,
                borderColor: accent === a.color ? a.color : 'transparent',
                boxShadow: accent === a.color ? `0 0 12px ${a.color}60` : 'none',
              }}
            >
              {accent === a.color && (
                <Check className="w-4 h-4 text-white absolute inset-0 m-auto drop-shadow" />
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Perubahan warna aksen akan diterapkan di seluruh antarmuka.
        </p>
      </SectionCard>

      {/* Display settings */}
      <SectionCard title="Preferensi Tampilan">
        <div className="space-y-3">
          {[
            { title: 'Animasi antarmuka', desc: 'Aktifkan transisi dan animasi halaman.' },
            { title: 'Tampilan kompak', desc: 'Kurangi jarak antar elemen untuk lebih banyak konten.' },
            { title: 'Font besar', desc: 'Perbesar ukuran teks untuk keterbacaan lebih baik.' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-black/20">
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
              <Switch defaultChecked={i === 0} />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'profile', label: 'Profil Akun', icon: User },
    { key: 'security', label: 'Keamanan', icon: Shield },
    { key: 'notifications', label: 'Notifikasi', icon: Bell },
    { key: 'appearance', label: 'Tampilan', icon: Palette },
  ];

  return (
    <div className="flex flex-col gap-8 pb-10 relative animate-in-up">
      {/* Ambient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/8 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/3 w-72 h-72 bg-indigo-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Pengaturan</h1>
        <p className="text-muted-foreground">Kelola preferensi akun, keamanan, dan sistem Anda.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 md:gap-8 md:items-start w-full">
        {/* Sidebar nav */}
        <aside className="w-full md:w-56 lg:w-64 shrink-0 md:sticky md:top-4">
          <div className="rounded-2xl border border-white/8 bg-card/50 backdrop-blur-sm p-2 space-y-1">
            {tabs.map(tab => (
              <NavItem
                key={tab.key}
                icon={tab.icon}
                label={tab.label}
                active={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
              />
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'profile' && <ProfileTab user={user} />}
          {activeTab === 'security' && <SecurityTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'appearance' && <AppearanceTab />}
        </div>
      </div>
    </div>
  );
}
