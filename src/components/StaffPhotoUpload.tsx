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
import { Camera, Loader2, Trash2, Upload } from "lucide-react";
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

function getCropCoords(image: HTMLImageElement, crop: Crop) {
  const isPct = crop.unit === "%";
  const cropX = isPct ? (crop.x / 100) * image.naturalWidth : crop.x * (image.naturalWidth / image.width);
  const cropY = isPct ? (crop.y / 100) * image.naturalHeight : crop.y * (image.naturalHeight / image.height);
  const cropW = isPct ? (crop.width / 100) * image.naturalWidth : crop.width * (image.naturalWidth / image.width);
  const cropH = isPct ? (crop.height / 100) * image.naturalHeight : crop.height * (image.naturalHeight / image.height);
  return { cropX, cropY, cropW, cropH };
}

/** Full-quality original crop (no size limit) */
async function getOriginalBlob(
  image: HTMLImageElement,
  crop: Crop
): Promise<Blob> {
  const { cropX, cropY, cropW, cropH } = getCropCoords(image, crop);
  const canvas = document.createElement("canvas");
  canvas.width = cropW;
  canvas.height = cropH;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/webp", 0.92);
  });
}

const THUMB_MAX_WIDTH = 500;
const THUMB_MAX_SIZE_BYTES = 300 * 1024; // 300 KB

/** Thumbnail: max 500px wide, max 300 KB */
async function getThumbnailBlob(
  image: HTMLImageElement,
  crop: Crop
): Promise<Blob> {
  const { cropX, cropY, cropW, cropH } = getCropCoords(image, crop);
  const scale = Math.min(1, THUMB_MAX_WIDTH / cropW);
  const outW = Math.round(cropW * scale);
  const outH = Math.round(cropH * scale);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, cropX, cropY, cropW, cropH, 0, 0, outW, outH);

  // Try decreasing quality until under 300 KB
  for (let q = 0.85; q >= 0.3; q -= 0.1) {
    const blob: Blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b!), "image/webp", q);
    });
    if (blob.size <= THUMB_MAX_SIZE_BYTES || q <= 0.3) return blob;
  }

  // Fallback (shouldn't reach)
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b!), "image/webp", 0.3);
  });
}

export default function StaffPhotoUpload({
  staffId,
  fullName,
  currentPhotoUrl,
  onPhotoUpdated,
}: StaffPhotoUploadProps) {
  const [pickOpen, setPickOpen] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState<Crop>();
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImgSrc(reader.result as string);
      setPickOpen(false);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height));
  }, []);

  const handleUpload = async () => {
    if (!imgRef.current || !crop) return;
    setUploading(true);
    try {
      const [thumbBlob, originalBlob] = await Promise.all([
        getThumbnailBlob(imgRef.current, crop),
        getOriginalBlob(imgRef.current, crop),
      ]);

      const thumbPath = `${staffId}.webp`;
      const originalPath = `${staffId}_original.webp`;

      // Upload both in parallel
      const [thumbUpload, originalUpload] = await Promise.all([
        supabase.storage.from("staff-photos").upload(thumbPath, thumbBlob, { upsert: true, contentType: "image/webp" }),
        supabase.storage.from("staff-photos").upload(originalPath, originalBlob, { upsert: true, contentType: "image/webp" }),
      ]);

      if (thumbUpload.error) throw thumbUpload.error;
      if (originalUpload.error) throw originalUpload.error;

      const { data: urlData } = supabase.storage.from("staff-photos").getPublicUrl(thumbPath);
      const photoUrl = `${urlData.publicUrl}?v=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("staff_profiles")
        .update({ photo_url: photoUrl } as any)
        .eq("id", staffId);

      if (updateError) throw updateError;

      toast.success("Photo updated");
      onPhotoUpdated();
      setCropOpen(false);
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
      // Remove both thumbnail and original
      await supabase.storage.from("staff-photos").remove([`${staffId}.webp`, `${staffId}_original.webp`]);
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
          onClick={() => setPickOpen(true)}
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

      {/* Pick / Drop modal */}
      <Dialog open={pickOpen} onOpenChange={setPickOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Upload Photo</DialogTitle>
          </DialogHeader>
          <div
            className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer ${
              dragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              Drag & drop an image here, or <span className="text-primary font-medium">click to browse</span>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Crop modal */}
      <Dialog open={cropOpen} onOpenChange={setCropOpen}>
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
            <Button variant="outline" onClick={() => { setCropOpen(false); setImgSrc(""); }}>
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
