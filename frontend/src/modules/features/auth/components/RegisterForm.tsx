import { useState } from "react";

import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { Eye, EyeOff, User, Lock, Mail, Phone, Car } from "lucide-react";
import { authConfig } from "@/config";

function Register({
  onRegisterSuccess,
  onToggleLogin,
}: {
  onRegisterSuccess?: () => void;
  onToggleLogin?: () => void;
}) {
  // Form states
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp!");
      return;
    }

    if (password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự!");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(authConfig.REGISTER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          phone_number: phone,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        onRegisterSuccess?.();
        onToggleLogin?.();
      } else {
        setError(data.detail || "Đăng ký tài khoản thất bại!");
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
              Tham gia ngay
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Tạo tài khoản để vào hệ thống
            </p>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-15 group-hover:opacity-25 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl rounded-3xl border border-white/20 dark:border-slate-800/50 p-8 shadow-2xl">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                    Họ tên
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Nguyễn Văn A"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="w-full h-11 rounded-xl border-slate-200 bg-white/50 px-11 dark:border-slate-700 dark:bg-slate-950/50 focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full h-11 rounded-xl border-slate-200 bg-white/50 px-11 dark:border-slate-700 dark:bg-slate-950/50 focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="tel"
                      placeholder="0987xxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full h-11 rounded-xl border-slate-200 bg-white/50 px-11 dark:border-slate-700 dark:bg-slate-950/50 focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                      Mật khẩu
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full h-11 rounded-xl border-slate-200 bg-white/50 px-11 dark:border-slate-700 dark:bg-slate-950/50 focus:ring-2 focus:ring-indigo-500 transition-all pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                      Xác nhận
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full h-11 rounded-xl border-slate-200 bg-white/50 px-11 dark:border-slate-700 dark:bg-slate-950/50 focus:ring-2 focus:ring-indigo-500 transition-all pr-11"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {success && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-600 dark:text-emerald-400 text-center font-medium">
                  Đăng ký thành công! Đang chuyển hướng...
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-600 dark:text-red-400 text-center font-medium">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-base shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
              >
                {loading ? "Đang xử lý..." : "Tạo tài khoản ngay"}
              </Button>
            </form>
          </div>
        </div>

        <div className="text-center">
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Đã có tài khoản?{" "}
            <button
              onClick={() => onToggleLogin?.()}
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
            >
              Đăng nhập tại đây
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
