import UserProfile from "../features/auth/UserProfile";

export default function ProfilePage({
  onLogout,
  onBackHome,
}: {
  onLogout: () => void;
  onBackHome: () => void;
}) {
  return <UserProfile onLogout={onLogout} onBackHome={onBackHome} />;
}
