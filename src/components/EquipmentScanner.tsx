import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, ScanLine, Loader2, Check, Upload } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface EquipmentScannerProps {
  onScanComplete: (data: { make: string; model: string; serial: string }) => void;
}

export const EquipmentScanner = ({ onScanComplete }: EquipmentScannerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [extractedData, setExtractedData] = useState({ make: "", model: "", serial: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setShowResult(false);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = (event.target?.result as string).split(',')[1];
      
      try {
        const { data, error } = await supabase.functions.invoke("ocr_processor", {
          body: { imageBase64: base64Data, type: "equipment" }
        });

        if (error) throw error;
        
        setExtractedData({
          make: data.make || "Unknown Make",
          model: data.model || "Unknown Model",
          serial: data.serial_number || "Unknown Serial",
        });
        
        setShowResult(true);
      } catch (err: any) {
        toast.error("Failed to process image: " + err.message);
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const startScan = () => {
    setIsOpen(true);
    setIsScanning(false);
    setShowResult(false);
  };

  const handleConfirm = () => {
    setIsOpen(false);
    toast.success("Equipment data saved!");
    onScanComplete(extractedData);
  };

  return (
    <>
      <Button 
        onClick={startScan}
        variant="outline" 
        className="w-full h-12 bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800"
      >
        <Camera className="h-4 w-4 mr-2 text-indigo-400" />
        Scan Data Plate with OCR
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-slate-950 border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanLine className="h-5 w-5 text-indigo-400" />
              Live Equipment OCR Scanner
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Upload or capture a photo of the unit's data plate.
            </DialogDescription>
          </DialogHeader>

          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleImageUpload} 
          />

          <div className="relative h-64 w-full bg-black rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center p-4">
            {isScanning ? (
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
                <p className="text-xs font-mono text-indigo-400 animate-pulse">PROCESSING IMAGE OCR...</p>
              </div>
            ) : showResult ? (
              <div className="w-full p-4 space-y-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg text-center mb-2">
                  <Check className="h-6 w-6 text-emerald-400 mx-auto mb-1" />
                  <p className="text-sm font-bold text-emerald-400">OCR Scan Successful</p>
                </div>
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-500">Make:</span>
                    <span className="text-slate-200 font-bold">{extractedData.make}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-500">Model:</span>
                    <span className="text-slate-200 font-bold">{extractedData.model}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span className="text-slate-500">Serial:</span>
                    <span className="text-slate-200 font-bold">{extractedData.serial}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <Upload className="h-10 w-10 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400">Upload or snap a photo of the serial plate</p>
                <Button size="sm" onClick={() => fileInputRef.current?.click()} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold">
                  Select Photo / Camera
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-between gap-2">
            <Button 
              variant="ghost" 
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              Cancel
            </Button>
            {showResult && (
              <Button 
                onClick={handleConfirm}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                Apply Data
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
