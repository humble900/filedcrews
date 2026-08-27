import React, { useState, useRef, useEffect } from "react";
import { Mic, Send, X, Bot, Image as ImageIcon, StopCircle, Settings, Play, Volume2, Save, Loader2, Lock, Zap, CreditCard, KeyRound, ArrowUpRight, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useNavigate } from "react-router-dom";

interface MobileTechVoiceCopilotProps {
  onClose?: () => void;
  jobId?: string;
}

const PREDEFINED_VOICES = [
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Mila (Default)", type: "Female, Professional" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", type: "Female, Friendly" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni", type: "Male, Clear" },
  { id: "TX3OmfOUXGLcasC2aXWw", name: "Drew", type: "Male, Deep" },
];

export default function MobileTechVoiceCopilot({ onClose, jobId }: MobileTechVoiceCopilotProps) {
  const { company, user } = useAuth();
  const navigate = useNavigate();
  
  // Gating state
  const [gateStatus, setGateStatus] = useState<'checking' | 'ready' | 'upgrade_required' | 'credits_exhausted'>('checking');
  const [gateInfo, setGateInfo] = useState<{ creditsUsed?: number; creditsLimit?: number; resetsAt?: string }>({});
  
  // State
  const [viewMode, setViewMode] = useState<'chat' | 'settings'>('chat');
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: 'Hi, I\'m Mila. I can help you diagnose issues, write reports, or update this job. What do you need?' }
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Voice Settings State
  const [voiceId, setVoiceId] = useState<string>("pFZP5JQG7iQjIQuC4Bku");
  const [isCustomClone, setIsCustomClone] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Voice Recording State
  const [isRecordingClone, setIsRecordingClone] = useState(false);
  const [cloningStatus, setCloningStatus] = useState<'idle' | 'recording' | 'uploading' | 'success'>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Fetch current voice settings + check AI access on mount
  useEffect(() => {
    const fetchVoiceSettings = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('staff_profiles')
        .select('voice_settings')
        .eq('id', user.id)
        .single();
      
      if (data?.voice_settings) {
        const settings = data.voice_settings as any;
        if (settings.voice_id) setVoiceId(settings.voice_id);
        if (settings.is_custom_clone) setIsCustomClone(settings.is_custom_clone);
      }
    };
    fetchVoiceSettings();

    // Pre-flight access check
    const checkAIAccess = async () => {
      if (!company?.id) { setGateStatus('upgrade_required'); return; }
      try {
        const tier = company?.subscription_tier || 'free_trial';
        const PAID_TIERS = new Set(['growth', 'founding_partner', 'Founding Partner', 'enterprise']);
        const { data: byokCheck } = await (supabase as any).from('api_keys').select('id').eq('company_id', company.id).eq('provider', 'openai').maybeSingle();
        const hasByok = !!byokCheck?.id;
        if (!PAID_TIERS.has(tier) && !hasByok) { setGateStatus('upgrade_required'); return; }
        const { data: compData } = await (supabase as any).from('companies').select('ai_credits_monthly_limit, ai_credits_used, ai_credits_bonus, ai_credits_reset_at').eq('id', company.id).single();
        if (compData) {
          const total = (compData.ai_credits_monthly_limit || 0) + (compData.ai_credits_bonus || 0);
          const remaining = total - (compData.ai_credits_used || 0);
          if (!hasByok && remaining <= 0) {
            setGateStatus('credits_exhausted');
            setGateInfo({ creditsUsed: compData.ai_credits_used, creditsLimit: total, resetsAt: compData.ai_credits_reset_at });
            return;
          }
        }
        setGateStatus('ready');
      } catch {
        setGateStatus('ready');
      }
    };
    checkAIAccess();
  }, [user?.id, company?.id]);

  // Handle standard message send
  const handleSend = async () => {
    if (!input.trim() || !company?.id) return;
    
    const userText = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai_copilot", {
        body: { 
          prompt: `Mobile Tech Request (Job ${jobId || 'Unknown'}): ${userText}`, 
          companyId: company.id, 
          jobId: jobId,
          bypassTools: false 
        }
      });

      if (error) throw error;

      // Handle gated responses
      if (data?.gated) {
        if (data.reason === 'upgrade_required') {
          setGateStatus('upgrade_required');
        } else if (data.reason === 'credits_exhausted') {
          setGateStatus('credits_exhausted');
          setGateInfo({ creditsUsed: data.creditsUsed, creditsLimit: data.creditsLimit, resetsAt: data.resetsAt });
        }
        setMessages(prev => [...prev, { role: 'assistant', content: data.message || 'AI access is currently unavailable.' }]);
        return;
      }
      
      if (data?.success) {
        let responseMsg = data.message;
        if (data.generatedData) {
           responseMsg += `\n(Executed: ${JSON.stringify(data.generatedData)})`;
        }
        setMessages(prev => [...prev, { role: 'assistant', content: responseMsg }]);
        // Here we would also fetch the TTS audio from ElevenLabs using the selected voiceId and play it
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data?.message || "I had trouble processing that." }]);
      }
    } catch (err: any) {
      toast.error(err.message);
      setMessages(prev => [...prev, { role: 'assistant', content: "Connection error." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle saving standard voice preference
  const saveVoicePreference = async (newVoiceId: string) => {
    setVoiceId(newVoiceId);
    setIsCustomClone(false);
    if (!user?.id) return;
    
    setSavingSettings(true);
    try {
      await supabase.from('staff_profiles').update({
        voice_settings: { voice_id: newVoiceId, is_custom_clone: false }
      }).eq('id', user.id);
      toast.success("Voice preference saved");
    } catch (err: any) {
      toast.error("Failed to save preference");
    } finally {
      setSavingSettings(false);
    }
  };

  // Handle starting the voice clone recording
  const startCloneRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        await uploadVoiceClone(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setCloningStatus('recording');
      setIsRecordingClone(true);
    } catch (err) {
      toast.error("Microphone access denied or unavailable.");
      setCloningStatus('idle');
    }
  };

  const stopCloneRecording = () => {
    if (mediaRecorderRef.current && isRecordingClone) {
      mediaRecorderRef.current.stop();
      setIsRecordingClone(false);
      setCloningStatus('uploading');
    }
  };

  const uploadVoiceClone = async (audioBlob: Blob) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const formData = new FormData();
      formData.append('files', audioBlob, 'voice_sample.mp3');
      formData.append('name', `Clone for ${user?.email || 'Tech'}`);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs_voice_clone`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: formData
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Upload failed");
      }

      setVoiceId(result.voice_id);
      setIsCustomClone(true);
      setCloningStatus('success');
      toast.success("Your voice was successfully cloned and set as default!");
      
    } catch (err: any) {
      toast.error(err.message || "Failed to clone voice.");
      setCloningStatus('idle');
    }
  };

  const formatResetDate = (dateStr?: string) => {
    if (!dateStr) return 'next month';
    try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } catch { return 'next month'; }
  };

  // ─── Gated Panels ───────────────────────────────────────────────────────────
  const renderGatedPanel = () => {
    if (gateStatus === 'checking') {
      return (
        <div className="flex-1 flex items-center justify-center bg-slate-50">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      );
    }
    if (gateStatus === 'upgrade_required') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 px-6 text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/15 flex items-center justify-center">
            <Lock className="h-7 w-7 text-amber-600" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">Upgrade to Unlock Mila AI</h3>
          <p className="text-sm text-slate-500 leading-relaxed max-w-[280px]">
            AI Copilot is available on paid plans. Upgrade your subscription to get AI-powered field assistance.
          </p>
          <Button className="w-full max-w-[260px] h-11 font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl gap-2" onClick={() => { onClose?.(); navigate('/ai-pricing'); }}>
            <Zap className="h-4 w-4" /> Upgrade Plan
          </Button>
          <Button variant="outline" className="w-full max-w-[260px] h-9 text-xs font-semibold rounded-xl gap-2" onClick={() => { onClose?.(); navigate('/settings'); }}>
            <KeyRound className="h-3.5 w-3.5" /> Or Add Your Own API Key
          </Button>
        </div>
      );
    }
    if (gateStatus === 'credits_exhausted') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 px-6 text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-rose-500/15 flex items-center justify-center">
            <ShieldAlert className="h-7 w-7 text-rose-600" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">AI Credits Exhausted</h3>
          <p className="text-sm text-slate-500 leading-relaxed max-w-[280px]">
            Your company used all <span className="font-bold text-slate-800">{gateInfo.creditsLimit}</span> credits this month. Resets <span className="font-bold text-slate-800">{formatResetDate(gateInfo.resetsAt)}</span>.
          </p>
          <div className="w-full max-w-[260px]">
            <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1"><span>Credits</span><span>{gateInfo.creditsUsed} / {gateInfo.creditsLimit}</span></div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-rose-500 rounded-full" style={{ width: '100%' }} /></div>
          </div>
          <Button className="w-full max-w-[260px] h-11 font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl gap-2" onClick={() => { onClose?.(); navigate('/ai-pricing'); }}>
            <CreditCard className="h-4 w-4" /> Buy More Credits
          </Button>
          <Button variant="outline" className="w-full max-w-[260px] h-9 text-xs font-semibold rounded-xl gap-2" onClick={() => { onClose?.(); navigate('/settings'); }}>
            <KeyRound className="h-3.5 w-3.5" /> Add Your Own API Key (Unlimited)
          </Button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-[600px] max-h-[80vh] w-full max-w-md bg-white shadow-xl rounded-t-xl sm:rounded-xl border flex-shrink-0 relative overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Mila Copilot</h3>
            <p className="text-xs text-indigo-100">{viewMode === 'chat' ? 'Tech Assistant' : 'Voice Settings'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {gateStatus === 'ready' && (
            <Button 
              variant="ghost" 
              size="icon" 
              className={`text-white hover:bg-indigo-700 h-8 w-8 rounded-full ${viewMode === 'settings' ? 'bg-indigo-800' : ''}`} 
              onClick={() => setViewMode(viewMode === 'chat' ? 'settings' : 'chat')}
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" className="text-white hover:bg-indigo-700 h-8 w-8 rounded-full" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* ─── Gated States ─── */}
      {gateStatus !== 'ready' && renderGatedPanel()}

      {/* ─── Ready State ─── */}
      {gateStatus === 'ready' && viewMode === 'chat' ? (
        <>
          {/* Chat Area */}
          <ScrollArea className="flex-1 p-4 bg-slate-50">
            <div className="space-y-4 pb-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white border text-slate-800 rounded-bl-sm'}`}>
                    {msg.role === 'assistant' && (
                      <button className="float-right ml-2 text-slate-400 hover:text-indigo-600 transition-colors" title="Read Aloud">
                        <Volume2 className="h-4 w-4" />
                      </button>
                    )}
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-white border rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm shadow-sm text-slate-500 flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-3 bg-white border-t shrink-0">
            <div className="flex gap-2 items-end relative">
              <Button variant="ghost" size="icon" className="shrink-0 h-10 w-10 text-slate-500 hover:text-indigo-600" title="Upload Photo">
                <ImageIcon className="h-5 w-5" />
              </Button>
              
              <div className="flex-1 relative">
                <Textarea 
                  placeholder="Message Mila..." 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isProcessing}
                  className="min-h-[40px] max-h-[120px] resize-none py-3 pr-10 rounded-2xl"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
              </div>

              {input.trim() ? (
                <Button 
                  size="icon" 
                  className="shrink-0 h-10 w-10 rounded-full bg-indigo-600 hover:bg-indigo-700" 
                  onClick={handleSend}
                  disabled={isProcessing}
                >
                  <Send className="h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  size="icon" 
                  className="shrink-0 h-10 w-10 rounded-full bg-indigo-600 hover:bg-indigo-700" 
                  disabled={isProcessing}
                >
                  <Mic className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Settings Area */
        <ScrollArea className="flex-1 p-6 bg-slate-50">
          <div className="space-y-8 pb-8">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Voice Profile</h3>
              <p className="text-sm text-slate-500 mb-6">Choose how Mila sounds when reading instructions or dictating reports to you.</p>
              
              <RadioGroup value={voiceId} onValueChange={saveVoicePreference} className="space-y-3">
                {PREDEFINED_VOICES.map(voice => (
                  <div key={voice.id} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${voiceId === voice.id && !isCustomClone ? 'border-indigo-600 bg-indigo-50/50' : 'bg-white hover:border-slate-300'}`}>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value={voice.id} id={voice.id} />
                      <Label htmlFor={voice.id} className="cursor-pointer">
                        <p className="font-medium text-slate-900">{voice.name}</p>
                        <p className="text-xs text-slate-500">{voice.type}</p>
                      </Label>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 rounded-full">
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="border-t pt-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Clone Your Voice</h3>
              <p className="text-sm text-slate-500 mb-6">Want Mila to sound like you? Read the script below to create a custom digital voice clone.</p>
              
              <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                  <p className="text-sm font-medium italic text-amber-900">
                    "I am a field technician. I'm recording this audio to create a digital clone of my voice so I can interact with my AI assistant seamlessly."
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center pt-2">
                  {cloningStatus === 'idle' && (
                    <Button onClick={startCloneRecording} className="w-full bg-indigo-600 hover:bg-indigo-700">
                      <Mic className="h-4 w-4 mr-2" /> Start Recording
                    </Button>
                  )}
                  {cloningStatus === 'recording' && (
                    <div className="w-full space-y-3">
                      <div className="flex justify-center">
                        <span className="relative flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                        </span>
                      </div>
                      <Button onClick={stopCloneRecording} variant="destructive" className="w-full">
                        <StopCircle className="h-4 w-4 mr-2" /> Stop & Save Clone
                      </Button>
                    </div>
                  )}
                  {cloningStatus === 'uploading' && (
                    <Button disabled className="w-full">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing Voice Clone...
                    </Button>
                  )}
                  {cloningStatus === 'success' && (
                    <div className="w-full flex flex-col items-center gap-3">
                      <div className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
                        <Volume2 className="h-4 w-4" /> Active Custom Voice
                      </div>
                      <Button onClick={() => setCloningStatus('idle')} variant="outline" className="w-full text-xs">
                        Record New Clone
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
