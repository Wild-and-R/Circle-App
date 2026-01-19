import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Front from "./pages/Front"

const Header = () => {
  const navigate = useNavigate();
  const user = localStorage.getItem("user");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <header className="flex items-center justify-between px-6 h-16 border-b bg-[#121212]">
      <Link to="/" className="text-green-500 font-semibold text-xl">
        circle
      </Link>

      {user ? (
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {JSON.parse(user).username}
          </span>
          <Link to="/home">
            <Button>Home</Button>
          </Link>
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      ) : (
        <div className="flex gap-3">
          <Link to="/login">
            <Button>Login</Button>
          </Link>

          <Link to="/register">
            <Button variant="outline">Register</Button>
          </Link>
        </div>
      )}
    </header>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <Header />

      <Routes>
        <Route path="/" element={<Front />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
