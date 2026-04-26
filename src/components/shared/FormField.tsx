import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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
  isTextArea?: boolean;
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
  options,
  isTextArea = false
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
          className={`w-full ${inputCls} rounded-md border px-3 text-foreground focus:outline-none appearance-none`}
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23ffffff66\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
        >
          {placeholder && <option value="" className="bg-zinc-900 text-white">{placeholder}</option>}
          {options.map(opt => (
            <option key={opt.value} value={opt.value} className="bg-zinc-900 text-white">
              {opt.label}
            </option>
          ))}
        </select>
      ) : isTextArea ? (
        <Textarea
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className={`${inputCls} min-h-[100px] py-2`}
        />
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
