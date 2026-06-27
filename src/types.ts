export interface UserProfile {
  firstName: string;
  lastName: string;
  username: string;
  level: number;
  xp: number;
  completedCampaignsCount: number;
  totalCallsCount: number;
  averageScore: number;
  badges: string[];
  role?: "admin" | "user";
  isActivated?: boolean;
  activationCode?: string;
}

export interface CallMessage {
  id: string;
  role: "agent" | "client";
  text: string;
  timestamp: string;
}

export interface ClientProfile {
  firstName: string;
  lastName: string;
  gender?: "homme" | "femme";
  age: number;
  city: string;
  profession: string;
  product: string;
  mood: string;
  objective: string;
  history: string;
  phone: string;
  // Advanced Dynamic Scenario attributes
  infosConnues?: string[];
  infosIgnorees?: string[];
  raisonAppel?: string;
  objectionsPossibles?: string[];
  reponsesAttendues?: string[];
  criteresReussite?: string[];
}

export interface CallEvaluation {
  score: number;
  result: string;
  explicationResultat: string;
  criteria: {
    respectScript: number;
    accueil: number;
    politesse: number;
    ecouteActive: number;
    empathie: number;
    reformulation: number;
    decouverteBesoins: number;
    gestionObjections: number;
    argumentation: number;
    confiance: number;
    clarteExplications: number;
    fluidite: number;
    gestionTemps: number;
    conclusion: number;
  };
  phrasesReussies: string[];
  erreurs: string[];
  expressionsAEviter: string[];
  expressionsRecommandees: string[];
  etapesOubliees: string[];
  conseils: string[];
  agentSpeakTimePercent: number;
  clientSpeakTimePercent: number;
  durationSeconds: number;
  nextExercise?: {
    title: string;
    description: string;
    objective: string;
    instructions: string;
  };
}

export interface HistoricalCall {
  id: string;
  campaignId: string;
  campaignName: string;
  callType: "incoming" | "outgoing";
  date: string;
  duration: number;
  result: string;
  score: number;
  evaluation: CallEvaluation;
  transcript: { role: "agent" | "client"; text: string }[];
}
