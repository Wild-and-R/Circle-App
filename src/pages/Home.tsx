import { useEffect, useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImagePlus } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/authSlice";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { socket } from "@/services/websocket";
import { toast } from "sonner";
// types.
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

//thread composer
const ThreadComposer = memo(
  ({
    content,
    setContent,
    preview,
    handleImageChange,
    posting,
    onSubmit,
    onCancelImage,
  }: {
    content: string;
    setContent: (v: string) => void;
    preview: string | null;
    handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    posting: boolean;
    onSubmit: () => void | Promise<void>;
    onCancelImage: () => void;
  }) => {
    return (
      <div className="flex flex-col gap-3">
        <Textarea
          placeholder="What is happening?!"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="
            bg-transparent
            border-none
            resize-none
            text-white
            placeholder:text-gray-500
            text-lg
            focus-visible:ring-0
            focus-visible:ring-offset-0
            min-h-[120px]
          "
        />

        {preview && (
          <div className="relative w-fit">
            <img
              src={preview}
              className="rounded-lg max-h-64 object-cover"
            />
            <button
              type="button"
              onClick={onCancelImage}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
              title="Remove image"
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
              onChange={handleImageChange}
            />
          </label>

          <Button
            disabled={posting}
            onClick={onSubmit}
            className="bg-green-500 text-black rounded-full px-6"
          >
            {posting ? "Posting..." : "Post"}
          </Button>
        </div>
      </div>
    );
  }
);


ThreadComposer.displayName = "ThreadComposer";

// main composer
const MainComposer = ({
  content,
  setContent,
  onSubmit,
}: {
  content: string;
  setContent: (v: string) => void;
  onSubmit: () => void;
}) => {
  return (
    <div className="flex items-center gap-4 py-3">
      <img
        src="https://randomuser.me/api/portraits/lego/1.jpg"
        className="w-10 h-10 rounded-full"
      />

      <input
        value={content}
        onFocus={onSubmit}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What is happening?!"
        className="
          flex-1
          bg-transparent
          text-white
          placeholder:text-gray-500
          outline-none
          text-sm
        "
      />

      

      <Button
        onClick={onSubmit}
        disabled={!content.trim()}
        className="
          bg-green-500
          text-black
          rounded-full
          px-4
          py-1
          text-sm
          hover:bg-green-600
        "
      >
        Post
      </Button>
    </div>
  );
};

//page component

const Home = () => {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);


  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  // fetch threads
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
     socket.on("connect", () => {
    console.log("Socket.IO connected:", socket.id);
  });

  socket.on("thread:new", (newThread: Thread) => {
    setThreads((prev) => {
      // prevent duplicates
      if (prev.some((t) => t.id === newThread.id)) return prev;
      return [newThread, ...prev];
    });
  });

  return () => {
    socket.off("thread:new");
  };
}, []);

  // toggle Like
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
      fetchThreads();
    }
  };

  // image
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setImage(file);
  setPreview(URL.createObjectURL(file));

  // Show success toast
  toast.success("Image uploaded successfully");
};


 // create thread
const createThread = async () => {
  if (!content.trim()) {
    toast.error("Thread content cannot be empty");
    return;
  }

  try {
    setPosting(true);

    const formData = new FormData();
    formData.append("content", content);
    if (image) formData.append("image", image);

    const res = await api.post("/thread", formData);

    toast.success(res.data.message || "Thread created successfully");

    setContent("");
    setImage(null);
    setPreview(null);
    setOpenDialog(false);
  } catch {
    toast.error("Failed to create thread");
  } finally {
    setPosting(false);
  }
};

  return (
    <div className="flex h-screen bg-[#121212] text-white px-8 py-6 overflow-hidden">
      {/* left sidebar*/}
      <aside className="w-60 flex flex-col gap-6 border-r border-[#222] h-full overflow-hidden">
        <h1 className="text-3xl font-bold text-green-500">circle</h1>

        <nav className="flex flex-col gap-4">
          {[
            { label: "Home", icon: "🏠︎", path:"/home" },
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

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
  <DialogTrigger asChild>
    <Button className="bg-green-500 text-black rounded-full">
      Create Post
    </Button>
  </DialogTrigger>

  <DialogContent
    className="
      max-w-2xl
      bg-gradient-to-b from-[#1a1a1a] to-[#121212]
      text-white
      border border-[#2a2a2a]
      rounded-2xl
      shadow-2xl
      p-0
    "
  >
    <div className="border-t border-[#2a2a2a]" />

    {/* Composer */}
    <div className="flex gap-4 px-6 py-4">
      <img
        src={
          user?.photo_profile ||
          "https://randomuser.me/api/portraits/lego/1.jpg"
        }
        className="w-10 h-10 rounded-full"
      />

      <div className="flex-1">
       <ThreadComposer
  content={content}
  setContent={setContent}
  preview={preview}
  handleImageChange={handleImageChange}
  posting={posting}
  onSubmit={createThread}
  onCancelImage={() => {
    setPreview(null);
    setImage(null);
    toast("Image removed");
  }}
/>
      </div>
    </div>
  </DialogContent>
</Dialog>


          <Button
          onClick={handleLogout}
          className="flex items-center gap-2 hover:text-red-600 mt-auto font-semibold text-lg"
        >
          <span>⍈</span> Logout
        </Button>
      </aside>

      {/* main */}
      <main className="flex-1 max-w-2xl flex flex-col gap-6 h-full overflow-y-auto pr-2">
        {/* Main header */}
<div className="border-b border-[#2a2a2a] pb-2">
  <h2 className="text-lg font-semibold mb-2">Home</h2>

  <MainComposer
    content={content}
    setContent={setContent}
    onSubmit={() => {
      setOpenDialog(true); 
    }}
  />
</div>


        {loading && <p className="text-gray-400">Loading...</p>}

        <section className="flex flex-col gap-6">
          {loading && <p className="text-gray-400">Loading threads...</p>}

          {!loading &&
  threads.map((thread) => (
    <Card
      key={thread.id}
      className="bg-[#1a1a1a] p-4 border-[#2a2a2a] cursor-pointer hover:bg-[#222]"
      onClick={() => navigate(`/thread/${thread.id}`)}
    >
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
            <span className="text-gray-400">@{thread.author.username}</span>
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
          onClick={(e) => {
            e.stopPropagation(); // prevent navigating when clicking like
            toggleLike(thread.id);
          }}
          className={`flex items-center gap-2 transition-colors ${
            thread.likedByMe ? "text-red-500" : "text-gray-400 hover:text-red-500"
          }`}
        >
          {/* SVG like icon */}
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
   <aside className="w-72 h-full flex flex-col">
    {/* Profile Card */}
  <div className="flex flex-col gap-6">
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
          <p className="text-gray-400">Coming Soon...</p>
          </div>
        {/* Footer */}
        <footer className="mt-auto text-gray-400 text-center text-xs">
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
