import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Save, Undo, Loader2, Grid } from "lucide-react";
import { toast } from "sonner";

interface InteractiveSpreadsheetProps {
  fileUrl: string;
  onSave: (csvContent: string) => Promise<void>;
  disabled?: boolean;
}

function parseCSV(csvText: string): string[][] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== "");
  return lines.map((line) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.replace(/^"|"$/g, ""));
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.replace(/^"|"$/g, ""));
    return result;
  });
}

function generateCSV(headers: string[], rows: string[][]): string {
  const formatCell = (cell: string) => {
    const escaped = (cell || "").replace(/"/g, '""');
    return escaped.includes(",") || escaped.includes("\n") || escaped.includes('"')
      ? `"${escaped}"`
      : cell;
  };
  const headerLine = headers.map(formatCell).join(",");
  const rowLines = rows.map((row) => row.map(formatCell).join(","));
  return [headerLine, ...rowLines].join("\n");
}

export default function InteractiveSpreadsheet({
  fileUrl,
  onSave,
  disabled = false,
}: InteractiveSpreadsheetProps) {
  const [loading, setLoading] = useState(true);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [saving, setSaving] = useState(false);

  // Load and parse CSV
  useEffect(() => {
    async function loadFile() {
      setLoading(true);
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error("Failed to load file");
        const text = await response.text();
        const parsed = parseCSV(text);

        if (parsed.length > 0) {
          setHeaders(parsed[0]);
          setRows(parsed.slice(1));
        } else {
          // Initialize blank sheet
          setHeaders(["Column A", "Column B", "Column C"]);
          setRows([["", "", ""]]);
        }
      } catch (err: any) {
        toast.error("Error loading spreadsheet: " + err.message);
        // Fallback placeholder
        setHeaders(["Item", "Quantity", "Price"]);
        setRows([["Example Item", "1", "10.00"]]);
      } finally {
        setLoading(false);
      }
    }
    loadFile();
  }, [fileUrl]);

  const handleCellChange = (rowIndex: number, colIndex: number, val: string) => {
    const newRows = [...rows];
    newRows[rowIndex] = [...newRows[rowIndex]];
    newRows[rowIndex][colIndex] = val;
    setRows(newRows);
  };

  const handleHeaderChange = (colIndex: number, val: string) => {
    const newHeaders = [...headers];
    newHeaders[colIndex] = val;
    setHeaders(newHeaders);
  };

  const addRow = () => {
    const newRow = Array(headers.length).fill("");
    setRows([...rows, newRow]);
  };

  const deleteRow = (rowIndex: number) => {
    const newRows = rows.filter((_, idx) => idx !== rowIndex);
    setRows(newRows);
  };

  const addColumn = () => {
    setHeaders([...headers, `Column ${headers.length + 1}`]);
    setRows(rows.map((row) => [...row, ""]));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const csvContent = generateCSV(headers, rows);
      await onSave(csvContent);
      toast.success("Spreadsheet saved successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to save spreadsheet");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12 flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground font-semibold">Parsing Spreadsheet Data…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Spreadsheet Actions Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 bg-muted/20 p-3 rounded-lg border">
        <div className="flex items-center gap-2">
          <Grid className="h-4 w-4 text-primary" />
          <span className="font-bold text-sm">Spreadsheet Editor</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addColumn}
            disabled={disabled || saving}
            className="h-8 text-xs font-semibold"
          >
            <Plus className="h-3 w-3 mr-1" /> Add Column
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRow}
            disabled={disabled || saving}
            className="h-8 text-xs font-semibold"
          >
            <Plus className="h-3 w-3 mr-1" /> Add Row
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={disabled || saving}
            className="h-8 text-xs font-semibold shadow-sm"
          >
            {saving ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Save className="h-3 w-3 mr-1" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Grid Table */}
      <div className="rounded-lg border overflow-x-auto shadow-sm max-h-[60vh]">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              {headers.map((h, colIdx) => (
                <TableHead key={colIdx} className="p-2 border-r last:border-r-0 min-w-[140px]">
                  <Input
                    value={h}
                    onChange={(e) => handleHeaderChange(colIdx, e.target.value)}
                    disabled={disabled || saving}
                    className="h-8 border-none bg-transparent hover:bg-background/80 focus:bg-background focus:ring-1 font-bold text-xs shadow-none text-center"
                  />
                </TableHead>
              ))}
              {!disabled && <TableHead className="w-12 text-center p-2">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={headers.length + 1} className="text-center p-8 text-muted-foreground text-sm">
                  Spreadsheet is empty. Click "Add Row" to start adding data.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, rowIdx) => (
                <TableRow key={rowIdx}>
                  {row.map((cell, colIdx) => (
                    <TableCell key={colIdx} className="p-1 border-r last:border-r-0 min-w-[140px]">
                      <Input
                        value={cell}
                        onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
                        disabled={disabled || saving}
                        className="h-8 border-none bg-transparent hover:bg-background/50 focus:bg-background focus:ring-1 text-xs shadow-none text-center"
                      />
                    </TableCell>
                  ))}
                  {!disabled && (
                    <TableCell className="p-1 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteRow(rowIdx)}
                        disabled={saving}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
