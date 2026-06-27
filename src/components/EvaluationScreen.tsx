import React, { useState, useEffect } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { Campaign } from "../campaigns";
import { ClientProfile, CallMessage, CallEvaluation, UserProfile } from "../types";
import { motion } from "motion/react";
import { 
  Sparkles, 
  Award, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Timer, 
  Mic, 
  Smile, 
  ArrowRight, 
  BookOpen, 
  CornerDownRight, 
  Loader2,
  ChevronRight,
  ShieldAlert,
  Zap
} from "lucide-react";

interface EvaluationScreenProps {
  userId: string;
  campaign: Campaign;
  callType: "incoming" | "outgoing";
  transcript: CallMessage[];
  duration: number;
  clientProfile: ClientProfile;
  onFinished: () => void;
}

export default function EvaluationScreen({ 
  userId,
  campaign, 
  callType, 
  transcript, 
  duration, 
  clientProfile, 
  onFinished 
}: EvaluationScreenProps) {
  const [loading, setLoading] = useState(true);
  const [evaluation, setEvaluation] = useState<CallEvaluation | null>(null);
  const [saving, setSaving] = useState(false);
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  const [levelUp, setLevelUp] = useState(false);
  const [xpGained, setXpGained] = useState(0);

  // Trigger evaluation on mount
  useEffect(() => {
    const runEvaluation = async () => {
      try {
        const response = await fetch("/api/gemini/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaignName: campaign.name,
            callType: callType,
            campaignDescription: campaign.description,
            clientProfile: clientProfile,
            history: transcript.map(m => ({ role: m.role, text: m.text })),
            duration: duration
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erreur serveur (${response.status}): ${errorText || response.statusText}`);
        }

        const evalData: CallEvaluation = await response.json();
        if (!evalData || !evalData.criteria) {
          throw new Error("Format d'évaluation invalide reçu du serveur.");
        }

        setEvaluation(evalData);
        
        // Save the result to Firestore and update stats
        await saveCallToHistory(evalData);
      } catch (err: any) {
        console.error("Evaluation error:", err);
        setEvaluationError(err.message || "Une erreur inconnue est survenue.");
        setLoading(false);
      }
    };

    runEvaluation();
  }, [campaign, callType, transcript, duration, clientProfile]);

  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  // Save the call records and compute progression logic
  const saveCallToHistory = async (evalData: CallEvaluation) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setSaving(true);
    try {
      const callId = `call_${Date.now()}`;
      const userRef = doc(db, "users", userId);
      const callRef = doc(db, "users", userId, "calls", callId);

      // 1. Fetch current profile (try Firestore first, fallback to localStorage)
      let profile: UserProfile | null = null;
      try {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          profile = userSnap.data() as UserProfile;
        }
      } catch (err) {
        console.warn("Could not fetch user profile from Firestore, using local:", err);
      }

      if (!profile) {
        const localKey = `zaiasa_profile_${userId}`;
        const localData = localStorage.getItem(localKey);
        if (localData) {
          try {
            profile = JSON.parse(localData);
          } catch (e) {}
        }
      }

      if (!profile) {
        // Fallback default profile
        profile = {
          firstName: userId.charAt(0).toUpperCase() + userId.slice(1),
          lastName: "",
          username: userId,
          level: 1,
          xp: 0,
          completedCampaignsCount: 0,
          totalCallsCount: 0,
          averageScore: 0,
          badges: ["Bienvenue 🎉"]
        };
      }

      // 2. Prepare call data
      const newCallRecord = {
        id: callId,
        campaignId: campaign.id,
        campaignName: campaign.name,
        callType: callType,
        date: new Date().toISOString(),
        duration: duration,
        result: evalData.result || "Terminé",
        score: evalData.score || 0,
        evaluation: evalData,
        transcript: transcript.map(m => ({ role: m.role, text: m.text }))
      };

      // 3. Save call to Firestore
      try {
        await setDoc(callRef, newCallRecord);
      } catch (err) {
        console.warn("Could not save call record to Firestore:", err);
      }

      // Save call to localStorage list
      const localCallsKey = `zaiasa_calls_${userId}`;
      const localCallsStr = localStorage.getItem(localCallsKey) || "[]";
      let localCalls: any[] = [];
      try {
        localCalls = JSON.parse(localCallsStr);
      } catch (e) {}
      localCalls.push(newCallRecord);
      localStorage.setItem(localCallsKey, JSON.stringify(localCalls));

      // 4. Compute stats progression
      const newTotalCalls = (profile.totalCallsCount || 0) + 1;
      
      // Recalculate average score
      const oldSum = (profile.averageScore || 0) * (profile.totalCallsCount || 0);
      const newAverage = (oldSum + evalData.score) / newTotalCalls;

      // XP Gained: Score * 5, plus a speed bonus if duration is reasonable
      const baseXP = evalData.score * 5;
      const speedBonus = duration > 40 && duration < 300 ? 50 : 0;
      const totalXPGained = baseXP + speedBonus;
      setXpGained(totalXPGained);

      const newXP = (profile.xp || 0) + totalXPGained;
      
      // Level up: every 1000 XP increases level
      const currentLevel = profile.level || 1;
      const newLevel = Math.floor(newXP / 1000) + 1;
      
      if (newLevel > currentLevel) {
        setLevelUp(true);
      }

      // Badges evaluation
      const currentBadges = [...(profile.badges || [])];
      const newEarnedBadges: string[] = [];

      // Badge 1: Novice 📞
      if (newTotalCalls === 1 && !currentBadges.includes("Novice 📞")) {
        newEarnedBadges.push("Novice 📞");
      }
      // Badge 2: Technicien 🛠️
      if (evalData.result === "Dossier résolu" && !currentBadges.includes("Technicien 🛠️")) {
        newEarnedBadges.push("Technicien 🛠️");
      }
      // Badge 3: Négociateur 🤝
      if (evalData.result === "Vente conclue" && !currentBadges.includes("Négociateur 🤝")) {
        newEarnedBadges.push("Négociateur 🤝");
      }
      // Badge 4: Calme Olympien 🧘
      if (campaign.id === "banque-premium" && evalData.score >= 90 && !currentBadges.includes("Calme Olympien 🧘")) {
        newEarnedBadges.push("Calme Olympien 🧘");
      }
      // Badge 5: Champion 🏆
      if (newLevel >= 5 && !currentBadges.includes("Champion 🏆")) {
        newEarnedBadges.push("Champion 🏆");
      }

      setUnlockedBadges(newEarnedBadges);
      const finalBadges = [...currentBadges, ...newEarnedBadges];

      const updatedProfile = {
        ...profile,
        level: newLevel,
        xp: newXP,
        totalCallsCount: newTotalCalls,
        averageScore: newAverage,
        badges: finalBadges
      };

      // 5. Save updated profile back to Firestore & localStorage
      try {
        await setDoc(userRef, updatedProfile, { merge: true });
      } catch (err) {
        console.warn("Could not update user profile in Firestore:", err);
      }
      localStorage.setItem(`zaiasa_profile_${userId}`, JSON.stringify(updatedProfile));

    } catch (err) {
      console.warn("Error in saveCallToHistory:", err);
    } finally {
      setSaving(false);
      setLoading(false);
    }
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 85) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-rose-600";
  };

  const getResultBadgeClass = (res: string) => {
    const success = ["Vente conclue", "Rendez-vous obtenu", "Client satisfait", "Problème résolu"];
    const warning = ["Client demande un rappel", "Client souhaite être rappelé", "Rappel programmé", "Rendez-vous refusé", "Escalade vers un superviseur"];
    if (success.includes(res)) {
      return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800";
    }
    if (warning.includes(res)) {
      return "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-800";
    }
    return "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-800";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 font-sans flex flex-col justify-center max-w-4xl mx-auto w-full relative text-slate-900 dark:text-slate-100 transition-colors">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {loading ? (
        // LOADING / EVALUATION STAGE
        <div className="text-center py-20 flex flex-col items-center justify-center space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xs animate-pulse">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-indigo-500/10 border-t-indigo-600 rounded-full animate-spin"></div>
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 absolute" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-xl font-bold text-slate-800 dark:text-slate-100">Analyse de l'appel par l'IA...</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              ZAIASA décortique votre conversation : respect des 14 critères qualité, posture client, empathie et objections. Veuillez patienter un instant.
            </p>
          </div>
          <div className="flex flex-col gap-1 text-slate-400 dark:text-slate-500 font-mono text-[9px] bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-850">
            <span>TRANSCRIPT_LENTH: {transcript.length} phrases échangées</span>
            <span>DIFFICULTY_FACTOR: {campaign.difficulty}/5</span>
          </div>
        </div>
      ) : !evaluation ? (
        // ERROR STATE fallback
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-8 shadow-xs">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">Erreur d'analyse</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">L'évaluation n'a pas pu être générée automatiquement.</p>
          {evaluationError && (
            <div className="mb-6 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 rounded-xl">
              <p className="text-[10px] text-rose-600 dark:text-rose-400 font-mono break-all">
                {evaluationError}
              </p>
            </div>
          )}
          <p className="text-[10px] text-slate-400 mb-6 italic">Votre appel a tout de même été enregistré localement.</p>
          <button onClick={onFinished} className="bg-indigo-600 hover:bg-indigo-700 px-6 py-2.5 rounded-lg text-white font-semibold cursor-pointer text-xs uppercase tracking-wider">
            Retour à l'accueil
          </button>
        </div>
      ) : (
        // FULL EVALUATION SCREEN REPORT
        <div className="space-y-6">
          
          {/* Main Success/Score banner */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-xs relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-950/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="text-center md:text-left space-y-2 relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Simulation terminée avec succès
              </span>
              <h1 className="font-display text-2xl font-bold text-slate-850 dark:text-white">
                Rapport de Performance
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Campagne : {campaign.name} • {callType === "incoming" ? "Entrant" : "Sortant"}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-2 justify-center md:justify-start">
                <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${getResultBadgeClass(evaluation.result)}`}>
                  {evaluation.result}
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 font-mono">
                  {Math.floor(duration / 60)}m {duration % 60}s
                </span>
              </div>
            </div>

            {/* Score Display */}
            <div className="text-center relative z-10 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 p-4 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Score Global</span>
              <span className={`font-display text-5xl font-black ${getScoreColorClass(evaluation.score)}`}>
                {evaluation.score}
              </span>
              <span className="text-[10px] text-slate-400 font-bold block mt-0.5">/ 100 points</span>
            </div>
          </div>

          {/* Explanation of the result */}
          {evaluation.explicationResultat && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-300 mb-2 flex items-center gap-1.5 font-mono">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Explication du Résultat Obtenu
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                {evaluation.explicationResultat}
              </p>
            </div>
          )}

          {/* XP & Level Ups Notifications */}
          {(xpGained > 0 || levelUp || unlockedBadges.length > 0) && (
            <div className="bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/40 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100/50 dark:border-indigo-900/30">
                  <Zap className="w-5 h-5 fill-indigo-600 dark:fill-indigo-400 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Progression & Récompenses</h4>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      +{xpGained} XP
                    </span>
                    {levelUp && (
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full animate-bounce uppercase tracking-wider border border-amber-100 dark:border-amber-900">
                        Niveau Supérieur ! 🎉
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {unlockedBadges.length > 0 && (
                <div className="flex flex-col sm:items-end justify-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Nouveaux Badges !</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {unlockedBadges.map((badge, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg font-semibold flex items-center gap-1 shadow-xs">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Analytical criteria grid (All 14 precise criteria requested by the user) */}
          {evaluation.criteria && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1.5 font-mono">
                <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Détail des 14 critères d'évaluation réglementaires
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: "respectScript", label: "1. Respect du script & étapes" },
                  { key: "accueil", label: "2. Qualité de l'accueil & intro" },
                  { key: "politesse", label: "3. Politesse & courtoisie" },
                  { key: "ecouteActive", label: "4. Écoute active (posture)" },
                  { key: "empathie", label: "5. Empathie & considération" },
                  { key: "reformulation", label: "6. Reformulation claire" },
                  { key: "decouverteBesoins", label: "7. Découverte des besoins" },
                  { key: "gestionObjections", label: "8. Gestion des objections" },
                  { key: "argumentation", label: "9. Force de l'argumentation" },
                  { key: "confiance", label: "10. Climat de confiance" },
                  { key: "clarteExplications", label: "11. Clarté des explications" },
                  { key: "fluidite", label: "12. Fluidité & sourire" },
                  { key: "gestionTemps", label: "13. Gestion des blancs & temps" },
                  { key: "conclusion", label: "14. Conclusion & prise de congé" }
                ].map((crit) => {
                  const scoreValue = evaluation.criteria[crit.key as keyof typeof evaluation.criteria] || 0;
                  return (
                    <div key={crit.key} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-850">
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                        <span>{crit.label}</span>
                        <span className={`font-mono text-xs font-bold ${getScoreColorClass(scoreValue)}`}>
                          {scoreValue}/100
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${scoreValue}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bullets List: Phrases Réussies vs Erreurs commises */}
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Left Box: Phrases Réussies */}
            <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-5 rounded-2xl shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 mb-3 font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Phrases d'Agent Réussies
                </h3>
                <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  {evaluation.phrasesReussies && evaluation.phrasesReussies.length > 0 ? (
                    evaluation.phrasesReussies.map((pt, i) => (
                      <li key={i} className="flex gap-2 items-start font-medium">
                        <CornerDownRight className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>"{pt}"</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-xs text-slate-500">Aucune phrase remarquable à signaler.</li>
                  )}
                </ul>
              </div>

              {evaluation.etapesOubliees && evaluation.etapesOubliees.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 p-5 rounded-2xl shadow-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1.5 mb-3 font-mono">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    Étapes clés ou Obligations réglementaires oubliées
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    {evaluation.etapesOubliees.map((expr, i) => (
                      <li key={i} className="flex gap-2 items-start font-medium">
                        <CornerDownRight className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{expr}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right Box: Erreurs & Conseils */}
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 p-5 rounded-2xl shadow-xs">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5 mb-3 font-mono">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-450" />
                  Conseils d'Amélioration Personnalisés
                </h3>
                <ul className="space-y-2 text-xs text-slate-800 dark:text-slate-300 font-semibold">
                  {evaluation.conseils && evaluation.conseils.length > 0 ? (
                    evaluation.conseils.map((pt, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        <CornerDownRight className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-xs text-slate-500 font-bold">Poursuivez ainsi !</li>
                  )}
                </ul>
              </div>

              {evaluation.erreurs && evaluation.erreurs.length > 0 && (
                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 p-5 rounded-2xl shadow-xs">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-1.5 mb-3 font-mono">
                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-450" />
                    Erreurs, bafouillages ou maladresses
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-850 dark:text-slate-300 font-semibold">
                    {evaluation.erreurs.map((pt, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        <CornerDownRight className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Side-by-side expressions cards: À éviter vs À privilégier */}
          {((evaluation.expressionsAEviter && evaluation.expressionsAEviter.length > 0) || 
            (evaluation.expressionsRecommandees && evaluation.expressionsRecommandees.length > 0)) && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-4 font-mono">
                Lexique de posture : mots à proscrire vs Recommandations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-950 p-4 rounded-xl">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-400 mb-2">Expressions entendues à éviter</h4>
                  <ul className="list-disc pl-4 text-xs text-slate-700 dark:text-slate-300 space-y-1 font-semibold">
                    {evaluation.expressionsAEviter?.map((expr, i) => (
                      <li key={i}>{expr}</li>
                    ))}
                    {(!evaluation.expressionsAEviter || evaluation.expressionsAEviter.length === 0) && (
                      <li className="list-none text-slate-400 dark:text-slate-500 text-xs font-normal">Excellente posture linguistique !</li>
                    )}
                  </ul>
                </div>

                <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-950 p-4 rounded-xl">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 mb-2">À privilégier en centre d'appels</h4>
                  <ul className="list-disc pl-4 text-xs text-slate-700 dark:text-slate-300 space-y-1 font-semibold">
                    {evaluation.expressionsRecommandees?.map((expr, i) => (
                      <li key={i}>{expr}</li>
                    ))}
                    {(!evaluation.expressionsRecommandees || evaluation.expressionsRecommandees.length === 0) && (
                      <li className="list-none text-slate-400 dark:text-slate-500 text-xs font-normal">Aucune suggestion lexicale particulière.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Time & Speaking Ratio Dashboard details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-stretch gap-6">
            
            {/* Durations */}
            <div className="flex-1 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-xl flex items-center justify-center">
                <Timer className="w-5 h-5 text-blue-600 dark:text-blue-450" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Durée Totale de l'Appel</span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 block mt-0.5 font-mono">
                  {Math.floor(duration / 60)} minutes et {duration % 60} secondes
                </span>
              </div>
            </div>

            {/* Separators */}
            <div className="hidden md:block w-px bg-slate-200 dark:bg-slate-800"></div>

            {/* Speak ratios */}
            <div className="flex-1 space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block font-mono">Répartition des Temps de parole</span>
              <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                <span>Vous : {evaluation.agentSpeakTimePercent || 45}%</span>
                <span>Client : {evaluation.clientSpeakTimePercent || 55}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex overflow-hidden">
                <div 
                  className="h-full bg-blue-500"
                  style={{ width: `${evaluation.agentSpeakTimePercent || 45}%` }}
                ></div>
                <div 
                  className="h-full bg-emerald-500"
                  style={{ width: `${evaluation.clientSpeakTimePercent || 55}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* New Targeted Exercise Challenge Card */}
          {evaluation.nextExercise && (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 border-2 border-indigo-200 dark:border-indigo-900/50 p-6 rounded-2xl shadow-sm relative overflow-hidden animate-fade-in">
              <div className="absolute top-0 right-0 p-8 opacity-10 dark:opacity-5 pointer-events-none">
                <Sparkles className="w-24 h-24 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  <Zap className="w-4 h-4 fill-white" />
                </div>
                <h3 className="text-sm font-extrabold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider font-mono">
                  Défi d'Entraînement Ciblé Suggéré
                </h3>
              </div>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white mb-1">
                Exercice : {evaluation.nextExercise.title}
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 mb-3 font-semibold">
                Objectif prioritaire : {evaluation.nextExercise.objective}
              </p>
              <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-xl border border-indigo-100 dark:border-indigo-950/40 space-y-2 mb-4">
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                  <strong>Description :</strong> {evaluation.nextExercise.description}
                </p>
                <p className="text-xs text-slate-850 dark:text-slate-200 leading-relaxed font-semibold bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <strong>Consignes d'entraînement :</strong> {evaluation.nextExercise.instructions}
                </p>
              </div>
              <button
                onClick={onFinished}
                className="bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-extrabold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
              >
                Relever le défi dès maintenant !
                <ArrowRight className="w-3.5 h-3.5 text-indigo-100" />
              </button>
            </div>
          )}

          {/* Bottom Action Footer */}
          <div className="text-center pt-4">
            <button
              onClick={onFinished}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold py-3.5 px-10 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider mx-auto cursor-pointer"
              id="back-to-home-btn"
            >
              Enregistrer l'évaluation & Retourner au tableau de bord
              <ChevronRight className="w-4 h-4 text-blue-100" />
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
