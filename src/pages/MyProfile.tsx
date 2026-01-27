import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import EditProfileDialog from "@/components/EditProfileDialog";
import { toast } from "sonner";
import { connectSocket, disconnectSocket } from "@/services/websocket";
import ThreadCard from "@/components/ThreadCard";
import { hydrateLikes } from "@/store/likeSlice";

interface ProfilePost {
  id: number;
  content: string;
  image_url?: string | null;
  created_at: string;
  likes_count: number;
  replies_count: number;
  likedByMe: boolean;
}

const MyProfile = () => {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();

  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "media">("all");
  const [loading, setLoading] = useState(false);

  const [openEdit, setOpenEdit] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchProfilePostsAndStats = async () => {
      setLoading(true);
      try {
        const statsRes = await api.get("/users/me/stats");
        setFollowersCount(statsRes.data.data.followers);
        setFollowingCount(statsRes.data.data.following);

        const postsRes = await api.get("/posts/me");
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
      } catch {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfilePostsAndStats();

    const sock = connectSocket(user.id);
    sock.on(
      "follow:changed",
      (payload: { followersDelta: number; followingDelta: number }) => {
        setFollowersCount((prev) => prev + payload.followersDelta);
        setFollowingCount((prev) => prev + payload.followingDelta);
      }
    );

    return () => {
      sock.off("follow:changed");
      disconnectSocket();
    };
  }, [user?.id, dispatch]);

  if (loading || !user) {
    return (
      <div className="text-center pt-20 text-gray-400">
        Loading profile...
      </div>
    );
  }

  const filteredPosts =
    activeTab === "media"
      ? posts.filter((p) => p.image_url && p.image_url.trim() !== "")
      : posts;

  return (
    <main className="max-w-4xl mx-auto px-4 py-6">
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
          className="w-20 h-20 rounded-full object-cover"
        />

        <h3 className="font-semibold text-lg text-white">
          {user.full_name || user.username}
        </h3>
        <p className="text-gray-400">@{user.username}</p>

        {user.bio && (
          <p className="text-sm text-gray-300 text-center max-w-md">
            {user.bio}
          </p>
        )}

        <div className="flex gap-8 mt-4 text-sm text-gray-400 font-semibold">
          <div className="text-center">
            <span className="block text-white">{followingCount}</span>
            Following
          </div>
          <div className="text-center">
            <span className="block text-white">{followersCount}</span>
            Followers
          </div>
        </div>

        <Button
          variant="outline"
          className="mt-6 text-sm"
          onClick={() => setOpenEdit(true)}
        >
          Edit Profile
        </Button>
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
                : "text-gray-400 hover:text-white"
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
                  full_name: user.full_name,
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
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <EditProfileDialog
        open={openEdit}
        onOpenChange={setOpenEdit}
        user={user}
      />
    </main>
  );
};

export default MyProfile;
