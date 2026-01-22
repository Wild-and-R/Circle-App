import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { ImagePlus } from "lucide-react";
import { toast } from "sonner";

import ThreadCard from "@/components/ThreadCard";
import type { Thread } from "@/components/ThreadCard";
import { api } from "@/services/api";

import { useAppDispatch } from "@/store/hooks";
import { setInitialLikes } from "@/store/likeSlice";


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

  // Replies
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

      // sync initial like to redux
      if (t.likedByMe) {
        dispatch(setInitialLikes([t.id]));
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch replies
  const fetchReplies = async () => {
    try {
      const res = await api.get(`/thread/${threadId}/replies`);
      const data = res.data.data.replies.map((r: any) => ({
        id: r.id,
        content: r.content,
        image: r.image,
        createdAt: r.created_at,
        user: r.user,
      }));
      setReplies(data);
    } catch (err) {
      console.error("Failed to fetch replies", err);
    }
  };

  useEffect(() => {
    fetchThread();
    fetchReplies();
  }, [threadId]);

  // Auto-expand textarea
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

      const res = await api.post(
        `/thread/${threadId}/replies`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

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
    } catch (err) {
      console.error("Failed to create reply", err);
    } finally {
      setReplyLoading(false);
    }
  };

  if (loading) return <p className="text-gray-400">Loading...</p>;
  if (!thread) return <p className="text-red-500">Thread not found</p>;

  return (
    <div className="relative max-w-2xl mx-auto mt-6 pb-36">
      {/* Thread */}
      <ThreadCard thread={thread} />

      {/* Replies */}
      <div className="space-y-4">
        {replies.map((r) => (
          <div key={r.id} className="flex space-x-3">
            <img
              src={
                r.user.photo_profile ? `http://localhost:3000/uploads/${r.user.photo_profile}`
      : "https://randomuser.me/api/portraits/lego/1.jpg"
              }
              alt={r.user.username}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="font-semibold text-white">
                {r.user.full_name || r.user.username}{" "}
                <span className="text-gray-400">
                  @{r.user.username}
                </span>
              </p>
              <p className="text-sm text-gray-400">
                {new Date(r.createdAt).toLocaleString()}
              </p>
              <p>{r.content}</p>
              {r.image && (
                <img
                  src={`http://localhost:3000/uploads/${r.image}`}
                  className="mt-2 rounded max-w-full"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Reply Composer */}
      <div className="fixed bottom-0 w-[calc(100%-16rem-18rem)] max-w-2xl bg-gray-900 border-t border-gray-700 p-4 flex flex-col space-y-2 z-50 left-[calc(16rem)]">
        <textarea
          ref={textareaRef}
          className="w-full border rounded p-2 resize-none overflow-hidden"
          placeholder="Write a reply..."
          value={newReply}
          onChange={(e) => setNewReply(e.target.value)}
        />

        {replyImage && (
          <div className="relative">
            <img
              src={URL.createObjectURL(replyImage)}
              className="max-h-48 w-full object-cover rounded"
            />
            <button
              onClick={() => {
                setReplyImage(null);
                toast.info("Image removed");
              }}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <label className="cursor-pointer text-green-500 flex items-center gap-2">
            <ImagePlus size={20} />
            <span className="text-sm">Image</span>
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setReplyImage(file);
                toast.success("Image added");
              }}
            />
          </label>

          <button
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={
              replyLoading || (!newReply.trim() && !replyImage)
            }
            onClick={handleReply}
          >
            {replyLoading ? "Posting..." : "Reply"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThreadDetail;
