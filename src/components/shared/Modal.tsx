import React from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ModalProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  isOpen?: boolean;
  onClose: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  saving?: boolean;
  submitVariant?: 'default' | 'destructive' | 'outline';
  children: React.ReactNode;
  footerContent?: React.ReactNode;
  showFooter?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

export function Modal({
  isOpen = true,
  title,
  description,
  icon,
  onClose,
  onSubmit,
  submitLabel = 'Simpan Data',
  submitDisabled = false,
  saving = false,
  children,
  footerContent,
  showFooter = true,
  maxWidth = 'md',
  submitVariant = 'default'
}: ModalProps) {
  const widthMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />
      <div className="absolute top-16 inset-x-0 bottom-0 flex items-start justify-center overflow-y-auto p-4 pt-6">
        <div className={`relative w-full ${widthMap[maxWidth]} rounded-2xl border border-white/10 bg-zinc-900 shadow-[0_32px_64px_rgba(0,0,0,0.6)] animate-in-up overflow-hidden`}>

          {/* Gradient header */}
          <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-primary/10 via-transparent to-transparent border-b border-white/8">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex items-start justify-between">
              <div className="flex items-center gap-3">
                {icon && (
                  <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
                    <div className="text-primary">{icon}</div>
                  </div>
                )}
                <div>
                  <h2 className="font-bold text-base">{title}</h2>
                  {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {children}
          </div>

          {/* Footer */}
          {showFooter && (
            <div className="flex items-center justify-end px-6 py-4 border-t border-white/5 bg-white/2 gap-3">
              {footerContent ? footerContent : (
                <>
                  <Button variant="outline" onClick={onClose} className="border-white/10 hover:bg-white/5 text-sm h-9">Batal</Button>
                  {onSubmit && (
                    <Button onClick={onSubmit} variant={submitVariant} disabled={submitDisabled || saving} className="gap-2 min-w-[120px] text-sm h-9">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      {saving ? 'Menyimpan...' : submitLabel}
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
