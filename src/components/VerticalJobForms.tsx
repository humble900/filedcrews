import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

interface VerticalJobFormsProps {
  vertical: string;
  data: any;
  onChange: (data: any) => void;
  disabled?: boolean;
}

export const VerticalJobForms = ({ vertical, data, onChange, disabled }: VerticalJobFormsProps) => {
  const updateField = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  switch (vertical) {
    case "HVAC":
      return (
        <div className="space-y-4 bg-muted/20 p-4 rounded-lg border border-border/40">
          <h4 className="text-sm font-semibold text-primary">HVAC System Details</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">System Brand</Label>
              <Input 
                value={data.systemBrand || ""} 
                onChange={(e) => updateField("systemBrand", e.target.value)} 
                disabled={disabled}
                placeholder="e.g. Carrier, Trane"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Model Number</Label>
              <Input 
                value={data.modelNumber || ""} 
                onChange={(e) => updateField("modelNumber", e.target.value)} 
                disabled={disabled}
                placeholder="e.g. 59TP6"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Refrigerant Type</Label>
              <Input 
                value={data.refrigerantType || ""} 
                onChange={(e) => updateField("refrigerantType", e.target.value)} 
                disabled={disabled}
                placeholder="e.g. R-410A"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tonnage / BTUs</Label>
              <Input 
                value={data.tonnage || ""} 
                onChange={(e) => updateField("tonnage", e.target.value)} 
                disabled={disabled}
                placeholder="e.g. 3 Ton"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Switch 
              checked={data.requiresDuctwork || false} 
              onCheckedChange={(c) => updateField("requiresDuctwork", c)} 
              disabled={disabled}
            />
            <Label className="text-sm font-normal">Requires ductwork modification</Label>
          </div>
        </div>
      );
      
    case "Plumbing":
      return (
        <div className="space-y-4 bg-muted/20 p-4 rounded-lg border border-border/40">
          <h4 className="text-sm font-semibold text-primary">Plumbing Details</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Pipe Material</Label>
              <Input 
                value={data.pipeMaterial || ""} 
                onChange={(e) => updateField("pipeMaterial", e.target.value)} 
                disabled={disabled}
                placeholder="e.g. Copper, PEX, PVC"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Water Pressure (PSI)</Label>
              <Input 
                type="number"
                value={data.waterPressure || ""} 
                onChange={(e) => updateField("waterPressure", e.target.value)} 
                disabled={disabled}
                placeholder="e.g. 60"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Switch 
              checked={data.mainShutoffLocated || false} 
              onCheckedChange={(c) => updateField("mainShutoffLocated", c)} 
              disabled={disabled}
            />
            <Label className="text-sm font-normal">Main water shut-off located</Label>
          </div>
        </div>
      );

    case "Electrical":
      return (
        <div className="space-y-4 bg-muted/20 p-4 rounded-lg border border-border/40">
          <h4 className="text-sm font-semibold text-primary">Electrical Panel Details</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Panel Amperage</Label>
              <Input 
                value={data.panelAmperage || ""} 
                onChange={(e) => updateField("panelAmperage", e.target.value)} 
                disabled={disabled}
                placeholder="e.g. 200A"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Voltage</Label>
              <Input 
                value={data.voltage || ""} 
                onChange={(e) => updateField("voltage", e.target.value)} 
                disabled={disabled}
                placeholder="e.g. 120/240V"
              />
            </div>
          </div>
          <div className="flex flex-col space-y-2 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                checked={data.requiresPermit || false} 
                onCheckedChange={(c) => updateField("requiresPermit", c)} 
                disabled={disabled}
              />
              <Label className="text-sm font-normal">Requires city permit</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                checked={data.panelUpgrade || false} 
                onCheckedChange={(c) => updateField("panelUpgrade", c)} 
                disabled={disabled}
              />
              <Label className="text-sm font-normal">Panel upgrade needed</Label>
            </div>
          </div>
        </div>
      );
      
    case "Landscaping":
      return (
        <div className="space-y-4 bg-muted/20 p-4 rounded-lg border border-border/40">
          <h4 className="text-sm font-semibold text-primary">Landscaping Specifications</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Total Area (sq ft)</Label>
              <Input 
                type="number"
                value={data.totalArea || ""} 
                onChange={(e) => updateField("totalArea", e.target.value)} 
                disabled={disabled}
                placeholder="e.g. 1500"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Soil Type</Label>
              <Input 
                value={data.soilType || ""} 
                onChange={(e) => updateField("soilType", e.target.value)} 
                disabled={disabled}
                placeholder="e.g. Clay, Loam"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Irrigation Details</Label>
            <Textarea 
              value={data.irrigationDetails || ""} 
              onChange={(e) => updateField("irrigationDetails", e.target.value)} 
              disabled={disabled}
              placeholder="List zones, sprinkler head types, etc."
              rows={2}
            />
          </div>
        </div>
      );
      
    case "Pest Control":
      return (
        <div className="space-y-4 bg-muted/20 p-4 rounded-lg border border-border/40">
          <h4 className="text-sm font-semibold text-primary">Pest Inspection Notes</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Target Pests</Label>
              <Input 
                value={data.targetPests || ""} 
                onChange={(e) => updateField("targetPests", e.target.value)} 
                disabled={disabled}
                placeholder="e.g. Termites, Rodents, Ants"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Chemicals Used</Label>
              <Input 
                value={data.chemicals || ""} 
                onChange={(e) => updateField("chemicals", e.target.value)} 
                disabled={disabled}
                placeholder="List EPA reg numbers if applicable"
              />
            </div>
          </div>
          <div className="flex flex-col space-y-2 pt-2">
            <div className="flex items-center space-x-2">
              <Switch 
                checked={data.interiorTreatment || false} 
                onCheckedChange={(c) => updateField("interiorTreatment", c)} 
                disabled={disabled}
              />
              <Label className="text-sm font-normal">Interior Treatment Included</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                checked={data.exteriorTreatment || false} 
                onCheckedChange={(c) => updateField("exteriorTreatment", c)} 
                disabled={disabled}
              />
              <Label className="text-sm font-normal">Exterior Treatment Included</Label>
            </div>
          </div>
        </div>
      );

    default:
      // Generic fallback for any other vertical
      return (
        <div className="space-y-4 bg-muted/20 p-4 rounded-lg border border-border/40">
          <h4 className="text-sm font-semibold text-primary">Custom Job Details</h4>
          <div className="space-y-1">
            <Label className="text-xs">Additional Notes</Label>
            <Textarea 
              value={data.additionalNotes || ""} 
              onChange={(e) => updateField("additionalNotes", e.target.value)} 
              disabled={disabled}
              placeholder="Enter any additional job specifications..."
              rows={3}
            />
          </div>
        </div>
      );
  }
};

export default VerticalJobForms;
