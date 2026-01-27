import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface User {
  id: number;
  username: string;
  full_name?: string | null;
  bio?: string | null;
  photo_profile?: string | null;
  isFollowing?: boolean;
}

const Search = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);

        const res = await api.get(`/users/search?q=${query}`);
        setResults(res.data.data.users);
      } catch {
        toast.error("Failed to search users");
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleFollow = async (userId: number) => {
    try {
      await api.post(`/follows/${userId}/follow`);
      setResults((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, isFollowing: true } : u
        )
      );
      toast.success("Followed");
    } catch {
      toast.error("Failed to follow user");
    }
  };

  const handleUnfollow = async (userId: number) => {
    try {
      await api.delete(`/follows/${userId}/unfollow`);
      setResults((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, isFollowing: false } : u
        )
      );
      toast.success("Unfollowed");
    } catch {
      toast.error("Failed to unfollow user");
    }
  };

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
        {loading && (
          <p className="text-gray-400 text-center">Searching...</p>
        )}

        {!loading && results.length === 0 && query && (
          <p className="text-gray-400 text-center">
            No users found
          </p>
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

            {user.isFollowing ? (
              <Button
                onClick={() => handleUnfollow(user.id)}
                className="border border-gray-500 text-gray-300 hover:bg-red-600 hover:text-white"
                variant="ghost"
              >
                Following
              </Button>
            ) : (
              <Button
                onClick={() => handleFollow(user.id)}
                className="bg-green-500 text-black hover:bg-green-600"
              >
                Follow
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Search;
