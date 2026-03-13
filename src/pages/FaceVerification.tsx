import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, CheckCircle2, XCircle, ImageIcon, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const FaceVerification = () => {
  const [referencePhoto, setReferencePhoto] = useState<string | null>(null);
  const [savedReference, setSavedReference] = useState<string | null>(null);
  const [comparisonPhoto, setComparisonPhoto] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<{ match: boolean; confidence: string; explanation: string } | null>(null);
  const [isDraggingRef, setIsDraggingRef] = useState(false);
  const [isDraggingComp, setIsDraggingComp] = useState(false);

  const refInputRef = useRef<HTMLInputElement>(null);
  const compInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFileSelect = useCallback(async (file: File, setter: (v: string) => void) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB allowed.", variant: "destructive" });
      return;
    }
    const base64 = await fileToBase64(file);
    setter(base64);
    setResult(null);
  }, []);

  const saveReference = () => {
    if (!referencePhoto) return;
    setSavedReference(referencePhoto);
    toast({ title: "Reference photo saved", description: "You can now upload a comparison photo." });
  };

  const clearReference = () => {
    setSavedReference(null);
    setReferencePhoto(null);
    setComparisonPhoto(null);
    setResult(null);
  };

  const verify = async () => {
    if (!savedReference || !comparisonPhoto) return;
    setVerifying(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("face-verify", {
        body: { referencePhoto: savedReference, comparisonPhoto },
      });

      if (error) throw error;
      setResult(data);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Verification failed", description: e.message || "Something went wrong.", variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  // Drag and drop handlers for reference photo
  const handleRefDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingRef(true);
  };

  const handleRefDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingRef(false);
  };

  const handleRefDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingRef(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0], setReferencePhoto);
    }
  };

  // Drag and drop handlers for comparison photo
  const handleCompDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingComp(true);
  };

  const handleCompDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingComp(false);
  };

  const handleCompDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingComp(false);
    
    if (!savedReference) {
      toast({ title: "Save reference first", description: "Please upload and save a reference photo first.", variant: "destructive" });
      return;
    }
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0], setComparisonPhoto);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Face Verification</h1>
          <p className="mt-1 text-muted-foreground">Compare two photos to verify if they show the same person.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Reference Photo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ImageIcon className="h-5 w-5 text-primary" />
                Reference Photo
              </CardTitle>
              <CardDescription>
                {savedReference ? "Reference saved. Click edit to change." : "Upload or drag a reference photo to compare against."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                ref={refInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f, setReferencePhoto);
                }}
              />

              {savedReference ? (
                <>
                  <div className="relative overflow-hidden rounded-lg border border-border">
                    <img src={savedReference} alt="Reference" className="aspect-square w-full object-cover" />
                  </div>
                  <Button variant="outline" className="w-full" onClick={clearReference}>
                    <Trash2 className="mr-2 h-4 w-4" /> Change Reference
                  </Button>
                </>
              ) : referencePhoto ? (
                <>
                  <div className="relative overflow-hidden rounded-lg border border-border">
                    <img src={referencePhoto} alt="Preview" className="aspect-square w-full object-cover" />
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={saveReference}>Save Reference</Button>
                    <Button variant="outline" onClick={() => { setReferencePhoto(null); }}>Cancel</Button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => refInputRef.current?.click()}
                  onDragOver={handleRefDragOver}
                  onDragLeave={handleRefDragLeave}
                  onDrop={handleRefDrop}
                  className={cn(
                    "flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed transition",
                    isDraggingRef
                      ? "border-primary bg-primary/10"
                      : "border-muted-foreground/30 bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <Upload className={cn("h-10 w-10", isDraggingRef ? "text-primary" : "text-muted-foreground/50")} />
                  <span className="text-sm text-muted-foreground text-center px-4">
                    {isDraggingRef ? "Drop photo here" : "Click or drag photo here"}
                  </span>
                </button>
              )}
            </CardContent>
          </Card>

          {/* Comparison Photo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ImageIcon className="h-5 w-5 text-primary" />
                Comparison Photo
              </CardTitle>
              <CardDescription>Upload or drag the photo you want to verify.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                ref={compInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f, setComparisonPhoto);
                }}
              />

              {comparisonPhoto ? (
                <>
                  <div className="relative overflow-hidden rounded-lg border border-border">
                    <img src={comparisonPhoto} alt="Comparison" className="aspect-square w-full object-cover" />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => { setComparisonPhoto(null); setResult(null); }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Remove
                  </Button>
                </>
              ) : (
                <button
                  onClick={() => {
                    if (!savedReference) {
                      toast({ title: "Save reference first", description: "Please upload and save a reference photo first.", variant: "destructive" });
                      return;
                    }
                    compInputRef.current?.click();
                  }}
                  onDragOver={savedReference ? handleCompDragOver : undefined}
                  onDragLeave={savedReference ? handleCompDragLeave : undefined}
                  onDrop={savedReference ? handleCompDrop : undefined}
                  className={cn(
                    "flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed transition",
                    !savedReference && "opacity-50 cursor-not-allowed",
                    isDraggingComp && savedReference
                      ? "border-primary bg-primary/10"
                      : "border-muted-foreground/30 bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <Upload className={cn("h-10 w-10", isDraggingComp && savedReference ? "text-primary" : "text-muted-foreground/50")} />
                  <span className="text-sm text-muted-foreground text-center px-4">
                    {!savedReference
                      ? "Save reference photo first"
                      : isDraggingComp
                        ? "Drop photo here"
                        : "Click or drag photo here"}
                  </span>
                </button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Verify Button */}
        {savedReference && comparisonPhoto && (
          <Button className="w-full" size="lg" onClick={verify} disabled={verifying}>
            {verifying ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing faces…
              </>
            ) : (
              "Verify Match"
            )}
          </Button>
        )}

        {/* Result */}
        {result && (
          <Card className={result.match ? "border-green-500/50 bg-green-500/5" : "border-destructive/50 bg-destructive/5"}>
            <CardContent className="flex items-start gap-4 p-6">
              {result.match ? (
                <CheckCircle2 className="mt-0.5 h-8 w-8 shrink-0 text-green-500" />
              ) : (
                <XCircle className="mt-0.5 h-8 w-8 shrink-0 text-destructive" />
              )}
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {result.match ? "Match — Same Person" : "No Match — Different People"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  <strong>Confidence:</strong> {result.confidence}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{result.explanation}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FaceVerification;
