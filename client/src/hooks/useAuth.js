import { useSelector } from "react-redux";
import { selectCurrentUser, selectIsAuthenticated, selectUserRole } from "../store/authSlice";

export const useAuth = () => {
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const role = useSelector(selectUserRole);

  return {
    user,
    isAuthenticated,
    role,
    isAdmin: role === "admin",
    isHospital: role === "hospital",
    isPatient: role === "patient",
    isDonor: role === "donor",
  };
};
