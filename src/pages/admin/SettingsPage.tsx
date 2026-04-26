import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  User,
  Shield,
  Bell,
  LogOut,
  Laptop2,
  Camera,
  Eye,
  EyeOff,
  Smartphone,
  Globe,
  Clock,
  AlertTriangle,
  Mail,
  MessageSquare,
  ChevronRight,
  Settings,
  Building2,
  Lock,
  Sparkles,
  SmartphoneNfc,
  Info,
  MapPin,
  Save
} from 'lucide-react';
import { PageHero } from '@/components/shared/PageHero';
import { showToast } from '@/lib/toast-utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

// ─── Types ──────────────────────────────────────────────────────────────────
type Tab = 'profile' | 'security' | 'school' | 'notifications';

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
      className={`group relative flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${active
        ? 'bg-primary/15 text-primary border border-primary/20 shadow-lg shadow-primary/5'
        : 'text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent'
        }`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${active ? 'bg-primary text-primary-foreground rotate-0' : 'bg-white/5 group-hover:bg-white/10 rotate-3 group-hover:rotate-0'}`}>
        <Icon className="w-4 h-4" />
      </div>
      <span>{label}</span>
      {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-primary animate-in slide-in-from-left-2" />}
    </button>
  );
}

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md shadow-2xl overflow-hidden group/card transition-all duration-500 hover:border-white/10">
      <div className="px-8 py-6 border-b border-white/5 flex items-center gap-4 bg-gradient-to-r from-white/[0.02] to-transparent">
        {Icon && (
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover/card:scale-110 transition-transform duration-500">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
        <div>
          <h3 className="text-base font-black tracking-tight uppercase">{title}</h3>
          {description && <p className="text-xs text-muted-foreground mt-0.5 font-medium">{description}</p>}
        </div>
      </div>
      <div className="p-8">{children}</div>
    </div>
  );
}

// ─── Tab Panels ──────────────────────────────────────────────────────────────

function ProfileTab() {
  const { user, setUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get<any>('/auth/me');
        setFormData({
          nama: res.data.nama || '',
          email: res.data.email || '',
          phone: res.data.phone || ''
        });
      } catch (e) {
        console.error('Failed to fetch profile', e);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put<any>('/auth/me', formData);
      // Update global auth context so sidebar/dashboard update immediately
      if (user) {
        setUser({
          ...user,
          nama: res.data.nama,
          email: res.data.email,
          phone: res.data.phone
        });
      }
      showToast.success('Profil berhasil diperbarui');
    } catch (e) {
      showToast.error('Gagal memperbarui profil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Avatar Hero */}
      <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-primary/15 via-zinc-900/60 to-zinc-900/40 backdrop-blur-xl p-8 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden group/hero">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -mr-32 -mt-32 rounded-full" />

        <div className="relative shrink-0">
          <div className="w-32 h-32 rounded-[2rem] bg-zinc-900 border-4 border-white/5 flex items-center justify-center shadow-2xl relative overflow-hidden group/avatar">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
            <div className="text-4xl font-black text-primary">
              {formData.nama?.charAt(0) || user?.username?.charAt(0) || 'A'}
            </div>
          </div>
          <button className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-xl hover:bg-primary/80 transition-all hover:scale-110 border-4 border-zinc-900">
            <Camera className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>

        <div className="text-center md:text-left space-y-3 pt-2">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white uppercase">{user?.username || 'Administrator'}</h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/20">
                <Shield className="w-3 h-3" /> {user?.role?.toUpperCase() || 'ADMIN'}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest px-3 py-1 rounded-full bg-white/5 text-muted-foreground border border-white/5">
                <Info className="w-3 h-3" /> ID: {user?.id?.split('-')[0]}
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed font-medium">
            Atur identitas digital Anda untuk sinkronisasi data personil di seluruh sistem akademik.
          </p>
        </div>
      </div>

      <SectionCard title="Data Personalia" description="Informasi dasar yang terhubung dengan akun Anda" icon={User}>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Username Login</Label>
            <Input defaultValue={user?.username} className="bg-white/5 border-white/10 h-12 rounded-2xl font-bold opacity-70 cursor-not-allowed" readOnly />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Nama Lengkap</Label>
            <Input
              value={formData.nama}
              onChange={e => setFormData({ ...formData, nama: e.target.value })}
              placeholder="Masukkan nama lengkap"
              className="bg-white/5 border-white/10 h-12 rounded-2xl font-bold focus:ring-primary/20"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Alamat Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@sekolah.id"
              className="bg-white/5 border-white/10 h-12 rounded-2xl font-bold focus:ring-primary/20"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Nomor WhatsApp</Label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder="08xx xxxx xxxx"
              className="bg-white/5 border-white/10 h-12 rounded-2xl font-bold focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 min-w-[180px] h-12 rounded-2xl font-bold uppercase tracking-tight shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90"
          >
            {saving ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <><Sparkles className="w-4 h-4" /> Update Profil</>}
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}

function SecurityTab() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: ''
  });
  const [changing, setChanging] = useState(false);
  const strength = getPasswordStrength(passwords.new);

  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const fetchSessions = async () => {
    try {
      const res = await api.get<any>('/auth/sessions');
      setSessions(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = async (id: string) => {
    if (!confirm('Cabut akses perangkat ini? Sesi akan langsung dihentikan.')) return;
    try {
      await api.delete(`/auth/sessions/${id}`);
      showToast.success('Sesi berhasil dicabut');
      fetchSessions();
    } catch (e) {
      showToast.error('Gagal mencabut sesi');
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.new) {
      showToast.error('Semua kolom password harus diisi');
      return;
    }
    if (strength.score < 2) {
      showToast.error('Password baru terlalu lemah');
      return;
    }

    setChanging(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.new
      });
      showToast.success('Password berhasil diperbarui');
      setPasswords({ current: '', new: '' });
    } catch (e: any) {
      showToast.error(e.response?.data?.message || 'Gagal memperbarui password');
    } finally {
      setChanging(false);
    }
  };

  const getDeviceIcon = (ua: string) => {
    if (!ua) return Globe;
    const lower = ua.toLowerCase();
    if (lower.includes('android') || lower.includes('iphone')) return Smartphone;
    return Laptop2;
  };

  const formatUA = (ua: string) => {
    if (!ua) return 'Perangkat Tidak Dikenal';
    let browser = 'Web Browser';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    let os = '';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Macintosh')) os = 'macOS';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone')) os = 'iOS';
    else if (ua.includes('Linux')) os = 'Linux';

    return os ? `${os} · ${browser}` : browser;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <SectionCard title="Kredensial & Sandi" description="Pastikan akun Anda terlindungi dengan sandi yang kuat" icon={Lock}>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Password Saat Ini</Label>
            <div className="relative">
              <Input
                type={showCurrent ? 'text' : 'password'}
                value={passwords.current}
                onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                className="bg-white/5 border-white/10 h-12 rounded-2xl pr-12 font-bold"
              />
              <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Password Baru</Label>
            <div className="relative">
              <Input
                type={showNew ? 'text' : 'password'}
                value={passwords.new}
                onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                className="bg-white/5 border-white/10 h-12 rounded-2xl pr-12 font-bold"
              />
              <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwords.new && (
              <div className="space-y-2 pt-2">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className="h-1.5 flex-1 rounded-full transition-all duration-500"
                      style={{ background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.05)' }}
                    />
                  ))}
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: strength.color }}>Level Keamanan: {strength.label}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleChangePassword}
            disabled={changing}
            className="gap-2 h-12 rounded-2xl font-bold uppercase tracking-tight bg-white/5 hover:bg-white/10 border border-white/10 text-foreground min-w-[180px]"
          >
            {changing ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : 'Ganti Password'}
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Sesi Terhubung" description="Perangkat yang memiliki akses aktif ke akun Anda" icon={SmartphoneNfc}>
        <div className="space-y-3">
          {loadingSessions ? (
            <div className="py-10 flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : sessions.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground font-medium uppercase tracking-widest">Tidak ada sesi aktif lain.</div>
          ) : (
            sessions.map((s) => {
              const Icon = getDeviceIcon(s.user_agent);
              return (
                <div key={s.id} className="flex items-center justify-between p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all group/session">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover/session:rotate-6 transition-transform">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-foreground">{formatUA(s.user_agent)}</p>
                        {s.current && (
                          <span className="text-[8px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-black uppercase tracking-tighter">Current Session</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] font-medium text-muted-foreground">{s.ip_address || 'Unknown IP'}</p>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
                        <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {s.current ? 'Online Sekarang' : format(new Date(s.created_at), 'dd MMM yyyy', { locale: id })}
                        </div>
                      </div>
                    </div>
                  </div>
                  {!s.current && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevoke(s.id)}
                      className="text-rose-400 hover:text-rose-400 hover:bg-rose-400/10 text-[10px] font-black uppercase tracking-widest rounded-xl"
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </SectionCard>
    </div>
  );
}

function SchoolTab({ user }: { user: any }) {
  const [sekolah, setSekolah] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchSekolah = async () => {
    if (!user?.sekolah_id) return;
    try {
      const res = await api.get<{ data: any }>(`/sekolah/${user.sekolah_id}`);
      setSekolah(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSekolah();
  }, [user]);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await api.put(`/sekolah/${user.sekolah_id}`, sekolah);
      showToast.success('Profil sekolah berhasil diperbarui');
    } catch (e) {
      showToast.error('Gagal memperbarui profil sekolah');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('logo', file);

    setUploading(true);
    try {
      await api.post(`/sekolah/${user.sekolah_id}/logo`, uploadData);
      showToast.success('Logo berhasil diperbarui');
      fetchSekolah();
    } catch (e) {
      showToast.error('Gagal mengunggah logo');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-20 flex justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (!sekolah) {
    return (
      <div className="rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md p-12 text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-amber-500" />
        </div>
        <h3 className="text-xl font-black uppercase tracking-tight text-white">Profil Sekolah Tidak Tersedia</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto font-medium">Akun Anda tidak terhubung dengan institusi manapun atau data sekolah belum dikonfigurasi oleh Super Admin.</p>
        <div className="pt-4">
          <Button variant="outline" className="rounded-2xl border-white/10 hover:bg-white/5" onClick={() => window.location.reload()}>
            Coba Segarkan Halaman
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <SectionCard title="Identitas Institusi" description="Kelola profil publik dan informasi legal sekolah" icon={Building2}>
        <div className="space-y-8">
          {/* Logo Upload */}
          <div className="flex flex-col md:flex-row items-center gap-8 p-6 rounded-3xl bg-white/[0.02] border border-white/5">
            <div
              className="w-24 h-24 rounded-3xl bg-zinc-900 border-2 border-dashed border-white/10 flex items-center justify-center text-muted-foreground group hover:border-primary/50 transition-colors cursor-pointer shrink-0 relative overflow-hidden"
              onClick={() => document.getElementById('logo-upload')?.click()}
            >
              {sekolah.logo_url ? (
                <img src={`${import.meta.env.VITE_API_URL}${sekolah.logo_url}`} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <div className="text-center">
                  <Camera className="w-6 h-6 mx-auto mb-1 opacity-40 group-hover:opacity-100 group-hover:text-primary transition-all" />
                  <span className="text-[8px] font-black uppercase tracking-tighter">Logo</span>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="space-y-1 text-center md:text-left">
              <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={handleLogoUpload} />
              <p className="text-sm font-black uppercase tracking-tight text-white">Logo Sekolah</p>
              <p className="text-xs text-muted-foreground font-medium">Resolusi disarankan 512x512px. Mendukung PNG, JPG, atau WebP.</p>
              <Button
                variant="outline"
                size="sm"
                className="h-8 mt-2 text-[10px] font-bold border-white/10 rounded-xl px-4"
                onClick={() => document.getElementById('logo-upload')?.click()}
                disabled={uploading}
              >
                {uploading ? 'Mengunggah...' : 'Upload Baru'}
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Nama Resmi Sekolah</Label>
                <Input value={sekolah?.nama || ''} onChange={e => setSekolah({ ...sekolah, nama: e.target.value })} className="bg-white/5 border-white/10 h-12 rounded-2xl font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">NPSN</Label>
                <Input value={sekolah?.npsn || ''} onChange={e => setSekolah({ ...sekolah, npsn: e.target.value })} className="bg-white/5 border-white/10 h-12 rounded-2xl font-bold" />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Status</Label>
                <select
                  value={sekolah?.status || 'Negeri'}
                  onChange={e => setSekolah({ ...sekolah, status: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 h-12 rounded-2xl font-bold px-4 text-sm focus:ring-1 focus:ring-primary/40 focus:outline-none"
                >
                  <option value="Negeri">Negeri</option>
                  <option value="Swasta">Swasta</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Akreditasi</Label>
                <Input value={sekolah?.akreditasi || ''} onChange={e => setSekolah({ ...sekolah, akreditasi: e.target.value })} placeholder="A / B / C" className="bg-white/5 border-white/10 h-12 rounded-2xl font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Kepala Sekolah</Label>
                <Input value={sekolah?.kepala_sekolah || ''} onChange={e => setSekolah({ ...sekolah, kepala_sekolah: e.target.value })} className="bg-white/5 border-white/10 h-12 rounded-2xl font-bold" />
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Lokasi & Wilayah</p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Alamat Lengkap</Label>
                  <textarea
                    value={sekolah?.alamat || ''}
                    onChange={e => setSekolah({ ...sekolah, alamat: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl font-bold p-4 text-sm focus:ring-1 focus:ring-primary/40 focus:outline-none min-h-[80px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Provinsi</Label>
                    <Input value={sekolah?.provinsi || ''} onChange={e => setSekolah({ ...sekolah, provinsi: e.target.value })} className="bg-white/5 border-white/10 h-12 rounded-2xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Kota/Kabupaten</Label>
                    <Input value={sekolah?.kabupaten || ''} onChange={e => setSekolah({ ...sekolah, kabupaten: e.target.value })} className="bg-white/5 border-white/10 h-12 rounded-2xl font-bold" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Kecamatan</Label>
                    <Input value={sekolah?.kecamatan || ''} onChange={e => setSekolah({ ...sekolah, kecamatan: e.target.value })} className="bg-white/5 border-white/10 h-12 rounded-2xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Kelurahan/Desa</Label>
                    <Input value={sekolah?.desa || ''} onChange={e => setSekolah({ ...sekolah, desa: e.target.value })} className="bg-white/5 border-white/10 h-12 rounded-2xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Kode Pos</Label>
                    <Input value={sekolah?.kode_pos || ''} onChange={e => setSekolah({ ...sekolah, kode_pos: e.target.value })} className="bg-white/5 border-white/10 h-12 rounded-2xl font-bold" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-3.5 h-3.5 text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Informasi Kontak & Web</p>
              </div>
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Email Sekolah</Label>
                  <Input type="email" value={sekolah?.email || ''} onChange={e => setSekolah({ ...sekolah, email: e.target.value })} placeholder="admin@sekolah.sch.id" className="bg-white/5 border-white/10 h-12 rounded-2xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">No. Telepon</Label>
                  <Input value={sekolah?.no_telepon || ''} onChange={e => setSekolah({ ...sekolah, no_telepon: e.target.value })} className="bg-white/5 border-white/10 h-12 rounded-2xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Situs Web</Label>
                  <Input value={sekolah?.website || ''} onChange={e => setSekolah({ ...sekolah, website: e.target.value })} placeholder="https://www.sekolah.sch.id" className="bg-white/5 border-white/10 h-12 rounded-2xl font-bold" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleUpdate}
            disabled={saving}
            className="gap-2 min-w-[200px] h-12 rounded-2xl font-bold uppercase tracking-tight shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90"
          >
            {saving ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> Simpan Perubahan</>}
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}

function NotificationsTab() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get<{ data: any }>('/notifications/settings');
        setSettings(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleToggle = async (key: string, value: boolean) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await api.put('/notifications/settings', newSettings);
      showToast.success('Pengaturan berhasil diperbarui');
    } catch (e) {
      console.error(e);
      showToast.error('Gagal memperbarui pengaturan');
      // Rollback
      setSettings(settings);
    }
  };

  if (loading) return <div className="py-20 flex justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const items = [
    { key: 'push_notification', title: 'Push Notification', desc: 'Terima pemberitahuan langsung di browser.', icon: SmartphoneNfc },
    { key: 'email_summary', title: 'Email Summary', desc: 'Laporan aktivitas mingguan dikirim ke email.', icon: Mail },
    { key: 'important_announcement', title: 'Pengumuman Penting', desc: 'Informasi krusial dari manajemen pusat.', icon: MessageSquare },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <SectionCard title="Notifikasi Sistem" description="Pusat kendali pemberitahuan real-time" icon={Bell}>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.key} className="flex items-center justify-between p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-muted-foreground/60" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{item.title}</p>
                  <p className="text-[10px] font-medium text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
              <Switch 
                checked={!!settings[item.key]} 
                onCheckedChange={(val) => handleToggle(item.key, val)}
              />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const tabs: { key: Tab; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
    { key: 'profile', label: 'Profil Akun', icon: User },
    { key: 'security', label: 'Keamanan', icon: Shield },
    { key: 'school', label: 'Profil Sekolah', icon: Building2, adminOnly: true },
    { key: 'notifications', label: 'Notifikasi', icon: Bell },
  ];

  const visibleTabs = tabs.filter(t => !t.adminOnly || user?.role === 'admin' || user?.role === 'superadmin');

  return (
    <div className="w-full p-6 space-y-8 mx-auto animate-in fade-in duration-700 relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[150px] -z-10 rounded-full" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/5 blur-[120px] -z-10 rounded-full" />

      <PageHero
        title="Pengaturan Sistem"
        description="Personalisasi akun, keamanan, dan preferensi operasional sekolah"
        icon={<Settings className="w-5 h-5" />}
        variant="primary"
        breadcrumb="Sistem / Pengaturan"
      />

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-8">
          <div className="p-3 rounded-[2rem] border border-white/5 bg-zinc-900/40 backdrop-blur-md shadow-2xl space-y-2">
            <div className="px-5 py-4 mb-2 border-b border-white/5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Menu Navigasi</p>
            </div>
            {visibleTabs.map(tab => (
              <NavItem
                key={tab.key}
                icon={tab.icon}
                label={tab.label}
                active={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
              />
            ))}

            <div className="pt-4 mt-4 border-t border-white/5 px-2">
              <Button 
                variant="ghost" 
                onClick={async () => {
                  await logout();
                  navigate('/login', { replace: true });
                }}
                className="w-full justify-start gap-3 h-12 rounded-2xl text-rose-400 hover:text-rose-400 hover:bg-rose-400/10 font-bold px-4"
              >
                <LogOut className="w-4 h-4" /> Keluar
              </Button>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'security' && <SecurityTab />}
          {activeTab === 'school' && <SchoolTab user={user} />}
          {activeTab === 'notifications' && <NotificationsTab />}
        </div>
      </div>
    </div>
  );
}
