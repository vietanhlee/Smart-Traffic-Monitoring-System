import Login from "@/modules/features/auth/components/LoginForm";
import Register from "@/modules/features/auth/components/RegisterForm";
import { useNavigate } from "react-router-dom";

export default function LoginPage({
  onLoginSuccess,
  onRegisterSuccess,
  showRegister,
  setShowRegister,
}: {
  onLoginSuccess: () => void;
  onRegisterSuccess: () => void;
  showRegister: boolean;
  setShowRegister: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  return (
    <div>
      {showRegister ? (
        <Register onRegisterSuccess={onRegisterSuccess} />
      ) : (
        <Login
          onLoginSuccess={() => {
            onLoginSuccess();
            navigate("/");
          }}
        />
      )}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2">
        <button
          className="px-6 py-3 bg-gradient-to-r from-purple-100 via-pink-100 to-blue-100 dark:bg-white/80 backdrop-blur-sm border border-purple-300/50 dark:border-gray-200 rounded-full text-gray-800 dark:text-gray-700 hover:from-purple-200 hover:via-pink-200 hover:to-blue-200 dark:hover:bg-white hover:shadow-lg transition-all duration-200 font-medium"
          onClick={() => setShowRegister(!showRegister)}
        >
          {showRegister
            ? "Đã có tài khoản? Đăng nhập"
            : "Chưa có tài khoản? Đăng ký"}
        </button>
      </div>
    </div>
  );
}
