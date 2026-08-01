import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  MessageSquarePlus, 
  BookOpen, 
  Settings, 
  CheckCircle2,
  XCircle,
  Bot,
  Trash2,
  Activity
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AIAgentPage() {
  const { company, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("roster");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  
  // Agent Builder Chat State
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{role: string, content: string}[]>([
    { role: "assistant", content: "Hi! I'm Mila. I can help you build custom virtual coworkers for your team. Need an agent to answer SMS leads or schedule jobs? Just tell me what you want to build!" }
  ]);
  const [isBuilding, setIsBuilding] = useState(false);

  // Global Settings State
  const [aiSettings, setAiSettings] = useState<any>({
    provider: "openai",
    apiKey: "",
    model: "gpt-4o",
    skills: {} // Legacy support
  });

  useEffect(() => {
    if (company) {
      if (!(company as any)?.ai_agent_enabled) {
        navigate("/marketplace/ai-agent");
      } else if ((company as any)?.ai_settings) {
        setAiSettings((prev: any) => ({
          ...prev,
          ...(company as any).ai_settings
        }));
      }
    }
  }, [company, navigate]);

  // Fetch Custom Agents (Roster)
  const { data: agents = [], isLoading: isLoadingAgents } = useQuery({
    queryKey: ["custom_agents", company?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_agents" as any)
        .select("*")
        .eq("company_id", company?.id || "")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!company?.id,
  });

  // Delete Agent Mutation
  const deleteAgentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("custom_agents" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Agent deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["custom_agents"] });
    },
    onError: (err: any) => {
      toast.error(`Failed to delete: ${err.message}`);
    }
  });

  const testConnection = async () => {
    if (!aiSettings.apiKey) {
      toast.error("Please save an API key first.");
      return;
    }
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai_copilot", {
        body: { prompt: "ping", companyId: company?.id, bypassTools: true }
      });
      if (error) throw error;
      if (data?.success) {
        toast.success(`Connection successful! Provider responded: ${data.response?.substring(0, 50)}...`);
      } else {
        toast.error(`Connection failed: ${data?.message || "Unknown error"}`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Connection failed: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!company?.id) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('companies')
        .update({ ai_settings: aiSettings })
        .eq('id', company.id);
      if (error) throw error;
      toast.success("Global AI settings saved");
      queryClient.invalidateQueries({ queryKey: ['company'] });
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !company?.id) return;
    
    const userMsg = chatInput;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsBuilding(true);

    try {
      // Append a hidden instruction to force tool usage if appropriate
      const buildPrompt = `User request to build/modify Mila agent: ${userMsg}. 
If you have enough information to build the agent, invoke the 'deploy_custom_agent' tool immediately. Otherwise, ask clarifying questions.`;

      const { data, error } = await supabase.functions.invoke("ai_copilot", {
        body: { prompt: buildPrompt, companyId: company.id, bypassTools: false }
      });

      if (error) throw error;

      if (data?.success) {
        setChatMessages(prev => [...prev, { role: "assistant", content: data.message }]);
        if (data.generatedData && data.generatedData.name) {
          // A tool was called and an agent was built
          queryClient.invalidateQueries({ queryKey: ["custom_agents"] });
          toast.success(`${data.generatedData.name} deployed successfully!`);
        }
      } else {
        setChatMessages(prev => [...prev, { role: "assistant", content: data?.message || "Sorry, I encountered an error processing that request." }]);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message);
      setChatMessages(prev => [...prev, { role: "assistant", content: "Error connecting to AI backend." }]);
    } finally {
      setIsBuilding(false);
    }
  };

  const tabs = [
    { id: "roster", label: "Agent Roster", icon: Users },
    { id: "builder", label: "Agent Builder", icon: MessageSquarePlus },
    { id: "kb", label: "Knowledge Base", icon: BookOpen },
    { id: "settings", label: "Global Settings", icon: Settings },
  ];

  return (
    <DashboardLayout activeTab="ai-agent">
      <SEO title="Mila Virtual Coworker" />
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-50/50">
        {/* Sidebar Tabs */}
        <div className="w-56 border-r bg-white flex flex-col shrink-0">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-slate-800">Mila Virtual Coworker</h2>
            <p className="text-xs text-slate-500 mt-1">AI Fleet Management</p>
          </div>
          <div className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors relative
                    ${isActive ? 'text-indigo-700 bg-indigo-50/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}
                  `}
                >
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r" />}
                  <Icon className={`h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-5xl mx-auto space-y-6 pb-24">
            
            {/* TAB: ROSTER */}
            {activeTab === "roster" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Your Active Agents</h2>
                    <p className="text-slate-500">Manage your deployed Mila virtual coworkers.</p>
                  </div>
                  <Button onClick={() => setActiveTab("builder")}>Build New Agent</Button>
                </div>

                {isLoadingAgents ? (
                  <div className="flex justify-center p-12"><Activity className="h-8 w-8 text-indigo-500 animate-spin" /></div>
                ) : agents.length === 0 ? (
                  <Card className="p-12 text-center bg-slate-50/50 border-dashed">
                    <Bot className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No agents deployed yet</h3>
                    <p className="text-slate-500 mb-6">Go to the Agent Builder to create your first Mila virtual coworker.</p>
                    <Button onClick={() => setActiveTab("builder")}>Start Building</Button>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {agents.map((agent: any) => (
                      <Card key={agent.id} className="flex flex-col">
                        <CardHeader className="pb-3 border-b">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{agent.name}</CardTitle>
                              <CardDescription className="flex items-center gap-2 mt-1">
                                <span className={`w-2 h-2 rounded-full ${agent.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                {agent.is_active ? 'Active' : 'Inactive'}
                              </CardDescription>
                            </div>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500" onClick={() => deleteAgentMutation.mutate(agent.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4 flex-1 space-y-4">
                          <div>
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trigger</span>
                            <p className="text-sm font-medium text-slate-900 mt-1">{agent.trigger_type}</p>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Skills</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {agent.active_skills?.map((skill: string) => (
                                <span key={skill} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs border border-indigo-100">
                                  {skill}
                                </span>
                              ))}
                              {!agent.active_skills?.length && <span className="text-sm text-slate-500">None</span>}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: BUILDER */}
            {activeTab === "builder" && (
              <Card className="flex flex-col h-[600px]">
                <CardHeader className="border-b shrink-0 bg-slate-50/50">
                  <CardTitle>Mila Agent Builder</CardTitle>
                  <CardDescription>Chat with the meta-agent to architect and deploy new specialized coworkers.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 p-0 flex flex-col overflow-hidden bg-slate-50/30">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4 pb-4">
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-800'}`}>
                            {msg.role === 'assistant' && <div className="font-semibold text-indigo-600 mb-1 flex items-center gap-2"><Bot className="h-3 w-3"/> Mila Builder</div>}
                            <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                          </div>
                        </div>
                      ))}
                      {isBuilding && (
                        <div className="flex justify-start">
                          <div className="bg-white border rounded-xl px-4 py-3 text-sm shadow-sm text-slate-500 flex items-center gap-2">
                            <Activity className="h-4 w-4 animate-spin" /> Mila is thinking...
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  <div className="p-4 bg-white border-t shrink-0">
                    <form 
                      onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                      className="flex gap-3 relative"
                    >
                      <Input 
                        placeholder="E.g. Build an agent to handle incoming Twilio SMS and auto-assign techs..." 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        disabled={isBuilding}
                        className="pr-24"
                      />
                      <Button type="submit" disabled={isBuilding || !chatInput.trim()} className="absolute right-1 top-1 bottom-1 h-auto">
                        Send
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TAB: KNOWLEDGE BASE */}
            {activeTab === "kb" && (
              <Card>
                <CardHeader>
                  <CardTitle>Agent Knowledge Base</CardTitle>
                  <CardDescription>Upload manuals, pricing guides, and SOPs for your Mila agents to reference.</CardDescription>
                </CardHeader>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Knowledge Base Coming Soon</h3>
                  <p className="text-slate-500 max-w-md mx-auto">This feature is part of Phase E. Soon you'll be able to upload PDFs to ground Mila in your company's proprietary data.</p>
                </CardContent>
              </Card>
            )}

            {/* TAB: SETTINGS */}
            {activeTab === "settings" && (
              <Card>
                <CardHeader>
                  <CardTitle>Global AI Settings</CardTitle>
                  <CardDescription>Configure your provider API keys and default models.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Provider</Label>
                    <Select value={aiSettings.provider} onValueChange={(val) => setAiSettings((prev: any) => ({ ...prev, provider: val }))}>
                      <SelectTrigger className="w-[300px]">
                        <SelectValue placeholder="Select Provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic">Anthropic</SelectItem>
                        <SelectItem value="gemini">Google Gemini</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input 
                      type="password" 
                      className="font-mono max-w-md" 
                      placeholder="sk-..." 
                      value={aiSettings.apiKey || ""}
                      onChange={(e) => setAiSettings((prev: any) => ({ ...prev, apiKey: e.target.value }))}
                    />
                  </div>

                  <div className="flex items-center gap-4 pt-4">
                    <Button variant="outline" onClick={testConnection} disabled={testing}>
                      {testing ? "Testing..." : "Test Connection"}
                    </Button>
                    <div className="flex items-center gap-2 text-sm">
                      {aiSettings.apiKey ? (
                        <><CheckCircle2 className="h-4 w-4 text-emerald-500" /><span className="text-emerald-700 font-medium">Connected</span></>
                      ) : (
                        <><XCircle className="h-4 w-4 text-red-500" /><span className="text-red-700 font-medium">Not Connected</span></>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-slate-50/50 px-6 py-4">
                  <Button onClick={handleSaveSettings} disabled={saving}>{saving ? "Saving..." : "Save Settings"}</Button>
                </CardFooter>
              </Card>
            )}

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
