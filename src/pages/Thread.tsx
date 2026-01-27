import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { ImagePlus } from "lucide-react";
import { toast } from "sonner";

import ThreadCard from "@/components/ThreadCard";
import type { Thread } from "@/components/ThreadCard";
import { api } from "@/services/api";

import { useAppDispatch } from "@/store/hooks";
import { hydrateLikes } from "@/store/likeSlice";

interface Reply {
  id: number;
  content: string;
  image?: string | null;
  createdAt: string;
  user: {
    id: number;
    full_name?: string;
    username: string;
    photo_profile?: string | null;
  };
}

const ThreadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const threadId = Number(id);

  const dispatch = useAppDispatch();

  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);

  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReply, setNewReply] = useState("");
  const [replyImage, setReplyImage] = useState<File | null>(null);
  const [replyLoading, setReplyLoading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch thread
  const fetchThread = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/thread/${threadId}`);
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

      dispatch(
        hydrateLikes([
          {
            id: t.id,
            likedByMe: t.likedByMe,
            likes: t._count?.likes || 0,
          },
        ])
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch replies
  const fetchReplies = async () => {
    const res = await api.get(`/thread/${threadId}/replies`);
    setReplies(
      res.data.data.replies.map((r: any) => ({
        id: r.id,
        content: r.content,
        image: r.image,
        createdAt: r.created_at,
        user: r.user,
      }))
    );
  };

  useEffect(() => {
    fetchThread();
    fetchReplies();
  }, [threadId]);

  // Auto grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [newReply]);

  // Create reply
  const handleReply = async () => {
    if (!newReply.trim() && !replyImage) return;

    setReplyLoading(true);
    try {
      const formData = new FormData();
      formData.append("content", newReply);
      if (replyImage) formData.append("image", replyImage);

      const res = await api.post(`/thread/${threadId}/replies`, formData);
      const r = res.data.data.reply;

      setReplies((prev) => [
        ...prev,
        {
          id: r.id,
          content: r.content,
          image: r.image,
          createdAt: r.created_at,
          user: r.user,
        },
      ]);

      setNewReply("");
      setReplyImage(null);
      toast.success("Reply posted");
    } finally {
      setReplyLoading(false);
    }
  };

  if (loading) return <p className="text-gray-400">Loading...</p>;
  if (!thread) return <p className="text-red-500">Thread not found</p>;

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-6">
      {/* Back Button */}
      <header className="flex items-center gap-2 mb-4 text-white text-lg font-semibold">
        <span
          onClick={() => window.history.back()}
          className="text-2xl cursor-pointer"
        >
          ←
        </span>
        <span>Thread</span>
      </header>

      {/* Thread content */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        <ThreadCard thread={thread} />

        {/* Replies */}
        {replies.map((r) => (
          <div
            key={r.id}
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 flex gap-3"
          >
            <img
              src={
                r.user.photo_profile
                  ? `http://localhost:3000/uploads/${r.user.photo_profile}`
                  : "https://randomuser.me/api/portraits/lego/1.jpg"
              }
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">
                  {r.user.full_name || r.user.username}
                </span>
                <span className="text-gray-400 text-sm">@{r.user.username}</span>
                <span className="text-gray-500 text-xs">
                  · {new Date(r.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-white">{r.content}</p>
              {r.image && (
                <img
                  src={`http://localhost:3000/uploads/${r.image}`}
                  className="mt-3 rounded-lg max-h-64 object-cover"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Composer */}
      <div className="mt-4 border-t border-[#2a2a2a] p-4">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3">
          <textarea
            ref={textareaRef}
            placeholder="Write a reply..."
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            className="
              w-full bg-transparent resize-none border-none
              text-white placeholder:text-gray-500
              focus:outline-none min-h-[60px]
            "
          />
        </div>

        {replyImage && (
          <div className="relative border border-[#2a2a2a] rounded-xl p-2 w-fit mt-2">
            <img
              src={URL.createObjectURL(replyImage)}
              className="rounded-lg max-h-48 object-cover"
            />
            <button
              onClick={() => setReplyImage(null)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex items-center mt-2">
          <label className="cursor-pointer text-green-500 flex items-center gap-2">
            <ImagePlus size={18} />
            <span className="text-sm">Image</span>
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setReplyImage(file);
              }}
            />
          </label>

          <button
            disabled={replyLoading || (!newReply.trim() && !replyImage)}
            onClick={handleReply}
            className="ml-auto bg-green-500 text-black px-6 py-2 rounded-full disabled:opacity-50"
          >
            {replyLoading ? "Posting..." : "Reply"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThreadDetail;
