import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";

export const PrivateRoute = () => {
  const user = useAppSelector((state) => state.auth.user);

  if (!user) {
    return <Navigate to="/" state= {{ toastMessage: 'Please Login/Register First', toastType: 'success' }} />;
  }

  return <Outlet />; // renders child routes
};
