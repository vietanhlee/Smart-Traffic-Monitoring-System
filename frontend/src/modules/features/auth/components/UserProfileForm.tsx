import { useState, useEffect } from "react";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import {
  User,
  Mail,
  Phone,
  UserCircle,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { authConfig, userConfig } from "@/config";

function UserProfile() {
  // Profile information states
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Password states
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI states
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Fetch current user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem(authConfig.TOKEN_KEY);
        if (!token) {
          toast.error("Vui lòng đăng nhập");
          return;
        }
        const res = await fetch(authConfig.ME_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUsername(data.username || "");
          setEmail(data.email || "");
          setPhone(data.phone_number || "");
        } else {
          toast.error("Không thể tải thông tin người dùng");
        }
      } catch {
        toast.error("Lỗi kết nối");
      }
    };
    fetchUserData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem(authConfig.TOKEN_KEY);
      const res = await fetch(userConfig.PROFILE_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username,
          email,
          phone_number: phone,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Cập nhật thông tin thành công!");
      } else {
        toast.error(data.detail || "Cập nhật thông tin thất bại!");
      }
    } catch {
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu mới không khớp!");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem(authConfig.TOKEN_KEY);
      const res = await fetch(userConfig.PASSWORD_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast.success("Cập nhật mật khẩu thành công!");
      } else {
        toast.error(data.detail || "Cập nhật mật khẩu thất bại!");
      }
    } catch {
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-8">
      {/* Simple Header */}
      <div className="flex flex-col gap-2 border-b border-border pb-6">
        <h2 className="text-2xl font-bold text-foreground">
          Cài đặt tài khoản
        </h2>
        <p className="text-sm text-muted-foreground">
          Quản lý thông tin cá nhân và bảo mật tài khoản của bạn
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border border-border bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm p-4 shadow-sm">
            <nav className="flex flex-col gap-1">
              <button
                onClick={() => setActiveSection("profile")}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-all cursor-pointer ${
                  activeSection === "profile"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-foreground"
                }`}
              >
                <UserCircle className="h-4 w-4" />
                Hồ sơ cá nhân
              </button>
              <button
                onClick={() => setActiveSection("password")}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-all cursor-pointer ${
                  activeSection === "password"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-foreground"
                }`}
              >
                <UserCircle className="h-4 w-4" />
                Đổi mật khẩu
              </button>
            </nav>
          </div>

          <div className="rounded-xl border border-border bg-slate-100/40 dark:bg-slate-800/40 p-5 text-center backdrop-blur-sm">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
              <UserCircle className="h-8 w-8" />
            </div>
            <p className="text-sm font-bold text-foreground truncate">{username || "Người dùng"}</p>
            <p className="text-xs font-medium text-muted-foreground truncate">{email}</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-border bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-6 sm:p-8 shadow-sm">
            {activeSection === "profile" && (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                      Tên hiển thị
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="pl-10 h-11 rounded-lg border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                      Số điện thoại
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10 h-11 rounded-lg border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                      Địa chỉ Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11 rounded-lg border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="rounded-lg px-10 h-11 font-bold shadow-md transition-all active:scale-95"
                  >
                    {loading ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                </div>
              </form>
            )}

            {activeSection === "password" && (
              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div className="space-y-5 max-w-md">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                      Mật khẩu hiện tại
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type={showOld ? "text" : "password"}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="pl-10 pr-10 h-11 rounded-lg border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOld(!showOld)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      >
                        {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                      Mật khẩu mới
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type={showNew ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-10 pr-10 h-11 rounded-lg border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      >
                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                      Xác nhận mật khẩu mới
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 pr-10 h-11 rounded-lg border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="rounded-lg px-10 h-11 font-bold shadow-md transition-all active:scale-95"
                  >
                    {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
