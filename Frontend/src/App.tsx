import { useState, useRef, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
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
} from "lucide-react";
import LoginPage from "./pages/LoginPage";
import TrafficDashboard from "@/modules/dashboard/components/TrafficDashboard";
import AnalyticsPage from "./pages/AnalyticsPage";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import ProtectedRoute from "@/modules/auth/components/ProtectedRoute";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-blue-900">
      {/* Banner */}
      <div className="w-full flex flex-wrap items-center justify-between px-2 sm:px-4 py-1 bg-white/80 dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 min-h-0">
        <div className="flex items-center min-w-0 gap-2">
          <a href="/home" className="flex items-center" title="Trang chủ">
            <div className="relative w-11 h-11">
              {/* Animated background gradient */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-gradient-x"></div>

              {/* Icon container with glassmorphism effect */}
              <div className="absolute inset-0.5 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <Car
                  className="w-6 h-6 text-white/90 drop-shadow-lg"
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
          <div className="flex flex-col justify-center">
            <h1 className="text-base sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate max-w-[220px] sm:max-w-[400px] md:max-w-[700px] lg:max-w-[1000px] leading-tight flex items-center">
              Smart Traffic Monitoring System
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mt-0.5 text-left max-w-[90vw] leading-tight">
              Real-time traffic monitoring and analysis
            </p>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Centered Navigation Tabs below title */}
          <nav className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold transition-colors text-sm sm:text-base focus:outline-none ${
                window.location.pathname === "/home"
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 shadow"
                  : "text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-800"
              }`}
              onClick={() => (window.location.href = "/home")}
            >
              <Car className="h-7 w-7 sm:h-8 sm:w-8" />
              <span className="font-semibold">Giám Sát</span>
            </Button>
            <Button
              variant="ghost"
              className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold transition-colors text-sm sm:text-base focus:outline-none ${
                window.location.pathname.startsWith("/analys")
                  ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 shadow"
                  : "text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-800"
              }`}
              onClick={() => (window.location.href = "/analys")}
            >
              <Settings className="h-7 w-7 sm:h-8 sm:w-8" />
              <span className="font-semibold">Phân Tích</span>
            </Button>
            <Button
              variant="ghost"
              className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold transition-colors text-sm sm:text-base focus:outline-none ${
                window.location.pathname.startsWith("/chat")
                  ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 shadow"
                  : "text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-800"
              }`}
              onClick={() => (window.location.href = "/chat")}
            >
              <UserCircle className="h-7 w-7 sm:h-8 sm:w-8" />
              <span className="font-semibold">Trợ Lý AI</span>
            </Button>
          </nav>
        </div>
        <div
          className="flex items-center space-x-3 relative flex-shrink-0 ml-auto"
          ref={dropdownRef}
          style={{ minWidth: 180, justifyContent: "flex-end" }}
        >
          {authed && (
            <>
              <button
                className="flex items-center space-x-2 focus:outline-none group"
                onClick={() => setShowUserDropdown((v) => !v)}
                onMouseEnter={() => {
                  if (hideDropdownTimeout.current)
                    clearTimeout(hideDropdownTimeout.current);
                  setShowUserDropdown(true);
                }}
                onMouseLeave={() => {
                  hideDropdownTimeout.current = setTimeout(
                    () => setShowUserDropdown(false),
                    180
                  );
                }}
                type="button"
              >
                <UserCircle className="h-7 w-7 text-blue-600 dark:text-blue-300" />
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  Tài khoản
                </span>
              </button>
              <div
                className={`absolute right-0 top-12 min-w-[160px] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-2 transition-all duration-200 ease-in-out ${
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
                    180
                  );
                }}
                style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
              >
                <a
                  href="/profile"
                  className="w-full flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm transition-colors"
                  onClick={() => setShowUserDropdown(false)}
                >
                  <Settings className="h-4 w-4 mr-2" /> Quản lý
                </a>
                <button
                  className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 text-sm transition-colors"
                  onClick={() => {
                    handleLogout();
                    setShowUserDropdown(false);
                  }}
                  type="button"
                >
                  <LogOut className="h-4 w-4 mr-2" /> Đăng xuất
                </button>
              </div>
            </>
          )}
          {/* Theme toggle button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
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
          <Route
            path="/profile"
            element={
              <ProfilePage
                onLogout={handleLogout}
                onBackHome={() => {
                  window.location.href = "/home";
                }}
              />
            }
          />
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
