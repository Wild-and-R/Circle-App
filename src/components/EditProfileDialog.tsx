import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { useAppDispatch } from "@/store/hooks";
import { updateUser } from "@/store/authSlice";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: any;
}

const EditProfileDialog = ({ open, onOpenChange, user }: Props) => {
  const dispatch = useAppDispatch();

  const [fullName, setFullName] = useState(user.full_name || "");
  const [bio, setBio] = useState(user.bio || "");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    user.photo_profile ? `http://localhost:3000/uploads/${user.photo_profile}` : null
  );
  const [saving, setSaving] = useState(false);

  // Reset dialog state when opening
  useEffect(() => {
    if (open) {
      setFullName(user.full_name || "");
      setBio(user.bio || "");
      setImage(null);
      setPreview(user.photo_profile ? `http://localhost:3000/uploads/${user.photo_profile}` : null);
    }
  }, [open, user]);

  const handleSave = async () => {
    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("full_name", fullName);
      formData.append("bio", bio);
      if (image) formData.append("photo_profile", image);

      const res = await api.put("/user/profile/me", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      dispatch(updateUser(res.data.data.user));
      toast.success("Profile updated");
      onOpenChange(false);
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelImage = () => {
    setImage(null);
    setPreview(user.photo_profile ? `http://localhost:3000/uploads/${user.photo_profile}` : null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#121212] text-white border-[#2a2a2a]">
        <h2 className="text-lg font-semibold mb-4">Edit Profile</h2>

        <div className="flex flex-col items-center gap-2">
          <label className="cursor-pointer">
            <img
              src={
                preview ||
                "https://randomuser.me/api/portraits/lego/1.jpg"
              }
              className="w-24 h-24 rounded-full object-cover"
            />
            <span className="text-sm text-green-500 block text-center mt-1">
              Change photo
            </span>
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setImage(file);
                setPreview(URL.createObjectURL(file));
              }}
            />
          </label>

          {image && (
            <Button
              variant="outline"
              onClick={handleCancelImage}
              className="mt-2 text-sm"
            >
              Cancel Photo
            </Button>
          )}
        </div>

        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full name"
          className="mt-4 bg-[#1a1a1a] border border-[#333] rounded p-2 w-full"
        />

        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Bio"
          className="mt-3 bg-[#1a1a1a] border border-[#333] rounded p-2 w-full resize-none"
          rows={3}
        />

        <div className="flex gap-2 mt-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-green-500 text-black"
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
