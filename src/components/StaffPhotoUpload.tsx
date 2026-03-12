import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import StaffAvatar from "./StaffAvatar";

interface StaffPhotoUploadProps {
  staffId: string;
  fullName: string;
  currentPhotoUrl?: string | null;
  onPhotoUpdated: () => void;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number) {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 80 }, 1, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

async function getCroppedBlob(
  image: HTMLImageElement,
  crop: Crop
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const outputSize = 256;
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";

  const cropX = (crop.x ?? 0) * scaleX;
  const cropY = (crop.y ?? 0) * scaleY;
  const cropW = (crop.width ?? 0) * scaleX;
  const cropH = (crop.height ?? 0) * scaleY;

  ctx.drawImage(image, cropX, cropY, cropW, cropH, 0, 0, outputSize, outputSize);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/webp", 0.85);
  });
}

export default function StaffPhotoUpload({
  staffId,
  fullName,
  currentPhotoUrl,
  onPhotoUpdated,
}: StaffPhotoUploadProps) {
  const [open, setOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState<Crop>();
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImgSrc(reader.result as string);
      setOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height));
  }, []);

  const handleUpload = async () => {
    if (!imgRef.current || !crop) return;
    setUploading(true);
    try {
      const blob = await getCroppedBlob(imgRef.current, crop);
      const filePath = `${staffId}.webp`;

      const { error: uploadError } = await supabase.storage
        .from("staff-photos")
        .upload(filePath, blob, { upsert: true, contentType: "image/webp" });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("staff-photos")
        .getPublicUrl(filePath);

      const photoUrl = `${urlData.publicUrl}?v=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("staff_profiles")
        .update({ photo_url: photoUrl } as any)
        .eq("id", staffId);

      if (updateError) throw updateError;

      toast.success("Photo updated");
      onPhotoUpdated();
      setOpen(false);
      setImgSrc("");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await supabase.storage.from("staff-photos").remove([`${staffId}.webp`]);
      const { error } = await supabase
        .from("staff_profiles")
        .update({ photo_url: null } as any)
        .eq("id", staffId);
      if (error) throw error;
      toast.success("Photo removed");
      onPhotoUpdated();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove photo");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onSelectFile}
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="relative group"
          onClick={() => inputRef.current?.click()}
          title="Change photo"
        >
          <StaffAvatar photoUrl={currentPhotoUrl} fullName={fullName} size="lg" />
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="h-5 w-5 text-white" />
          </div>
        </button>
        {currentPhotoUrl && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleRemove}
            disabled={removing}
          >
            {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crop Photo</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            {imgSrc && (
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                aspect={1}
                circularCrop
                className="max-h-[400px]"
              >
                <img
                  ref={imgRef}
                  src={imgSrc}
                  alt="Crop preview"
                  onLoad={onImageLoad}
                  style={{ maxHeight: "400px" }}
                />
              </ReactCrop>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); setImgSrc(""); }}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Uploading…</> : "Save Photo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
