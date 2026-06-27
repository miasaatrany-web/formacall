import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Campaign } from "./campaigns";
import { UserProfile, CallMessage, ClientProfile } from "./types";
import AuthScreen from "./components/AuthScreen";
import DashboardScreen from "./components/DashboardScreen";
import LearningScreen from "./components/LearningScreen";
import SimulationScreen from "./components/SimulationScreen";
import EvaluationScreen from "./components/EvaluationScreen";
import { ShieldAlert, LogOut, Loader2, Sun, Moon } from "lucide-react";

// Centralized Admin IDs
const ADMIN_IDS = ["miasaatrany_gmail_com", "miasaatrany"];
const isUserAdminUid = (uid: string | null) => uid ? ADMIN_IDS.includes(uid.toLowerCase()) : false;

export default function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Dark Mode state (default to true for gorgeous immersive dark blue-green theme)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("zaiasa_dark_mode");
    return saved !== null ? saved === "true" : true;
  });

  useEffect(() => {
    localStorage.setItem("zaiasa_dark_mode", String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);
  // Screen routing state
  const [screen, setScreen] = useState<"auth" | "dashboard" | "learning" | "simulation" | "evaluation">("auth");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedCallType, setSelectedCallType] = useState<"incoming" | "outgoing" | null>(null);

  // Active call data
  const [transcript, setTranscript] = useState<CallMessage[]>([]);
  const [duration, setDuration] = useState(0);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);

  // 1. Restore session on mount
  useEffect(() => {
    const savedUserId = localStorage.getItem("zaiasa_user_id");
    if (savedUserId) {
      setUserId(savedUserId);
      fetchUserProfile(savedUserId);
    } else {
      setScreen("auth");
      setLoading(false);
    }
  }, []);

  // Fetch the user profile from Cloud Firestore or localStorage
  const fetchUserProfile = async (uid: string) => {
    setLoading(true);
    try {
      const userDocRef = doc(db, "users", uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const profileData = docSnap.data() as UserProfile;
        if (isUserAdminUid(uid)) {
          profileData.role = "admin";
          profileData.isActivated = true;
        }
        setUserProfile(profileData);
        localStorage.setItem(`zaiasa_profile_${uid}`, JSON.stringify(profileData));
        setScreen("dashboard");
      } else {
        // Fallback profile if somehow missing in firestore
        const fallbackName = uid.charAt(0).toUpperCase() + uid.slice(1);
        const defaultProfile: UserProfile = {
          firstName: fallbackName,
          lastName: "",
          username: uid,
          level: 1,
          xp: 0,
          completedCampaignsCount: 0,
          totalCallsCount: 0,
          averageScore: 0,
          badges: ["Bienvenue 🎉"],
          role: isUserAdminUid(uid) ? "admin" : "user",
          isActivated: isUserAdminUid(uid) ? true : false
        };
        try {
          await setDoc(userDocRef, defaultProfile);
        } catch (setErr) {
          console.warn("Could not write initial profile to firestore", setErr);
        }
        setUserProfile(defaultProfile);
        localStorage.setItem(`zaiasa_profile_${uid}`, JSON.stringify(defaultProfile));
        setScreen("dashboard");
      }
    } catch (err) {
      console.warn("Error fetching user profile:", err);
      // Fallback to local profile to prevent blocking the user
      const localKey = `zaiasa_profile_${uid}`;
      const localData = localStorage.getItem(localKey);
      if (localData) {
        try {
          const profile = JSON.parse(localData) as UserProfile;
          if (isUserAdminUid(uid)) {
            profile.role = "admin";
            profile.isActivated = true;
          }
          setUserProfile(profile);
          setScreen("dashboard");
          return;
        } catch (e) {}
      }
      
      const fallbackName = uid.charAt(0).toUpperCase() + uid.slice(1);
      const fallbackProfile: UserProfile = {
        firstName: fallbackName,
        lastName: "",
        username: uid,
        level: 1,
        xp: 0,
        completedCampaignsCount: 0,
        totalCallsCount: 0,
        averageScore: 0,
        badges: ["Bienvenue 🎉"],
        role: isUserAdminUid(uid) ? "admin" : "user",
        isActivated: isUserAdminUid(uid) ? true : false
      };
      localStorage.setItem(localKey, JSON.stringify(fallbackProfile));
      setUserProfile(fallbackProfile);
      setScreen("dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (uid: string) => {
    setUserId(uid);
    fetchUserProfile(uid);
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      localStorage.removeItem("zaiasa_user_id");
      setUserId(null);
      setUserProfile(null);
      setScreen("auth");
    } catch (err) {
      console.error("Error signing out:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCampaign = (campaign: Campaign, type: "incoming" | "outgoing") => {
    setSelectedCampaign(campaign);
    setSelectedCallType(type);
    setScreen("learning");
  };

  const handleReadyToSimulate = () => {
    setScreen("simulation");
  };

  const handleCallEnded = (finalTranscript: CallMessage[], finalDuration: number, finalClient: ClientProfile) => {
    setTranscript(finalTranscript);
    setDuration(finalDuration);
    setClientProfile(finalClient);
    setScreen("evaluation");
  };

  const handleEvaluationFinished = async () => {
    setLoading(true);
    if (userId) {
      // Refresh statistics & profile from db
      await fetchUserProfile(userId);
    }
    setScreen("dashboard");
  };

  // Global loading skeleton
  if (loading && screen === "auth") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-center transition-colors">
        <Loader2 className="w-10 h-10 text-teal-600 dark:text-teal-400 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 font-sans">Chargement de l'application ZAIASA...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 selection:bg-teal-500/30 selection:text-teal-900 dark:selection:text-teal-100 ${
      darkMode ? "bg-slate-950 text-slate-100 dark" : "bg-slate-50 text-slate-900"
    }`}>
      {screen === "auth" && (
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      )}

      {screen === "dashboard" && userProfile && userId && (
        <DashboardScreen 
          userId={userId}
          userProfile={userProfile} 
          onSelectCampaign={handleSelectCampaign}
          onLogout={handleLogout}
          onRefreshProfile={() => fetchUserProfile(userId)}
        />
      )}

      {screen === "learning" && selectedCampaign && selectedCallType && (
        <LearningScreen 
          campaign={selectedCampaign}
          callType={selectedCallType}
          isActivated={userProfile?.isActivated === true || userProfile?.role === "admin" || isUserAdminUid(userId)}
          onReady={handleReadyToSimulate}
          onBack={() => setScreen("dashboard")}
        />
      )}

      {screen === "simulation" && selectedCampaign && selectedCallType && (
        <SimulationScreen 
          campaign={selectedCampaign}
          callType={selectedCallType}
          onCallEnded={handleCallEnded}
          onBack={() => setScreen("learning")}
        />
      )}

      {screen === "evaluation" && selectedCampaign && selectedCallType && clientProfile && userId && (
        <EvaluationScreen 
          userId={userId}
          campaign={selectedCampaign}
          callType={selectedCallType}
          transcript={transcript}
          duration={duration}
          clientProfile={clientProfile}
          onFinished={handleEvaluationFinished}
        />
      )}

      {/* Floating Theme Toggle (Green-Blue / Teal Highlight) */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="fixed bottom-6 right-6 z-50 p-3.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-teal-600 dark:text-teal-400 rounded-full shadow-lg border-2 border-teal-500/30 hover:border-teal-500 transition-all active:scale-95 flex items-center justify-center cursor-pointer group"
        title={darkMode ? "Passer en mode clair" : "Passer en mode sombre"}
        id="theme-toggle-btn"
      >
        {darkMode ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out text-[11px] font-bold uppercase tracking-wider pl-0 group-hover:pl-2 whitespace-nowrap">
          {darkMode ? "Mode Clair" : "Mode Sombre"}
        </span>
      </button>
    </div>
  );
}
