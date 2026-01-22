import { Outlet } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import ThreadComposer from "@/components/ThreadComposer";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { api } from "@/services/api";
import { useAppSelector } from "@/store/hooks";

const PrivateLayout = () => {
  const user = useAppSelector((state) => state.auth.user);

  const [openComposer, setOpenComposer] = useState(false);
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const openCreatePost = () => setOpenComposer(true);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
    toast.success("Image uploaded");
  };

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

      await api.post("/thread", formData);

      toast.success("Thread created");

      setContent("");
      setImage(null);
      setPreview(null);
      setOpenComposer(false);
    } catch {
      toast.error("Failed to create thread");
    } finally {
      setPosting(false);
    }
  };

  return (
    <>
      <div className="flex h-screen bg-[#121212] text-white overflow-hidden">
        <LeftSidebar onCreatePost={openCreatePost} />

        <main className="flex-1 max-w-2xl px-6 py-4 overflow-y-auto">
          <Outlet context={{ openCreatePost }} />
        </main>

        <RightSidebar />
      </div>

      {/* Global Composer Dialog */}
      <Dialog open={openComposer} onOpenChange={setOpenComposer}>
        <DialogContent className="max-w-2xl bg-[#121212] text-white border-[#2a2a2a]">
          <div className="flex gap-4">
            <img
              src={
                user?.photo_profile ||
                "https://randomuser.me/api/portraits/lego/1.jpg"
              }
              className="w-10 h-10 rounded-full"
            />

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
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PrivateLayout;
