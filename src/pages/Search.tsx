import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAppSelector } from "@/store/hooks";

interface User {
  id: number;
  username: string;
  full_name?: string | null;
  bio?: string | null;
  photo_profile?: string | null;
}

const Search = () => {
  const currentUser = useAppSelector((state) => state.auth.user);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [followLoadingIds, setFollowLoadingIds] = useState<number[]>([]);
  const [followingSet, setFollowingSet] = useState<Set<number>>(new Set());

  // Fetch following list once
  const fetchFollowingList = async () => {
    if (!currentUser) return;
    try {
      const res = await api.get(`/follows/${currentUser.id}/following`);
      const ids = res.data.data.map((u: User) => u.id);
      setFollowingSet(new Set(ids));
    } catch {
      toast.error("Failed to load following list");
    }
  };

  useEffect(() => {
    fetchFollowingList();
  }, [currentUser]);

  // Search users
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.get(`/users/search?q=${query}`);
        setResults(res.data.data.users || []);
      } catch {
        toast.error("Failed to search users");
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [query]);

  // Follow / Unfollow user
  const toggleFollow = async (userId: number) => {
    if (!currentUser || followLoadingIds.includes(userId)) return;

    setFollowLoadingIds((ids) => [...ids, userId]);
    const isFollowing = followingSet.has(userId);

    try {
      if (isFollowing) {
        await api.delete(`/follows/${userId}/unfollow`);
        setFollowingSet((s) => {
          const copy = new Set(s);
          copy.delete(userId);
          return copy;
        });
        toast.success("Unfollowed");
      } else {
        await api.post(`/follows/${userId}/follow`);
        setFollowingSet((s) => new Set(s).add(userId));
        toast.success("Followed");
      }
    } catch {
      toast.error("Failed to update follow status");
    } finally {
      setFollowLoadingIds((ids) => ids.filter((id) => id !== userId));
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="sticky top-0 bg-[#121212] z-10 pb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-full px-4 py-2 text-white"
        />
      </div>

      <div className="mt-4 space-y-3">
        {loading && <p className="text-gray-400 text-center">Searching...</p>}

        {!loading && results.length === 0 && query && (
          <p className="text-gray-400 text-center">No users found</p>
        )}

        {results.map((user) => {
          const isFollowing = followingSet.has(user.id);

          return (
            <div
              key={user.id}
              className="flex items-center justify-between gap-4 p-3 border border-[#2a2a2a] rounded-lg bg-[#1a1a1a]"
            >
              <div className="flex items-center gap-3">
                <img
                  src={
                    user.photo_profile
                      ? `http://localhost:3000/uploads/${user.photo_profile}`
                      : "https://randomuser.me/api/portraits/lego/1.jpg"
                  }
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-white">
                    {user.full_name || user.username}
                  </p>
                  <p className="text-sm text-gray-400">@{user.username}</p>
                  {user.bio && (
                    <p className="text-sm text-gray-500 line-clamp-1">
                      {user.bio}
                    </p>
                  )}
                </div>
              </div>

              <Button
                onClick={() => toggleFollow(user.id)}
                disabled={followLoadingIds.includes(user.id)}
                className={`w-24 text-sm ${
                  isFollowing
                    ? "bg-gray-700"
                    : "bg-green-500 text-black"
                }`}
              >
                {followLoadingIds.includes(user.id)
                  ? "..."
                  : isFollowing
                  ? "Following"
                  : "Follow"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Search;
