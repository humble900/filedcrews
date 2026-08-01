import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Loader2, Upload, FileText, Check, Sliders } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface DocumentScannerProps {
  projectId: string;
  jobId?: string;
  onUploadSuccess: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FilterType = "original" | "enhanced" | "bw";

export default function DocumentScanner({
  projectId,
  jobId,
  onUploadSuccess,
  open,
  onOpenChange,
}: DocumentScannerProps) {
  const { staffProfile } = useAuth();
  const [imgSrc, setImgSrc] = useState("");
  const [docName, setDocName] = useState("");
  const [docNotes, setDocNotes] = useState("");
  const [filter, setFilter] = useState<FilterType>("original");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  
  const originalImgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Set default document name when dialog opens
  useEffect(() => {
    if (open) {
      const dateStr = new Date().toLocaleDateString().replace(/\//g, "-");
      setDocName(`Scan_${dateStr}`);
      setDocNotes("");
      setImgSrc("");
      setFilter("original");
    }
  }, [open]);

  // Apply filters on canvas when image source or filter changes
  useEffect(() => {
    if (!imgSrc || !originalImgRef.current || !canvasRef.current) return;
    
    const img = originalImgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions to match image
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Draw original image
    ctx.drawImage(img, 0, 0);

    if (filter === "original") return;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    if (filter === "enhanced") {
      // Color Document Enhancer: Boost contrast and brightness
      // Contrast factor (1.4) and brightness offset (25)
      const factor = 1.4;
      const brightness = 25;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, (data[i] - 128) * factor + 128 + brightness));     // R
        data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * factor + 128 + brightness)); // G
        data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * factor + 128 + brightness)); // B
      }
    } else if (filter === "bw") {
      // Black & White photocopy look: Thresholding
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // Threshold around 130
        const bwValue = gray > 130 ? 255 : 0;
        
        data[i] = bwValue;     // R
        data[i + 1] = bwValue; // G
        data[i + 2] = bwValue; // B
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }, [imgSrc, filter]);

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      setImgSrc(result);
      
      // Auto-extract OCR for document notes
      const base64Data = result.split(',')[1];
      try {
        toast.info("Extracting document details...");
        const { data, error } = await supabase.functions.invoke("ocr_processor", {
          body: { imageBase64: base64Data, type: "receipt" }
        });
        
        if (!error && data) {
          const parts = [];
          if (data.merchant_name) parts.push(`Merchant: ${data.merchant_name}`);
          if (data.date) parts.push(`Date: ${data.date}`);
          if (data.total_amount) parts.push(`Total: $${data.total_amount}`);
          if (parts.length > 0) {
            setDocNotes((prev) => prev ? prev + "\n" + parts.join(" | ") : parts.join(" | "));
            toast.success("Document details extracted!");
          }
        }
      } catch (err) {
        console.error("OCR Error:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleUpload = async () => {
    if (!canvasRef.current || !docName.trim()) return;
    setUploading(true);
    try {
      // Convert canvas to blob
      const blob: Blob = await new Promise((resolve) => {
        canvasRef.current!.toBlob((b) => resolve(b!), "image/webp", 0.9);
      });

      const filename = `${docName.trim().replace(/\s+/g, "_")}_${Date.now()}.webp`;
      const filePath = `documents/${projectId}/${filename}`;

      // 1. Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("task-attachments")
        .upload(filePath, blob, { upsert: true, contentType: "image/webp" });

      if (uploadError) throw uploadError;

      // 2. Fetch public URL
      const { data: urlData } = supabase.storage
        .from("task-attachments")
        .getPublicUrl(filePath);

      // 3. Save to database table
      const { error: dbError } = await supabase.from("project_documents").insert({
        project_id: projectId,
        job_id: jobId || null,
        name: docName.trim(),
        file_url: urlData.publicUrl,
        file_type: "image",
        uploaded_by: staffProfile?.id || null,
        notes: docNotes.trim() || null,
      });

      if (dbError) throw dbError;

      toast.success("Document scanned and saved successfully");
      onUploadSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save scanned document");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Scan New Document
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!imgSrc ? (
            <div
              className={`flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-10 transition-colors cursor-pointer ${
                dragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
              }`}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) processFile(file);
              }}
            >
              <div className="p-4 bg-muted rounded-full">
                <Camera className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold">Take a picture of the document</p>
                <p className="text-xs text-muted-foreground">Or drag & drop / browse files from your device</p>
              </div>
              <Button type="button" variant="secondary" size="sm">
                Select Photo
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Document Enhancer Previews */}
              <div className="flex gap-2 justify-center">
                {(["original", "enhanced", "bw"] as FilterType[]).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={filter === type ? "default" : "outline"}
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => setFilter(type)}
                  >
                    {filter === type && <Check className="h-3.5 w-3.5" />}
                    {type === "original" ? "Original" : type === "enhanced" ? "Color Clean" : "B&W Scan"}
                  </Button>
                ))}
              </div>

              {/* Live Canvas View */}
              <div className="relative rounded-lg overflow-hidden border border-border bg-slate-900 aspect-video flex items-center justify-center max-h-[300px]">
                <canvas ref={canvasRef} className="max-w-full max-h-[300px] object-contain" />
                {/* Hidden original image for processing source */}
                <img
                  ref={originalImgRef}
                  src={imgSrc}
                  alt="Original source"
                  className="hidden"
                  onLoad={() => setFilter("original")}
                />
              </div>

              {/* Form details */}
              <div className="grid gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Document Name *</label>
                  <Input
                    placeholder="e.g. Supplier Invoice 2026"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Notes / Summary</label>
                  <Textarea
                    placeholder="Add document description, total amounts, or compliance items..."
                    rows={2}
                    value={docNotes}
                    onChange={(e) => setDocNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={onSelectFile}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {imgSrc && (
            <Button onClick={handleUpload} disabled={uploading || !docName.trim()}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Uploading Scan…
                </>
              ) : (
                "Save Scan"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
