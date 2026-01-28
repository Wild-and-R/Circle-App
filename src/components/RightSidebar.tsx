import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/store/hooks";
import { useState, useEffect, useCallback } from "react";
import EditProfileDialog from "./EditProfileDialog";
import { api } from "@/services/api";
import { toast } from "sonner";
import { connectSocket, disconnectSocket } from "@/services/websocket";

interface SuggestedUser {
  id: number;
  username: string;
  full_name: string | null;
  photo_profile: string | null;
  bio?: string | null;
}

const RightSidebar = () => {
  const user = useAppSelector((state) => state.auth.user);

  const [openEdit, setOpenEdit] = useState(false);
  const [suggested, setSuggested] = useState<SuggestedUser[]>([]);
  const [loadingSuggested, setLoadingSuggested] = useState(false);

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // Keep track of IDs you are currently following
  const [followingIds, setFollowingIds] = useState<number[]>([]);

  // Helper to check if user is followed
  const isFollowing = useCallback(
    (userId: number) => followingIds.includes(userId),
    [followingIds]
  );

  useEffect(() => {
    if (!user) return;

    const fetchSuggested = async () => {
      setLoadingSuggested(true);
      try {
        const res = await api.get("/users/suggested");
        setSuggested(res.data.data);
      } catch {
        toast.error("Failed to load suggested users");
      } finally {
        setLoadingSuggested(false);
      }
    };

    const fetchFollowStats = async () => {
      try {
        const res = await api.get("/users/me/stats");
        setFollowersCount(res.data.data.followers);
        setFollowingCount(res.data.data.following);

        // Set initial following IDs from suggested users
        const following = res.data.data.followingIds || [];
        setFollowingIds(following);
      } catch {
        toast.error("Failed to load follow stats");
      }
    };

    fetchSuggested();
    fetchFollowStats();

    // Connect Socket.IO
    const sock = connectSocket(user.id);

    // Listen for follow/unfollow updates
    sock.on("follow:changed", (payload: { followersDelta: number; followingDelta: number }) => {
      setFollowersCount((prev) => prev + payload.followersDelta);
      setFollowingCount((prev) => prev + payload.followingDelta);
    });

    return () => {
      sock.off("follow:changed");
      disconnectSocket();
    };
  }, [user]);

  const handleFollow = async (userId: number) => {
  setSuggested((prev) => prev.filter((u) => u.id !== userId));
  setFollowingIds((prev) => [...prev, userId]);

  try {
    await api.post(`/follows/${userId}/follow`);
    toast.success("Followed");
  } catch {
    // rollback
    setSuggested((prev) => [...prev, suggested.find((u) => u.id === userId)!]);
    setFollowingIds((prev) => prev.filter((id) => id !== userId));
    toast.error("Failed to follow user");
  }
};



  const handleUnfollow = async (userId: number) => {
  setFollowingIds((prev) => prev.filter((id) => id !== userId));

  try {
    await api.delete(`/follows/${userId}/unfollow`);
    toast.success("Unfollowed");

    const userObj = suggested.find((u) => u.id === userId);
    if (!userObj) {
      const res = await api.get(`/users/${userId}`);
      setSuggested((prev) => [res.data.data.user, ...prev]);
    }
  } catch {
    setFollowingIds((prev) => [...prev, userId]);
    toast.error("Failed to unfollow user");
  }
};


  if (!user) return null;

  return (
    <aside className="w-72 h-full border-l border-[#222] p-4 flex flex-col">
      <div className="flex flex-col gap-6 flex-1 overflow-hidden">
        {/* Profile */}
        <div className="flex flex-col items-center gap-2">
          <img
            src={
              user.photo_profile
                ? `http://localhost:3000/uploads/${user.photo_profile}`
                : "https://randomuser.me/api/portraits/lego/1.jpg"
            }
            className="w-20 h-20 rounded-full"
          />
          <h3 className="font-semibold text-lg">{user.full_name || user.username}</h3>
          <p className="text-gray-400">@{user.username}</p>
          {user.bio && <p className="text-sm text-gray-300 text-center">{user.bio}</p>}
        </div>

        {/* Follow Stats */}
        <div className="flex justify-center gap-8 text-sm">
          <div className="flex flex-col items-center">
            <span className="font-semibold text-white">{followingCount}</span>
            <span className="text-gray-400">Following</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-semibold text-white">{followersCount}</span>
            <span className="text-gray-400">Followers</span>
          </div>
        </div>

        <Button className="bg-[#222] hover:bg-[#333]" onClick={() => setOpenEdit(true)}>
          Edit Profile
        </Button>

        {/* Suggested Users */}
        {suggested.length > 0 && (
          <div className="mt-6 flex flex-col flex-1 overflow-hidden">
            <h4 className="font-semibold text-white mb-2">Suggested for you</h4>
            <div className="overflow-y-auto flex-1">
              {loadingSuggested && (
                <p className="text-gray-400 text-sm text-center">Loading...</p>
              )}
              {!loadingSuggested &&
                suggested.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between gap-3 border border-gray-700 rounded p-2 mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={
                          u.photo_profile
                            ? `http://localhost:3000/uploads/${u.photo_profile}`
                            : "https://randomuser.me/api/portraits/lego/1.jpg"
                        }
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{u.full_name || u.username}</span>
                        <span className="text-gray-400 text-xs">@{u.username}</span>
                      </div>
                    </div>

                    {isFollowing(u.id) ? (
                      <Button
                        onClick={() => handleUnfollow(u.id)}
                        className="bg-red-500 hover:bg-red-600 text-black text-xs"
                      >
                        Unfollow
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleFollow(u.id)}
                        className="bg-green-500 hover:bg-green-600 text-black text-xs"
                      >
                        Follow
                      </Button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-auto text-gray-400 text-center text-xs pt-6">
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

      <EditProfileDialog open={openEdit} onOpenChange={setOpenEdit} user={user} />
    </aside>
  );
};

export default RightSidebar;
