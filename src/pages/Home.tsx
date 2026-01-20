import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/authSlice";
import { useNavigate } from "react-router-dom";

interface Thread {
  id: number;
  author: {
    username: string;
    full_name?: string;
    photo_profile?: string; // URL or undefined
  };
  content: string;
  image?: string;
  likes: number;
  replies: number;
  likedByMe: boolean;
  createdAt: string;
}

// Dummy threads
const dummyThreads: Thread[] = [
  {
    id: 1,
    author: {
      username: "sharorukaforever",
      full_name: "Charlotta Skopovskaya",
      photo_profile: "https://randomuser.me/api/portraits/women/65.jpg",
    },
    content:
      "Ruka is once again the center of attention after her stunning performance. Other women should stay away from Ruka.",
    likes: 50,
    replies: 400,
    likedByMe: true,
    createdAt: "4h",
  },
  {
    id: 2,
    author: {
      username: "cinderellagray",
      full_name: "Oguri Cap",
      photo_profile: "https://randomuser.me/api/portraits/women/43.jpg",
    },
    content:
      "Is this how you use the app? Hello. I'm getting hungry.",
    likes: 400,
    replies: 500,
    likedByMe: false,
    createdAt: "17h",
  },
  {
    id: 3,
    author: {
      username: "notchar",
      full_name: "Lieutenant Quattro",
      photo_profile: "https://randomuser.me/api/portraits/men/37.jpg",
    },
    content:
      "Just finished watching the latest episode of 'True War Tales'. How laughable, this is clearly fictional. When I have the time, I'll visit the whole team and laugh at their faces!",
    likes: 351,
    replies: 412,
    likedByMe: false,
    createdAt: "10h",
  },
  {
    id: 4,
    author: {
      username: "breakthebarrier",
      full_name: "Lloyd Bannings",
      photo_profile: "https://randomuser.me/api/portraits/men/12.jpg",
    },
    content: "Public Service Announcement on not getting scammed: A thread.",
    image:
      "https://dummyimage.com/600x400/000/fff&text=PSA",
    likes: 10,
    replies: 30,
    likedByMe: false,
    createdAt: "Jul 25",
  },
];

const Home = () => {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [threads, setThreads] = useState<Thread[]>(dummyThreads);

  // Logout handler
  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const toggleLike = (id: number) => {
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === id
          ? {
              ...thread,
              likedByMe: !thread.likedByMe,
              likes: thread.likedByMe ? thread.likes - 1 : thread.likes + 1,
            }
          : thread
      )
    );
  };

  return (
    <div className="flex gap-6 min-h-[calc(100vh-4rem)] bg-[#121212] text-white px-8 py-6">
      {/* Left Sidebar */}
<aside className="w-60 flex flex-col gap-6 border-r border-[#222]">
  {/* Logo */}
  <h1 className="text-3xl font-bold text-green-500 mb-4">circle</h1>

  {/* Navigation */}
  <nav className="flex flex-col gap-4">
    {[
      { label: "Home", icon: "🏠︎" },
      { label: "Search", icon: "🔍︎" },
      { label: "Follows", icon: "❤︎" },
      { label: "Profile", icon: "👤" },
    ].map(({ label, icon }) => (
      <button
        key={label}
        className="flex items-center gap-3 text-white hover:text-green-500 font-semibold text-lg"
      >
        <span>{icon}</span> {label}
      </button>
    ))}
  </nav>

  <button className="bg-green-500 hover:bg-green-600 text-black font-semibold py-2 rounded-full mt-2">
    Create Post
  </button>

  <button
    onClick={handleLogout}
    className="flex items-center gap-2 text-white hover:text-red-600 mt-auto font-semibold text-lg"
  >
    <span>⍈</span> Logout
  </button>
</aside>


      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-6 max-w-2xl">
        <header className="flex items-center gap-4 text-muted-foreground">
          <img
            src={user?.photo_profile || "https://randomuser.me/api/portraits/lego/1.jpg"}
            alt="Profile"
            className="w-10 h-10 rounded-full"
          />
          <input
            type="text"
            placeholder="What is happening?!"
            className="flex-1 bg-[#222] rounded-full px-4 py-2 text-white placeholder:text-gray-400 outline-none"
          />
          <button className="bg-green-500 px-4 py-2 rounded-full font-semibold hover:bg-green-600">
            Post
          </button>
        </header>

        {/* Threads */}
        <section className="flex flex-col gap-6">
          {threads.map((thread) => (
            <Card key={thread.id} className="bg-[#1a1a1a] border-[#2a2a2a] p-4">
              <header className="flex items-center gap-4 mb-2">
                <img
                  src={thread.author.photo_profile || ""}
                  alt={thread.author.username}
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-white">
                    {thread.author.full_name ? `${thread.author.full_name} ` : ""}
                    <span className="text-gray-400">@{thread.author.username}</span>
                  </span>
                  <span className="text-sm text-gray-400">{thread.createdAt}</span>
                </div>
              </header>

              <p className="text-white">{thread.content}</p>

              {thread.image && (
                <img
                  src={thread.image}
                  alt="Thread"
                  className="mt-4 rounded-lg max-h-72 object-cover"
                />
              )}

              <footer className="mt-4 flex items-center gap-6 text-gray-400">
                <button
                  onClick={() => toggleLike(thread.id)}
                  className={`flex items-center gap-2 ${
                    thread.likedByMe ? "text-red-500" : "hover:text-red-500"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill={thread.likedByMe ? "currentColor" : "none"}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  {thread.likes}
                </button>

                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 8h10M7 12h4m-4 4h6"
                    />
                  </svg>
                  {thread.replies} Replies
                </div>
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
              <span className="block font-semibold text-white">291</span>
              Following
            </div>
            <div>
              <span className="block font-semibold text-white">23</span>
              Followers
            </div>
          </div>

          <button className="mt-4 w-full py-2 bg-[#222] rounded-md hover:bg-[#333] font-semibold">
            Edit Profile
          </button>
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
              <button className="py-1 px-3 border border-green-500 rounded-md text-green-500 hover:bg-green-500 hover:text-black transition">
                Follow
              </button>
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

