import Login from "@/modules/features/auth/components/LoginForm";
import Register from "@/modules/features/auth/components/RegisterForm";

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
  return (
    <div>
      {showRegister ? (
        <Register
          onRegisterSuccess={onRegisterSuccess}
          onToggleLogin={() => setShowRegister(false)}
        />
      ) : (
        <Login
          onLoginSuccess={onLoginSuccess}
          onToggleRegister={() => setShowRegister(true)}
        />
      )}
    </div>
  );
}
