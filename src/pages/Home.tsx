import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "sonner";

import ThreadCard from "@/components/ThreadCard";
import type { Thread } from "@/components/ThreadCard";
import MainComposer from "@/components/MainComposer";

import { api } from "@/services/api";
import { socket } from "@/services/websocket";

type OutletContext = {
  openCreatePost: () => void;
};

const Home = () => {
  const { openCreatePost } = useOutletContext<OutletContext>();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch threads
  const fetchThreads = async () => {
    try {
      setLoading(true);
      const res = await api.get<Thread[]>("/threads");
      setThreads(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();

    socket.on("thread:new", (newThread: Thread) => {
      setThreads((prev) =>
        prev.some((t) => t.id === newThread.id)
          ? prev
          : [newThread, ...prev]
      );
    });

    return () => {
      socket.off("thread:new");
    };
  }, []);

  // Like
  const toggleLike = async (id: number) => {
    setThreads((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              likedByMe: !t.likedByMe,
              likes: t.likedByMe ? t.likes - 1 : t.likes + 1,
            }
          : t
      )
    );

    try {
      await api.post(`/threads/${id}/like`);
    } catch {
      toast.error("Failed to like thread");
      fetchThreads();
    }
  };

  return (
    <>
      {/* Top Header + Main Composer */}
      <div className="border-b border-[#2a2a2a] pb-3 mb-4">
        <h2 className="text-lg font-semibold mb-2">Home</h2>
        <MainComposer onOpen={openCreatePost} />
      </div>

      {loading && <p className="text-gray-400">Loading threads...</p>}

      {/* Feed */}
      <section className="flex flex-col gap-6">
        {!loading &&
          threads.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              clickable
              onLike={toggleLike}
            />
          ))}
      </section>
    </>
  );
};

export default Home;
