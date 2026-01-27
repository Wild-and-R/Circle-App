import { useEffect, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface User {
  id: number;
  username: string;
  full_name: string | null;
  photo_profile: string | null;
  bio?: string | null;
}

const Follow = () => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const [tab, setTab] = useState<"followers" | "following">("followers");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [followLoadingIds, setFollowLoadingIds] = useState<number[]>([]);

  // Track all users the current user is following
  const [followingSet, setFollowingSet] = useState<Set<number>>(new Set());

  // Fetch the current user's following list on first load
  const fetchFollowingList = async () => {
    if (!currentUser) return;
    try {
      const res = await api.get(`/follows/${currentUser.id}/following`);
      const followingIds = res.data.data.map((u: User) => u.id);
      setFollowingSet(new Set(followingIds));
    } catch {
      toast.error("Failed to load following list");
    }
  };

  // Fetch users for current tab
  const fetchUsers = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const res = await api.get(`/follows/${currentUser.id}/${tab}`);
      const fetchedUsers: User[] = Array.isArray(res.data)
        ? res.data
        : res.data.data || [];
      setUsers(fetchedUsers);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowingList(); // load following info on page load
  }, [currentUser]);

  useEffect(() => {
    fetchUsers(); // load users whenever tab changes
  }, [tab, currentUser]);

  const toggleFollow = async (userId: number) => {
    if (!currentUser || followLoadingIds.includes(userId)) return;

    setFollowLoadingIds((ids) => [...ids, userId]);
    try {
      const isFollowing = followingSet.has(userId);

      if (isFollowing) {
        await api.delete(`/follows/${userId}/unfollow`);
        setFollowingSet((s) => {
          const copy = new Set(s);
          copy.delete(userId);
          return copy;
        });
        if (tab === "following") {
          setUsers((list) => list.filter((u) => u.id !== userId));
        }
      } else {
        await api.post(`/follows/${userId}/follow`);
        setFollowingSet((s) => new Set(s).add(userId));
      }

      toast.success(isFollowing ? "Unfollowed" : "Followed");
    } catch {
      toast.error("Failed to update follow status");
    } finally {
      setFollowLoadingIds((ids) => ids.filter((id) => id !== userId));
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto w-full max-w-3xl mx-auto p-4 text-white">
      <h1 className="text-2xl font-semibold mb-4 text-green-500">Follows</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-4">
        {["followers", "following"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={`flex-1 py-2 ${
              tab === t
                ? "border-b-2 border-green-500 text-green-500 font-semibold"
                : "text-gray-400"
            }`}
          >
            {t === "followers" ? "Followers" : "Following"}
          </button>
        ))}
      </div>

      {/* User List */}
      <div className="flex flex-col gap-3">
        {loading && <p className="text-center text-gray-400">Loading...</p>}
        {!loading && users.length === 0 && (
          <p className="text-center text-gray-400">No users found.</p>
        )}

        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between border border-gray-700 rounded p-3"
          >
            <div className="flex items-center gap-3">
              <img
                src={
                  user.photo_profile
                    ? `http://localhost:3000/uploads/${user.photo_profile}`
                    : "https://randomuser.me/api/portraits/lego/1.jpg"
                }
                className="w-12 h-12 rounded-full"
              />
              <div>
                <p className="font-semibold">{user.full_name || user.username}</p>
                <p className="text-gray-400 text-sm">@{user.username}</p>
                {user.bio && (
                  <p className="text-gray-500 text-xs line-clamp-2 max-w-xs">{user.bio}</p>
                )}
              </div>
            </div>

            <Button
              onClick={() => toggleFollow(user.id)}
              disabled={followLoadingIds.includes(user.id)}
              className={`w-24 text-sm ${
                followingSet.has(user.id)
                  ? "bg-gray-700"
                  : "bg-green-500 text-black"
              }`}
            >
              {followLoadingIds.includes(user.id)
                ? "..."
                : followingSet.has(user.id)
                ? "Following"
                : "Follow"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Follow;
