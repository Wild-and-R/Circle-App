import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Thread {
  id: number;
  author: {
    username: string;
    full_name?: string;
    photo_profile?: string;
  };
  content: string;
  image?: string | null;
  likes: number;
  replies: number;
  likedByMe: boolean;
  createdAt: string;
}

const ThreadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch thread
  const fetchThread = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/thread/${id}`);
      const t = res.data.data.thread;
      setThread({
        id: t.id,
        author: t.author,
        content: t.content,
        image: t.image,
        likes: t._count?.likes || 0,
        replies: t._count?.replies || 0,
        likedByMe: t.likedByMe,
        createdAt: t.created_at, 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThread();
  }, [id]);

  // Toggle like
  const toggleLike = async () => {
    if (!thread) return;

    setThread({
      ...thread,
      likedByMe: !thread.likedByMe,
      likes: thread.likedByMe ? thread.likes - 1 : thread.likes + 1,
    });

    try {
      await api.post(`/threads/${thread.id}/like`);
    } catch (err) {
      fetchThread();
    }
  };

  if (loading) return <p className="text-gray-400">Loading...</p>;
  if (!thread) return <p className="text-red-500">Thread not found</p>;

  return (
    <Card className="bg-[#1a1a1a] p-4 border-[#2a2a2a] max-w-2xl mx-auto mt-6">
      <header className="flex items-center gap-4 mb-2">
        <img
          src={thread.author.photo_profile || "https://randomuser.me/api/portraits/lego/1.jpg"}
          className="w-12 h-12 rounded-full"
        />
        <div>
          <p className="font-semibold text-white">
            {thread.author.full_name || "Unknown"}{" "}
            <span className="text-gray-400">@{thread.author.username || "unknown"}</span>
          </p>
          <p className="text-sm text-gray-400">
            {thread.createdAt ? new Date(thread.createdAt).toLocaleString() : "Invalid date"}
          </p>
        </div>
      </header>

      <p className="text-white">{thread.content}</p>

      {thread.image && (
        <img
          src={`http://localhost:3000/uploads/${thread.image}`}
          className="mt-4 rounded-lg"
        />
      )}

      <footer className="mt-4 flex gap-6 text-gray-400">
        <Button
          onClick={toggleLike}
          className={`flex items-center gap-2 transition-colors ${
            thread.likedByMe ? "text-red-500" : "text-gray-400 hover:text-red-500"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={thread.likedByMe ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={2}
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span>{thread.likes}</span>
        </Button>

        <span>🗨️ {thread.replies} Replies</span>
      </footer>
    </Card>
  );
};

export default ThreadDetail;
