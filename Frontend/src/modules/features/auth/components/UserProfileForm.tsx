import { useState, useEffect } from "react";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import {
  Eye,
  EyeOff,
  User,
  Lock,
  Mail,
  Phone,
  Car,
  CheckCircle,
  KeyRound,
  UserCircle,
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
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");

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
    setError("");
    setSuccess(false);
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
        setSuccess(true);
        toast.success("Cập nhật thông tin thành công!");
      } else {
        setError(data.detail || "Cập nhật thông tin thất bại!");
        toast.error(data.detail || "Cập nhật thông tin thất bại!");
      }
    } catch {
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu mới không khớp!");
      toast.error("Mật khẩu mới không khớp!");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess(false);
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
        setSuccess(true);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast.success("Cập nhật mật khẩu thành công!");
      } else {
        setError(data.detail || "Cập nhật mật khẩu thất bại!");
        toast.error(data.detail || "Cập nhật mật khẩu thất bại!");
      }
    } catch {
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-blue-900 p-4">
      <div className="flex flex-col lg:flex-row max-w-3xl w-full gap-4">
        {/* Vertical Navigation - hidden on mobile, shown as horizontal tabs on tablet+ */}
        <div className="hidden lg:flex flex-col space-y-2 py-8">
          <button
            onClick={() => setActiveSection("profile")}
            className={`group flex items-center gap-3 p-3 rounded-l-lg transition-all ${
              activeSection === "profile"
                ? "bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-blue-600 dark:text-blue-400 shadow-lg"
                : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/50 dark:hover:bg-gray-800/50"
            }`}
          >
            <UserCircle className="w-6 h-6" />
            <span className="font-medium">Thông tin</span>
          </button>

          <button
            onClick={() => setActiveSection("password")}
            className={`group flex items-center gap-3 p-3 rounded-l-lg transition-all ${
              activeSection === "password"
                ? "bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-blue-600 dark:text-blue-400 shadow-lg"
                : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/50 dark:hover:bg-gray-800/50"
            }`}
          >
            <KeyRound className="w-6 h-6" />
            <span className="font-medium">Mật khẩu</span>
          </button>
        </div>

        <Card className="flex-1 shadow-2xl border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-3 shadow-lg">
              <Car className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {activeSection === "profile"
                ? "Thông tin cá nhân"
                : "Đổi mật khẩu"}
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-xs sm:text-sm">
              {activeSection === "profile"
                ? "Cập nhật thông tin tài khoản"
                : "Thay đổi mật khẩu đăng nhập"}
            </p>

            {/* Mobile tabs */}
            <div className="flex lg:hidden gap-2 mt-4 justify-center">
              <button
                onClick={() => setActiveSection("profile")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeSection === "profile"
                    ? "bg-blue-500 text-white shadow-lg"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <UserCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Thông tin</span>
              </button>
              <button
                onClick={() => setActiveSection("password")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeSection === "password"
                    ? "bg-blue-500 text-white shadow-lg"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <KeyRound className="w-5 h-5" />
                <span className="text-sm font-medium">Mật khẩu</span>
              </button>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6">
            {/* Profile Form */}
            {activeSection === "profile" && (
              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div className="space-y-3">
                  {/* Username */}
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                    <Input
                      placeholder="Tên đăng nhập"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="pl-9 h-10 text-sm border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  {/* Email */}
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-9 h-10 text-sm border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  {/* Phone */}
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                    <Input
                      placeholder="Số điện thoại"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="pl-9 h-10 text-sm border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Status Messages */}
                {success && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-3 py-2 rounded-lg text-xs flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Cập nhật thông tin thành công!
                  </div>
                )}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-xs flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 text-sm bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Đang cập nhật...
                    </div>
                  ) : (
                    "Cập nhật thông tin"
                  )}
                </Button>
              </form>
            )}

            {/* Password Form */}
            {activeSection === "password" && (
              <form onSubmit={handleUpdatePassword} className="space-y-5">
                <div className="space-y-3">
                  {/* Old Password */}
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                    <Input
                      type={showOldPassword ? "text" : "password"}
                      placeholder="Mật khẩu hiện tại"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                      className="pl-9 pr-10 h-10 text-sm border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showOldPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* New Password */}
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Mật khẩu mới"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="pl-9 pr-10 h-10 text-sm border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Confirm New Password */}
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="pl-9 pr-10 h-10 text-sm border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Status Messages */}
                {success && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-3 py-2 rounded-lg text-xs flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Cập nhật mật khẩu thành công!
                  </div>
                )}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-xs flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 text-sm bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Đang cập nhật...
                    </div>
                  ) : (
                    "Cập nhật mật khẩu"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default UserProfile;
