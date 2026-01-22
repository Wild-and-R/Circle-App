import { Button } from "@/components/ui/button";

interface MainComposerProps {
  onOpen: () => void;
}

const MainComposer = ({ onOpen }: MainComposerProps) => {
  return (
    <div className="flex items-center gap-4 py-3">
      <img
        src="https://randomuser.me/api/portraits/lego/1.jpg"
        className="w-10 h-10 rounded-full"
      />

      <input
        onFocus={onOpen}
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
        onClick={onOpen}
        className="bg-green-500 text-black rounded-full px-4 py-1 text-sm"
      >
        Post
      </Button>
    </div>
  );
};

export default MainComposer;
