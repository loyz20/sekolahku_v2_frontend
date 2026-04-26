import React from 'react';
import { Search, Filter, ChevronDown, Download, Trash2, Plus, Upload, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FilterOption {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  icon?: React.ElementType;
}

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterOption[];
  onExport?: () => void;
  exportTooltip?: string;
  onImport?: () => void;
  importTooltip?: string;
  onTemplate?: () => void;
  templateTooltip?: string;
  templateIcon?: React.ElementType;
  onAdd?: () => void;
  addTooltip?: string;
  addIcon?: React.ElementType;
  loading?: boolean;
  selectedCount?: number;
  onBulkDelete?: () => void;
}

/**
 * FilterBar Component
 * A premium, glassmorphic search and filter bar for data tables.
 * Supports search input, multiple dropdown filters, and action buttons.
 */
export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Cari data...",
  filters = [],
  onExport,
  selectedCount = 0,
  onBulkDelete,
  onTemplate,
  templateTooltip = "Unduh Template Excel",
  onImport,
  importTooltip = "Import dari Excel",
  onAdd,
  addTooltip = "Tambah Data Baru",
  exportTooltip = "Export ke Excel",
  addIcon,
  templateIcon,
  loading = false,
}: FilterBarProps) {
  return (
    <TooltipProvider>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/40 p-3 rounded-[2rem] border border-white/5 backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-top-2 duration-500">
        {/* Search Section */}
        <div className="flex items-center gap-3 flex-1 px-3">
          {selectedCount > 0 ? (
            <div className="flex items-center gap-3 animate-in slide-in-from-left-4 duration-300">
              <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-2xl">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-widest text-primary">
                  {selectedCount} Item Terpilih
                </span>
              </div>
              {onBulkDelete && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="h-9 rounded-2xl font-black text-[10px] uppercase tracking-widest gap-2 px-5 shadow-lg shadow-destructive/20 border border-destructive/30" 
                  onClick={onBulkDelete}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Massal
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 w-full group">
              <Search className="w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                className="bg-transparent border-none text-sm focus:ring-0 w-full placeholder:text-muted-foreground/30 font-bold tracking-tight text-foreground/90"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Filters & Actions Section */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {filters.map((filter, idx) => {
            const Icon = filter.icon || Filter;
            const activeOption = filter.options.find(o => o.value === filter.value);
            const displayLabel = activeOption && filter.value !== '' ? activeOption.label : filter.label;
            const isFiltered = filter.value !== '';
            
            return (
              <DropdownMenu key={idx}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className={`h-11 px-5 rounded-2xl border transition-all duration-300 gap-3 group whitespace-nowrap
                      ${isFiltered 
                        ? 'bg-primary/10 border-primary/20 text-primary' 
                        : 'bg-white/[0.03] border-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    <div className={`p-1 rounded-lg transition-colors ${isFiltered ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground/40 group-hover:text-muted-foreground'}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.15em]">{displayLabel}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isFiltered ? 'text-primary/40' : 'text-muted-foreground/20 group-hover:text-muted-foreground/40'}`} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl border-white/10 bg-zinc-900/95 backdrop-blur-xl p-2 shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="px-2 py-1.5 mb-1 border-b border-white/5">
                     <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{filter.label}</p>
                  </div>
                  {filter.options.map((opt) => (
                    <DropdownMenuItem
                      key={opt.value}
                      className={`rounded-xl text-xs font-bold uppercase tracking-tight py-3 px-3 mb-1 cursor-pointer transition-colors
                        ${filter.value === opt.value 
                          ? 'text-primary bg-primary/10 focus:bg-primary/20 focus:text-primary' 
                          : 'text-muted-foreground hover:text-foreground focus:bg-white/5'
                        }`}
                      onClick={() => filter.onChange(opt.value)}
                    >
                      <div className="flex items-center justify-between w-full">
                         {opt.label}
                         {filter.value === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}

          <div className="flex items-center gap-1.5 ml-2 border-l border-white/10 pl-3">
            {onTemplate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={onTemplate}
                    className="w-11 h-11 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/10 text-muted-foreground hover:text-indigo-400 transition-all group"
                  >
                    <div className="flex items-center justify-center">
                      {(() => {
                        const Icon = templateIcon || FileDown;
                        return <Icon className="w-4 h-4 text-muted-foreground/40 group-hover:text-indigo-400 transition-colors" />;
                      })()}
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-zinc-900 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest py-2 px-3">{templateTooltip}</TooltipContent>
              </Tooltip>
            )}

            {onImport && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={onImport}
                    className="w-11 h-11 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/10 text-muted-foreground hover:text-sky-400 transition-all group"
                  >
                    <Upload className="w-4 h-4 text-muted-foreground/40 group-hover:text-sky-400 transition-colors" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-zinc-900 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest py-2 px-3">{importTooltip}</TooltipContent>
              </Tooltip>
            )}

            {onExport && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={onExport}
                    className="w-11 h-11 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/10 text-muted-foreground hover:text-emerald-400 transition-all group"
                  >
                    <Download className="w-4 h-4 text-muted-foreground/40 group-hover:text-emerald-400 transition-colors" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-zinc-900 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest py-2 px-3">{exportTooltip}</TooltipContent>
              </Tooltip>
            )}

            {onAdd && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="default" 
                    size="icon"
                    onClick={onAdd}
                    disabled={loading}
                    className="w-11 h-11 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all group disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      (() => {
                        const Icon = addIcon || Plus;
                        return <Icon className={`w-5 h-5 transition-transform duration-300 ${!addIcon ? 'group-hover:rotate-90' : 'group-hover:scale-110'}`} />;
                      })()
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-primary border border-primary/20 text-primary-foreground text-[10px] font-black uppercase tracking-widest py-2 px-3">{addTooltip}</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
