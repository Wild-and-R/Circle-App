import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Front from "./pages/Front";
import Thread from "./pages/Thread";
import Follow from "./pages/Follow";
import Search from "./pages/Search";
import MyProfile from "./pages/MyProfile";
import Profile from "./pages/Profile";
import { PrivateRoute } from "./components/PrivateRoute";
import PrivateLayout from "./layouts/PrivateLayout";
import { Toaster } from "@/components/ui/sonner";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Front />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Private */}
        <Route element={<PrivateRoute />}>
          <Route element={<PrivateLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/thread/:id" element={<Thread />} />
            <Route path="/follows" element={<Follow />} />
            <Route path="/search" element={<Search />} />
            <Route path="/myprofile" element={<MyProfile />} />
            <Route path="/profile/:id" element={<Profile />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <Toaster />
    </BrowserRouter>
  );
};

export default App;
