import React from 'react';
import { cn } from '@/utils/cn';
import { X, Loader2, ChevronDown, Search, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

// ─── Button ────────────────────────────────────────────
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
        {
          'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-lg shadow-primary-500/25': variant === 'primary',
          'glass glass-hover text-[var(--text-primary)]': variant === 'secondary',
          'hover:bg-surface-200 dark:hover:bg-surface-800 text-[var(--text-secondary)]': variant === 'ghost',
          'bg-danger-500 text-white hover:bg-danger-600': variant === 'danger',
          'border border-surface-300 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 text-[var(--text-primary)]': variant === 'outline',
        },
        {
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-sm': size === 'md',
          'px-6 py-3 text-base': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  )
);
Button.displayName = 'Button';

// ─── Input ─────────────────────────────────────────────
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-[var(--text-secondary)]">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">{icon}</div>}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-xl border bg-transparent px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all',
            'border-surface-300 dark:border-surface-700',
            icon && 'pl-10',
            error && 'border-danger-500 focus:ring-danger-500/50',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-danger-500">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';

// ─── Select ────────────────────────────────────────────
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ value: string; label: string; group?: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, ...props }, ref) => {
    const groups = options.reduce<Record<string, typeof options>>((acc, opt) => {
      const g = opt.group || '';
      (acc[g] = acc[g] || []).push(opt);
      return acc;
    }, {});

    return (
      <div className="space-y-1.5">
        {label && <label className="block text-sm font-medium text-[var(--text-secondary)]">{label}</label>}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'w-full appearance-none rounded-xl border border-surface-300 dark:border-surface-700 bg-[var(--bg-primary)] px-4 py-2.5 pr-10 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all cursor-pointer',
              className
            )}
            {...props}
          >
            {Object.entries(groups).map(([group, opts]) =>
              group ? (
                <optgroup key={group} label={group} className="bg-white dark:bg-surface-800 text-[var(--text-primary)]">
                  {opts.map((o) => <option key={o.value} value={o.value} className="bg-white dark:bg-surface-800 text-black dark:text-white">{o.label}</option>)}
                </optgroup>
              ) : (
                opts.map((o) => <option key={o.value} value={o.value} className="bg-white dark:bg-surface-800 text-black dark:text-white">{o.label}</option>)
              )
            )}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
        </div>
      </div>
    );
  }
);
Select.displayName = 'Select';

// ─── Modal ─────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative glass rounded-2xl p-6 w-full animate-slide-up', maxWidth)}>
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-800 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ─── Card ──────────────────────────────────────────────
interface CardProps {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  hoverable?: boolean;
}

export function Card({ className, children, onClick, hoverable }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'glass rounded-2xl p-5',
        hoverable && 'glass-hover cursor-pointer transition-all duration-200',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── GlassCard ─────────────────────────────────────────
export function GlassCard({ className, children, ...props }: CardProps) {
  return (
    <Card className={cn('backdrop-blur-xl', className)} {...props}>
      {children}
    </Card>
  );
}

// ─── Badge ─────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  variant?: 'solid' | 'outline';
  className?: string;
}

export function Badge({ children, color, variant = 'solid', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variant === 'solid'
          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
          : 'border border-current',
        className
      )}
      style={color ? { backgroundColor: `${color}20`, color } : undefined}
    >
      {children}
    </span>
  );
}

// ─── Tabs ──────────────────────────────────────────────
interface TabsProps {
  tabs: Array<{ id: string; label: string; icon?: React.ReactNode; count?: number }>;
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-1 p-1 rounded-xl bg-surface-200/50 dark:bg-surface-800/50', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer',
            activeTab === tab.id
              ? 'bg-white dark:bg-surface-700 shadow-sm text-primary-600 dark:text-primary-400'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          )}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Spinner ───────────────────────────────────────────
export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  return (
    <Loader2
      className={cn(
        'animate-spin text-primary-500',
        { 'w-4 h-4': size === 'sm', 'w-6 h-6': size === 'md', 'w-8 h-8': size === 'lg' },
        className
      )}
    />
  );
}

// ─── ProgressBar ───────────────────────────────────────
export function ProgressBar({ value, max = 100, className }: { value: number; max?: number; className?: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn('w-full h-2 rounded-full bg-surface-200 dark:bg-surface-800 overflow-hidden', className)}>
      <div
        className="h-full rounded-full gradient-bg transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── SearchInput ───────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = 'Search...', className }: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      icon={<Search className="w-4 h-4" />}
      className={className}
    />
  );
}

// ─── EmptyState ────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4 text-[var(--text-muted)]">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}

// ─── Toast Container ───────────────────────────────────
const toastIcons = {
  success: <CheckCircle className="w-5 h-5 text-accent-500" />,
  error: <AlertCircle className="w-5 h-5 text-danger-500" />,
  info: <Info className="w-5 h-5 text-primary-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-warning-500" />,
};

export function ToastContainer({ toasts, onDismiss }: {
  toasts: Array<{ id: string; type: 'success' | 'error' | 'info' | 'warning'; title: string; description?: string }>;
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div key={toast.id} className="glass rounded-xl p-4 animate-slide-up flex items-start gap-3 shadow-lg">
          {toastIcons[toast.type]}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{toast.title}</p>
            {toast.description && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{toast.description}</p>}
          </div>
          <button onClick={() => onDismiss(toast.id)} className="p-0.5 hover:bg-surface-200 dark:hover:bg-surface-800 rounded cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Toggle ────────────────────────────────────────────
export function Toggle({ checked, onChange, label, disabled }: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <label className={cn('inline-flex items-center gap-3', disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer')}>
      <div
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors duration-200',
          checked ? 'bg-primary-600' : 'bg-surface-300 dark:bg-surface-700'
        )}
      >
        <div
          className={cn(
            'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
            checked && 'translate-x-5'
          )}
        />
      </div>
      {label && <span className="text-sm text-[var(--text-secondary)]">{label}</span>}
    </label>
  );
}

// ─── Skeleton ──────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-lg bg-surface-200 dark:bg-surface-800', className)} />
  );
}
