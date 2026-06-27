import React, { useState, useEffect, useRef } from "react";
import { Campaign } from "../campaigns";
import { ClientProfile, CallMessage, CallEvaluation } from "../types";
import { 
  playDtmfTone, 
  startRingbackTone, 
  stopRingbackTone, 
  playDisconnectTone 
} from "../utils/audio";
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  User, 
  FileText, 
  Clock, 
  Send, 
  Smile, 
  Briefcase, 
  Compass, 
  CheckSquare, 
  Circle,
  Activity
} from "lucide-react";

interface SimulationScreenProps {
  campaign: Campaign;
  callType: "incoming" | "outgoing";
  onCallEnded: (transcript: CallMessage[], duration: number, clientProfile: ClientProfile) => void;
  onBack: () => void;
}

export default function SimulationScreen({ campaign, callType, onCallEnded, onBack }: SimulationScreenProps) {
  const [callState, setCallState] = useState<"idle" | "ringing" | "connected" | "ended">("idle");
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [messages, setMessages] = useState<CallMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [loadingReply, setLoadingReply] = useState(false);
  const [silenceCounter, setSilenceCounter] = useState(0);
  const [loadingScenario, setLoadingScenario] = useState(true);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [leftPanelTab, setLeftPanelTab] = useState<"profil" | "scenario">("profil");

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Keep references to state values to avoid React stale closure bugs with Speech Recognition
  const stateRef = useRef({ callState, isListening, loadingReply, isMuted });
  useEffect(() => {
    stateRef.current = { callState, isListening, loadingReply, isMuted };
  }, [callState, isListening, loadingReply, isMuted]);

  // Generate dynamic client profile and complete scenario on load
  useEffect(() => {
    const generateClientScenario = async () => {
      setLoadingScenario(true);
      try {
        const response = await fetch("/api/gemini/generate-scenario", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaignId: campaign.id,
            campaignName: campaign.name,
            campaignDescription: campaign.description,
            callType: callType,
            possibleClients: campaign.possibleClients,
            tips: campaign.tips,
            proExpressions: campaign.proExpressions,
            wordsToAvoid: campaign.wordsToAvoid
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!data || !data.clientProfile) {
          throw new Error("Invalid response format");
        }
        
        if (data && data.clientProfile) {
          // Fallback phone number
          if (!data.clientProfile.phone) {
            data.clientProfile.phone = `0${Math.floor(Math.random() * 2) + 6} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10}`;
          }
          
          setClientProfile({
            ...data.clientProfile,
            infosConnues: data.infosConnues || [],
            infosIgnorees: data.infosIgnorees || [],
            raisonAppel: data.raisonAppel || "",
            objectionsPossibles: data.objectionsPossibles || [],
            reponsesAttendues: data.reponsesAttendues || [],
            criteresReussite: data.criteresReussite || []
          });
        }
      } catch (err) {
        console.error("Failed to generate client scenario:", err);
        // Robust fallback
        const clients = campaign.possibleClients;
        const selected = clients[Math.floor(Math.random() * clients.length)];
        const mockPhone = `0${Math.floor(Math.random() * 2) + 6} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10}`;
        setClientProfile({
          ...selected,
          phone: mockPhone,
          infosConnues: ["Contrat n°83921", "Prix de 34,99€ / mois"],
          infosIgnorees: ["Offre promo à 19,99€"],
          raisonAppel: "Problème d'accès internet",
          objectionsPossibles: ["Je n'ai pas le temps", "C'est trop cher"],
          reponsesAttendues: ["Présentation de l'entreprise", "Vérification d'identité"],
          criteresReussite: ["Calmer le client", "Proposer une offre adaptée"]
        });
      } finally {
        setLoadingScenario(false);
      }
    };

    generateClientScenario();

    // Cleanup audio on unmount
    return () => {
      stopRingbackTone();
      window.speechSynthesis.cancel();
      if (timerRef.current) clearInterval(timerRef.current);
      if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
    };
  }, [campaign, callType]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingReply]);

  // Helper to start recording with safety guards
  const startListeningAutomatically = () => {
    if (
      recognitionRef.current && 
      !stateRef.current.isListening && 
      stateRef.current.callState === "connected" && 
      !stateRef.current.loadingReply &&
      !stateRef.current.isMuted
    ) {
      try {
        setIsListening(true);
        recognitionRef.current.start();
      } catch (e) {
        // Safe to ignore if already started
      }
    }
  };

  // Helper to stop listening
  const stopListeningAutomatically = () => {
    if (recognitionRef.current && stateRef.current.isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
    }
  };

  // Handle Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = "fr-FR";
      rec.continuous = false;
      rec.interimResults = false;

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript.trim()) {
          setInputText(transcript);
          // Automatically trigger send message for hands-free fluid conversation!
          sendMessageRef.current(transcript);
        }
        setIsListening(false);
      };

      rec.onerror = (err: any) => {
        console.warn("Speech Recognition error:", err);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
        // If call is still active and client is not speaking/responding, restart listening automatically
        setTimeout(() => {
          if (
            recognitionRef.current && 
            stateRef.current.callState === "connected" && 
            !stateRef.current.isListening && 
            !stateRef.current.loadingReply &&
            !stateRef.current.isMuted
          ) {
            startListeningAutomatically();
          }
        }, 600);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Handle Telephone Stopwatch timer
  useEffect(() => {
    if (callState === "connected") {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
        setSilenceCounter(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // Handle AI Customer silence nudge
  useEffect(() => {
    // If agent is silent for 12 seconds, client says "Allô ?"
    if (callState === "connected" && silenceCounter >= 12 && !loadingReply) {
      setSilenceCounter(0);
      handleSilenceTrigger();
    }
  }, [silenceCounter, callState, loadingReply]);

  const handleSilenceTrigger = async () => {
    if (!clientProfile) return;
    
    const nudges = [
      "Allô ?",
      "Vous êtes toujours là ?",
      "Allô, je vous écoute ?",
      "Est-ce que vous m'entendez ?"
    ];
    const randomNudge = nudges[Math.floor(Math.random() * nudges.length)];
    
    // Add client nudge message
    const clientNudgeMsg: CallMessage = {
      id: `client-nudge-${Date.now()}`,
      role: "client",
      text: randomNudge,
      timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    };
    
    setMessages(prev => [...prev, clientNudgeMsg]);
    speakClientText(randomNudge);
  };

  // Speak client text aloud
  const speakClientText = (text: string) => {
    // Stop listening before synthesizing to prevent the microphone from catching the computer speakers
    stopListeningAutomatically();

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "fr-FR";

      const voices = window.speechSynthesis.getVoices();
      const frVoices = voices.filter(v => v.lang.toLowerCase().startsWith("fr"));
      let voiceToUse = null;

      if (clientProfile && clientProfile.gender) {
        if (clientProfile.gender === "homme") {
          // Try to find a male voice
          voiceToUse = frVoices.find(v => {
            const name = v.name.toLowerCase();
            return name.includes("daniel") || name.includes("paul") || name.includes("gilles") || name.includes("claude") || name.includes("male") || name.includes("homme");
          });
        } else if (clientProfile.gender === "femme") {
          // Try to find a female voice
          voiceToUse = frVoices.find(v => {
            const name = v.name.toLowerCase();
            return name.includes("amelie") || name.includes("chantal") || name.includes("marie") || name.includes("julie") || name.includes("hortense") || name.includes("female") || name.includes("femme") || name.includes("google");
          });
        }
      }

      // Fallback to any French voice if specific voice not found
      if (!voiceToUse && frVoices.length > 0) {
        voiceToUse = frVoices[0];
      }

      if (voiceToUse) {
        utterance.voice = voiceToUse;
      }

      utterance.onend = () => {
        // Once customer finishes speaking, automatically wake up the microphone
        startListeningAutomatically();
      };

      utterance.onerror = () => {
        startListeningAutomatically();
      };

      if (!isMuted) {
        window.speechSynthesis.speak(utterance);
      } else {
        // If muted, wait a brief second and wake up microphone
        setTimeout(() => {
          startListeningAutomatically();
        }, 1000);
      }
    } else {
      // If speechSynthesis not supported, trigger auto-recording anyway
      setTimeout(() => {
        startListeningAutomatically();
      }, 1200);
    }
  };

  // Start Call Procedure
  const handleStartCall = () => {
    if (callState !== "idle") return;
    
    setCallState("ringing");
    setMessages([]);
    setDuration(0);
    setSilenceCounter(0);
    setCurrentStepIdx(0);
    
    // Start play ringback sound
    startRingbackTone();

    // After 4.5 seconds (about 1.5 ringbacks), client picks up
    setTimeout(() => {
      stopRingbackTone();
      setCallState("connected");

      // Initial customer pick up greeting
      const initGreeting = callType === "incoming" ? "Allô ? Oui, bonjour ?" : "Allô ? J'écoute.";
      
      const firstMsg: CallMessage = {
        id: "client-init",
        role: "client",
        text: initGreeting,
        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
      };
      
      setMessages([firstMsg]);
      speakClientText(initGreeting);
    }, 4500);
  };

  // End Call Procedure
  const handleEndCall = () => {
    stopRingbackTone();
    window.speechSynthesis.cancel();
    playDisconnectTone();
    setCallState("ended");
    
    setTimeout(() => {
      onCallEnded(messages, duration, clientProfile!);
    }, 1500);
  };

  // Speech Recognition Mic Toggle
  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      alert("La reconnaissance vocale n'est pas supportée dans votre navigateur.");
      return;
    }

    if (isListening) {
      stopListeningAutomatically();
    } else {
      window.speechSynthesis.cancel(); // Stop customer from talking
      startListeningAutomatically();
    }
  };

  // Direct Send Message logic to avoid stale closures in listeners
  const handleSendMessageDirect = async (text: string) => {
    if (!text.trim() || stateRef.current.callState !== "connected" || stateRef.current.loadingReply) return;

    const agentText = text.trim();
    setInputText("");
    setSilenceCounter(0); // Reset silence timer

    // 1. Add agent message to transcript
    const agentMsg: CallMessage = {
      id: `agent-${Date.now()}`,
      role: "agent",
      text: agentText,
      timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    };

    const updatedMessages = [...messages, agentMsg];
    setMessages(updatedMessages);

    // Dynamic Script checklist matching
    if (currentStepIdx < campaign.script.length) {
      setCurrentStepIdx(prev => prev + 1);
    }

    // Stop listening while generating reply
    stopListeningAutomatically();
    setLoadingReply(true);

    try {
      const response = await fetch("/api/gemini/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName: campaign.name,
          callType: callType,
          campaignDescription: campaign.description,
          clientProfile: clientProfile,
          history: updatedMessages.map(m => ({ role: m.role, text: m.text })),
          agentInput: agentText
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data || !data.reply) {
        throw new Error("Missing client reply in response");
      }

      if (data.reply) {
        const clientMsg: CallMessage = {
          id: `client-${Date.now()}`,
          role: "client",
          text: data.reply,
          timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        };
        setMessages(prev => [...prev, clientMsg]);
        speakClientText(data.reply);

        // Reacting dynamically to custom client actions
        if (data.action === "hang_up") {
          setActionStatus("hang_up");
          setTimeout(() => {
            handleEndCall();
          }, 5000); // Give plenty of time to finish TTS playback of client's anger/goodbye
        } else if (data.action === "ask_manager") {
          setActionStatus("ask_manager");
        } else if (data.action === "ask_callback") {
          setActionStatus("ask_callback");
        } else {
          setActionStatus(null);
        }
      }
    } catch (err) {
      console.warn("Failed to get client reply:", err);
      // Ensure microphone comes back online if API errors out
      startListeningAutomatically();
    } finally {
      setLoadingReply(false);
      setSilenceCounter(0);
    }
  };

  // Keep references updated with latest values for async events
  const sendMessageRef = useRef<(text: string) => void>(handleSendMessageDirect);
  useEffect(() => {
    sendMessageRef.current = handleSendMessageDirect;
  }, [messages, clientProfile, campaign, callType, currentStepIdx, loadingReply]);

  // Send Advisor Speech to API (form submit)
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await handleSendMessageDirect(inputText);
  };

  const handleKeypadPress = (key: string) => {
    playDtmfTone(key);
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 font-sans flex flex-col justify-between max-w-7xl mx-auto w-full relative text-slate-900 dark:text-white transition-colors">
      {/* High-contrast colorful glows for Blue, Green, Red theme */}
      <div className="absolute top-10 left-10 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/3 w-60 h-60 bg-red-500/5 rounded-full blur-[90px] pointer-events-none"></div>

      {/* Screen Header in Blue */}
      <div className="flex items-center justify-between border-b border-blue-200 dark:border-blue-900/40 pb-4 mb-4">
        <div>
          <span className="text-[10px] font-bold uppercase text-blue-800 dark:text-blue-300 tracking-wider bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/30 px-3 py-1 rounded-full shadow-2xs">
            Centre de Simulation Actif
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-2">
            <span className="w-2.5 h-2.5 bg-blue-600 dark:bg-blue-500 rounded-full animate-pulse"></span>
            Session : {campaign.name}
          </h2>
        </div>
        <button
          onClick={onBack}
          className="text-xs bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-300 hover:text-blue-800 px-4 py-2 rounded-xl transition-all cursor-pointer font-bold shadow-xs active:scale-95"
          id="quit-sim-btn"
        >
          ← Retour à la préparation
        </button>
      </div>

      {/* Grid Layout of Call Center Software */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch mb-4 min-h-[500px]">
        
        {/* LEFT COLUMN: AUTOMATED CLIENT SHEET */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2 border-b border-blue-100 dark:border-slate-800 pb-3 mb-4">
              <User className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-display text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Fiche Client & Scénario
              </h3>
            </div>

            {loadingScenario ? (
              <div className="text-center py-16 flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-blue-500/10 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="space-y-1 px-4">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Génération du scénario...</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Gemini crée un profil, un historique d'appels, des connaissances et objections sur-mesure pour cette session.
                  </p>
                </div>
              </div>
            ) : clientProfile ? (
              <div className="space-y-4 text-sm">
                
                {/* Tabs selection buttons */}
                <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setLeftPanelTab("profil")}
                    className={`text-[10px] font-bold py-1.5 rounded-lg transition-all cursor-pointer ${
                      leftPanelTab === "profil"
                        ? "bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    Profil Client
                  </button>
                  <button
                    onClick={() => setLeftPanelTab("scenario")}
                    className={`text-[10px] font-bold py-1.5 rounded-lg transition-all cursor-pointer ${
                      leftPanelTab === "scenario"
                        ? "bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    Détail Scénario
                  </button>
                </div>

                {leftPanelTab === "profil" ? (
                  // Tab 1: Profile information
                  <div className="space-y-3.5 animate-fade-in">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest block">Prénom / Nom</span>
                      <span className="text-slate-950 dark:text-white font-bold text-sm">
                        {clientProfile.firstName} {clientProfile.lastName}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest block">Téléphone</span>
                        <span className="text-slate-900 dark:text-slate-200 font-mono text-xs font-semibold">{clientProfile.phone}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest block">Âge / Ville</span>
                        <span className="text-slate-800 dark:text-slate-200 font-medium">
                          {clientProfile.age} ans, {clientProfile.city}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest block">Profession</span>
                        <span className="text-slate-800 dark:text-slate-200 font-medium truncate block" title={clientProfile.profession}>
                          {clientProfile.profession}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest block">Produit Détenu</span>
                        <span className="text-blue-700 dark:text-blue-300 font-bold bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-9 block truncate text-xs mt-0.5">
                          {clientProfile.product}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest block">Humeur Actuelle</span>
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide mt-0.5">
                        <Smile className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        {clientProfile.mood}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest block">Objectif Client</span>
                      <p className="text-xs text-slate-900 dark:text-slate-200 font-medium leading-relaxed bg-blue-50/40 dark:bg-blue-950/20 p-2.5 border border-blue-100/50 dark:border-blue-900/40 rounded-lg">
                        {clientProfile.objective}
                      </p>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest block">Historique Client</span>
                      <p className="text-xs text-slate-800 dark:text-slate-300 leading-relaxed font-medium bg-slate-50 dark:bg-slate-800/50 p-2 border border-slate-100 dark:border-slate-800 rounded-lg">
                        {clientProfile.history}
                      </p>
                    </div>
                  </div>
                ) : (
                  // Tab 2: Detailed call scenario parameters
                  <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1 animate-fade-in">
                    {clientProfile.raisonAppel && (
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest block">Raison de l'appel</span>
                        <p className="text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 leading-normal">
                          {clientProfile.raisonAppel}
                        </p>
                      </div>
                    )}

                    {clientProfile.infosConnues && clientProfile.infosConnues.length > 0 && (
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest block">Informations Connues</span>
                        <ul className="list-disc pl-4 text-xs text-slate-700 dark:text-slate-300 space-y-1.5 mt-1">
                          {clientProfile.infosConnues.map((item, idx) => (
                            <li key={idx} className="leading-tight">{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {clientProfile.infosIgnorees && clientProfile.infosIgnorees.length > 0 && (
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest block">Informations Ignorées</span>
                        <ul className="list-disc pl-4 text-xs text-slate-700 dark:text-slate-300 space-y-1.5 mt-1">
                          {clientProfile.infosIgnorees.map((item, idx) => (
                            <li key={idx} className="leading-tight">{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {clientProfile.objectionsPossibles && clientProfile.objectionsPossibles.length > 0 && (
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest block">Objections Prévues</span>
                        <ul className="list-disc pl-4 text-xs text-rose-700 dark:text-rose-400 space-y-1.5 mt-1">
                          {clientProfile.objectionsPossibles.map((item, idx) => (
                            <li key={idx} className="leading-tight font-semibold">{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {clientProfile.criteresReussite && clientProfile.criteresReussite.length > 0 && (
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest block">Critères de Réussite</span>
                        <ul className="list-disc pl-4 text-xs text-teal-700 dark:text-teal-400 space-y-1.5 mt-1">
                          {clientProfile.criteresReussite.map((item, idx) => (
                            <li key={idx} className="leading-tight font-semibold">{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-6 h-6 border-2 border-blue-500/20 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-slate-500 mt-2 font-mono font-bold">Chargement de la fiche...</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 font-mono flex items-center gap-1.5 justify-center font-bold">
            <Activity className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span>ID CLIENT: CRM-{Math.floor(Math.random() * 90000) + 10000}</span>
          </div>
        </div>

        {/* CENTER COLUMN: VIRTUAL SOFTPHONE & CONVERSATION AREA */}
        <div className="lg:col-span-2 flex flex-col justify-between bg-white border border-blue-100 rounded-2xl overflow-hidden shadow-xs">
          
          {/* Softphone status banner */}
          <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                callState === "connected" ? "bg-emerald-500 animate-pulse" : callState === "ringing" ? "bg-amber-500 animate-ping" : "bg-slate-300"
              }`}></div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">État du softphone</span>
                <span className="text-xs font-extrabold text-slate-800">
                  {callState === "idle" && "Téléphone disponible (Raccroché)"}
                  {callState === "ringing" && "Numérotation en cours (Sonnerie...)"}
                  {callState === "connected" && "Appel en ligne"}
                  {callState === "ended" && "Appel suspendu"}
                </span>
              </div>
            </div>

            {callState === "connected" && (
              <div className="bg-emerald-50 text-emerald-800 font-mono text-xs px-3 py-1 rounded-lg border border-emerald-200 flex items-center gap-1 font-extrabold shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                {formatTimer(duration)}
              </div>
            )}
          </div>

          {/* Transcript / Dialogue History scroll space */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50 max-h-[400px]">
            {callState === "idle" ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-4 shadow-2xs">
                  <Phone className="w-6 h-6" />
                </div>
                <h4 className="font-display font-extrabold text-slate-900 mb-1.5 text-base">Prêt à passer l'appel</h4>
                <p className="text-xs text-slate-700 max-w-xs leading-relaxed font-medium">
                  Cliquez sur le bouton vert <strong className="text-emerald-700">"Appeler le client"</strong> ci-dessous pour lancer la tonalité de numérotation et démarrer l'exercice.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {actionStatus && (
                  <div className="flex justify-center my-4 animate-fade-in">
                    {actionStatus === "hang_up" && (
                      <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 rounded-xl px-4 py-2.5 text-xs font-bold flex items-center gap-2 shadow-xs">
                        <PhoneOff className="w-4 h-4 text-rose-600 animate-bounce" />
                        <span>Le client est mécontent et s'apprête à raccrocher...</span>
                      </div>
                    )}
                    {actionStatus === "ask_manager" && (
                      <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 rounded-xl px-4 py-2.5 text-xs font-bold flex items-center gap-2 shadow-xs">
                        <Activity className="w-4 h-4 text-amber-600 animate-pulse" />
                        <span>Le client demande à parler à un superviseur !</span>
                      </div>
                    )}
                    {actionStatus === "ask_callback" && (
                      <div className="bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-200 dark:border-indigo-900/60 text-indigo-800 dark:text-indigo-300 rounded-xl px-4 py-2.5 text-xs font-bold flex items-center gap-2 shadow-xs">
                        <Clock className="w-4 h-4 text-indigo-600 animate-pulse" />
                        <span>Le client demande à être rappelé plus tard.</span>
                      </div>
                    )}
                  </div>
                )}

                {messages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={`flex flex-col ${msg.role === "agent" ? "items-end" : "items-start"}`}
                  >
                    <span className="text-[9px] text-slate-500 font-extrabold mb-0.5 px-1 uppercase tracking-wider font-mono">
                      {msg.role === "agent" ? "Vous (Conseiller)" : "Client"}
                    </span>
                    <div className={`p-3.5 rounded-xl max-w-[85%] text-xs shadow-xs leading-relaxed font-semibold border ${
                      msg.role === "agent"
                        ? "bg-blue-100 text-blue-950 border-blue-300 rounded-tr-none"
                        : "bg-white text-slate-900 border-emerald-200 rounded-tl-none shadow-sm"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}

                {loadingReply && (
                  <div className="flex flex-col items-start">
                    <span className="text-[9px] text-slate-500 font-extrabold mb-0.5 uppercase tracking-wider font-mono">
                      Le client répond...
                    </span>
                    <div className="bg-white text-slate-500 border border-slate-200 p-3 rounded-xl rounded-tl-none shadow-xs flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-150"></span>
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-300"></span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef}></div>
              </div>
            )}
          </div>

          {/* Interactive Dial Pad & controls */}
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            {callState === "idle" ? (
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 py-4">
                {/* Visual Dial Keypad */}
                <div className="grid grid-cols-3 gap-1.5 bg-white border border-blue-200 p-3 rounded-xl w-44 shadow-sm">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((key) => (
                    <button
                      key={key}
                      onClick={() => handleKeypadPress(key)}
                      className="w-10 h-10 bg-slate-100 hover:bg-blue-50 border border-slate-300 text-sm font-extrabold text-slate-800 rounded-lg flex items-center justify-center active:scale-[0.9] transition-all cursor-pointer shadow-2xs"
                    >
                      {key}
                    </button>
                  ))}
                </div>

                {/* Big emerald green call triggers */}
                <div className="text-center md:text-left">
                  <span className="text-[10px] font-extrabold text-slate-500 tracking-widest block uppercase mb-1.5">Passer la communication</span>
                  <button
                    onClick={handleStartCall}
                    className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold py-3.5 px-8 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
                    id="call-btn"
                  >
                    <Phone className="w-4 h-4 text-emerald-100" />
                    Démarrer l'Appel (Micro Auto)
                  </button>
                </div>
              </div>
            ) : (
              /* Active call keyboard controls */
              <div className="space-y-3">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  {/* Microphone dictation button - red when active/listening */}
                  <button
                    type="button"
                    onClick={toggleSpeechRecognition}
                    className={`p-3 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                      isListening
                        ? "bg-red-600 border-red-500 text-white animate-pulse scale-105"
                        : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-blue-50 hover:text-blue-800"
                    }`}
                    title={isListening ? "Le micro est ACTIF (parlez librement) - Cliquez pour couper" : "Parler au micro"}
                    id="speech-mic-btn"
                  >
                    {isListening ? (
                      <Mic className="w-5 h-5" />
                    ) : (
                      <MicOff className="w-5 h-5" />
                    )}
                  </button>

                  {/* Text inputs */}
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={callState !== "connected" || loadingReply}
                    className="flex-1 bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 text-slate-900 font-semibold text-xs rounded-xl py-3 px-4 transition-colors disabled:opacity-50 shadow-inner"
                    placeholder={
                      isListening 
                        ? "🎤 Le micro est actif... Parlez, la réplique sera envoyée automatiquement !" 
                        : "Tapez votre réplique professionnelle ici..."
                    }
                    id="advisor-text-input"
                  />

                  {/* Send button in Blue */}
                  <button
                    type="submit"
                    disabled={!inputText.trim() || callState !== "connected" || loadingReply}
                    className="p-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl transition-colors active:scale-[0.95] flex items-center justify-center cursor-pointer shadow-xs"
                    id="send-msg-btn"
                  >
                    <Send className="w-4.5 h-4.5" />
                  </button>
                </form>

                {/* Call utilities controls */}
                <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className={`p-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isMuted 
                          ? "bg-red-50 border-red-200 text-red-700" 
                          : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                      id="mute-btn"
                    >
                      {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-600" /> : <Volume2 className="w-3.5 h-3.5 text-slate-600" />}
                      <span>{isMuted ? "Sourdine Activée" : "Sourdine"}</span>
                    </button>
                    {isListening && (
                      <span className="text-[10px] bg-red-100 text-red-800 border border-red-200 px-2 py-1 rounded-md font-bold animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping"></span>
                        MICRO EN DIRECT
                      </span>
                    )}
                  </div>

                  {/* Hangup in intense Red */}
                  <button
                    onClick={handleEndCall}
                    className="bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-extrabold py-2.5 px-5 rounded-xl flex items-center gap-1.5 text-xs transition-colors cursor-pointer shadow-sm"
                    id="hangup-btn"
                  >
                    <PhoneOff className="w-4 h-4" />
                    Raccrocher (Terminer l'appel)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: SCRIPT CHECKLIST TRACKER */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2 border-b border-blue-100 dark:border-slate-800 pb-3 mb-4">
              <CheckSquare className="w-4.5 h-4.5 text-blue-600 dark:text-teal-400" />
              <h3 className="font-display text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Script d'Appel & Phrases
              </h3>
            </div>

            <div className="space-y-3.5">
              {campaign.script.map((step, idx) => {
                const isCompleted = idx < currentStepIdx;
                const isCurrent = idx === currentStepIdx && callState === "connected";

                return (
                  <div 
                    key={idx}
                    className={`p-3 rounded-xl border transition-all ${
                      isCurrent 
                        ? "bg-blue-50/90 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800/80 text-slate-950 dark:text-white shadow-xs font-bold" 
                        : isCompleted
                        ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-950 dark:text-emerald-400/90"
                        : "bg-slate-50/40 dark:bg-slate-950/10 border-slate-100 dark:border-slate-900 text-slate-500"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {isCompleted ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-extrabold shrink-0 shadow-2xs mt-0.5">
                          ✓
                        </div>
                      ) : isCurrent ? (
                        <div className="w-5 h-5 rounded-full border-2 border-blue-600 dark:border-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="w-2.5 h-2.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-ping"></span>
                        </div>
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 dark:text-slate-700 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider block font-mono ${
                          isCurrent ? "text-blue-700 dark:text-blue-400" : isCompleted ? "text-emerald-700 dark:text-emerald-400 font-bold" : "text-slate-400 dark:text-slate-600"
                        }`}>
                          Étape {idx + 1} : {step.phase}
                        </span>
                        <p className={`text-[11px] mt-0.5 leading-normal font-semibold italic ${
                          isCurrent ? "text-slate-500 dark:text-slate-400" : isCompleted ? "text-emerald-800 dark:text-emerald-500" : "text-slate-400 dark:text-slate-600"
                        }`}>
                          {step.details}
                        </p>
                        
                        {/* THE SCRIPT SENTENCE TO READ DIRECTLY */}
                        <div className={`mt-2 p-2 rounded-lg text-xs font-extrabold border leading-relaxed ${
                          isCurrent 
                            ? "bg-white dark:bg-slate-950 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-teal-300 shadow-3xs" 
                            : isCompleted
                            ? "bg-white/60 dark:bg-slate-950/20 border-emerald-100 dark:border-emerald-900/20 text-emerald-900/70 dark:text-emerald-300/70"
                            : "bg-white/30 dark:bg-slate-950/5 border-slate-200/50 dark:border-slate-800/50 text-slate-500 dark:text-slate-500"
                        }`}>
                          "{step.sentence}"
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 bg-blue-50/70 dark:bg-blue-950/40 p-4 border border-blue-200 dark:border-blue-900/30 rounded-xl">
            <h4 className="text-[10px] font-extrabold text-blue-800 dark:text-blue-300 uppercase tracking-widest block mb-1 font-mono">Aide-Mémoire</h4>
            <p className="text-xs text-blue-950 dark:text-blue-200 leading-relaxed font-bold italic">
              "Félicitez votre client à chaque manipulation réussie et parlez calmement."
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
