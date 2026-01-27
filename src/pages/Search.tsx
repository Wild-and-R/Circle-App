import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAppSelector } from "@/store/hooks";
import { connectSocket } from "@/services/websocket";

interface User {
  id: number;
  username: string;
  full_name?: string | null;
  bio?: string | null;
  photo_profile?: string | null;
  isFollowing?: boolean;
}

const Search = () => {
  const currentUser = useAppSelector((state) => state.auth.user);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [followLoadingIds, setFollowLoadingIds] = useState<number[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);

        const res = await api.get(`/users/search?q=${query}`);
        const users: User[] = res.data.data.users.map((u: any) => ({
          ...u,
          isFollowing: !!u.isFollowing,
        }));
        setResults(users);
      } catch {
        toast.error("Failed to search users");
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleFollow = async (userId: number) => {
    if (followLoadingIds.includes(userId)) return;

    setFollowLoadingIds((ids) => [...ids, userId]);
    setResults((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isFollowing: true } : u))
    );

    try {
      await api.post(`/follows/${userId}/follow`);
      toast.success("Followed");
    } catch {
      setResults((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isFollowing: false } : u))
      );
      toast.error("Failed to follow user");
    } finally {
      setFollowLoadingIds((ids) => ids.filter((id) => id !== userId));
    }
  };

  const handleUnfollow = async (userId: number) => {
    if (followLoadingIds.includes(userId)) return;

    setFollowLoadingIds((ids) => [...ids, userId]);
    setResults((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isFollowing: false } : u))
    );

    try {
      await api.delete(`/follows/${userId}/unfollow`);
      toast.success("Unfollowed");
    } catch {
      setResults((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isFollowing: true } : u))
      );
      toast.error("Failed to unfollow user");
    } finally {
      setFollowLoadingIds((ids) => ids.filter((id) => id !== userId));
    }
  };

  useEffect(() => {
  if (!currentUser) return;

  const sock = connectSocket(currentUser.id);

  sock.on(
  "follow:changed",
  (payload: {
    currentUserId: number;
    actionUserId: number;
    isFollowing: boolean;
    followersDelta?: number;
    followingDelta?: number;
  }) => {
    // Update Search results if any affected
    setResults((prev) =>
      prev.map((u) =>
        u.id === payload.actionUserId ? { ...u, isFollowing: payload.isFollowing } : u
      )
    );
  }
);


  return () => {
    sock.off("follow:changed");
  };
}, [currentUser]);



  return (
    <div className="max-w-2xl mx-auto">
      {/* Search input */}
      <div className="sticky top-0 bg-[#121212] z-10 pb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          className="
            w-full
            bg-[#1a1a1a]
            border
            border-[#2a2a2a]
            rounded-full
            px-4
            py-2
            text-white
            placeholder:text-gray-400
            outline-none
          "
        />
      </div>

      {/* Results */}
      <div className="mt-4 space-y-3">
        {loading && <p className="text-gray-400 text-center">Searching...</p>}

        {!loading && results.length === 0 && query && (
          <p className="text-gray-400 text-center">No users found</p>
        )}

        {results.map((user) => (
          <div
            key={user.id}
            className="
              flex
              items-center
              justify-between
              gap-4
              p-3
              border
              border-[#2a2a2a]
              rounded-lg
              bg-[#1a1a1a]
            "
          >
            <div className="flex items-center gap-3">
              <img
                src={
                  user.photo_profile
                    ? `http://localhost:3000/uploads/${user.photo_profile}`
                    : "https://randomuser.me/api/portraits/lego/1.jpg"
                }
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://randomuser.me/api/portraits/lego/1.jpg";
                }}
                className="w-12 h-12 rounded-full object-cover"
              />

              <div className="flex flex-col">
                <span className="font-semibold text-white">
                  {user.full_name || user.username}
                </span>
                <span className="text-sm text-gray-400">
                  @{user.username}
                </span>
                {user.bio && (
                  <span className="text-sm text-gray-500 line-clamp-1">
                    {user.bio}
                  </span>
                )}
              </div>
            </div>

            <Button
              onClick={() =>
                user.isFollowing ? handleUnfollow(user.id) : handleFollow(user.id)
              }
              disabled={followLoadingIds.includes(user.id)}
              className={`w-24 text-sm ${
                user.isFollowing
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-green-500 hover:bg-green-600 text-black"
              }`}
            >
              {followLoadingIds.includes(user.id)
                ? "..."
                : user.isFollowing
                ? "Following"
                : "Follow"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Search;
