import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"

interface SearchableSelectProps {
  id?: string;
  label?: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export function SearchableSelect({ 
  id,
  label,
  options, 
  value, 
  onChange, 
  placeholder, 
  className,
  required 
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  
  // Find the label for the current value
  const selectedLabel = React.useMemo(() => 
    options.find((opt) => opt.value === value)?.label
  , [options, value])

  const isMobile = useIsMobile()

  const content = (
    <Command className="bg-transparent">
      <CommandInput 
        placeholder={`Cari...`} 
        className="h-9 border-none focus:ring-0" 
        autoFocus
      />
      <CommandList className="no-scrollbar max-h-[300px]">
        <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">
          Data tidak ditemukan.
        </CommandEmpty>
        <CommandGroup>
          {options.map((opt) => (
            <CommandItem
              key={opt.value}
              value={opt.label}
              onSelect={() => {
                onChange(opt.value)
                setOpen(false)
              }}
              className="flex items-center gap-2 px-2 py-1.5 cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary transition-colors"
            >
              <div className="flex items-center justify-center w-4 h-4">
                {value === opt.value && <Check className="w-3.5 h-3.5" />}
              </div>
              <span className="truncate">{opt.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <Label htmlFor={id} className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      
      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <Button
              id={id}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                "w-full justify-between h-10 bg-white/5 border-white/10 hover:bg-white/10 text-sm font-normal text-foreground transition-colors",
                !value && "text-muted-foreground/40"
              )}
            >
              <span className="truncate">{selectedLabel || placeholder || "Pilih..."}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="p-0 bg-zinc-950 border-white/10 max-h-[80vh] z-[10001]">
            <DrawerHeader className="sr-only">
              <DrawerTitle>{label || "Pilih Opsi"}</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 pt-0">
              {content}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                "w-full justify-between h-10 bg-white/5 border-white/10 hover:bg-white/10 text-sm font-normal text-foreground transition-colors",
                !value && "text-muted-foreground/40"
              )}
            >
              <span className="truncate">{selectedLabel || placeholder || "Pilih..."}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="p-0 bg-zinc-950 border-white/10 shadow-2xl w-[--radix-popover-trigger-width] z-[10001]" 
            align="start"
          >
            {content}
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
