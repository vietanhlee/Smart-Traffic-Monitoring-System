import { useState, useRef, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  NavLink,
} from "react-router-dom";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";
import { Button } from "@/ui/button";
import {
  Car,
  LogOut,
  Settings,
  UserCircle,
  Sun,
  Moon,
  Home,
  BarChart3,
  Bot,
  ShieldCheck,
} from "lucide-react";
import { clearAllChatData } from "@/utils/chatStorage";
import LoginPage from "./pages/LoginPage";
import TrafficDashboard from "@/modules/features/traffic/components/TrafficDashboard";
import AnalyticsPage from "./pages/AnalyticsPage";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import ProtectedRoute from "@/modules/features/auth/guards/ProtectedRoute";
import AdminResourcesPage from "@/pages/AdminResourcesPage";
import AdminRoadsPage from "@/pages/AdminRoadsPage";
import { authConfig } from "@/config";
import "./App.css";
import { TrafficProvider } from "@/hooks/useTrafficStore";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { to: "/home", label: "Trang Chủ", icon: Home },
  { to: "/analys", label: "Phân Tích", icon: BarChart3 },
  { to: "/chat", label: "Trợ Lý AI", icon: Bot },
];

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}

function AppContent() {
  const [showRegister, setShowRegister] = useState(false);
  const [authed, setAuthed] = useState(() => {
    const token = localStorage.getItem("access_token");
    if (token && token.length < 10) {
      localStorage.removeItem("access_token");
      return false;
    }
    return !!token;
  });
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const hideDropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const navigate = useNavigate();

  const handleLoginSuccess = () => setAuthed(true);
  const handleRegisterSuccess = () => setShowRegister(false);
  const handleLogout = () => {
    // Clear authentication
    localStorage.removeItem("access_token");
    // Clear chat data when user logs out
    clearAllChatData();
    setAuthed(false);
    setIsAdmin(false);
    setShowUserDropdown(false);
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowUserDropdown(false);
      }
    };
    if (showUserDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserDropdown]);

  // Fetch current user to determine admin role
  useEffect(() => {
    const fetchMe = async () => {
      try {
        if (!authed) {
          setIsAdmin(false);
          return;
        }
        const token = localStorage.getItem("access_token");
        if (!token) {
          setIsAdmin(false);
          return;
        }
        const res = await fetch(`${authConfig.ME_URL}`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        if (!res.ok) {
          setIsAdmin(false);
          return;
        }
        const data = await res.json();
        setIsAdmin(data?.role_id === 0);
      } catch {
        setIsAdmin(false);
      }
    };
    fetchMe();
  }, [authed]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <a href="/home" className="app-brand" title="Trang chủ">
          <span className="app-logo">
            <Car className="h-6 w-6" />
          </span>
          <span className="app-brand-copy">
            <strong>Smart Traffic System</strong>
            <small>Realtime monitoring and analysis</small>
          </span>
        </a>

        <nav className="app-nav" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `app-nav-link ${isActive ? "app-nav-link--active" : ""}`
                }
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="app-actions" ref={dropdownRef}>
          {authed && (
            <>
              <button
                className="app-account-trigger"
                onClick={() => setShowUserDropdown((v) => !v)}
                onMouseEnter={() => {
                  if (hideDropdownTimeout.current)
                    clearTimeout(hideDropdownTimeout.current);
                  setShowUserDropdown(true);
                }}
                onMouseLeave={() => {
                  hideDropdownTimeout.current = setTimeout(
                    () => setShowUserDropdown(false),
                    200,
                  );
                }}
                type="button"
              >
                <UserCircle className="h-5 w-5" />
                <span>Tài khoản</span>
              </button>
              <div
                className={`app-account-dropdown ${
                  showUserDropdown
                    ? "opacity-100 scale-100 pointer-events-auto"
                    : "opacity-0 scale-95 pointer-events-none"
                }`}
                onMouseEnter={() => {
                  if (hideDropdownTimeout.current)
                    clearTimeout(hideDropdownTimeout.current);
                  setShowUserDropdown(true);
                }}
                onMouseLeave={() => {
                  hideDropdownTimeout.current = setTimeout(
                    () => setShowUserDropdown(false),
                    200,
                  );
                }}
              >
                {isAdmin && (
                  <NavLink
                    to="/admin/resources"
                    className="app-account-item"
                    onClick={() => setShowUserDropdown(false)}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Trang Admin
                  </NavLink>
                )}
                <NavLink
                  to="/profile"
                  className="app-account-item"
                  onClick={() => setShowUserDropdown(false)}
                >
                  <Settings className="h-4 w-4" />
                  Quản lý tài khoản
                </NavLink>
                <button
                  className="app-account-item app-account-item--danger"
                  onClick={() => {
                    handleLogout();
                    setShowUserDropdown(false);
                  }}
                  type="button"
                >
                  <LogOut className="h-4 w-4" /> Đăng xuất
                </button>
              </div>
            </>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="app-theme-toggle"
            title={theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </header>

      <TrafficProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <LoginPage
                onLoginSuccess={handleLoginSuccess}
                onRegisterSuccess={handleRegisterSuccess}
                showRegister={showRegister}
                setShowRegister={setShowRegister}
              />
            }
          />
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<TrafficDashboard />} />
            <Route path="/analys" element={<AnalyticsPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route
              path="/admin"
              element={<Navigate to="/admin/resources" replace />}
            />
            <Route path="/admin/resources" element={<AdminResourcesPage />} />
            <Route path="/admin/roads" element={<AdminRoadsPage />} />
          </Route>
          <Route
            path="*"
            element={<Navigate to={authed ? "/home" : "/login"} replace />}
          />
        </Routes>
      </TrafficProvider>
      <Toaster position="top-right" richColors />
    </div>
  );
}
