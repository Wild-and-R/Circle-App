import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/authSlice";
import { disconnectSocket } from "@/services/websocket";

interface LeftSidebarProps {
  onCreatePost: () => void;
}

const LeftSidebar = ({ onCreatePost }: LeftSidebarProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    disconnectSocket();
    dispatch(logout());
  };

  return (
    <aside className="w-60 flex flex-col gap-6 border-r border-[#222] h-full px-4">
      <h1 className="text-3xl font-bold text-green-500">circle</h1>

      <nav className="flex flex-col gap-4">
        {[
          { label: "Home", icon: "🏠︎", path: "/home" },
          { label: "Search", icon: "🔍︎" },
          { label: "Follows", icon: "❤︎", path: "/follows" },
          { label: "Profile", icon: "👤" },
        ].map(({ label, icon, path }) => (
          <Button
            key={label}
            onClick={() => path && navigate(path)}
            className="flex items-center gap-3 justify-start text-lg font-semibold hover:text-green-500"
            variant="ghost"
          >
            <span>{icon}</span>
            {label}
          </Button>
        ))}
      </nav>

      <Button
        onClick={onCreatePost}
        className="bg-green-500 text-black rounded-full font-semibold"
      >
        Create Post
      </Button>

      <Button
        onClick={handleLogout}
        className="flex items-center gap-2 mt-auto hover:text-red-600 font-semibold"
        variant="ghost"
      >
        <span>⍈</span> Logout
      </Button>
    </aside>
  );
};

export default LeftSidebar;
