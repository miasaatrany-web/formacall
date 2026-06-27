import React, { useState } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { User, Sparkles, BookOpen, GraduationCap, Trophy } from "lucide-react";
import { UserProfile } from "../types";

interface AuthScreenProps {
  onAuthSuccess: (uid: string) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Veuillez entrer votre nom.");
      return;
    }

    if (trimmedName.length < 2) {
      setError("Le nom doit contenir au moins 2 caractères.");
      return;
    }

    setLoading(true);

    // Normalize the name to create a safe document ID
    const normalizedId = trimmedName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9_.-]/g, "_") // Replace spaces/special chars with underscores
      .replace(/_+/g, "_") // Deduplicate underscores
      .trim();

    const ADMIN_IDS = ["miasaatrany_gmail_com", "miasaatrany"];
    const isAdmin = ADMIN_IDS.includes(normalizedId.toLowerCase());

    try {
      const userDocRef = doc(db, "users", normalizedId);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        // Create initial profile if it doesn't exist
        const initialProfile: UserProfile = {
          firstName: trimmedName,
          lastName: "",
          username: normalizedId,
          level: 1,
          xp: 0,
          completedCampaignsCount: 0,
          totalCallsCount: 0,
          averageScore: 0,
          badges: ["Bienvenue 🎉"],
          role: isAdmin ? "admin" : "user",
          isActivated: isAdmin ? true : false
        };
        await setDoc(userDocRef, initialProfile);
        
        // Save local backup
        localStorage.setItem(`zaiasa_profile_${normalizedId}`, JSON.stringify(initialProfile));
      } else {
        const existingData = docSnap.data() as UserProfile;
        // Make sure existing admin profile retains or upgrades its roles
        if (isAdmin && (existingData.role !== "admin" || !existingData.isActivated)) {
          existingData.role = "admin";
          existingData.isActivated = true;
          await setDoc(userDocRef, existingData, { merge: true });
        }
        // Save local backup of existing profile
        localStorage.setItem(`zaiasa_profile_${normalizedId}`, JSON.stringify(existingData));
      }

      // Save active session
      localStorage.setItem("zaiasa_user_id", normalizedId);
      onAuthSuccess(normalizedId);
    } catch (err: any) {
      console.warn("Firestore access error, falling back to LocalStorage:", err);
      
      // Fallback local-only profile creation/loading so the app is 100% resilient
      const localKey = `zaiasa_profile_${normalizedId}`;
      const savedProfileStr = localStorage.getItem(localKey);
      
      if (!savedProfileStr) {
        const fallbackProfile: UserProfile = {
          firstName: trimmedName,
          lastName: "",
          username: normalizedId,
          level: 1,
          xp: 0,
          completedCampaignsCount: 0,
          totalCallsCount: 0,
          averageScore: 0,
          badges: ["Bienvenue 🎉"],
          role: isAdmin ? "admin" : "user",
          isActivated: isAdmin ? true : false
        };
        localStorage.setItem(localKey, JSON.stringify(fallbackProfile));
      } else if (isAdmin) {
        try {
          const profile = JSON.parse(savedProfileStr) as UserProfile;
          profile.role = "admin";
          profile.isActivated = true;
          localStorage.setItem(localKey, JSON.stringify(profile));
        } catch (e) {}
      }

      localStorage.setItem("zaiasa_user_id", normalizedId);
      onAuthSuccess(normalizedId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-8 relative overflow-hidden font-sans transition-colors">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/5 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-8 relative z-10 transition-all hover:shadow-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-600 dark:bg-teal-500 mb-4 shadow-sm relative group overflow-hidden">
            <GraduationCap className="w-7 h-7 text-white transition-transform group-hover:scale-110" />
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
            ZAIASA
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
            Simulateur de formation • Centres d'appel
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-sm rounded-xl p-3.5 mb-6 flex items-start gap-2.5 animate-fade-in" id="auth-error">
            <span className="text-base">⚠️</span>
            <span className="font-medium">{error}</span>
          </div>
        )}

        <div className="bg-teal-50/60 dark:bg-teal-950/30 border border-teal-100/60 dark:border-teal-900/40 rounded-xl p-4 mb-6 text-slate-600 dark:text-slate-300 text-xs leading-relaxed space-y-2 font-medium">
          <p className="font-extrabold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
            Connexion Simplifiée d'Élève
          </p>
          <p>
            Pas besoin de mot de passe ! Entrez simplement votre prénom ou votre nom pour accéder immédiatement à votre espace de formation.
          </p>
          <p>
            Si vous revenez plus tard sur cet appareil, entrez le même nom pour retrouver votre progression, vos scores et vos badges obtenus !
          </p>
        </div>

        <form onSubmit={handleConnect} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Votre Prénom / Nom
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                <User className="w-4.5 h-4.5" />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-900 dark:text-white font-semibold rounded-xl py-3 pl-10 pr-4 text-sm transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600"
                placeholder="Ex: Mamadou, Sophie Martin..."
                id="student-name-input"
                autoFocus
              />
            </div>
            {(name.trim().toLowerCase() === "miasaatrany@gmail.com" || name.trim().toLowerCase() === "miasaatrany") && (
              <p className="mt-2 text-xs font-bold text-amber-500 dark:text-amber-400 flex items-center gap-1 animate-pulse" id="admin-mode-detected-text">
                🔑 Compte Administrateur Spécial Détecté
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg hover:shadow-teal-500/10 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            id="auth-submit-btn"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Commencer la Formation
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-around text-slate-400 dark:text-slate-500 text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-slate-300 dark:text-slate-600" />
            <span>Apprentissage interactif</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-slate-300 dark:text-slate-600" />
            <span>Badges & Niveaux</span>
          </div>
        </div>
      </div>
    </div>
  );
}
