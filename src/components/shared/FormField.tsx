import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface FormFieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: any;
  onChange: (value: any) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  options?: { value: string | number; label: string }[];
}

const inputCls = "h-10 bg-white/5 border-white/10 focus:border-primary/40 text-sm placeholder:text-muted-foreground/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export function FormField({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  className = '',
  options
}: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label htmlFor={id} className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>

      {options ? (
        <select
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full ${inputCls} rounded-md border px-3 text-foreground focus:outline-none`}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(opt => (
            <option key={opt.value} value={opt.value} className="bg-zinc-900">
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className={inputCls}
        />
      )}
    </div>
  );
}
