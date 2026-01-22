import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/store/hooks";

const RightSidebar = () => {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <aside className="w-72 h-full flex flex-col px-4">
      {/* Profile Card */}
      <div className="flex flex-col gap-6">
        <div className="mb-4 rounded-lg h-20 bg-gradient-to-r from-green-400 to-yellow-400" />

        <div className="flex flex-col items-center gap-2">
          <img
            src={user?.photo_profile || "https://randomuser.me/api/portraits/lego/1.jpg"}
            className="w-20 h-20 rounded-full border-4 border-[#121212]"
          />
          <h2 className="font-semibold text-lg">
            {user?.full_name || user?.username}
          </h2>
          <p className="text-gray-400">@{user?.username}</p>
        </div>

        <div className="flex justify-around text-sm text-gray-400">
          <div>
            <span className="block font-semibold text-white">0</span>
            Following
          </div>
          <div>
            <span className="block font-semibold text-white">0</span>
            Followers
          </div>
        </div>

        <Button className="bg-[#222] hover:bg-[#333]">
          Edit Profile
        </Button>
      </div>

      <footer className="mt-auto text-gray-400 text-center text-xs">
    Developed by Wildan Rahadian ·{" "}
    <a
      href="https://dumbways.id/"
      target="_blank"
      rel="noopener noreferrer"
      className="underline"
    >
      Powered by DumbWays Indonesia
    </a>{" "}
    · #1 Coding Bootcamp
  </footer>
    </aside>
  );
};

export default RightSidebar;
