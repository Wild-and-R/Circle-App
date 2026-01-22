import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export interface Thread {
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

interface ThreadCardProps {
  thread: Thread;
  onLike: (id: number) => void;
  clickable?: boolean;
}

const ThreadCard = ({
  thread,
  onLike,
  clickable = false,
}: ThreadCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (clickable) {
      navigate(`/thread/${thread.id}`);
    }
  };

  return (
    <Card
      onClick={handleClick}
      className={`
        bg-[#1a1a1a]
        p-4
        border-[#2a2a2a]
        ${clickable ? "cursor-pointer hover:bg-[#222]" : ""}
      `}
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
          onClick={(e) => {
            e.stopPropagation();
            onLike(thread.id);
          }}
          className={`flex items-center gap-2 transition-colors ${
            thread.likedByMe
              ? "text-red-500"
              : "text-gray-400 hover:text-red-500"
          }`}
        >
          {/* Heart icon */}
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

export default ThreadCard;
