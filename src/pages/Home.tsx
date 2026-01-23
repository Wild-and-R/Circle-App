import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";

import ThreadCard from "@/components/ThreadCard";
import type { Thread } from "@/components/ThreadCard";
import MainComposer from "@/components/MainComposer";

import { api } from "@/services/api";
import { connectSocket } from "@/services/websocket";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setInitialLikes } from "@/store/likeSlice";

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

      const likedIds = res.data
        .filter((t) => t.likedByMe)
        .map((t) => t.id);

      dispatch(setInitialLikes(likedIds));
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
    <>
      <div className="border-b border-[#2a2a2a] pb-3 mb-4">
        <h2 className="text-lg font-semibold mb-2">Home</h2>
        <MainComposer onOpen={openCreatePost} />
      </div>

      {loading && <p className="text-gray-400">Loading threads...</p>}

      <section className="flex flex-col gap-6">
        {!loading &&
          threads.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              clickable
            />
          ))}
      </section>
    </>
  );
};

export default Home;
