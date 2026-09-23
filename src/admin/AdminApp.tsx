import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BadgeCheck,
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  Package,
  Server,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store as StoreIcon,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { adminApi, AdminApiError, type AdminUser } from './adminApi';
import { AdminLogin, type LoginMode } from './AdminLogin';
import { OverviewSection } from './sections/OverviewSection';
import { UsersSection } from './sections/UsersSection';
import { StoresSection } from './sections/StoresSection';
import { OrdersSection } from './sections/OrdersSection';
import { ListingsSection } from './sections/ListingsSection';
import { CategoriesSection } from './sections/CategoriesSection';
import { ContentSection } from './sections/ContentSection';
import { FinanceSection } from './sections/FinanceSection';
import { ActivitySection } from './sections/ActivitySection';
import { HealthSection } from './sections/HealthSection';
import { SettingsSection } from './sections/SettingsSection';
import { useToast } from './ui';

export const ADMIN_BASE = '/admin-cp';

type SectionId =
  | 'overview'
  | 'users'
  | 'stores'
  | 'orders'
  | 'listings'
  | 'categories'
  | 'content'
  | 'finance'
  | 'activity'
  | 'health'
  | 'settings';

const NAV: { id: SectionId; label: string; icon: React.ComponentType<{ className?: string }>; group: string }[] = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, group: 'Control' },
  { id: 'users', label: 'Users & Sellers', icon: Users, group: 'Control' },
  { id: 'stores', label: 'Stores', icon: StoreIcon, group: 'Control' },
  { id: 'orders', label: 'Orders', icon: ShoppingBag, group: 'Commerce' },
  { id: 'listings', label: 'Listings', icon: Package, group: 'Commerce' },
  { id: 'finance', label: 'Finance & Escrow', icon: Wallet, group: 'Commerce' },
  { id: 'categories', label: 'Categories', icon: FolderTree, group: 'Content' },
  { id: 'content', label: 'Blog & Reviews', icon: Newspaper, group: 'Content' },
  { id: 'activity', label: 'Activity Log', icon: Activity, group: 'System' },
  { id: 'health', label: 'System Health', icon: Server, group: 'System' },
  { id: 'settings', label: 'Settings', icon: Settings, group: 'System' },
];

interface ParsedAdminPath {
  mode: 'login' | 'forgot' | 'reset';
  section: SectionId;
  token?: string;
  params: URLSearchParams;
}

function parseAdminPath(): ParsedAdminPath {
  if (typeof window === 'undefined') {
    return { mode: 'login', section: 'overview', params: new URLSearchParams() };
  }

  const url = new URL(window.location.href);
  const relative = url.pathname.startsWith(ADMIN_BASE)
    ? url.pathname.slice(ADMIN_BASE.length)
    : url.pathname;
  const [first = ''] = relative.split('/').filter(Boolean);

  if (first === 'login') return { mode: 'login', section: 'overview', params: url.searchParams };
  if (first === 'forgot-password') return { mode: 'forgot', section: 'overview', params: url.searchParams };
  if (first === 'reset-password') {
    return {
      mode: 'reset',
      section: 'overview',
      token: url.searchParams.get('token') ?? undefined,
      params: url.searchParams,
    };
  }

  const section = (NAV.find((item) => item.id === first)?.id ?? 'overview') as SectionId;
  return { mode: 'login', section, params: url.searchParams };
}

/**
 * Super Admin console, mounted at /admin-cp.
 *
 * Loaded lazily from App.tsx so none of this code ships in the public bundle.
 */
export default function AdminApp() {
  const [route, setRoute] = useState<ParsedAdminPath>(() => parseAdminPath());
  const [user, setUser] = useState<AdminUser | null>(null);
  const [ready, setReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [toastNode, notify] = useToast();

  const navigate = useCallback((path: string, replace = false) => {
    if (typeof window === 'undefined') return;
    const target = `${ADMIN_BASE}${path.startsWith('/') ? path : `/${path}`}`;
    if (replace) window.history.replaceState({}, '', target);
    else window.history.pushState({}, '', target);
    setRoute(parseAdminPath());
    window.scrollTo({ top: 0 });
  }, []);

  const checkSession = useCallback(async () => {
    try {
      const res = await adminApi.auth.session();
      setUser(res.user);
    } catch {
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  // Keep the console in sync with browser back/forward.
  useEffect(() => {
    const onPop = () => setRoute(parseAdminPath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Reference data used by several sections.
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [categoriesRes, locationsRes] = await Promise.all([
          fetch('/api/categories').then((res) => res.json()),
          fetch('/api/locations').then((res) => res.json()),
        ]);
        setCategories(categoriesRes.categories ?? []);
        setStates(locationsRes.states ?? []);
      } catch {
        // Non-fatal: filters and dropdowns simply stay empty.
      }
    })();
  }, [user]);

  const logout = async () => {
    try {
      await adminApi.auth.logout();
    } catch (err) {
      notify(err instanceof AdminApiError ? err.message : 'Sign-out failed', 'error');
    }
    setUser(null);
    navigate('/login', true);
  };

  const sections = useMemo(() => {
    if (!user) return null;

    switch (route.section) {
      case 'users':
        return <UsersSection initialParams={route.params} categories={categories} notify={notify} />;
      case 'stores':
        return <StoresSection initialParams={route.params} notify={notify} states={states} />;
      case 'orders':
        return <OrdersSection initialParams={route.params} notify={notify} />;
      case 'listings':
        return <ListingsSection initialParams={route.params} notify={notify} />;
      case 'categories':
        return <CategoriesSection notify={notify} onChanged={() => undefined} />;
      case 'content':
        return <ContentSection initialParams={route.params} notify={notify} />;
      case 'finance':
        return <FinanceSection notify={notify} />;
      case 'activity':
        return <ActivitySection initialParams={route.params} notify={notify} />;
      case 'health':
        return <HealthSection />;
      case 'settings':
        return <SettingsSection notify={notify} />;
      default:
        return <OverviewSection onNavigate={(section, params) => navigate(`/${section}${params ? `?${params}` : ''}`)} />;
    }
  }, [route.params, route.section, user, categories, states, notify, navigate]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-xs font-bold text-slate-400">Verifying administrator session…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <AdminLogin
        mode={route.mode}
        token={route.token}
        onAuthenticated={async () => {
          await checkSession();
          navigate('/overview', true);
        }}
        onNavigate={(mode: LoginMode, token?: string) => {
          const path =
            mode === 'login'
              ? '/login'
              : mode === 'forgot'
                ? '/forgot-password'
                : `/reset-password${token ? `?token=${token}` : ''}`;
          navigate(path, true);
        }}
      />
    );
  }

  const activeSection = NAV.find((item) => item.id === route.section) ?? NAV[0];
  const groups = Array.from(new Set(NAV.map((item) => item.group)));

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-['Inter',sans-serif]">
      {toastNode}

      {/* Top bar */}
      <header className="bg-slate-900 text-white sticky top-0 z-40">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer"
              aria-label="Open navigation"
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-black leading-tight truncate">Komback Control Centre</p>
              <p className="text-[10px] text-slate-400 leading-tight truncate">
                {activeSection.label} · signed in as {user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Storefront
            </a>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-[11px] font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden"
          />
        )}

        <aside
          className={`fixed lg:sticky top-[57px] left-0 z-50 lg:z-0 h-[calc(100vh-57px)] w-64 bg-white border-r border-slate-200 flex flex-col overflow-y-auto transition-transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="p-4 lg:hidden flex justify-end">
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="p-3 space-y-4 flex-1">
            {groups.map((group) => (
              <div key={group}>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                  {group}
                </p>
                <div className="space-y-0.5">
                  {NAV.filter((item) => item.group === group).map((item) => {
                    const Icon = item.icon;
                    const active = item.id === route.section;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          navigate(`/${item.id}`);
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer text-left ${
                          active
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-3 border-t border-slate-100">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-[10px] font-black uppercase text-slate-400">Administrator</p>
              <p className="text-xs font-bold text-slate-800 truncate mt-0.5">{user.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
              <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-black text-emerald-700">
                <BadgeCheck className="w-3 h-3" />
                Full platform access
              </span>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 max-w-[1600px] mx-auto w-full">{sections}</main>
      </div>
    </div>
  );
}
