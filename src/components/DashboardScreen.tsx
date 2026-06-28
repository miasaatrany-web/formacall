import React, { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { CAMPAIGNS, Campaign } from "../campaigns";
import { UserProfile, HistoricalCall } from "../types";
import { motion, AnimatePresence } from "motion/react";
import FrenchLearningScreen from "./FrenchLearningScreen";
import { 
  PhoneIncoming, 
  PhoneOutgoing, 
  BookMarked, 
  Star, 
  Clock, 
  TrendingUp, 
  Award, 
  LogOut, 
  History, 
  X, 
  ChevronRight, 
  User as UserIcon,
  Calendar,
  Zap,
  CheckCircle,
  XCircle,
  HelpCircle,
  Shield,
  Key,
  Copy,
  Users,
  Search,
  Check,
  RefreshCw,
  Plus,
  Headset
} from "lucide-react";

interface DashboardScreenProps {
  userId: string;
  userProfile: UserProfile;
  onSelectCampaign: (campaign: Campaign, type: "incoming" | "outgoing") => void;
  onLogout: () => void;
  onRefreshProfile?: () => void;
}

export default function DashboardScreen({ userId, userProfile, onSelectCampaign, onLogout, onRefreshProfile }: DashboardScreenProps) {
  const [selectedType, setSelectedType] = useState<"incoming" | "outgoing" | "learning_french" | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyCalls, setHistoryCalls] = useState<HistoricalCall[]>([]);
  const [selectedPastCall, setSelectedPastCall] = useState<HistoricalCall | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Simple User Activation States
  const [enteredCode, setEnteredCode] = useState("");
  const [activationError, setActivationError] = useState("");
  const [activationSuccess, setActivationSuccess] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  // Admin Console States
  const ADMIN_IDS = ["miasaatrany_gmail_com", "miasaatrany"];
  const isAdmin = userProfile.role === "admin" || ADMIN_IDS.includes(userId.toLowerCase());
  const [adminTab, setAdminTab] = useState<"users" | "simulation">(isAdmin ? "users" : "simulation");
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  // Fetch all users for Admin
  const fetchAllUsers = async () => {
    if (!isAdmin) return;
    setLoadingUsers(true);
    try {
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);
      const list: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as UserProfile;
        const u = { ...data, username: docSnap.id };
        // Exclude the admin themselves from the codes list
        const isUserAdmin = u.username === "miasaatrany_gmail_com" || u.username === "miasaatrany" || u.role === "admin";
        if (!isUserAdmin) {
          list.push(u);
        }
      });
      // Sort alphabetically by first name
      list.sort((a, b) => (a.firstName || "").localeCompare(b.firstName || ""));
      setAllUsers(list);
    } catch (err) {
      console.warn("Error fetching users list for admin:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isAdmin && adminTab === "users") {
      fetchAllUsers();
    }
  }, [isAdmin, adminTab]);

  const deleteUser = async (targetUsername: string) => {
    // Using a more robust confirmation that works in iframes
    const confirmed = window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le compte de ${targetUsername} ?`);
    if (!confirmed) return;
    
    try {
      console.log(`Attempting to delete user: ${targetUsername}`);
      const userRef = doc(db, "users", targetUsername);
      await deleteDoc(userRef);
      console.log(`Successfully deleted user: ${targetUsername}`);
      
      setAllUsers(prev => prev.filter(u => u.username !== targetUsername));
    } catch (err) {
      console.error("Failed to delete user:", err);
      alert("Erreur lors de la suppression de l'utilisateur. Vérifiez les permissions Firestore.");
    }
  };

  // Generate a random 6-digit code for a simple user
  const handleGenerateCode = async (targetUsername: string) => {
    setIsGenerating(targetUsername);
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const targetDocRef = doc(db, "users", targetUsername);
      await updateDoc(targetDocRef, {
        activationCode: code,
        isActivated: false
      });

      // Update local state list to avoid full fetch
      setAllUsers(prev => 
        prev.map(u => u.username === targetUsername ? { ...u, activationCode: code, isActivated: false } : u)
      );
    } catch (err) {
      console.error("Failed to generate activation code:", err);
    } finally {
      setIsGenerating(null);
    }
  };

  // Simple user activation handler
  const handleActivateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError("");
    
    const cleanCode = enteredCode.trim();
    if (cleanCode.length !== 6 || !/^\d+$/.test(cleanCode)) {
      setActivationError("Veuillez saisir un code valide de 6 chiffres.");
      return;
    }

    if (!userProfile.activationCode) {
      setActivationError("Aucun code d'activation n'a été généré pour votre compte. Veuillez contacter votre administrateur.");
      return;
    }

    if (cleanCode !== userProfile.activationCode) {
      setActivationError("Code d'activation incorrect. Veuillez vérifier auprès de votre administrateur.");
      return;
    }

    setIsActivating(true);
    try {
      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, { isActivated: true });
      
      // Update local backup
      const updatedProfile = { ...userProfile, isActivated: true };
      localStorage.setItem(`zaiasa_profile_${userId}`, JSON.stringify(updatedProfile));

      setActivationSuccess(true);
      
      setTimeout(() => {
        if (onRefreshProfile) {
          onRefreshProfile();
        }
      }, 1500);
    } catch (err) {
      console.error("Failed to activate account:", err);
      setActivationError("Erreur lors de la communication avec le serveur. Veuillez réessayer.");
    } finally {
      setIsActivating(false);
    }
  };

  // Copy code utility
  const handleCopyCode = (code: string, username: string) => {
    navigator.clipboard.writeText(code);
    setCopiedUserId(username);
    setTimeout(() => setCopiedUserId(null), 2000);
  };

  // Fetch history when drawer is opened
  useEffect(() => {
    if (showHistory) {
      const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
          let list: HistoricalCall[] = [];
          try {
            const callsRef = collection(db, "users", userId, "calls");
            const q = query(callsRef, orderBy("date", "desc"));
            const snapshot = await getDocs(q);
            snapshot.forEach((doc) => {
              list.push({ id: doc.id, ...doc.data() } as HistoricalCall);
            });
          } catch (fireErr) {
            console.warn("Could not fetch call history from Firestore, using local fallback:", fireErr);
          }

          if (list.length === 0) {
            const localCallsStr = localStorage.getItem(`zaiasa_calls_${userId}`) || "[]";
            try {
              list = JSON.parse(localCallsStr);
              list.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
            } catch (e) {}
          }

          setHistoryCalls(list);
        } catch (err) {
          console.warn("Error fetching call history:", err);
        } finally {
          setLoadingHistory(false);
        }
      };
      fetchHistory();
    }
  }, [showHistory, userId]);

  const renderStars = (diff: number) => {
    return Array.from({ length: 5 }).map((_, idx) => (
      <Star 
        key={idx} 
        className={`w-3.5 h-3.5 ${idx < diff ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} 
      />
    ));
  };

  const getDifficultyText = (diff: number) => {
    const texts = ["Débutant", "Intermédiaire", "Avancé", "Expert", "Légendaire"];
    return texts[diff - 1] || "Inconnu";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans relative overflow-x-hidden text-slate-900 dark:text-white transition-colors">
      {/* Background ambient light - extremely subtle minimalist green-blue glow */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-teal-500/5 dark:bg-teal-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Mini-Header for Profile and Stats */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-600 dark:bg-teal-500 flex items-center justify-center text-white shadow-sm" id="callcenter-logo">
            <Headset className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="font-display font-bold text-base text-slate-800 dark:text-white tracking-tight block">ZAIASA</span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider -mt-1">Centre d'Apprentissage</p>
          </div>
        </div>

        {/* User stats widget */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4">
            {/* XP and Level */}
            <div className="text-right">
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-teal-100 dark:border-teal-900/40">
                  Niveau {userProfile.level}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                  {userProfile.xp} XP
                </span>
              </div>
              <div className="w-36 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                <div 
                  className="h-full bg-teal-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, (userProfile.xp % 1000) / 10)}%` }}
                ></div>
              </div>
            </div>

            {/* Micro stats separator */}
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>

            <div className="text-center">
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Score Moyen</p>
              <p className="text-sm font-extrabold text-slate-800 dark:text-white">{userProfile.averageScore ? `${Math.round(userProfile.averageScore)}/100` : "—"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(true)}
              className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Historique des appels"
              id="history-drawer-btn"
            >
              <History className="w-3.5 h-3.5 text-teal-500 dark:text-teal-400" />
              <span>Historique</span>
            </button>

            <button
              onClick={onLogout}
              className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg border border-slate-200/60 dark:border-slate-700 hover:border-rose-200 transition-all cursor-pointer"
              title="Se déconnecter"
              id="logout-btn"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Screen Layout */}
      <main className="flex-1 flex flex-col items-center px-4 py-8 max-w-5xl mx-auto w-full relative z-10">
        {!userProfile.isActivated && !isAdmin && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="w-full mb-8 overflow-hidden"
          >
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-800 dark:text-amber-400 text-sm">Compte non activé</h4>
                  <p className="text-amber-700/70 dark:text-amber-500/70 text-xs font-semibold max-w-md">
                    Vous avez accès aux formations, mais la simulation d'appel est verrouillée. Saisissez votre code d'activation à 6 chiffres pour tout débloquer.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-1 w-full md:w-auto">
                <form onSubmit={handleActivateAccount} className="flex items-center gap-2 w-full md:w-auto">
                  <input
                    type="text"
                    maxLength={6}
                    value={enteredCode}
                    onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="CODE"
                    className="w-24 text-center bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 focus:border-amber-500 rounded-lg py-2 text-sm font-mono font-bold tracking-widest outline-hidden transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={isActivating || enteredCode.length !== 6}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-black px-4 py-2 rounded-lg text-[10px] uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {isActivating ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Activer"}
                  </button>
                </form>
                {activationError && (
                  <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold px-2">
                    {activationError}
                  </p>
                )}
                {activationSuccess && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold px-2">
                    Succès ! Redirection...
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {isAdmin && (
          <div className="flex gap-4 mb-8 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 w-full max-w-md mx-auto">
            <button
              onClick={() => setAdminTab("users")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                adminTab === "users" 
                  ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Shield className="w-4 h-4" />
              Console Codes
            </button>
            <button
              onClick={() => setAdminTab("simulation")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                adminTab === "simulation" 
                  ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Zap className="w-4 h-4" />
              Simulations
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {isAdmin && adminTab === "users" ? (
            // Admin Console View
            <motion.div
              key="admin-console"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Shield className="w-6 h-6 text-amber-500" />
                    <span>Console d'Administration</span>
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-semibold">
                    Générez et distribuez les codes d'activation pour chaque compte d'utilisateur simple.
                  </p>
                </div>
                
                <button
                  onClick={fetchAllUsers}
                  disabled={loadingUsers}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? "animate-spin" : ""}`} />
                  <span>Actualiser</span>
                </button>
              </div>

              {/* Admin stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/85 rounded-xl p-4 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Utilisateurs Simples
                  </span>
                  <span className="text-2xl font-extrabold text-slate-800 dark:text-white">
                    {allUsers.length}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/85 rounded-xl p-4 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Comptes Activés
                  </span>
                  <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-5 h-5 text-emerald-500" />
                    {allUsers.filter(u => u.isActivated).length}
                  </span>
                </div>
                <div className="hidden sm:block bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/85 rounded-xl p-4 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    En Attente d'Activation
                  </span>
                  <span className="text-2xl font-extrabold text-amber-500 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-500" />
                    {allUsers.filter(u => !u.isActivated).length}
                  </span>
                </div>
              </div>

              {/* Search user */}
              <div className="relative mb-6">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Rechercher un élève par son nom ou identifiant..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-900 dark:text-white font-semibold rounded-xl py-3 pl-10 pr-4 text-sm transition-colors"
                />
              </div>

              {/* Users List */}
              {loadingUsers ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-8 h-8 border-3 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mb-3"></div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">Chargement des élèves...</p>
                </div>
              ) : (
                (() => {
                  const filteredUsers = allUsers.filter(u => 
                    (u.firstName || "").toLowerCase().includes(userSearch.toLowerCase()) || 
                    (u.username || "").toLowerCase().includes(userSearch.toLowerCase())
                  );

                  if (filteredUsers.length === 0) {
                    return (
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl p-8 text-center text-slate-400 dark:text-slate-500">
                        <Users className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
                        <p className="text-sm font-bold">Aucun élève trouvé</p>
                        <p className="text-xs mt-1">Créez ou connectez des comptes pour les voir apparaître ici.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {filteredUsers.map((user) => {
                        return (
                          <div
                            key={user.username}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-display font-bold text-base border border-slate-200/50 dark:border-slate-700">
                                {user.firstName ? user.firstName.charAt(0).toUpperCase() : "?"}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-800 dark:text-white text-sm">
                                  {user.firstName} {user.lastName}
                                </h4>
                                <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                  ID: {user.username}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                              {/* Status Pill */}
                              <div>
                                {user.isActivated ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/40 uppercase">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Activé
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-100 dark:border-amber-900/40 uppercase">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                    En attente
                                  </span>
                                )}
                              </div>

                              {/* Activation Code Controls */}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => deleteUser(user.username)}
                                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 border border-rose-100 dark:border-rose-900/40 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                  title="Supprimer définitivement l'utilisateur"
                                >
                                  Supprimer
                                </button>
                                
                                {user.activationCode ? (
                                  <div className="flex items-center gap-1.5">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-800">
                                      <span className="font-mono text-xs font-extrabold tracking-wider text-teal-600 dark:text-teal-400">
                                        {user.activationCode}
                                      </span>
                                      <button
                                        onClick={() => handleCopyCode(user.activationCode || "", user.username)}
                                        className="text-slate-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors p-0.5 cursor-pointer"
                                        title="Copier le code"
                                      >
                                        {copiedUserId === user.username ? (
                                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                                        ) : (
                                          <Copy className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    </div>

                                    <button
                                      onClick={() => handleGenerateCode(user.username)}
                                      disabled={isGenerating === user.username}
                                      className="p-1.5 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                                      title="Regénérer le code"
                                    >
                                      <RefreshCw className={`w-3.5 h-3.5 ${isGenerating === user.username ? "animate-spin text-amber-500" : ""}`} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleGenerateCode(user.username)}
                                    disabled={isGenerating === user.username}
                                    className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-extrabold rounded-lg flex items-center gap-1.5 text-[10px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                                  >
                                    {isGenerating === user.username ? (
                                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                      <>
                                        <Plus className="w-3.5 h-3.5" />
                                        Générer Code
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </motion.div>
          ) : !selectedType ? (
            // Phase 1: Entrants / Sortants choice
            <motion.div 
              key="call-type-selector"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="w-full text-center"
            >
              <h2 className="font-display text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
                Bonjour, {userProfile.firstName}
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-10 max-w-md mx-auto leading-relaxed font-semibold">
                Sélectionnez un type de communication pour démarrer votre simulation avec notre IA conversationnelle.
              </p>

              <div className="grid md:grid-cols-3 gap-6 w-full max-w-4xl mx-auto">
                <button
                  onClick={() => setSelectedType("incoming")}
                  className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-500 rounded-xl p-6 text-center flex flex-col items-center justify-center transition-all duration-300 shadow-xs hover:shadow-md cursor-pointer overflow-hidden"
                  id="incoming-calls-btn"
                >
                  <div className="w-14 h-14 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                    <PhoneIncoming className="w-7 h-7" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-slate-800 dark:text-white mb-1.5 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    Appels entrants
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] max-w-xs leading-relaxed font-medium">
                    Répondez aux réclamations clients, diagnostiquez des pannes et résolvez des problèmes techniques complexes.
                  </p>
                </button>

                <button
                  onClick={() => setSelectedType("outgoing")}
                  className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-500 rounded-xl p-6 text-center flex flex-col items-center justify-center transition-all duration-300 shadow-xs hover:shadow-md cursor-pointer overflow-hidden"
                  id="outgoing-calls-btn"
                >
                  <div className="w-14 h-14 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                    <PhoneOutgoing className="w-7 h-7" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-slate-800 dark:text-white mb-1.5 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    Appels sortants
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] max-w-xs leading-relaxed font-medium">
                    Contactez des prospects, proposez des contrats d'assurance et de placement, et traitez les objections commerciales.
                  </p>
                </button>

                <button
                  onClick={() => setSelectedType("learning_french")}
                  className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-500 rounded-xl p-6 text-center flex flex-col items-center justify-center transition-all duration-300 shadow-xs hover:shadow-md cursor-pointer overflow-hidden"
                  id="learning-french-btn"
                >
                  <div className="w-14 h-14 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                    <BookMarked className="w-7 h-7" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-slate-800 dark:text-white mb-1.5 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    Apprendre le français
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] max-w-xs leading-relaxed font-medium">
                    Perfectionnez votre grammaire, évitez les fautes d'orthographe et entraînez-vous sur l'élocution et l'intonation.
                  </p>
                </button>
              </div>
            </motion.div>
          ) : selectedType === "learning_french" ? (
            <FrenchLearningScreen
              isActivated={userProfile.isActivated === true || isAdmin}
              onBack={() => setSelectedType(null)}
              userProfile={userProfile}
            />
          ) : (
            // Phase 2: Campaign chooser
            <motion.div 
              key="campaign-selector"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <button 
                    onClick={() => setSelectedType(null)}
                    className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 uppercase tracking-widest mb-1 flex items-center gap-1 transition-colors cursor-pointer"
                    id="back-to-type-btn"
                  >
                    ← Retour au choix initial
                  </button>
                  <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    {selectedType === "incoming" ? (
                      <>
                        <PhoneIncoming className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
                        <span>Campagnes d'appels entrants</span>
                      </>
                    ) : (
                      <>
                        <PhoneOutgoing className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                        <span>Campagnes d'appels sortants</span>
                      </>
                    )}
                  </h2>
                </div>
                <div className="text-slate-500 dark:text-slate-400 text-xs max-w-xs leading-normal font-semibold">
                  Sélectionnez l'une de nos campagnes d'entraînement ci-dessous pour démarrer votre apprentissage.
                </div>
              </div>

              <div className="space-y-4">
                {CAMPAIGNS.filter(campaign => campaign.type === selectedType).map((campaign, idx) => {
                  const isEmerald = campaign.color === "emerald";
                  const isBlue = campaign.color === "blue";
                  const isAmber = campaign.color === "amber";
                  const isPurple = campaign.color === "purple";
                  
                  let borderHoverClass = "hover:border-teal-400 dark:hover:border-teal-500";
                  if (isEmerald) { borderHoverClass = "hover:border-emerald-400 dark:hover:border-emerald-500"; }
                  else if (isBlue) { borderHoverClass = "hover:border-teal-400 dark:hover:border-teal-500"; }
                  else if (isAmber) { borderHoverClass = "hover:border-amber-400 dark:hover:border-amber-500"; }
                  else if (isPurple) { borderHoverClass = "hover:border-fuchsia-400 dark:hover:border-fuchsia-500"; }

                  return (
                    <div
                      key={campaign.id}
                      className={`group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 ${borderHoverClass} rounded-xl p-5 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs`}
                      id={`campaign-card-${campaign.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                            Campagne {idx + 1}
                          </span>
                          <span className="h-2.5 w-px bg-slate-200 dark:bg-slate-800"></span>
                          <div className="flex items-center gap-0.5">
                            {renderStars(campaign.difficulty)}
                          </div>
                          <span className="h-2.5 w-px bg-slate-200 dark:bg-slate-800"></span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wide">
                            Difficulté : {getDifficultyText(campaign.difficulty)}
                          </span>
                        </div>

                        <h3 className="font-display text-lg font-bold text-slate-800 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                          {campaign.name}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 text-xs mt-1 leading-relaxed font-semibold">
                          {campaign.description}
                        </p>

                        <div className="flex items-center gap-3 mt-3 text-xs text-slate-400 dark:text-slate-500">
                          <span className="flex items-center gap-1 font-bold">
                            <Clock className="w-3.5 h-3.5 text-teal-500 dark:text-teal-400" />
                            {campaign.duration}
                          </span>
                          <span>•</span>
                          <span className="font-bold bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded text-[10px] border border-slate-200/50 dark:border-slate-800">
                            {campaign.script.length} étapes de script
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center">
                        <button
                          onClick={() => onSelectCampaign(campaign, selectedType)}
                          className="w-full md:w-auto bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-extrabold py-3 px-5 rounded-xl flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer shadow-md hover:shadow-teal-500/10"
                          id={`start-campaign-${campaign.id}`}
                        >
                          Apprendre le script
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Slide-out History & Profile Drawer */}
      <AnimatePresence>
        {showHistory && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40"
            ></motion.div>

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col font-sans text-slate-900 dark:text-white transition-colors"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/30">
                <div className="flex items-center gap-2">
                  <History className="w-4.5 h-4.5 text-teal-600 dark:text-teal-400" />
                  <h3 className="font-display text-base font-bold text-slate-800 dark:text-white">Mon Profil & Activité</h3>
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  id="close-history-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Profile summary card */}
                <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-xl pointer-events-none"></div>
                  
                  <div className="flex items-center gap-3 mb-3.5 relative z-10">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm text-slate-800 dark:text-white">
                        {userProfile.firstName} {userProfile.lastName}
                      </h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">@{userProfile.username}</p>
                    </div>
                  </div>

                  {/* Badges Section */}
                  <div className="relative z-10">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1.5">Badges Débloqués</span>
                    <div className="flex flex-wrap gap-1">
                      {userProfile.badges && userProfile.badges.length > 0 ? (
                        userProfile.badges.map((badge, bIdx) => (
                          <span 
                            key={bIdx}
                            className="text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 shadow-xs"
                          >
                            <Award className="w-3 h-3 text-amber-500 shrink-0" />
                            {badge}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">Aucun badge pour le moment.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Training Stats Block */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Total Appels</span>
                    <span className="font-display text-xl font-bold text-slate-800 dark:text-white">{userProfile.totalCallsCount || 0}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">Niveau</span>
                    <span className="font-display text-xl font-bold text-teal-600 dark:text-teal-400 flex items-center justify-center gap-0.5">
                      <Zap className="w-4 h-4 fill-teal-600 text-teal-600 dark:fill-teal-400 dark:text-teal-400" />
                      {userProfile.level}
                    </span>
                  </div>
                </div>

                {/* History List */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">Historique des simulations</h4>
                  
                  {loadingHistory ? (
                    <div className="text-center py-8">
                      <div className="w-5 h-5 border-2 border-teal-500/20 border-t-teal-600 rounded-full animate-spin mx-auto"></div>
                      <p className="text-xs text-slate-400 mt-2 font-mono">Chargement...</p>
                    </div>
                  ) : historyCalls.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500">
                      <p className="text-xs font-semibold">Aucun appel enregistré pour l'instant.</p>
                      <p className="text-[10px] mt-0.5">Commencez un appel pour voir vos rapports d'évaluation !</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {historyCalls.map((call) => {
                        const scoreColorClass = call.score >= 85 ? "text-emerald-600 dark:text-emerald-400" : call.score >= 60 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400";
                        return (
                          <div
                            key={call.id}
                            onClick={() => setSelectedPastCall(call)}
                            className="bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{call.campaignName}</span>
                                <span className="text-[10px] text-slate-300 dark:text-slate-700 font-mono">•</span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                  {new Date(call.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${call.callType === "incoming" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40" : "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-900/40"}`}>
                                  {call.callType === "incoming" ? "entrant" : "sortant"}
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">{call.result}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`text-sm font-extrabold ${scoreColorClass}`}>
                                {call.score}/100
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Complete Historical Call Detail Modal */}
      <AnimatePresence>
        {selectedPastCall && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 dark:text-white transition-colors"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-800 dark:text-white">{selectedPastCall.campaignName}</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1 font-extrabold">
                    <Calendar className="w-3.5 h-3.5 text-teal-500 dark:text-teal-400" />
                    Le {new Date(selectedPastCall.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    <span>•</span>
                    <Clock className="w-3.5 h-3.5 text-teal-500 dark:text-teal-400" />
                    Durée : {Math.floor(selectedPastCall.duration / 60)}m {selectedPastCall.duration % 60}s
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPastCall(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  id="close-past-call-modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Score Section */}
                <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-center md:text-left">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-0.5">Résultat Final</span>
                    <span className="text-base font-extrabold text-slate-800 dark:text-white">{selectedPastCall.result}</span>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${selectedPastCall.callType === "incoming" ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40" : "bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border-teal-100 dark:border-teal-900/40"}`}>
                        {selectedPastCall.callType === "incoming" ? "Appel Entrant" : "Appel Sortant"}
                      </span>
                    </div>
                  </div>
                  <div className="text-center md:text-right">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-0.5">Score Global</span>
                    <span className={`font-display text-3xl font-black ${selectedPastCall.score >= 85 ? "text-emerald-600 dark:text-emerald-400" : selectedPastCall.score >= 60 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"}`}>
                      {selectedPastCall.score}/100
                    </span>
                  </div>
                </div>

                {/* Score criteria breakdown */}
                {selectedPastCall.evaluation?.criteria && (
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">Critères d'évaluation</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(selectedPastCall.evaluation.criteria).map(([key, val]) => {
                        const formattedNames: { [k: string]: string } = {
                          accueil: "Qualité de l'accueil",
                          respectScript: "Respect du script",
                          empathie: "Écoute & Empathie",
                          argumentation: "Argumentation",
                          professionnalisme: "Professionnalisme",
                          conclusion: "Conclusion & Congé"
                        };
                        return (
                          <div key={key} className="bg-slate-50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                            <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                              <span>{formattedNames[key] || key}</span>
                              <span className="font-extrabold text-slate-800 dark:text-slate-200">{val}/100</span>
                            </div>
                            <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-teal-500 rounded-full" 
                                style={{ width: `${val}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Bullets lists */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1.5 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Points Forts
                      </h4>
                      <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300 list-disc list-inside font-semibold">
                        {selectedPastCall.evaluation?.pointsForts?.map((pt, i) => (
                          <li key={i}>{pt}</li>
                        )) || <li className="italic">Aucun point fort.</li>}
                      </ul>
                    </div>

                    <div className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-xl border border-rose-100 dark:border-rose-900/40">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 mb-1.5 flex items-center gap-1">
                        <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        Erreurs & Maladresses
                      </h4>
                      <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300 list-disc list-inside font-semibold">
                        {selectedPastCall.evaluation?.erreurs?.map((err, i) => (
                          <li key={i}>{err}</li>
                        )) || <li>Aucune erreur signalée.</li>}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-teal-50 dark:bg-teal-950/20 p-4 rounded-xl border border-teal-100 dark:border-teal-900/40">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 mb-1.5 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        Points à Améliorer
                      </h4>
                      <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300 list-disc list-inside font-semibold">
                        {selectedPastCall.evaluation?.pointsAmeliorer?.map((pt, i) => (
                          <li key={i}>{pt}</li>
                        )) || <li className="italic">Aucun point.</li>}
                      </ul>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/40">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1.5 flex items-center gap-1">
                        <HelpCircle className="w-4 h-4 text-amber-600" />
                        Conseils personnalisés
                      </h4>
                      <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300 list-disc list-inside font-semibold">
                        {selectedPastCall.evaluation?.conseils?.map((pt, i) => (
                          <li key={i}>{pt}</li>
                        )) || <li className="italic">Aucun conseil.</li>}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Call Transcript Section */}
                {selectedPastCall.transcript && (
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Transcription de l'appel</h4>
                    <div className="space-y-2 bg-slate-50 dark:bg-slate-950/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 max-h-48 overflow-y-auto">
                      {selectedPastCall.transcript.map((msg, mIdx) => (
                        <div 
                          key={mIdx} 
                          className={`flex flex-col ${msg.role === "agent" ? "items-end" : "items-start"}`}
                        >
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold mb-0.5">
                            {msg.role === "agent" ? "Vous (Conseiller)" : "Client"}
                          </span>
                          <p className={`text-xs p-2.5 rounded-lg max-w-[85%] font-semibold ${msg.role === "agent" ? "bg-teal-50 dark:bg-teal-950/60 text-teal-950 dark:text-teal-100 border border-teal-100 dark:border-teal-900/40 rounded-tr-none" : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-tl-none"}`}>
                            {msg.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
