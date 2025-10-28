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
} from "lucide-react";
import LoginPage from "./pages/LoginPage";
import TrafficDashboard from "@/modules/features/traffic/components/TrafficDashboard";
import AnalyticsPage from "./pages/AnalyticsPage";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import ProtectedRoute from "@/modules/features/auth/guards/ProtectedRoute";
import "./App.css";
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const hideDropdownTimeout = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  const handleLoginSuccess = () => setAuthed(true);
  const handleRegisterSuccess = () => setShowRegister(false);
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setAuthed(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-slate-900 dark:to-blue-900">
      {/* Banner */}
      <div className="w-full flex flex-wrap items-center justify-between px-3 sm:px-6 py-3 bg-white/80 dark:bg-gray-900/90 shadow-xl border-b border-purple-200/50 dark:border-gray-800 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center min-w-0 gap-3">
          <a
            href="/home"
            className="flex items-center flex-shrink-0"
            title="Trang chủ"
          >
            <div className="relative w-12 h-12">
              {/* Animated background gradient */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-gradient-x"></div>

              {/* Icon container with glassmorphism effect */}
              <div className="absolute inset-0.5 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <Car
                  className="w-7 h-7 text-white/90 drop-shadow-lg"
                  strokeWidth={2}
                />
                <div className="absolute -right-1 -top-1">
                  <div className="relative w-4 h-4 bg-green-500 rounded-full animate-pulse">
                    <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></div>
                  </div>
                </div>
              </div>
            </div>
          </a>
          <div className="flex flex-col justify-center min-w-0">
            <h1 className="text-base sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent truncate leading-tight">
              Smart Traffic System
            </h1>
            <p className="text-gray-600 dark:text-gray-600 text-xs sm:text-sm hidden sm:block leading-tight">
              Real-time monitoring & analysis
            </p>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto">
          {/* Centered Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-3">
            <NavLink
              to="/home"
              className={({ isActive }) =>
                `flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 rounded-xl font-bold transition-all text-sm focus:outline-none ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-400/40"
                    : "bg-gradient-to-r from-blue-50 to-cyan-50 dark:bg-gray-800 text-blue-800 dark:text-gray-600 hover:from-blue-100 hover:to-cyan-100 dark:hover:bg-blue-900/50"
                }`
              }
            >
              <Home className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="hidden sm:inline">Trang Chủ</span>
            </NavLink>
            <NavLink
              to="/analys"
              className={({ isActive }) =>
                `flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 rounded-xl font-bold transition-all text-sm focus:outline-none ${
                  isActive
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-400/40"
                    : "bg-gradient-to-r from-purple-50 to-pink-50 dark:bg-gray-800 text-purple-800 dark:text-gray-600 hover:from-purple-100 hover:to-pink-100 dark:hover:bg-purple-900/50"
                }`
              }
            >
              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="hidden sm:inline">Phân Tích</span>
            </NavLink>
            <NavLink
              to="/chat"
              className={({ isActive }) =>
                `flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 rounded-xl font-bold transition-all text-sm focus:outline-none ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-400/40"
                    : "bg-gradient-to-r from-indigo-50 to-violet-50 dark:bg-gray-800 text-indigo-800 dark:text-gray-600 hover:from-indigo-100 hover:to-violet-100 dark:hover:bg-indigo-900/50"
                }`
              }
            >
              <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="hidden sm:inline">Trợ Lý AI</span>
            </NavLink>
          </nav>
        </div>
        <div
          className="flex items-center space-x-2 sm:space-x-3 relative flex-shrink-0"
          ref={dropdownRef}
        >
          {authed && (
            <>
              <button
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r from-slate-50 to-gray-50 dark:from-gray-800 dark:to-gray-800 hover:from-slate-100 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-700 focus:outline-none group transition-all border border-gray-300/50 dark:border-gray-700 shadow-sm"
                onClick={() => setShowUserDropdown((v) => !v)}
                onMouseEnter={() => {
                  if (hideDropdownTimeout.current)
                    clearTimeout(hideDropdownTimeout.current);
                  setShowUserDropdown(true);
                }}
                onMouseLeave={() => {
                  hideDropdownTimeout.current = setTimeout(
                    () => setShowUserDropdown(false),
                    200
                  );
                }}
                type="button"
              >
                <UserCircle className="h-6 w-6 sm:h-7 sm:w-7 text-gray-700 dark:text-blue-400" />
                <span className="font-bold text-gray-800 dark:text-gray-200 hidden sm:inline text-sm">
                  Tài khoản
                </span>
              </button>
              <div
                className={`absolute right-0 top-full mt-2 min-w-[180px] bg-white/95 dark:bg-gray-800/95 rounded-xl shadow-2xl border border-purple-200/50 dark:border-gray-700 z-50 py-2 transition-all duration-200 backdrop-blur-xl ${
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
                    200
                  );
                }}
              >
                <a
                  href="/profile"
                  className="w-full flex items-center px-4 py-2.5 text-gray-800 dark:text-gray-200 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-gray-700 dark:hover:to-gray-700 text-sm font-semibold transition-all"
                  onClick={() => setShowUserDropdown(false)}
                >
                  <Settings className="h-4 w-4 mr-3 text-purple-600 dark:text-blue-400" />{" "}
                  Quản lý tài khoản
                </a>
                <button
                  className="w-full flex items-center px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm transition-all"
                  onClick={() => {
                    handleLogout();
                    setShowUserDropdown(false);
                  }}
                  type="button"
                >
                  <LogOut className="h-4 w-4 mr-3" /> Đăng xuất
                </button>
              </div>
            </>
          )}
          {/* Theme toggle button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-gray-800 dark:to-gray-700 border-amber-300 dark:border-gray-700 hover:from-amber-200 hover:to-yellow-200 dark:hover:from-gray-700 dark:hover:to-gray-600 shadow-sm"
            title={theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-600" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-700" />
            )}
          </Button>
        </div>
      </div>
      {/* Main Content */}
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
        </Route>
        <Route
          path="*"
          element={<Navigate to={authed ? "/home" : "/login"} replace />}
        />
      </Routes>
      <Toaster position="top-right" richColors />
    </div>
  );
}
