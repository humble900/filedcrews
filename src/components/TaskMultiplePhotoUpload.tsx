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
import { Camera, Loader2, Upload, Eye, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TaskMultiplePhotoUploadProps {
  taskId: string;
  type: "before" | "after";
  currentUrls: string[];
  onPhotosUpdated: (urls: string[]) => void;
  disabled?: boolean;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number) {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, 4 / 3, mediaWidth, mediaHeight),
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

const MAX_WIDTH = 1200;
const MAX_SIZE_BYTES = 800 * 1024; // 800 KB

async function getProcessedBlob(
  image: HTMLImageElement,
  crop: Crop
): Promise<Blob> {
  const { cropX, cropY, cropW, cropH } = getCropCoords(image, crop);
  const scale = Math.min(1, MAX_WIDTH / cropW);
  const outW = Math.round(cropW * scale);
  const outH = Math.round(cropH * scale);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, cropX, cropY, cropW, cropH, 0, 0, outW, outH);

  for (let q = 0.85; q >= 0.3; q -= 0.1) {
    const blob: Blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b!), "image/webp", q);
    });
    if (blob.size <= MAX_SIZE_BYTES || q <= 0.3) return blob;
  }

  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b!), "image/webp", 0.3);
  });
}

export default function TaskMultiplePhotoUpload({
  taskId,
  type,
  currentUrls = [],
  onPhotosUpdated,
  disabled = false,
}: TaskMultiplePhotoUploadProps) {
  const [pickOpen, setPickOpen] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState<Crop>();
  const [uploading, setUploading] = useState(false);
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
      const blob = await getProcessedBlob(imgRef.current, crop);
      const timestamp = Date.now();
      const filePath = `tasks/${taskId}/${type}_multi_${timestamp}.webp`;

      const { error: uploadError } = await supabase.storage
        .from("task-attachments")
        .upload(filePath, blob, { upsert: true, contentType: "image/webp" });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("task-attachments")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      
      const newUrls = [...currentUrls, publicUrl];
      onPhotosUpdated(newUrls);

      toast.success("Photo added successfully");
      setCropOpen(false);
      setImgSrc("");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    const newUrls = currentUrls.filter((_, idx) => idx !== indexToRemove);
    onPhotosUpdated(newUrls);
    toast.success("Photo removed");
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onSelectFile}
        disabled={disabled}
      />

      <div className="grid grid-cols-2 gap-2 w-full">
        {currentUrls.map((url, index) => (
          <div key={index} className="relative rounded-lg overflow-hidden border border-border group aspect-[4/3] bg-muted flex items-center justify-center">
            <img
              src={url}
              alt={`${type} photo ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => {
                  setPreviewUrl(url);
                  setPreviewOpen(true);
                }}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
              {!disabled && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleRemovePhoto(index)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        ))}

        {currentUrls.length < 6 && !disabled && (
          <Button
            type="button"
            variant="outline"
            className="border-dashed border-2 flex flex-col items-center justify-center aspect-[4/3] h-auto w-full gap-1 rounded-lg hover:bg-accent/40"
            onClick={() => setPickOpen(true)}
          >
            <Plus className="h-5 w-5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground font-semibold">
              Add Photo
            </span>
          </Button>
        )}
      </div>

      {/* Pick / Source Dialog */}
      <Dialog open={pickOpen} onOpenChange={setPickOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add {type === "before" ? "Before" : "After"} Photo</DialogTitle>
          </DialogHeader>
          <div
            className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer ${
              dragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              Drag & drop an image here, or{" "}
              <span className="text-primary font-medium">click to capture / browse</span>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Crop Dialog */}
      <Dialog open={cropOpen} onOpenChange={setCropOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crop Task Photo</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center bg-black/5 p-2 rounded-lg">
            {imgSrc && (
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                aspect={4 / 3}
                className="max-h-[350px]"
              >
                <img
                  ref={imgRef}
                  src={imgSrc}
                  alt="Crop preview"
                  onLoad={onImageLoad}
                  style={{ maxHeight: "350px" }}
                />
              </ReactCrop>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setCropOpen(false);
                setImgSrc("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Uploading…
                </>
              ) : (
                "Save Photo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl p-1 bg-black overflow-hidden flex items-center justify-center">
          <img
            src={previewUrl}
            alt="Full preview"
            className="max-h-[85vh] w-auto object-contain rounded"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
