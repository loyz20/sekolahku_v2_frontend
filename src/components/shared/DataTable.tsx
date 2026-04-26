import React from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Column<T> {
  header: React.ReactNode;
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
  onLimitChange?: (limit: number) => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  
  // Selection
  selectable?: boolean;
  selectedIds?: (string | number)[];
  onSelectionChange?: (ids: (string | number)[]) => void;

  // Sorting
  sortField?: string;
  sortDirection?: 'ASC' | 'DESC';
  onSort?: (field: string) => void;

  // Additional Toolbar
  renderToolbar?: () => React.ReactNode;
  hideHeader?: boolean;
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
  onLimitChange,
  search,
  onSearchChange,
  searchPlaceholder = "Cari data...",
  emptyMessage = "Tidak ada data ditemukan.",
  emptyIcon,
  selectable,
  selectedIds = [],
  onSelectionChange,
  sortField,
  sortDirection,
  onSort,
  renderToolbar,
  hideHeader = false
}: DataTableProps<T>) {
  const isAllSelected = data.length > 0 && selectedIds.length === data.length;
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected;

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map(item => item.id));
    }
  };

  const handleSelectOne = (id: string | number) => {
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  // Pagination Helpers
  const getPageNumbers = () => {
    if (!pagination) return [];
    const { page, total_pages } = pagination;
    const pages = [];
    
    if (total_pages <= 7) {
      for (let i = 1; i <= total_pages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 4) pages.push('...');
      
      const start = Math.max(2, page - 1);
      const end = Math.min(total_pages - 1, page + 1);
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      
      if (page < total_pages - 3) pages.push('...');
      if (!pages.includes(total_pages)) pages.push(total_pages);
    }
    return pages;
  };

  return (
    <div className="rounded-2xl border border-white/8 bg-card/50 backdrop-blur-sm shadow-lg overflow-hidden">
      {/* Toolbar */}
      {!hideHeader && (onSearchChange !== undefined || pagination !== undefined || renderToolbar) && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-white/5">
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
          <div className="flex items-center gap-3 ml-auto">
            {renderToolbar && renderToolbar()}
            {pagination && (
              <span className="text-xs text-muted-foreground hidden lg:block">
                {pagination.total} total data
              </span>
            )}
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-white/[0.03] to-transparent border-b border-white/5 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/50">
              {selectable && (
                <th className="px-6 py-5 text-left w-10">
                  <input
                    type="checkbox"
                    className="rounded-md border-white/10 bg-white/5 text-primary focus:ring-primary/20 cursor-pointer w-4 h-4"
                    checked={isAllSelected}
                    ref={input => {
                      if (input) input.indeterminate = isSomeSelected;
                    }}
                    onChange={handleSelectAll}
                  />
                </th>
              )}
              <th className="px-6 py-5 text-left w-14">
                <span className="opacity-50">NO</span>
              </th>
              {columns.map((col, i) => {
                const isSortable = !!onSort && !!col.accessor;
                const isSorted = sortField === col.accessor;
                
                return (
                  <th
                    key={i}
                    className={`px-6 py-5 ${col.className || ''} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${isSortable ? 'cursor-pointer hover:text-primary transition-all duration-300' : ''}`}
                    style={{ width: col.width }}
                    onClick={() => isSortable && onSort(col.accessor as string)}
                  >
                    <div className={`flex items-center gap-2 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : ''}`}>
                      <span className={`${isSorted ? 'text-primary' : ''}`}>
                        {col.header}
                      </span>
                      {isSortable && (
                        <div className="flex flex-col opacity-30 group-hover:opacity-100 transition-opacity">
                          <ChevronUp className={`w-2.5 h-2.5 -mb-0.5 ${isSorted && sortDirection === 'ASC' ? 'text-primary opacity-100' : ''}`} />
                          <ChevronDown className={`w-2.5 h-2.5 ${isSorted && sortDirection === 'DESC' ? 'text-primary opacity-100' : ''}`} />
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: pagination?.limit || 5 }).map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  {selectable && <td className="px-5 py-4"><Skeleton className="h-4 w-4" /></td>}
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
                <td colSpan={columns.length + (selectable ? 2 : 1)} className="px-5 py-14 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-muted-foreground/40">
                      {emptyIcon || <Search className="w-6 h-6" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, idx) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <tr 
                    key={item.id} 
                    className={`border-b border-white/[0.03] transition-all duration-300 group ${isSelected ? 'bg-primary/5' : 'hover:bg-white/[0.02] hover:border-white/10'}`}
                  >
                    {selectable && (
                      <td className="px-5 py-3.5">
                        <input
                          type="checkbox"
                          className="rounded border-white/20 bg-black/20 text-primary focus:ring-primary/20 cursor-pointer"
                          checked={isSelected}
                          onChange={() => handleSelectOne(item.id)}
                        />
                      </td>
                    )}
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
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && onPageChange && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-4 border-t border-white/5 gap-4">
          <div className="flex items-center gap-4">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
              Menampilkan <span className="text-foreground font-bold">{(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)}</span> dari <span className="text-foreground font-bold">{pagination.total}</span> data
            </p>
            
            {onLimitChange && (
              <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Baris:</span>
                <select 
                  className="bg-transparent border-none text-xs focus:ring-0 cursor-pointer text-foreground font-bold"
                  value={pagination.limit}
                  onChange={e => onLimitChange(Number(e.target.value))}
                >
                  {[5, 10, 25, 50, 100].map(l => (
                    <option key={l} value={l} className="bg-card">{l}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg border border-white/8 hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              title="Halaman Pertama"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg border border-white/8 hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 px-1">
              {getPageNumbers().map((p, i) => (
                p === '...' ? (
                  <span key={`dots-${i}`} className="px-2 text-muted-foreground/40 text-xs">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => onPageChange(p as number)}
                    className={`min-w-[32px] h-8 text-xs font-bold rounded-lg transition-all ${pagination.page === p ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'hover:bg-white/5 text-muted-foreground hover:text-foreground'}`}
                  >
                    {p}
                  </button>
                )
              ))}
            </div>

            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.total_pages}
              className="p-1.5 rounded-lg border border-white/8 hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(pagination.total_pages)}
              disabled={pagination.page >= pagination.total_pages}
              className="p-1.5 rounded-lg border border-white/8 hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              title="Halaman Terakhir"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 ml-2 pl-4 border-l border-white/10">
               <span className="text-[10px] font-bold text-muted-foreground uppercase">Ke Hal:</span>
               <input 
                key={pagination.page}
                type="number"
                min={1}
                max={pagination.total_pages}
                defaultValue={pagination.page}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = Number((e.target as HTMLInputElement).value);
                    if (val >= 1 && val <= pagination.total_pages) {
                      onPageChange(val);
                    }
                  }
                }}
                className="w-12 h-8 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-center focus:ring-1 focus:ring-primary/40 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
               />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
