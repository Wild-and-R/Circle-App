import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { api } from "@/services/api";
import ThreadCard from "@/components/ThreadCard";
import { hydrateLikes } from "@/store/likeSlice";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ProfileUser {
  id: number;
  username: string;
  full_name?: string | null;
  bio?: string | null;
  photo_profile?: string | null;
}

interface ProfilePost {
  id: number;
  content: string;
  image_url?: string | null;
  created_at: string;
  likes_count: number;
  replies_count: number;
  likedByMe: boolean;
}

const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"all" | "media">("all");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // follow state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = currentUser?.id === Number(id);

  useEffect(() => {
    if (!id) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const [userRes, statsRes, postsRes] = await Promise.all([
          api.get(`/users/${id}`),
          api.get(`/users/${id}/stats`),
          api.get(`/posts/user/${id}`),
        ]);

        setUser(userRes.data.data.user);
        setFollowersCount(statsRes.data.data.followers);
        setFollowingCount(statsRes.data.data.following);

        const mappedPosts: ProfilePost[] =
          postsRes.data.data.posts.map((post: any) => ({
            id: post.id,
            content: post.content,
            image_url: post.image,
            created_at: post.created_at,
            likes_count: post.likes_count,
            replies_count: post.replies_count,
            likedByMe: post.likedByMe,
          }));

        setPosts(mappedPosts);

        dispatch(
          hydrateLikes(
            mappedPosts.map((p) => ({
              id: p.id,
              likedByMe: p.likedByMe,
              likes: p.likes_count,
            }))
          )
        );

        // determine follow state (same logic as Search)
        if (!isOwnProfile && currentUser) {
          const res = await api.get(
            `/follows/${currentUser.id}/following`
          );
          const followingIds = res.data.data.map((u: any) => u.id);
          setIsFollowing(followingIds.includes(Number(id)));
        }
      } catch {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, dispatch, currentUser, isOwnProfile]);

  const toggleFollow = async () => {
    if (!user || followLoading || !currentUser) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await api.delete(`/follows/${user.id}/unfollow`);
        setIsFollowing(false);
        setFollowersCount((c) => c - 1);
        toast.success("Unfollowed");
      } else {
        await api.post(`/follows/${user.id}/follow`);
        setIsFollowing(true);
        setFollowersCount((c) => c + 1);
        toast.success("Followed");
      }
    } catch {
      toast.error("Failed to update follow status");
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading || !user) {
    return <div className="text-center pt-20 text-gray-400">Loading...</div>;
  }

  const filteredPosts =
    activeTab === "media" ? posts.filter((p) => p.image_url) : posts;

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-6">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <header className="flex items-center gap-2 mb-4 text-white text-lg font-semibold">
          <span
            onClick={() => window.history.back()}
            className="text-2xl cursor-pointer"
          >
            ←
          </span>
          <span>{user.full_name || user.username}</span>
        </header>

        {/* Profile Info */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <img
            src={
              user.photo_profile
                ? `http://localhost:3000/uploads/${user.photo_profile}`
                : "https://randomuser.me/api/portraits/lego/1.jpg"
            }
            className="w-20 h-20 rounded-full"
          />

          <h3 className="font-semibold text-lg">
            {user.full_name || user.username}
          </h3>
          <p className="text-gray-400">@{user.username}</p>

          {user.bio && (
            <p className="text-sm text-gray-300 text-center max-w-md">
              {user.bio}
            </p>
          )}

          <div className="flex gap-8 mt-4 text-sm text-gray-400 font-semibold">
            <div>
              <span className="block text-white">{followingCount}</span>
              Following
            </div>
            <div>
              <span className="block text-white">{followersCount}</span>
              Followers
            </div>
          </div>

          {/* Follow Button */}
          {!isOwnProfile && (
            <Button
              onClick={toggleFollow}
              disabled={followLoading}
              className={`mt-4 w-32 ${
                isFollowing
                  ? "bg-gray-700"
                  : "bg-green-500 text-black"
              }`}
            >
              {followLoading
                ? "..."
                : isFollowing
                ? "Following"
                : "Follow"}
            </Button>
          )}
        </div>

        {/* Tabs */}
        <nav className="border-b border-gray-700 flex gap-8 mb-6">
          {["all", "media"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-2 font-semibold ${
                activeTab === tab
                  ? "text-white border-b-2 border-green-500"
                  : "text-gray-400"
              }`}
            >
              {tab === "all" ? "All Posts" : "Media"}
            </button>
          ))}
        </nav>

        {/* Posts */}
        {activeTab === "all" ? (
          <section className="space-y-6">
            {filteredPosts.map((post) => (
              <ThreadCard
                key={post.id}
                thread={{
                  id: post.id,
                  author: {
                    username: user.username,
                    full_name: user.full_name ?? undefined,
                    photo_profile: user.photo_profile ?? undefined,
                  },
                  content: post.content,
                  image: post.image_url,
                  likes: post.likes_count,
                  replies: post.replies_count,
                  likedByMe: post.likedByMe,
                  createdAt: post.created_at,
                }}
                clickable
              />
            ))}
          </section>
        ) : (
          <section className="grid grid-cols-3 gap-2">
            {filteredPosts.map((post) => (
              <img
                key={post.id}
                src={`http://localhost:3000/uploads/${post.image_url}`}
                className="w-full h-32 object-cover rounded cursor-pointer"
                onClick={() =>
                  setSelectedImage(
                    `http://localhost:3000/uploads/${post.image_url}`
                  )
                }
              />
            ))}
          </section>
        )}

        {selectedImage && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
            onClick={() => setSelectedImage(null)}
          >
            <img
              src={selectedImage}
              className="max-h-[90%] max-w-[90%] rounded"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
