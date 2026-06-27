import React, { useState, useEffect } from "react";
import { Campaign } from "../campaigns";
import { 
  Volume2, 
  Mic, 
  MicOff, 
  Check, 
  BookOpen, 
  Lightbulb, 
  AlertTriangle, 
  ThumbsUp, 
  Play, 
  ChevronRight,
  Sparkles,
  Info
} from "lucide-react";

interface LearningScreenProps {
  campaign: Campaign;
  callType: "incoming" | "outgoing";
  isActivated?: boolean;
  onReady: () => void;
  onBack: () => void;
}

export default function LearningScreen({ campaign, callType, isActivated = false, onReady, onBack }: LearningScreenProps) {
  const [activeTab, setActiveTab] = useState<"script" | "tips" | "pro" | "avoid" | "errors" | "best">("script");
  const [isPlayingText, setIsPlayingText] = useState<number | null>(null);
  const [isRecordingStep, setIsRecordingStep] = useState<number | null>(null);
  const [recordingText, setRecordingText] = useState<{ [key: number]: string }>({});
  const [recognition, setRecognition] = useState<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = "fr-FR";
      rec.continuous = false;
      rec.interimResults = false;
      
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (isRecordingStep !== null) {
          setRecordingText(prev => ({ ...prev, [isRecordingStep]: transcript }));
        }
      };

      rec.onerror = (err: any) => {
        console.error("Speech recognition error:", err);
        setIsRecordingStep(null);
      };

      rec.onend = () => {
        setIsRecordingStep(null);
      };

      setRecognition(rec);
    }
  }, [isRecordingStep]);

  // Read out loud with Speech Synthesis in French
  const handleSpeak = (text: string, idx: number) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel(); // Stop anything playing
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "fr-FR";
      
      // Try to find a French voice
      const voices = window.speechSynthesis.getVoices();
      const frVoice = voices.find(v => v.lang.startsWith("fr"));
      if (frVoice) {
        utterance.voice = frVoice;
      }

      utterance.onstart = () => setIsPlayingText(idx);
      utterance.onend = () => setIsPlayingText(null);
      utterance.onerror = () => setIsPlayingText(null);

      window.speechSynthesis.speak(utterance);
    } else {
      alert("La synthèse vocale n'est pas supportée par votre navigateur.");
    }
  };

  // Toggle Speech Recognition
  const handleRecordToggle = (idx: number) => {
    if (!recognition) {
      alert("La reconnaissance vocale n'est pas supportée ou autorisée par votre navigateur.");
      return;
    }

    if (isRecordingStep === idx) {
      recognition.stop();
      setIsRecordingStep(null);
    } else {
      try {
        window.speechSynthesis.cancel(); // Stop playing speech
        setIsPlayingText(null);
        setIsRecordingStep(idx);
        setRecordingText(prev => ({ ...prev, [idx]: "Écoute en cours..." }));
        recognition.start();
      } catch (e) {
        console.error("Failed to start recognition:", e);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 max-w-4xl mx-auto w-full flex flex-col justify-center font-sans relative text-slate-900">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <div className="mb-8">
        <button 
          onClick={onBack}
          className="text-xs bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 hover:text-blue-800 px-4 py-2 rounded-xl transition-all cursor-pointer font-bold shadow-xs active:scale-95 mb-4 inline-flex items-center gap-1.5"
          id="learning-back-btn"
        >
          ← Retour aux campagnes
        </button>
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-800 px-2.5 py-1 rounded-full border border-blue-200">
            {callType === "incoming" ? "Appel Entrant" : "Appel Sortant"}
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-xs text-slate-500 font-semibold">Difficulté : {campaign.difficulty}/5</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-slate-900 mb-2">
          Apprentissage du Script : {campaign.name}
        </h1>
        <p className="text-slate-600 text-xs leading-relaxed max-w-2xl font-medium">
          Prenez le temps d'étudier le script et les conseils professionnels ci-dessous. Écoutez la diction recommandée et entraînez-vous à haute voix avant de lancer l'appel.
        </p>
      </div>

      {/* Menu / Tabs row */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-3 mb-6" id="learning-tabs">
        {[
          { id: "script", label: "Script de l'appel", icon: BookOpen },
          { id: "tips", label: "Conseils de posture", icon: Lightbulb },
          { id: "pro", label: "Expressions clés", icon: Sparkles },
          { id: "avoid", label: "Mots à éviter", icon: AlertTriangle },
          { id: "errors", label: "Erreurs fréquentes", icon: AlertTriangle },
          { id: "best", label: "Bonnes pratiques", icon: ThumbsUp }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                isSelected 
                  ? "bg-blue-600 text-white shadow-xs" 
                  : "bg-white border border-slate-200 text-slate-600 hover:text-blue-800 hover:border-blue-300"
              }`}
              id={`tab-${tab.id}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content Panels */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 min-h-[350px] flex flex-col justify-between mb-8 shadow-xs">
        {activeTab === "script" && (
          <div className="space-y-5">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-500" />
              Script d'appel recommandé pas-à-pas
            </h3>
            
            <div className="space-y-4">
              {campaign.script.map((step, idx) => (
                <div 
                  key={idx}
                  className="bg-slate-50 p-4 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-slate-300 transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded">
                        Étape {idx + 1} : {step.phase}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mb-1.5 italic">
                      {step.details}
                    </p>
                    <p className="text-xs text-slate-900 font-bold font-sans leading-relaxed border-l-2 border-blue-500 pl-3">
                      "{step.sentence}"
                    </p>

                    {/* Speech Recognition repeat block */}
                    {recordingText[idx] && (
                      <div className="mt-3 bg-white p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 font-semibold">
                        <span className="font-extrabold text-blue-600">Répété : </span>
                        "{recordingText[idx]}"
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {/* Read out loud Button */}
                    <button
                      onClick={() => handleSpeak(step.sentence, idx)}
                      className={`p-2 rounded-lg border text-[11px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isPlayingText === idx
                          ? "bg-blue-600 text-white border-transparent"
                          : "bg-white border-slate-200 text-slate-600 hover:text-blue-800 hover:bg-slate-50"
                      }`}
                      title="Écouter la synthèse vocale"
                      id={`play-audio-step-${idx}`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isPlayingText === idx ? "Lecture..." : "Écouter"}</span>
                    </button>

                    {/* Microphone Repeat Button - turns red when active/recording */}
                    <button
                      onClick={() => handleRecordToggle(idx)}
                      className={`p-2 rounded-lg border text-[11px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isRecordingStep === idx
                          ? "bg-red-600 text-white border-transparent animate-pulse"
                          : "bg-white border-slate-200 text-slate-600 hover:text-blue-800 hover:bg-slate-50"
                      }`}
                      title="Répéter au micro"
                      id={`record-step-${idx}`}
                    >
                      {isRecordingStep === idx ? (
                        <MicOff className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <Mic className="w-3.5 h-3.5 text-slate-600" />
                      )}
                      <span>{isRecordingStep === idx ? "Stop" : "Répéter"}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "tips" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-blue-600" />
              Conseils de posture & Diction
            </h3>
            <div className="grid gap-3 pt-1">
              {campaign.tips.map((tip, idx) => (
                <div key={idx} className="bg-slate-50 p-4 border border-slate-200 rounded-xl flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 border border-blue-100">
                    {idx + 1}
                  </div>
                  <p className="text-xs text-slate-700 font-semibold leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "pro" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Expressions professionnelles recommandées
            </h3>
            <div className="grid md:grid-cols-2 gap-3 pt-1">
              {campaign.proExpressions.map((expr, idx) => (
                <div key={idx} className="bg-slate-50 p-3.5 border border-slate-200 rounded-xl flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="text-xs text-slate-800 font-bold font-sans">"{expr}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "avoid" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Mots et expressions à éviter absolument
            </h3>
            <div className="grid md:grid-cols-2 gap-3 pt-1">
              {campaign.wordsToAvoid.map((word, idx) => (
                <div key={idx} className="bg-red-50 p-3.5 border border-red-100 rounded-xl flex items-center gap-2.5">
                  <div className="w-4.5 h-4.5 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-[9px] shrink-0 border border-red-200">
                    ✕
                  </div>
                  <p className="text-xs text-red-950 font-mono font-bold">"{word}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "errors" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Erreurs fréquentes commises par les conseillers
            </h3>
            <div className="grid gap-3 pt-1">
              {campaign.commonErrors.map((error, idx) => (
                <div key={idx} className="bg-slate-50 p-4 border border-slate-200 rounded-xl flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 border border-amber-200">
                    !
                  </div>
                  <p className="text-xs text-slate-700 font-semibold leading-relaxed">{error}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "best" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <ThumbsUp className="w-4 h-4 text-blue-600" />
              Bonnes pratiques de communication
            </h3>
            <div className="grid gap-3 pt-1">
              {campaign.bestPractices.map((practice, idx) => (
                <div key={idx} className="bg-slate-50 p-4 border border-slate-200 rounded-xl flex items-start gap-3">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-700 font-semibold leading-relaxed">{practice}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action button in panel bottom */}
        <div className="mt-8 pt-5 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-[11px] text-slate-500 font-bold">
            {isActivated 
              ? "Pratiquez autant que vous le souhaitez, puis passez à la simulation."
              : "⚠️ Votre compte n'est pas encore activé. Contactez l'administrateur pour accéder à la simulation."
            }
          </div>
          <button
            onClick={isActivated ? onReady : undefined}
            disabled={!isActivated}
            className={`w-full sm:w-auto font-extrabold py-3 px-6 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all text-xs uppercase tracking-wider ${
              isActivated 
                ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-[0.98]" 
                : "bg-slate-300 text-slate-500 cursor-not-allowed"
            }`}
            id="ready-to-simulate-btn"
          >
            {isActivated ? "Je suis prêt, démarrer la simulation" : "Simulation Verrouillée"}
            <ChevronRight className={`w-3.5 h-3.5 ${isActivated ? "text-blue-100" : "text-slate-400"}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
