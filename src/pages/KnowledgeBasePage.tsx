import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Folder, FileText, Link as LinkIcon, RefreshCw, Trash2, Loader2, Upload, FileUp } from "lucide-react";
import SEO from "@/components/SEO";
import { cn } from "@/lib/utils";

export default function KnowledgeBasePage() {
  const { company } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  
  // Modals state
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  
  const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [sourceType, setSourceType] = useState<'url' | 'pdf'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Queries
  const { data: collections = [], isLoading: loadingCollections } = useQuery({
    queryKey: ["kb_collections", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase.from("kb_collections").select("*").eq("company_id", company.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!company?.id,
  });

  // Auto-select first collection
  useEffect(() => {
    if (collections.length > 0 && !activeCollectionId) {
      setActiveCollectionId(collections[0].id);
    }
  }, [collections, activeCollectionId]);

  const { data: documents = [], isLoading: loadingDocuments } = useQuery({
    queryKey: ["kb_documents", activeCollectionId],
    queryFn: async () => {
      if (!activeCollectionId) return [];
      const { data, error } = await supabase.from("kb_documents").select("*").eq("collection_id", activeCollectionId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!activeCollectionId,
    refetchInterval: 3000, // Poll to show processing updates
  });

  const activeCollection = collections.find(c => c.id === activeCollectionId);

  // Mutations
  const createCollectionMutation = useMutation({
    mutationFn: async () => {
      if (!company?.id || !newCollectionName.trim()) throw new Error("Name required");
      const { data, error } = await supabase.from("kb_collections").insert({ company_id: company.id, name: newCollectionName.trim() }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["kb_collections", company?.id] });
      setIsCollectionModalOpen(false);
      setNewCollectionName("");
      setActiveCollectionId(data.id);
      toast({ title: "Collection Created" });
    },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" })
  });

  const addSourceMutation = useMutation({
    mutationFn: async () => {
      if (!activeCollectionId || !newSourceName.trim()) throw new Error("Name required");
      
      let finalSourceUrl = null;

      if (sourceType === 'url') {
        finalSourceUrl = newSourceUrl.trim();
      } else if (sourceType === 'pdf') {
        if (!selectedFile) throw new Error("Please select a file to upload.");
        
        const fileExt = selectedFile.name.split('.').pop();
        const filePath = `${company?.id}/${activeCollectionId}/${crypto.randomUUID()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage.from('knowledge_base').upload(filePath, selectedFile);
        if (uploadError) throw new Error("Failed to upload file: " + uploadError.message);
        
        finalSourceUrl = filePath;
      }

      const { data: docData, error: docError } = await supabase.from("kb_documents").insert({
        collection_id: activeCollectionId,
        title: newSourceName.trim(),
        type: sourceType,
        source_url: finalSourceUrl,
        status: 'pending'
      }).select().single();

      if (docError) throw docError;

      // Trigger the background processor
      supabase.functions.invoke("process_knowledge_base", {
        body: { document_id: docData.id }
      }).catch(console.error);

      return docData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kb_documents", activeCollectionId] });
      setIsAddSourceModalOpen(false);
      setNewSourceName("");
      setNewSourceUrl("");
      setSelectedFile(null);
      toast({ title: "Source Added", description: "Processing started in the background." });
    },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" })
  });

  const deleteSourceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kb_documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kb_documents", activeCollectionId] });
      toast({ title: "Source deleted" });
    }
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'ready': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Ready</Badge>;
      case 'processing': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20"><Loader2 className="w-3 h-3 animate-spin mr-1 inline"/> Processing</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
      default: return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <>
      <SEO title="Knowledge Base" description="Train Mila Virtual Coworker with your company manuals and websites." path="/knowledge" />
      <DashboardLayout activeTab="knowledge" companyName={company?.name || ""} companyPrefix={company?.prefix || ""} companyId={company?.id || ""}>
        <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-background">
          
          {/* LEFT SIDEBAR - Collections */}
          <div className="w-64 border-r border-border flex flex-col bg-muted/10 shrink-0">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-lg flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary"/> Knowledge Base</h2>
              <Button size="icon" variant="ghost" onClick={() => setIsCollectionModalOpen(true)} className="h-8 w-8 rounded-full">
                <Plus className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {loadingCollections ? (
                <div className="text-sm text-muted-foreground p-4 text-center">Loading collections...</div>
              ) : collections.length === 0 ? (
                <div className="text-sm text-muted-foreground p-4 text-center">No collections found.</div>
              ) : (
                collections.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCollectionId(c.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                      activeCollectionId === c.id 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <Folder className="w-4 h-4" />
                    <span className="truncate">{c.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* RIGHT PANE - Sources */}
          <div className="flex-1 flex flex-col bg-background overflow-hidden relative">
            {activeCollectionId ? (
              <>
                <div className="p-6 border-b border-border bg-card shadow-sm flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">{activeCollection?.name}</h1>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      ID: {activeCollectionId.substring(0,8)}... • <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3"/> Auto-sync active</span>
                    </p>
                  </div>
                  <Button onClick={() => setIsAddSourceModalOpen(true)} className="gap-2 font-bold shadow-lg shadow-primary/20">
                    <Plus className="w-4 h-4"/> Add Source
                  </Button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                  {loadingDocuments ? (
                    <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary/50" /></div>
                  ) : documents.length === 0 ? (
                    <div className="text-center py-20">
                      <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileUp className="w-8 h-8 text-muted-foreground"/>
                      </div>
                      <h3 className="text-lg font-semibold">No sources added yet</h3>
                      <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-2 mb-6">
                        Upload your SOPs, employee manuals, or provide your company website URL so Mila can learn how your business operates.
                      </p>
                      <Button onClick={() => setIsAddSourceModalOpen(true)}>Add your first source</Button>
                    </div>
                  ) : (
                    <div className="space-y-4 max-w-4xl mx-auto">
                      {documents.map(doc => (
                        <Card key={doc.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center p-4">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mr-4">
                              {doc.type === 'url' ? <LinkIcon className="w-6 h-6 text-primary"/> : <FileText className="w-6 h-6 text-primary"/>}
                            </div>
                            <div className="flex-1 min-w-0 pr-4">
                              <h4 className="font-semibold text-base truncate">{doc.title}</h4>
                              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                {doc.type === 'url' && <span className="truncate max-w-[200px]">{doc.source_url}</span>}
                                {doc.page_count > 0 && <span>{doc.page_count} Chunks</span>}
                                <span>{getStatusBadge(doc.status)}</span>
                              </div>
                              {doc.status === 'error' && (
                                <p className="text-xs text-destructive mt-1 bg-destructive/10 p-2 rounded-md border border-destructive/20">{doc.error_message}</p>
                              )}
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => deleteSourceMutation.mutate(doc.id)} className="text-muted-foreground hover:text-destructive">
                              <Trash2 className="w-4 h-4"/>
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col">
                <BookOpen className="w-12 h-12 mb-4 opacity-20"/>
                <p>Select or create a collection to get started.</p>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>

      {/* Create Collection Modal */}
      <Dialog open={isCollectionModalOpen} onOpenChange={setIsCollectionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Knowledge Base Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Collection Name</label>
              <Input placeholder="e.g. Employee Manuals" value={newCollectionName} onChange={e => setNewCollectionName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCollectionModalOpen(false)}>Cancel</Button>
            <Button onClick={() => createCollectionMutation.mutate()} disabled={createCollectionMutation.isPending || !newCollectionName.trim()}>
              {createCollectionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Source Modal */}
      <Dialog open={isAddSourceModalOpen} onOpenChange={setIsAddSourceModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Source to {activeCollection?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setSourceType('url')}
                className={cn("p-4 border rounded-xl flex flex-col items-center gap-2 transition-all", sourceType === 'url' ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted/50")}
              >
                <LinkIcon className={cn("w-8 h-8", sourceType === 'url' ? "text-primary" : "text-muted-foreground")}/>
                <span className="font-semibold text-sm">Website URL</span>
              </button>
              <button 
                onClick={() => setSourceType('pdf')}
                className={cn("p-4 border rounded-xl flex flex-col items-center gap-2 transition-all", sourceType === 'pdf' ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted/50")}
              >
                <Upload className={cn("w-8 h-8", sourceType === 'pdf' ? "text-primary" : "text-muted-foreground")}/>
                <span className="font-semibold text-sm">Upload PDF</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Source Title</label>
                <Input placeholder="e.g. 2026 Company Handbook" value={newSourceName} onChange={e => setNewSourceName(e.target.value)} />
              </div>

              {sourceType === 'url' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Website URL</label>
                  <Input placeholder="https://example.com" value={newSourceUrl} onChange={e => setNewSourceUrl(e.target.value)} />
                  <p className="text-xs text-muted-foreground mt-1">We will extract text from this page and generate embeddings.</p>
                </div>
              )}

              {sourceType === 'pdf' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">File Upload</label>
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-muted/20 relative group">
                    <input 
                      type="file" 
                      accept=".pdf"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <FileUp className="w-8 h-8 text-muted-foreground mx-auto mb-2 group-hover:text-primary transition-colors"/>
                    <p className="text-sm font-medium">
                      {selectedFile ? selectedFile.name : "Click to browse or drag and drop"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : "PDFs only (Max 10MB)"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSourceModalOpen(false)}>Cancel</Button>
            <Button onClick={() => addSourceMutation.mutate()} disabled={addSourceMutation.isPending || !newSourceName.trim() || (sourceType === 'url' && !newSourceUrl.trim()) || (sourceType === 'pdf' && !selectedFile)}>
              {addSourceMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>} Save Source
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
