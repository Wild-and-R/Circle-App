import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus } from "lucide-react";

interface ThreadComposerProps {
  content: string;
  setContent: (v: string) => void;
  preview: string | null;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  posting: boolean;
  onSubmit: () => void | Promise<void>;
  onCancelImage: () => void;
}

const ThreadComposer = memo(
  ({
    content,
    setContent,
    preview,
    handleImageChange,
    posting,
    onSubmit,
    onCancelImage,
  }: ThreadComposerProps) => {
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
              alt="preview"
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

export default ThreadComposer;
