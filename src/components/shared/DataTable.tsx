import React from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Column<T> {
  header: string;
  accessor?: keyof T;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
  width?: string;
  align?: 'left' | 'right' | 'center';
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-white/5 ${className}`} />;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  loading = false,
  pagination,
  onPageChange,
  search,
  onSearchChange,
  searchPlaceholder = "Cari data...",
  emptyMessage = "Tidak ada data ditemukan.",
  emptyIcon
}: DataTableProps<T>) {
  return (
    <div className="rounded-2xl border border-white/8 bg-card/50 backdrop-blur-sm shadow-lg overflow-hidden">
      {/* Toolbar */}
      {(onSearchChange !== undefined || pagination !== undefined) && (
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
          {onSearchChange !== undefined && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={search}
                onChange={e => onSearchChange(e.target.value)}
                className="pl-9 bg-black/20 border-white/10 h-9 focus-visible:ring-primary/20"
              />
            </div>
          )}
          {pagination && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              {pagination.total} total data
            </span>
          )}
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">
              <th className="px-5 py-3 text-left w-12">No</th>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`px-5 py-3 ${col.className || ''} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: pagination?.limit || 5 }).map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td className="px-5 py-4"><Skeleton className="h-4 w-6" /></td>
                  {columns.map((col, j) => (
                    <td key={j} className="px-5 py-4">
                      <Skeleton className={`h-4 ${col.width || 'w-24'} ${col.align === 'right' ? 'ml-auto' : col.align === 'center' ? 'mx-auto' : ''}`} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-5 py-14 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-muted-foreground/40">
                      {emptyIcon || <Search className="w-6 h-6" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr key={item.id} className="border-b border-white/5 hover:bg-white/3 transition-colors group">
                  <td className="px-5 py-3.5 text-xs font-medium text-muted-foreground">
                    {pagination ? (pagination.page - 1) * pagination.limit + idx + 1 : idx + 1}
                  </td>
                  {columns.map((col, j) => (
                    <td
                      key={j}
                      className={`px-5 py-3.5 ${col.className || ''} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                    >
                      {col.render ? col.render(item, idx) : (col.accessor ? String(item[col.accessor]) : null)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.total_pages > 1 && onPageChange && (
        <div className="flex items-center justify-between px-5 py-4 border-t border-white/5">
          <p className="text-xs text-muted-foreground">
            Halaman <span className="font-semibold text-foreground">{pagination.page}</span> dari <span className="font-semibold text-foreground">{pagination.total_pages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg border border-white/8 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.total_pages}
              className="p-1.5 rounded-lg border border-white/8 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
