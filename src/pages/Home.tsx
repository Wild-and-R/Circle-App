import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/authSlice";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

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

const Home = () => {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  // Logout
  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  // Fetch threads
  const fetchThreads = async () => {
    try {
      setLoading(true);
      const res = await api.get<Thread[]>("/threads");
      setThreads(res.data);
    } catch (error) {
      console.error("Failed to fetch threads", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  // Toggle like
  const toggleLike = async (id: number) => {
    // optimistic update
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === id
          ? {
              ...thread,
              likedByMe: !thread.likedByMe,
              likes: thread.likedByMe
                ? thread.likes - 1
                : thread.likes + 1,
            }
          : thread
      )
    );

    try {
      await api.post(`/threads/${id}/like`);
    } catch (error) {
      console.error("Failed to toggle like", error);
      fetchThreads(); // rollback if error
    }
  };

  return (
    <div className="flex gap-6 min-h-[calc(100vh-4rem)] bg-[#121212] text-white px-8 py-6">
      {/* Left Sidebar */}
      <aside className="w-60 flex flex-col gap-6 border-r border-[#222]">
        <h1 className="text-3xl font-bold text-green-500 mb-4">circle</h1>

        <nav className="flex flex-col gap-4">
          {[
            { label: "Home", icon: "🏠︎" },
            { label: "Search", icon: "🔍︎" },
            { label: "Follows", icon: "❤︎" },
            { label: "Profile", icon: "👤" },
          ].map(({ label, icon }) => (
            <Button
              key={label}
              className="flex items-center gap-3 hover:text-green-500 font-semibold text-lg"
            >
              <span>{icon}</span> {label}
            </Button>
          ))}
        </nav>

        <Button className="bg-green-500 hover:bg-green-600 text-black font-semibold py-2 rounded-full">
          Create Post
        </Button>

        <Button
          onClick={handleLogout}
          className="flex items-center gap-2 hover:text-red-600 mt-auto font-semibold text-lg"
        >
          <span>⍈</span> Logout
        </Button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-6 max-w-2xl">
        {/* Create thread input (UI only for now) */}
        <header className="flex items-center gap-4">
          <img
            src={user?.photo_profile || "https://randomuser.me/api/portraits/lego/1.jpg"}
            className="w-10 h-10 rounded-full"
          />
          <input
            placeholder="What is happening?!"
            className="flex-1 bg-[#222] rounded-full px-4 py-2 outline-none"
          />
          <Button className="bg-green-500 px-4 py-2 rounded-full font-semibold">
            Post
          </Button>
        </header>

        {/* Threads */}
        <section className="flex flex-col gap-6">
          {loading && <p className="text-gray-400">Loading threads...</p>}

          {!loading &&
            threads.map((thread) => (
              <Card key={thread.id} className="bg-[#1a1a1a] p-4 border-[#2a2a2a]">
                <header className="flex items-center gap-4 mb-2">
                  <img
                    src={
                      thread.author.photo_profile ||
                      "https://randomuser.me/api/portraits/lego/1.jpg"
                    }
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="font-semibold text-white">
                      {thread.author.full_name}{" "}
                      <span className="text-gray-400">
                        @{thread.author.username}
                      </span>
                    </p>
                    <p className="text-sm text-gray-400">
                      {new Date(thread.createdAt).toLocaleString()}
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
  onClick={() => toggleLike(thread.id)}
  className={`flex items-center gap-2 transition-colors ${
    thread.likedByMe
      ? "text-red-500"
      : "text-gray-400 hover:text-red-500"
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
            ))}
        </section>
      </main>

      {/* Right Sidebar */}
      <aside className="w-72 flex flex-col gap-6">
        {/* Profile card */}
        <div className="bg-[#1a1a1a] rounded-lg p-4 shadow border border-[#2a2a2a] text-white">
          <div className="mb-4 rounded-lg h-20 bg-gradient-to-r from-green-400 to-yellow-400"></div>

          <div className="flex flex-col items-center gap-2">
            <img
              src={user?.photo_profile || "https://randomuser.me/api/portraits/lego/1.jpg"}
              alt={user?.username || "profile"}
              className="w-20 h-20 rounded-full border-4 border-[#121212]"
            />
            <h2 className="font-semibold text-lg">
              {user?.full_name || user?.username || "Your Name"}
            </h2>
            <p className="text-gray-400">@{user?.username || "username"}</p>
          </div>

          <div className="flex justify-around mt-4 text-sm text-gray-400">
            <div>
              <span className="block font-semibold text-white">0</span>
              Following
            </div>
            <div>
              <span className="block font-semibold text-white">0</span>
              Followers
            </div>
          </div>

          <Button className="mt-4 w-full py-2 bg-[#222] rounded-md hover:bg-[#333] font-semibold">
            Edit Profile
          </Button>
        </div>

        {/* Suggested for you */}
        <div className="bg-[#1a1a1a] rounded-lg p-4 shadow border border-[#2a2a2a] text-white">
          <h3 className="text-lg font-semibold mb-4">Suggested for you</h3>

          {[
            { username: "swordofthesoul", full_name: "Mo Ye" },
            { username: "knightofdogma", full_name: "Iris Fleur" },
            { username: "montecristo", full_name: "Edmond Dantes" },
            { username: "notintelmember", full_name: "Altina Schwarzer" },
            { username: "angeloflaughter", full_name: "Renne Bright" },
          ].map(({ username, full_name }) => (
            <div key={username} className="flex justify-between items-center mb-3">
              <div>
                <p className="font-semibold">{full_name}</p>
                <p className="text-gray-400 text-sm">@{username}</p>
              </div>
              <Button className="py-1 px-3 border border-green-500 rounded-md text-green-500 hover:bg-green-500 hover:text-black transition">
                Follow
              </Button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="text-gray-400 text-center text-xs">
          Developed by Wildan Rahadian ·{" "}
          <a
            href="https://dumbways.id/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Powered by DumbWays Indonesia
          </a>{" "}
          · #1 Coding Bootcamp
        </footer>
      </aside>
    </div>
  );
};
export default Home;
