import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { 
    Bell, 
    CheckCircle2, 
    AlertTriangle, 
    Info, 
    X, 
    Trash2, 
    Check,
    Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHero } from '@/components/shared/PageHero';
import { DataTable } from '@/components/shared/DataTable';
import { useNotifications } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { showToast } from '@/lib/toast-utils';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    is_read: boolean;
    created_at: string;
}

export default function NotificationPage() {
    const { markAsRead, markAllAsRead, refreshNotifications } = useNotifications();
    const [items, setItems] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, total_pages: 1 });
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const fetchNotifications = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const res = await api.get<any>(`/notifications?page=${page}&limit=${pagination.limit}`);
            setItems(res.data.notifications || []);
            setPagination(res.data.pagination);
        } catch (e) {
            showToast.error('Gagal mengambil notifikasi');
        } finally {
            setLoading(false);
        }
    }, [pagination.limit]);

    useEffect(() => {
        fetchNotifications(1);
    }, [fetchNotifications]);

    const handleMarkRead = async (id: string) => {
        try {
            await markAsRead(id);
            setItems(prev => prev.map(item => item.id === id ? { ...item, is_read: true } : item));
        } catch (e) {
            showToast.error('Gagal memperbarui status');
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllAsRead();
            setItems(prev => prev.map(item => ({ ...item, is_read: true })));
            showToast.success('Semua notifikasi ditandai telah dibaca');
        } catch (e) {
            showToast.error('Gagal memperbarui status');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus notifikasi ini?')) return;
        try {
            await api.delete(`/notifications/${id}`);
            setItems(prev => prev.filter(item => item.id !== id));
            showToast.success('Notifikasi dihapus');
            refreshNotifications();
        } catch (e) {
            showToast.error('Gagal menghapus notifikasi');
        }
    };

    const columns = [
        {
            header: 'Notifikasi',
            render: (n: Notification) => (
                <div className={`flex items-start gap-4 py-1 ${!n.is_read ? 'opacity-100' : 'opacity-60'}`}>
                    <div className={`mt-1 w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        n.type === 'success' ? 'bg-emerald-500/15 text-emerald-400' : 
                        n.type === 'warning' ? 'bg-amber-500/15 text-amber-400' : 
                        n.type === 'error' ? 'bg-rose-500/15 text-rose-400' : 'bg-sky-500/15 text-sky-400'
                    }`}>
                        {n.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
                         n.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
                         n.type === 'error' ? <X className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-foreground truncate">{n.title}</h4>
                            {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.message}</p>
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: idLocale })}
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: 'Aksi',
            align: 'right' as const,
            render: (n: Notification) => (
                <div className="flex items-center justify-end gap-2">
                    {!n.is_read && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleMarkRead(n.id)} 
                            className="h-8 w-8 rounded-xl hover:bg-emerald-500/10 text-emerald-400"
                            title="Tandai telah dibaca"
                        >
                            <Check className="w-4 h-4" />
                        </Button>
                    )}
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(n.id)} 
                        className="h-8 w-8 rounded-xl hover:bg-rose-500/10 text-rose-400"
                        title="Hapus"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            )
        }
    ];

    const filteredItems = filter === 'unread' ? items.filter(n => !n.is_read) : items;

    return (
        <div className="w-full p-4 md:p-8 space-y-8 mx-auto animate-in fade-in duration-700">
            <PageHero
                title="NOTIFIKASI"
                description="Pantau semua pemberitahuan dan aktivitas sistem Anda."
                icon={<Bell className="w-5 h-5" />}
                variant="primary"
                breadcrumb="Core / Notifikasi"
            />

            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
                    <Button 
                        variant={filter === 'all' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        onClick={() => setFilter('all')}
                        className="rounded-xl h-9 px-4 font-bold text-[10px] uppercase tracking-widest"
                    >
                        Semua
                    </Button>
                    <Button 
                        variant={filter === 'unread' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        onClick={() => setFilter('unread')}
                        className="rounded-xl h-9 px-4 font-bold text-[10px] uppercase tracking-widest"
                    >
                        Belum Dibaca
                    </Button>
                </div>

                <Button 
                    variant="outline" 
                    onClick={handleMarkAllRead} 
                    className="h-10 px-6 rounded-xl gap-2 font-black text-[10px] uppercase tracking-widest border-white/10 hover:bg-white/5"
                >
                    <Check className="w-4 h-4 text-emerald-400" /> Tandai Semua Dibaca
                </Button>
            </div>

            <div className="rounded-[2.5rem] bg-zinc-900/40 border border-white/5 backdrop-blur-sm overflow-hidden shadow-2xl">
                <DataTable
                    columns={columns}
                    data={filteredItems}
                    loading={loading}
                    pagination={pagination}
                    onPageChange={fetchNotifications}
                />
            </div>
        </div>
    );
}
