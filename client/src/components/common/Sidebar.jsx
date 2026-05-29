import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useDispatch } from "react-redux";
import { logoutUser } from "../../store/authSlice";
import { ROLE_MENU } from "../../utils/constants";
import { HiLogout, HiHeart, HiMail } from "react-icons/hi";
import {
  HiHome,
  HiClipboardList,
  HiPlus,
  HiExclamationCircle,
  HiUser,
  HiBeaker,
  HiSwitchHorizontal,
  HiOfficeBuilding,
} from "react-icons/hi";
import toast from "react-hot-toast";

const iconMap = {
  HiHome,
  HiClipboardList,
  HiPlus,
  HiExclamationCircle,
  HiUser,
  HiHeart,
  HiBeaker,
  HiSwitchHorizontal,
  HiOfficeBuilding,
  HiMail,
};

export default function Sidebar({ isOpen, onClose }) {
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  let menuItems = ROLE_MENU[role] || [];

  if (role === 'hospital' && !user?.isHospitalVerified) {
    menuItems = menuItems.filter(item => 
      ['/dashboard', '/dashboard/hospital-profile', '/dashboard/profile'].includes(item.path)
    );
  }
  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch {
      toast.error("Logout failed");
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-surface-100 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-surface-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <HiHeart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-surface-900">Life Flow</h1>
                <p className="text-xs text-surface-400 capitalize">{role} Panel</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = iconMap[item.icon] || HiHome;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/dashboard"}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-primary-50 text-primary-700"
                        : "text-surface-600 hover:bg-surface-50 hover:text-surface-900"
                    }`
                  }
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-3 border-t border-surface-100">
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700">
                {user?.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-900 truncate">{user?.name}</p>
                <p className="text-xs text-surface-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <HiLogout className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}