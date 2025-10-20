import { useState, useRef, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";
import { Button } from "@/ui/button";
import { Car, LogOut, Settings, UserCircle, Sun, Moon } from "lucide-react";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import ChatPage from "./pages/ChatPage";
import ProtectedRoute from "@/modules/auth/components/ProtectedRoute";
import "./App.css";

export default function App() {
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

  const handleLoginSuccess = () => setAuthed(true);
  const handleRegisterSuccess = () => setShowRegister(false);
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setAuthed(false);
    setShowUserDropdown(false);
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
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <BrowserRouter>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-blue-900">
          {/* Banner */}
          <div className="w-full flex flex-wrap items-center justify-between px-2 sm:px-4 py-2 bg-white/80 dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 min-w-0">
              <a
                href="/"
                className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white flex-shrink-0"
                title="Trang chủ"
              >
                <Car className="h-6 w-6 sm:h-7 sm:w-7" />
              </a>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate max-w-[320px] sm:max-w-[520px] md:max-w-[900px] lg:max-w-[1200px]">
                  Hệ Thống Giám Sát Giao Thông Thông Minh
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm truncate max-w-[320px] sm:max-w-[520px] md:max-w-[900px] lg:max-w-[1200px]">
                  Giám sát và phân tích giao thông thời gian thực
                </p>
              </div>
            </div>
            <div
              className="flex items-center space-x-2 sm:space-x-3 relative flex-shrink-0"
              ref={dropdownRef}
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
              <Route path="/" element={<HomePage />} />
              <Route
                path="/profile"
                element={
                  <ProfilePage
                    onLogout={handleLogout}
                    onBackHome={() => {
                      window.location.href = "/";
                    }}
                  />
                }
              />
              <Route path="/chat" element={<ChatPage />} />
            </Route>
            <Route
              path="*"
              element={<Navigate to={authed ? "/" : "/login"} replace />}
            />
          </Routes>
          <Toaster position="top-right" richColors />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
