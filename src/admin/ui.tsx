import React, { useEffect, useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Inbox, Loader2, X } from 'lucide-react';
import { formatNaira } from '../utils/formatters';

export { formatNaira };

// ---------------------------------------------------------------------------
// Layout primitives
// ---------------------------------------------------------------------------

export const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}> = ({ title, subtitle, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
    <div>
      <h2 className="text-base font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">{title}</h2>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`bg-white rounded-2xl border border-slate-200/90 shadow-xs ${className}`}>{children}</div>
);

export const StatCard: React.FC<{
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  tone?: 'default' | 'emerald' | 'amber' | 'rose' | 'blue' | 'violet';
  onClick?: () => void;
}> = ({ label, value, hint, icon, tone = 'default', onClick }) => {
  const tones: Record<string, string> = {
    default: 'bg-slate-100 text-slate-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    blue: 'bg-blue-50 text-blue-600',
    violet: 'bg-violet-50 text-violet-600',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs ${
        onClick ? 'cursor-pointer hover:border-emerald-400 transition-colors' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{label}</span>
        {icon && (
          <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${tones[tone]}`}>
            {icon}
          </span>
        )}
      </div>
      <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-['Plus_Jakarta_Sans',sans-serif]">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {hint && <div className="text-[11px] text-slate-500 mt-1">{hint}</div>}
    </div>
  );
};

export const Badge: React.FC<{ children: React.ReactNode; tone?: string }> = ({
  children,
  tone = 'slate',
}) => {
  const tones: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700',
    emerald: 'bg-emerald-100 text-emerald-800',
    amber: 'bg-amber-100 text-amber-800',
    rose: 'bg-rose-100 text-rose-700',
    blue: 'bg-blue-100 text-blue-800',
    violet: 'bg-violet-100 text-violet-800',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black ${tones[tone] ?? tones.slate}`}>
      {children}
    </span>
  );
};

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'ghost' | 'danger' | 'subtle';
    size?: 'sm' | 'md';
    loading?: boolean;
  }
> = ({ variant = 'primary', size = 'md', loading, children, className = '', ...rest }) => {
  const variants: Record<string, string> = {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20',
    ghost: 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white',
    subtle: 'bg-slate-100 hover:bg-slate-200 text-slate-800',
  };
  const sizes = { sm: 'px-2.5 py-1.5 text-[11px]', md: 'px-3.5 py-2 text-xs' };

  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      className={`rounded-xl font-extrabold inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({
  className = '',
  ...rest
}) => (
  <input
    {...rest}
    className={`w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/60 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all ${className}`}
  />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({
  className = '',
  children,
  ...rest
}) => (
  <select
    {...rest}
    className={`px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/60 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer ${className}`}
  >
    {children}
  </select>
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({
  className = '',
  ...rest
}) => (
  <textarea
    {...rest}
    className={`w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/60 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all ${className}`}
  />
);

export const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({
  label,
  hint,
  children,
}) => (
  <label className="block">
    <span className="block text-[11px] font-bold text-slate-600 mb-1">{label}</span>
    {children}
    {hint && <span className="block text-[10px] text-slate-400 mt-1">{hint}</span>}
  </label>
);

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

export const Spinner: React.FC<{ label?: string }> = ({ label = 'Loading…' }) => (
  <div className="flex items-center justify-center gap-2 py-10 text-xs font-bold text-slate-500">
    <Loader2 className="w-4 h-4 animate-spin" />
    <span>{label}</span>
  </div>
);

export const ErrorNote: React.FC<{ message: string | null; onRetry?: () => void }> = ({
  message,
  onRetry,
}) => {
  if (!message) return null;
  return (
    <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 mb-4">
      <span className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
        <span>{message}</span>
      </span>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
};

export const EmptyState: React.FC<{ title: string; hint?: string; action?: React.ReactNode }> = ({
  title,
  hint,
  action,
}) => (
  <div className="text-center py-12">
    <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-3" />
    <p className="text-sm font-bold text-slate-700">{title}</p>
    {hint && <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{hint}</p>}
    {action && <div className="mt-4 flex justify-center">{action}</div>}
  </div>
);

export const Toast: React.FC<{ message: string | null; tone?: 'success' | 'error' }> = ({
  message,
  tone = 'success',
}) => {
  if (!message) return null;
  return (
    <div
      className={`fixed bottom-6 right-6 z-[60] px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2 ${
        tone === 'error'
          ? 'bg-rose-600 border-rose-500 text-white'
          : 'bg-slate-900 border-slate-800 text-white'
      }`}
    >
      <span className="w-2 h-2 rounded-full bg-emerald-400" />
      <span>{message}</span>
    </div>
  );
};

export function useToast(): [React.ReactNode, (message: string, tone?: 'success' | 'error') => void] {
  const [state, setState] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!state) return;
    const timer = setTimeout(() => setState(null), 3500);
    return () => clearTimeout(timer);
  }, [state]);

  const show = (message: string, tone: 'success' | 'error' = 'success') => setState({ message, tone });
  return [<Toast key="toast" message={state?.message ?? null} tone={state?.tone} />, show];
}

// ---------------------------------------------------------------------------
// Modal / confirm
// ---------------------------------------------------------------------------

export const Modal: React.FC<{
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}> = ({ open, title, subtitle, onClose, children, footer, wide }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        className={`bg-white w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} rounded-2xl shadow-2xl border border-slate-200 my-8`}
      >
        <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">{title}</h3>
            {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 max-h-[65vh] overflow-y-auto">{children}</div>
        {footer && <div className="p-4 border-t border-slate-100 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};

export const ConfirmDialog: React.FC<{
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}> = ({ open, title, message, confirmLabel = 'Confirm', danger, onConfirm, onCancel, busy }) => (
  <Modal
    open={open}
    title={title}
    onClose={onCancel}
    footer={
      <>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={busy}>
          {confirmLabel}
        </Button>
      </>
    }
  >
    <p className="text-xs text-slate-600 leading-relaxed">{message}</p>
  </Modal>
);

// ---------------------------------------------------------------------------
// Table + pagination
// ---------------------------------------------------------------------------

export const DataTable: React.FC<{ head: React.ReactNode; children: React.ReactNode }> = ({
  head,
  children,
}) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left text-xs min-w-[720px]">
      <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-black">
        {head}
      </thead>
      <tbody className="divide-y divide-slate-100">{children}</tbody>
    </table>
  </div>
);

export const Pagination: React.FC<{
  page: number;
  pages: number;
  total: number;
  limit: number;
  onPage: (page: number) => void;
}> = ({ page, pages, total, limit, onPage }) => (
  <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-100">
    <span className="text-[11px] text-slate-500 font-medium">
      {total.toLocaleString()} record{total === 1 ? '' : 's'} · page {page} of {pages} · {limit} per page
    </span>
    <div className="flex items-center gap-1.5">
      <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        <ChevronLeft className="w-3.5 h-3.5" />
        Prev
      </Button>
      <Button variant="ghost" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next
        <ChevronRight className="w-3.5 h-3.5" />
      </Button>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Charts (dependency-free SVG)
// ---------------------------------------------------------------------------

export const TrendChart: React.FC<{ data: { date: string; orders: number; revenue: number }[] }> = ({
  data,
}) => {
  if (data.length === 0) return <p className="text-xs text-slate-500 py-8 text-center">No activity yet.</p>;

  const maxOrders = Math.max(1, ...data.map((point) => point.orders));
  const maxRevenue = Math.max(1, ...data.map((point) => point.revenue));
  const width = 100;
  const height = 32;

  const ordersPath = data
    .map((point, index) => {
      const x = (index / Math.max(1, data.length - 1)) * width;
      const y = height - (point.orders / maxOrders) * height;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  const revenuePath = data
    .map((point, index) => {
      const x = (index / Math.max(1, data.length - 1)) * width;
      const y = height - (point.revenue / maxRevenue) * height;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-40">
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(5 150 105)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="rgb(5 150 105)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${revenuePath} L${width},${height} L0,${height} Z`} fill="url(#revenueFill)" />
        <path d={revenuePath} fill="none" stroke="rgb(5 150 105)" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
        <path
          d={ordersPath}
          fill="none"
          stroke="rgb(59 130 246)"
          strokeWidth="0.8"
          strokeDasharray="2 1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="flex items-center gap-4 mt-2 text-[10px] font-bold text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-emerald-600 inline-block" /> Revenue
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-blue-500 inline-block" /> Orders
        </span>
        <span className="ml-auto font-medium">
          30 days · peak {formatNaira(maxRevenue)} / {maxOrders} orders
        </span>
      </div>
    </div>
  );
};

export const BarList: React.FC<{ items: { label: string; value: number; tone?: string }[] }> = ({
  items,
}) => {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
            <span>{item.label}</span>
            <span className="text-slate-900">{item.value.toLocaleString()}</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full ${item.tone ?? 'bg-emerald-500'}`}
              style={{ width: `${Math.max(2, Math.round((item.value / max) * 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
