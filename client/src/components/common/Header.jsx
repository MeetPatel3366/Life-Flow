import { HiMenuAlt2 } from "react-icons/hi";
import NotificationBell from "./NotificationBell";
import { useAuth } from "../../hooks/useAuth";

export default function Header({ onMenuToggle }) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-surface-100">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg hover:bg-surface-100 transition-colors lg:hidden cursor-pointer"
          >
            <HiMenuAlt2 className="w-5 h-5 text-surface-600" />
          </button>
          <div>
            <h2 className="text-sm font-medium text-surface-500">Welcome back,</h2>
            <p className="text-base font-semibold text-surface-900">{user?.name || "User"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
