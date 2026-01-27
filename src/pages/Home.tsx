import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";

import ThreadCard from "@/components/ThreadCard";
import type { Thread } from "@/components/ThreadCard";
import MainComposer from "@/components/MainComposer";

import { api } from "@/services/api";
import { connectSocket } from "@/services/websocket";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { hydrateLikes } from "@/store/likeSlice";

type OutletContext = {
  openCreatePost: () => void;
};

const Home = () => {
  const { openCreatePost } = useOutletContext<OutletContext>();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const res = await api.get<Thread[]>("/threads");
      setThreads(res.data);

      dispatch(
        hydrateLikes(
          res.data.map((t) => ({
            id: t.id,
            likedByMe: t.likedByMe,
            likes: t.likes,
          }))
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();

    if (!user?.id) return;

    const socket = connectSocket(user.id);
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
  }, [user?.id]);

  return (
    <div className="flex flex-col h-full overflow-y-auto pr-1">
      <div className="border-b border-[#2a2a2a] pb-3 mb-4">
        <h2 className="text-lg font-semibold mb-2">Home</h2>
        <MainComposer onOpen={openCreatePost} />
      </div>

      {loading && <p className="text-gray-400">Loading threads...</p>}

      <section className="flex flex-col gap-6">
        {!loading &&
          threads.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} clickable />
          ))}
      </section>
    </div>
  );
};

export default Home;
