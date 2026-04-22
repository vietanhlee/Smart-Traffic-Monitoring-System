import { NavLink } from "react-router-dom";
import {
  Server,
  Route,
  Shield,
  type LucideIcon,
} from "lucide-react";

type AdminNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

const adminNavItems: AdminNavItem[] = [
  { to: "/admin/resources", label: "Quản lý tài nguyên", icon: Server },
  { to: "/admin/roads", label: "Quản lý tuyến đường", icon: Route },
];

type AdminLayoutProps = {
  /** Tiêu đề phụ hiển thị trên header (ví dụ: "Quản lý tài nguyên") */
  subtitle: string;
  /** Tiêu đề chính hiển thị trên header */
  title: string;
  /** Các nút hành động bên phải header */
  headerActions?: React.ReactNode;
  /** Nội dung chính */
  children: React.ReactNode;
};

export default function AdminLayout({
  subtitle,
  title,
  headerActions,
  children,
}: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-8 sm:px-8">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="mb-8 border-b border-slate-300 dark:border-slate-800 pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Shield className="h-6 w-6" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
               <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                {title}
              </h1>
            </div>
          </div>

          {headerActions && (
            <div className="flex flex-wrap items-center gap-3">
              {headerActions}
            </div>
          )}
        </div>
      </div>

      {/* ── Body (Sidebar + Content) ──────────────────────── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="space-y-6">
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 shadow-sm">
              <h3 className="mb-2 px-4 pt-3 text-[10px] font-bold uppercase text-slate-400">
                Menu Quản Trị
              </h3>
              <nav className="space-y-1">
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                          isActive
                            ? "bg-indigo-600 text-white"
                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                        }`
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="min-h-0 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
