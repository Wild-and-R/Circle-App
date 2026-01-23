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
  const [followLoadingIds, setFollowLoadingIds] = useState<number[]>([]); // track loading per user for follow button

  // Fetch followers or following depending on tab
  const fetchUsers = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const url = `/follows/${currentUser.id}/${tab}`; // example route: /follows/:userId/followers or /following
      const res = await api.get(url);
console.log("Follow API response:", res.data);
setUsers(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [tab, currentUser]);

  // Check if currentUser is following a user
  const [followingSet, setFollowingSet] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (tab === "following") {
      // All users here are followed by currentUser
      setFollowingSet(new Set(users.map((u) => u.id)));
    } else {
      setFollowingSet(new Set());
    }
  }, [users, tab]);

  // Toggle follow/unfollow for a user
  const toggleFollow = async (userId: number) => {
    if (!currentUser) return;
    if (followLoadingIds.includes(userId)) return;

    setFollowLoadingIds((ids) => [...ids, userId]);
    try {
      const isFollowing = followingSet.has(userId);

      if (isFollowing) {
        // unfollow
        await api.delete(`/follows/${userId}/unfollow`);
        setFollowingSet((s) => {
          const copy = new Set(s);
          copy.delete(userId);
          return copy;
        });
        if (tab === "following") {
          // If currently viewing following tab, remove user from list on unfollow
          setUsers((list) => list.filter((u) => u.id !== userId));
        }
      } else {
        // follow
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
    <main className="flex flex-col w-full max-w-3xl mx-auto p-4 text-white bg-[#121212] rounded-md shadow-md">
      <h1 className="text-2xl font-semibold mb-4 text-green-500">Follows</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-4">
        <button
          className={`flex-1 py-2 text-center ${
            tab === "followers"
              ? "border-b-2 border-green-500 text-green-500 font-semibold"
              : "text-gray-400"
          }`}
          onClick={() => setTab("followers")}
        >
          Followers
        </button>
        <button
          className={`flex-1 py-2 text-center ${
            tab === "following"
              ? "border-b-2 border-green-500 text-green-500 font-semibold"
              : "text-gray-400"
          }`}
          onClick={() => setTab("following")}
        >
          Following
        </button>
      </div>

      {/* User List */}
      <div className="flex flex-col gap-3 overflow-y-auto max-h-[600px]">
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
                alt={user.username}
                className="w-12 h-12 rounded-full object-cover"
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
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-green-500 hover:bg-green-600 text-black"
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
    </main>
  );
};

export default Follow;
