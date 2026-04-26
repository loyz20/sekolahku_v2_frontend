import { toast } from 'sonner';

/**
 * Custom Toast Utility for Sekolahku V2
 * Provides consistent styling and behavior for all notifications
 */
export const showToast = {
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      className: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 backdrop-blur-xl',
    });
  },
  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      className: 'bg-rose-500/10 border-rose-500/20 text-rose-400 backdrop-blur-xl',
    });
  },
  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      className: 'bg-sky-500/10 border-sky-500/20 text-sky-400 backdrop-blur-xl',
    });
  },
  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      className: 'bg-amber-500/10 border-amber-500/20 text-amber-400 backdrop-blur-xl',
    });
  },
  loading: (message: string) => {
    return toast.loading(message, {
      className: 'bg-zinc-900/80 border-white/10 text-white backdrop-blur-xl',
    });
  },
  promise: <T>(
    promise: Promise<T>,
    {
      loading = 'Memproses...',
      success = 'Berhasil!',
      error = 'Gagal memproses'
    }: { loading?: string; success?: string | ((data: T) => string); error?: string | ((err: any) => string) }
  ) => {
    return toast.promise(promise, {
      loading,
      success: (data: T) => (typeof success === 'function' ? success(data) : success),
      error: (err: any) => (typeof error === 'function' ? error(err) : error),
    });
  }
};
