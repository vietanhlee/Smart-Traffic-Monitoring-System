import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { Eye, EyeOff, Mail, Lock, Car } from "lucide-react";
import { authConfig } from "@/config";

function Login({
  onLoginSuccess,
  onToggleRegister,
}: {
  onLoginSuccess?: () => void;
  onToggleRegister?: () => void;
}) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // OAuth2 yêu cầu application/x-www-form-urlencoded
      const formData = new URLSearchParams();
      formData.append("username", email); // OAuth2 dùng field "username" cho cả email/username
      formData.append("password", password);

      const res = await fetch(authConfig.LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.access_token) {
        localStorage.setItem(authConfig.TOKEN_KEY, data.access_token);
        onLoginSuccess?.();
        navigate("/home");
      } else {
        setError(data.detail || "Đăng nhập thất bại!");
      }
    } catch {
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent px-4 py-10">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-white dark:bg-slate-900 shadow-2xl shadow-indigo-500/20 border border-indigo-100 dark:border-indigo-900/50">
            <Car className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
              Chào mừng trở lại
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Đăng nhập để vào hệ thống
            </p>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-15 group-hover:opacity-25 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl rounded-3xl border border-white/20 dark:border-slate-800/50 p-8 shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full h-12 rounded-xl border-slate-200 bg-white/50 px-12 dark:border-slate-700 dark:bg-slate-950/50 focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full h-12 rounded-xl border-slate-200 bg-white/50 px-12 dark:border-slate-700 dark:bg-slate-950/50 focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-600 dark:text-red-400 text-center font-medium">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-base shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? "Đang xử lý..." : "Đăng nhập ngay"}
              </Button>
            </form>
          </div>
        </div>

        <div className="text-center">
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Chưa có tài khoản?{" "}
            <button
              onClick={() => onToggleRegister?.()}
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
            >
              Tạo tài khoản miễn phí
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
