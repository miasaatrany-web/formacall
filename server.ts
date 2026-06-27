import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Initialize Gemini SDK with User-Agent header for telemetry as required by the skill
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in the environment variables.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// ==========================================
// FALLBACK ENGINES FOR GEMINI API LIMITS
// ==========================================

function getFallbackClientReply(agentInput: string, history: any[], clientProfile: any): { reply: string; action: string; isFallback: boolean } {
  const text = (agentInput || "").toLowerCase();
  const firstName = clientProfile?.firstName || "Client";
  const mood = (clientProfile?.mood || "").toLowerCase();
  
  const isGreeting = text.includes("bonjour") || text.includes("bienvenue") || text.includes("enchante");
  const isGoodbye = text.includes("au revoir") || text.includes("bonne journée") || text.includes("bonne soiree") || text.includes("raccor") || text.includes("quitter");
  const isPolite = text.includes("s'il vous plaît") || text.includes("s'il vous plait") || text.includes("merci");
  const isApology = text.includes("désolé") || text.includes("navré") || text.includes("pardon") || text.includes("excuse");
  
  const isIdentity = text.includes("identi") || text.includes("numéro de contrat") || text.includes("nom") || text.includes("prénom") || text.includes("contrat") || text.includes("email") || text.includes("adresse") || text.includes("téléphone");
  const isPriceReduction = text.includes("réduction") || text.includes("geste") || text.includes("remise") || text.includes("offrir") || text.includes("rembourser") || text.includes("rabais") || text.includes("promo") || text.includes("cadeau") || text.includes("diminuer");
  const isPriceContest = text.includes("cher") || text.includes("tarif") || text.includes("prix") || text.includes("facture") || text.includes("paye") || text.includes("coûte") || text.includes("hausse") || text.includes("augmentation") || text.includes("mensualité");
  const isTechResolution = text.includes("redémarrer") || text.includes("brancher") || text.includes("débrancher") || text.includes("test") || text.includes("voyant") || text.includes("panne") || text.includes("réseau") || text.includes("technicien") || text.includes("box") || text.includes("câble");
  const isRudeOrImpatient = mood.includes("colère") || mood.includes("impatient") || mood.includes("stressé") || mood.includes("agacé") || mood.includes("fermé");

  const messageCount = history ? history.length : 0;

  if (isGoodbye) {
    return {
      reply: "Merci à vous également pour ces précisions. Bonne journée, au revoir.",
      action: "continue",
      isFallback: true
    };
  }

  if (isGreeting && messageCount <= 1) {
    if (clientProfile?.raisonAppel) {
      return {
        reply: `Bonjour. Je m'appelle ${firstName}. ${clientProfile.raisonAppel}`,
        action: "continue",
        isFallback: true
      };
    }
    return {
      reply: `Bonjour, je suis ${firstName}. J'ai un souci avec mon service et j'aimerais qu'on en discute.`,
      action: "continue",
      isFallback: true
    };
  }

  if (isIdentity && messageCount <= 3) {
    return {
      reply: `Oui, bien sûr. Mon numéro de contrat est le 83921-X, et je suis bien ${clientProfile?.firstName || "Jean"} ${clientProfile?.lastName || "Dubois"}. Est-ce que vous accédez bien à ma fiche ?`,
      action: "continue",
      isFallback: true
    };
  }

  if (isPriceReduction) {
    return {
      reply: "D'accord, c'est un geste appréciable. Quelle sera la nouvelle mensualité exacte et pour combien de temps ?",
      action: "continue",
      isFallback: true
    };
  }

  if (isTechResolution) {
    return {
      reply: "D'accord, je viens de faire la manipulation. Je débranche... j'attends... et je rebranche. Les voyants clignotent. Ah, le voyant internet redevient vert stable ! On dirait que ça remarche !",
      action: "continue",
      isFallback: true
    };
  }

  if (isApology) {
    return {
      reply: "Je comprends bien, l'important c'est de trouver une solution rapide à mon problème.",
      action: "continue",
      isFallback: true
    };
  }

  if (isPriceContest) {
    return {
      reply: `Je trouve que le montant de ${clientProfile?.product || "mon offre"} reste très élevé par rapport à ce que propose la concurrence pour les mêmes services. Pouvez-vous faire un geste de fidélité ou m'orienter vers une offre plus adaptée ?`,
      action: "continue",
      isFallback: true
    };
  }

  if (messageCount > 8 && isRudeOrImpatient) {
    return {
      reply: "Écoutez, je perds mon temps et cette discussion ne mène à rien. Je préfère raccrocher et m'adresser ailleurs. Au revoir !",
      action: "hang_up",
      isFallback: true
    };
  }

  if (messageCount > 10) {
    return {
      reply: "Très bien, votre proposition me convient. Pouvez-vous s'il vous plaît m'envoyer la confirmation et le récapitulatif par e-mail ?",
      action: "continue",
      isFallback: true
    };
  }

  const genericReplies = [
    "D'accord, je comprends. Mais que proposez-vous concrètement pour résoudre ma situation aujourd'hui ?",
    "Pouvez-vous m'en dire plus sur les modalités de cette offre ?",
    "Très bien, mais est-ce que cela va impacter ma période d'engagement ou mon matériel ?",
    "C'est noté. Y a-t-il d'autres frais cachés ou est-ce le prix final net tout compris ?",
    "D'accord, je veux bien y réfléchir si cela me permet de conserver un service de qualité."
  ];

  const randomReply = genericReplies[messageCount % genericReplies.length];

  return {
    reply: randomReply,
    action: "continue",
    isFallback: true
  };
}

function getFallbackEvaluation(campaignName: string, callType: string, clientProfile: any, history: any[], duration: number): any {
  const msgCount = history ? history.length : 0;
  const agentMsgs = (history || []).filter(m => m.role === "agent" || m.role === "advisor");
  
  let scorePoliteness = 80;
  let scoreAccueil = 75;
  let scoreActiveListening = 80;
  let scoreEmpathy = 75;
  let scoreObjections = 70;
  let scoreReformulation = 70;
  let scoreScript = 75;
  let scoreConclusion = 75;

  const agentTexts = agentMsgs.map(m => (m.text || "").toLowerCase());
  const agentFullText = agentTexts.join(" ");

  if (agentFullText.includes("bonjour") || agentFullText.includes("bienvenue")) {
    scoreAccueil = 90;
    scorePoliteness = 85;
  }
  if (agentFullText.includes("merci") || agentFullText.includes("s'il vous plaît") || agentFullText.includes("s'il vous plait")) {
    scorePoliteness += 10;
  }
  if (agentFullText.includes("zaïasa") || agentFullText.includes("zaiasa") || agentFullText.includes("telecom")) {
    scoreAccueil += 10;
  }

  if (agentFullText.includes("comprends") || agentFullText.includes("désolé") || agentFullText.includes("navré") || agentFullText.includes("parfaitement")) {
    scoreEmpathy = 85;
  }

  if (agentFullText.includes("réduction") || agentFullText.includes("geste") || agentFullText.includes("remise") || agentFullText.includes("offrir") || agentFullText.includes("proposer")) {
    scoreObjections = 80;
  }

  if (agentFullText.includes("si je comprends bien") || agentFullText.includes("vous m'indiquez que") || agentFullText.includes("vous dites que") || agentFullText.includes("reformuler")) {
    scoreReformulation = 85;
  }

  if (agentFullText.includes("au revoir") || agentFullText.includes("bonne journée") || agentFullText.includes("remercie") || agentFullText.includes("confirmer")) {
    scoreConclusion = 85;
  }

  scorePoliteness = Math.min(scorePoliteness, 100);
  scoreAccueil = Math.min(scoreAccueil, 100);
  scoreEmpathy = Math.min(scoreEmpathy, 100);
  scoreObjections = Math.min(scoreObjections, 100);
  scoreReformulation = Math.min(scoreReformulation, 100);
  scoreConclusion = Math.min(scoreConclusion, 100);

  const averageScore = Math.round(
    (scoreScript + scoreAccueil + scorePoliteness + scoreActiveListening + scoreEmpathy + 
     scoreReformulation + scoreObjections + scoreConclusion) / 8
  );

  let result = "Client satisfait";
  let explanation = "La simulation s'est déroulée de manière fluide. L'agent a fait preuve de professionnalisme et d'écoute active.";
  
  if (agentFullText.includes("réduction") || agentFullText.includes("geste") || agentFullText.includes("remise") || agentFullText.includes("valider")) {
    result = callType === "incoming" ? "Problème résolu" : "Vente conclue";
    explanation = "L'agent a parfaitement traité les demandes et objections du client en proposant une solution ciblée ou un geste commercial convaincant.";
  } else if (msgCount < 4) {
    result = "Appel abandonné";
    explanation = "L'appel a été trop court pour évaluer correctement la démarche commerciale complète du conseiller.";
  } else if (agentFullText.includes("raccrocher") || agentFullText.includes("fermer") || scorePoliteness < 60) {
    result = "Client insatisfait";
    explanation = "Le conseiller n'a pas su rassurer le client ni traiter ses objections de manière satisfaisante, générant de la frustration.";
  }

  return {
    isFallback: true,
    score: averageScore,
    result: result,
    explicationResultat: explanation,
    criteria: {
      respectScript: scoreScript,
      accueil: scoreAccueil,
      politesse: scorePoliteness,
      ecouteActive: scoreActiveListening,
      empathie: scoreEmpathy,
      reformulation: scoreReformulation,
      decouverteBesoins: 75,
      gestionObjections: scoreObjections,
      argumentation: 75,
      confiance: 80,
      clarteExplications: 80,
      fluidite: 80,
      gestionTemps: 85,
      conclusion: scoreConclusion
    },
    phrasesReussies: [
      agentTexts.find(t => t.includes("bonjour")) ? "L'accueil et la politesse de départ étaient parfaits." : "L'agent s'est exprimé poliment et clairement.",
      agentTexts.find(t => t.includes("comprends")) ? "L'utilisation de l'empathie ('Je comprends tout à fait') a permis d'apaiser l'échange." : "La posture professionnelle générale était rassurante."
    ],
    erreurs: [
      msgCount < 6 ? "L'entretien est trop superficiel, passez plus de temps à poser des questions de découverte." : "Tentez d'approfondir les besoins réels du client par des questions ouvertes.",
      !agentFullText.includes("reformuler") ? "Pensez à reformuler l'objection du client avant d'y répondre directement." : "Soignez davantage l'explication pas à pas des options du forfait."
    ],
    expressionsAEviter: [
      "Je ne sais pas",
      "C'est comme ça",
      "Attendez une minute"
    ],
    expressionsRecommandees: [
      "Je vérifie immédiatement cette information pour vous",
      "Je comprends tout à fait votre point de vue et vos arguments",
      "Puis-je vous suggérer une alternative plus économique ?"
    ],
    etapesOubliees: [
      !agentFullText.includes("contrat") ? "Validation explicite du numéro de contrat ou de l'identité." : "Validation et récapitulatif final de l'accord."
    ].filter(Boolean),
    conseils: [
      "Assurez-vous de valider l'identité de l'appelant au tout début de la conversation (étape d'identification du script).",
      "Reformulez systématiquement pour valider que vous avez bien cerné l'objection majeure du client avant de proposer une réduction tarifaire."
    ],
    agentSpeakTimePercent: 48,
    clientSpeakTimePercent: 52,
    durationSeconds: duration || 85,
    nextExercise: {
      title: "Maîtrise du rebond commercial et empathie active",
      description: "Entraînez-vous à accueillir les réclamations tarifaires avec empathie et à rebondir habilement sur des options de fidélisation adaptées.",
      objective: "Savoir désamorcer la frustration liée au prix pour orienter vers de la valeur.",
      instructions: "Refaites une simulation avec le même client, mais concentrez-vous sur l'écoute active et la reformulation avant de parler de prix."
    }
  };
}

// ==========================================
// API ROUTES WITH COMPREHENSIVE FALLBACKS
// ==========================================

// API Route: Generate an entire dynamic scenario before starting the simulation
app.post("/api/gemini/generate-scenario", async (req, res) => {
  const { campaignId, campaignName, campaignDescription, callType, possibleClients, tips, proExpressions, wordsToAvoid } = req.body;

  if (!campaignName || !callType) {
    return res.status(400).json({ error: "Missing required fields (campaignName, callType)" });
  }

  // Select a baseline client template to mutate
  const clientsList = possibleClients || [];
  const baselineClient = clientsList.length > 0 
    ? clientsList[Math.floor(Math.random() * clientsList.length)] 
    : { firstName: "Anonyme", lastName: "Client", age: 40, city: "Paris", profession: "Employé", product: "Inconnu", mood: "Neutre", objective: "Inconnu", history: "Nouveau client" };

  try {
    const ai = getGeminiClient();

    const prompt = `
Vous êtes un concepteur pédagogique de formations pour centres d'appels téléphoniques.
Générez un scénario complet et réaliste de simulation d'appel client pour la campagne suivante en français.

Détails de la campagne :
- ID : ${campaignId}
- Nom de la campagne : ${campaignName}
- Type de flux : ${callType === "incoming" ? "Appel Entrant (Le client appelle le service client)" : "Appel Sortant (Le conseiller appelle le prospect/client)"}
- Description : ${campaignDescription}

Modèle de base pour le client (à faire varier et à enrichir pour créer de la nouveauté) :
- Prénom : ${baselineClient.firstName}
- Nom : ${baselineClient.lastName}
- Âge : ${baselineClient.age} ans
- Ville : ${baselineClient.city}
- Profession : ${baselineClient.profession}
- Produit actuellement détenu : ${baselineClient.product}
- Humeur initiale : ${baselineClient.mood}
- Objectif/Situation : ${baselineClient.objective}
- Historique chez nous : ${baselineClient.history}

CONSIGNES DE VARIATION ET D'AUTOMATION :
1. Créez un profil client UNIQUE basé sur le modèle de base, mais modifiez légèrement le nom, l'âge, la ville de résidence, sa profession exacte, et surtout son humeur pour rendre chaque simulation différente ! (ex: au lieu de juste "très en colère", soyez précis comme "froid et exigeant", "très pressé et stressé par sa journée", "très méfiant envers la téléprospection suite à des arnaques").
2. Déterminez de façon logique :
   - les informations précises qu'il connaît (son forfait, son prix, ses soucis passés, etc.)
   - les informations qu'il ignore (nos offres promotionnelles secrètes, l'aspect technique d'une box, etc.)
   - la raison exacte de l'appel (pourquoi cet appel a lieu à cet instant précis)
   - 3 objections concrètes qu'il formulera si le conseiller tente de lui proposer un produit/service ou de résoudre la panne
   - 3 réponses professionnelles ou comportements qu'il attend du conseiller pour être satisfait
   - 3 critères de réussite clairs et mesurables pour cet appel
3. Format de réponse attendu : un objet JSON valide contenant l'ensemble de ces informations en français.

Générez la structure JSON exacte ci-dessous sans aucun bloc de texte markdown :
{
  "clientProfile": {
    "firstName": "Prénom choisi",
    "lastName": "Nom choisi",
    "gender": "homme ou femme (en fonction du prénom choisi, soyez cohérent)",
    "age": 45,
    "city": "Ville choisie",
    "profession": "Profession choisie",
    "product": "Produit choisi",
    "mood": "Nuance d'humeur unique choisie",
    "objective": "Objectif personnel du client pour cet appel",
    "history": "Historique de relation enrichi",
    "phone": "06 xx xx xx xx (numéro de téléphone fictif aléatoire)"
  },
  "infosConnues": [
    "Détail connu 1",
    "Détail connu 2",
    "Détail connu 3"
  ],
  "infosIgnorees": [
    "Détail ignoré 1",
    "Détail ignoré 2"
  ],
  "raisonAppel": "Explication concrète de la raison d'appel",
  "objectionsPossibles": [
    "Objection 1",
    "Objection 2",
    "Objection 3"
  ],
  "reponsesAttendues": [
    "Attente 1",
    "Attente 2",
    "Attente 3"
  ],
  "criteresReussite": [
    "Critère 1",
    "Critère 2",
    "Critère 3"
  ]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 1.0, // Higher temperature for high variation and uniqueness
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            clientProfile: {
              type: Type.OBJECT,
              properties: {
                firstName: { type: Type.STRING },
                lastName: { type: Type.STRING },
                gender: { type: Type.STRING, enum: ["homme", "femme"] },
                age: { type: Type.INTEGER },
                city: { type: Type.STRING },
                profession: { type: Type.STRING },
                product: { type: Type.STRING },
                mood: { type: Type.STRING },
                objective: { type: Type.STRING },
                history: { type: Type.STRING },
                phone: { type: Type.STRING },
              },
              required: [
                "firstName",
                "lastName",
                "gender",
                "age",
                "city",
                "profession",
                "product",
                "mood",
                "objective",
                "history",
                "phone",
              ],
            },
            infosConnues: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            infosIgnorees: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            raisonAppel: { type: Type.STRING },
            objectionsPossibles: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            reponsesAttendues: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            criteresReussite: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            "clientProfile",
            "infosConnues",
            "infosIgnorees",
            "raisonAppel",
            "objectionsPossibles",
            "reponsesAttendues",
            "criteresReussite",
          ],
        },
      },
    });

    const scenarioText = response.text || "{}";
    const scenarioData = JSON.parse(scenarioText.trim());
    res.json(scenarioData);
  } catch (error) {
    console.log("[GEMINI] Info: Using high-fidelity offline fallback generator for scenario.");
    
    // Select Gender intelligently
    const selectedGender = baselineClient.gender || (
      baselineClient.firstName && ["jean", "pierre", "michel", "philippe", "alain", "nicolas", "christophe", "didier", "marc", "antoine", "lucas", "guillaume", "julien"].some(n => baselineClient.firstName.toLowerCase().includes(n)) ? "homme" : "femme"
    );

    const fallbackScenario = {
      isFallback: true,
      clientProfile: {
        firstName: baselineClient.firstName || (selectedGender === "homme" ? "Jean-Pierre" : "Marie-Hélène"),
        lastName: baselineClient.lastName || "Dubois",
        gender: selectedGender,
        age: baselineClient.age || 45,
        city: baselineClient.city || "Lyon",
        profession: baselineClient.profession || "Cadre administratif",
        product: baselineClient.product || "Forfait Standard",
        mood: baselineClient.mood || "Un peu impatient mais ouvert à la discussion",
        objective: baselineClient.objective || "Comprendre la hausse récente sur sa facture",
        history: baselineClient.history || "Client fidèle depuis 3 ans, aucun incident de paiement.",
        phone: `0${Math.floor(Math.random() * 2) + 6} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10}`
      },
      infosConnues: [
        `Possède l'abonnement depuis 18 mois à 34.99€ par mois.`,
        `Le prélèvement de ce mois est de 39.99€, soit 5€ d'augmentation.`,
        `N'a jamais eu de retard de paiement et utilise le service quotidiennement.`
      ],
      infosIgnorees: [
        `La fin de l'offre promotionnelle initiale de 12 mois.`,
        `L'ajout automatique d'une option d'appels vers l'international sans engagement.`,
        `La possibilité de réajuster l'offre vers un forfait plus économique de fidélité.`
      ],
      raisonAppel: callType === "incoming" 
        ? "Appelle pour comprendre la hausse surprise de sa facture et envisage de résilier."
        : "Est recontacté pour faire un bilan de satisfaction et proposer une mise à jour d'abonnement.",
      objectionsPossibles: [
        "Je n'ai pas été informé de cette augmentation tarifaire.",
        "Je ne me sers pas des options supplémentaires qu'on m'a rajoutées.",
        "Les prix des concurrents sont plus bas à services équivalents."
      ],
      reponsesAttendues: [
        "Des excuses claires pour le manque d'informations sur la fin de promo.",
        "Une explication calme et professionnelle des conditions tarifaires.",
        "Une proposition commerciale avantageuse (geste ou forfait moins cher)."
      ],
      criteresReussite: [
        "Identifier le client poliment et pratiquer l'écoute active.",
        "Faire preuve de réelle empathie face au mécontentement du prix.",
        "Proposer un ajustement commercial ou un forfait sur-mesure satisfaisant.",
        "Valider formellement l'accord du client avant de raccrocher."
      ]
    };
    res.json(fallbackScenario);
  }
});

// API Route: AI Client simulation response (Acts and reacts like a real customer)
app.post("/api/gemini/simulate", async (req, res) => {
  const { campaignName, callType, campaignDescription, clientProfile, history, agentInput } = req.body;

  if (!campaignName || !clientProfile || !history) {
    return res.status(400).json({ error: "Missing required fields (campaignName, clientProfile, history)" });
  }

  try {
    const ai = getGeminiClient();

    // Extract dynamic scenario details if they exist, or build fallback
    const infosConnues = clientProfile.infosConnues ? clientProfile.infosConnues.join(", ") : "Non spécifié";
    const infosIgnorees = clientProfile.infosIgnorees ? clientProfile.infosIgnorees.join(", ") : "Non spécifié";
    const raisonAppel = clientProfile.raisonAppel || "Non spécifiée";
    const objectionsPossibles = clientProfile.objectionsPossibles ? clientProfile.objectionsPossibles.join(", ") : "Non spécifié";
    const reponsesAttendues = clientProfile.reponsesAttendues ? clientProfile.reponsesAttendues.join(", ") : "Non spécifié";
    const criteresReussite = clientProfile.criteresReussite ? clientProfile.criteresReussite.join(", ") : "Non spécifié";

    // Build rich system instruction for a high-intelligence client simulation
    const systemInstruction = `
Vous êtes un client humain engagé dans une conversation téléphonique réelle avec un conseiller de centre d'appels.
Vous devez incarner ce rôle de manière EXTRÊMEMENT réaliste, dynamique et cohérente.

Informations sur la campagne :
- Nom : ${campaignName}
- Type d'appel : ${callType}
- Description : ${campaignDescription}

Votre identité de client (Incarnez-la à 100% !) :
- Nom : ${clientProfile.firstName} ${clientProfile.lastName}
- Âge : ${clientProfile.age} ans
- Ville : ${clientProfile.city}
- Profession : ${clientProfile.profession}
- Produit détenu : ${clientProfile.product}
- Humeur et émotions : ${clientProfile.mood} (C'est votre fil conducteur comportemental !)
- Votre objectif d'appel : ${clientProfile.objective}
- Votre historique chez eux : ${clientProfile.history}

VOTRE SCÉNARIO COMPLET DE CLIENT :
- Raison de l'appel : ${raisonAppel}
- Ce que vous connaissez : ${infosConnues}
- Ce que vous ignorez de base : ${infosIgnorees}
- Vos objections potentielles : ${objectionsPossibles}
- Les réponses ou postures que vous attendez : ${reponsesAttendues}
- Critères qui vous feront dire oui (réussite) : ${criteresReussite}

RÈGLES D'INTERACTION DE L'IA CLIENT :
1. ÉCOUTE ET MÉMOIRE : Écoutez attentivement le conseiller. Gardez en mémoire tout ce qui a été dit précédemment dans l'appel. Ne vous répétez pas inutilement, sauf si vous êtes agacé ou si le conseiller ne répond pas à votre question.
2. PAS DE TEXTE FIXE : Ne récitez jamais un texte pré-écrit. Formulez vos phrases de manière vivante, parlée, naturelle. Vos répliques doivent être courtes (1 à 3 phrases maximum) pour correspondre au rythme d'une vraie conversation téléphonique.
3. ADAPTATION COMPORTEMENTALE : Ajustez votre ton et votre ouverture d'esprit selon la qualité de l'argumentation du conseiller. S'il est poli, empathique et utilise de bons arguments, devenez plus coopératif, détendu et réceptif. S'il est hésitant, froid ou insistant sans écouter vos besoins, devenez plus fermé, sceptique ou irrité.
4. PRISE DE DÉCISION : N'acceptez une offre ou un rendez-vous que si le conseiller a réellement présenté des arguments convaincants, a répondu de manière satisfaisante à vos objections, et a créé une relation de confiance. S'il ne fait aucun effort, refusez poliment mais fermement.
5. RÉACTIONS AUX ERREURS : Si le conseiller commet des maladresses importantes (ex: ton condescendant, phrases robotiques, oubli flagrant de politesse, ignorance de votre problème, argumentation agressive, non-respect de vos objections, silence gênant ou bafouillage excessif), réagissez comme un vrai client :
   - Demandez une précision ("Qu'est-ce que vous voulez dire par là ?")
   - Exprimez un doute ("Je ne suis pas sûr que ce soit légal/possible...")
   - Montrez votre mécontentement ("Écoutez, je trouve que vous insistez beaucoup...")
   - Demandez à parler à un responsable ("Je préférerais échanger avec votre superviseur s'il vous plaît.")
   - Demandez un rappel ("Rappelez-moi demain, là je n'ai vraiment pas le temps.")
   - RACCROCHEZ si l'interaction est catastrophique ou insupportable.

IMPORTANT : Vous devez retourner un objet JSON contenant :
- "reply" : Votre réplique vocale en français. Pas d'indications scéniques entre parenthèses. Écrivez uniquement les paroles dites.
- "action" : L'action comportementale correspondante parmi :
    - "continue" (si la conversation se poursuit normalement)
    - "ask_manager" (si vous demandez à parler à un responsable)
    - "ask_callback" (si vous demandez à être rappelé plus tard)
    - "hang_up" (si vous décidez de raccrocher à cause d'une trop mauvaise expérience ou d'une impasse totale).
`;

    const contents = `
Voici l'historique complet de notre appel jusqu'à présent :
${history.map((m: any) => `${m.role === "agent" ? "Conseiller" : "Client (Vous)"}: ${m.text}`).join("\n")}

Dernière réplique du Conseiller : "${agentInput}"

Générez votre réponse JSON contenant votre "reply" et votre "action" en français. Rédigez uniquement du JSON valide sans aucun markdown.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.7,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING, description: "Votre réplique vocale en français sans indications scéniques entre parenthèses." },
            action: {
              type: Type.STRING,
              enum: ["continue", "ask_manager", "ask_callback", "hang_up"],
              description: "L'action comportementale correspondante : 'continue', 'ask_manager', 'ask_callback' ou 'hang_up'."
            }
          },
          required: ["reply", "action"]
        }
      },
    });

    const replyText = response.text || "{}";
    const replyData = JSON.parse(replyText.trim());
    res.json(replyData);
  } catch (error) {
    console.log("[GEMINI] Info: Using high-fidelity offline fallback engine for simulation.");
    const fallbackData = getFallbackClientReply(agentInput, history, clientProfile);
    res.json(fallbackData);
  }
});

// API Route: AI Evaluation of call performance against 14 criteria & outcomes & targeted exercises
app.post("/api/gemini/evaluate", async (req, res) => {
  const { campaignName, callType, campaignDescription, clientProfile, history, duration } = req.body;

  if (!campaignName || !clientProfile || !history) {
    return res.status(400).json({ error: "Missing required fields for evaluation" });
  }

  try {
    const ai = getGeminiClient();

    const evaluationPrompt = `
Analysez cette conversation de formation téléphonique francophone de centre d'appels.
Vous devez réaliser une évaluation approfondie, objective, et extrêmement constructive des performances du conseiller.

Informations de contexte :
- Campagne : ${campaignName}
- Type d'appel : ${callType}
- Description : ${campaignDescription}

Profil et Scénario du client :
- Nom : ${clientProfile.firstName} ${clientProfile.lastName}
- Humeur initiale : ${clientProfile.mood}
- Objectif : ${clientProfile.objective}
- Raison de l'appel : ${clientProfile.raisonAppel || "Non spécifié"}
- Objections attendues : ${clientProfile.objectionsPossibles ? clientProfile.objectionsPossibles.join(", ") : "Non spécifié"}
- Attentes du client : ${clientProfile.reponsesAttendues ? clientProfile.reponsesAttendues.join(", ") : "Non spécifié"}
- Critères de réussite du scénario : ${clientProfile.criteresReussite ? clientProfile.criteresReussite.join(", ") : "Non spécifié"}

Transcript complet de la conversation :
${JSON.stringify(history, null, 2)}

Durée totale : ${duration} secondes

CONSIGNES D'ÉVALUATION STRIP-BY-STRIP :
1. Calculez une note globale sur 100 points, basée sur une moyenne pondérée cohérente des 14 critères ci-dessous.
2. Notez précisément chacun de ces 14 critères sur 100 points :
   - respectScript : Respect du script de formation imposé.
   - accueil : Qualité de l'accueil et de la présentation de l'entreprise.
   - politesse : Politesse, courtoisie, formules d'usage.
   - ecouteActive : Écoute active (laisser le client parler, ne pas lui couper la parole).
   - empathie : Empathie et considération pour la situation ou le mécontentement du client.
   - reformulation : Reformulation claire des besoins ou du problème exprimé.
   - decouverteBesoins : Découverte approfondie des besoins par des questions adaptées.
   - gestionObjections : Capacité à traiter les objections de manière constructive sans s'énerver.
   - argumentation : Force et clarté de l'argumentation professionnelle.
   - confiance : Capacité à instaurer une relation de confiance et de crédibilité.
   - clarteExplications : Clarté et vulgarisation des explications techniques/commerciales.
   - fluidite : Fluidité de la conversation et ton dynamique/souriant.
   - gestionTemps : Gestion du temps (pas de blancs excessifs ni de longueur inutile).
   - conclusion : Qualité de la conclusion de l'appel et de la prise de congé réglementaire.
3. Déterminez le RÉSULTAT RÉEL final de la simulation parmi cette liste exclusive :
   - "Vente conclue"
   - "Vente refusée"
   - "Rendez-vous obtenu"
   - "Rendez-vous refusé"
   - "Client satisfait"
   - "Client insatisfait"
   - "Problème résolu"
   - "Problème non résolu"
   - "Client demande un rappel"
   - "Client raccroche"
   - "Appel abandonné"
   - "Escalade vers un superviseur"
4. EXPLICATION DU RÉSULTAT : Expliquez clairement et précisément pourquoi ce résultat a été obtenu (ex: "La vente n'a pas été conclue car le conseiller n'a pas présenté les avantages de l'offre et n'a pas répondu correctement aux objections du client.").
5. Rédigez des listes d'éléments textuels concrets issus du transcript :
   - "phrasesReussies" : les phrases du conseiller qui étaient excellentes et bien formulées.
   - "erreurs" : les erreurs commises, bafouillages, ou mauvaises formulations détectées.
   - "expressionsAEviter" : expressions maladroites utilisées ou à éviter en centre d'appels.
   - "expressionsRecommandees" : expressions professionnelles de remplacement que le conseiller aurait dû utiliser.
   - "etapesOubliees" : étapes clés du script ou obligations réglementaires omises.
   - "conseils" : des conseils personnalisés et concrets pour progresser.
6. ENTRAÎNEMENT CIBLÉ : Générez un nouvel exercice d'entraînement sur-mesure (nextExercise) ciblé sur la faiblesse principale détectée chez l'agent lors de cet appel, afin qu'il puisse s'améliorer au prochain essai ! (ex: si l'agent a mal géré l'objection du prix, créez un mini-jeu centré sur le prix).

Retournez UNIQUEMENT un objet JSON valide contenant exactement cette structure (sans bloc markdown) :
{
  "score": 85,
  "result": "Vente conclue",
  "explicationResultat": "La vente a été conclue car le conseiller a fait preuve...",
  "criteria": {
    "respectScript": 80,
    "accueil": 90,
    "politesse": 95,
    "ecouteActive": 85,
    "empathie": 80,
    "reformulation": 75,
    "decouverteBesoins": 80,
    "gestionObjections": 70,
    "argumentation": 80,
    "confiance": 85,
    "clarteExplications": 90,
    "fluidite": 85,
    "gestionTemps": 90,
    "conclusion": 85
  },
  "phrasesReussies": [
    "Phrase réussie 1",
    "Phrase réussie 2"
  ],
  "erreurs": [
    "Erreur commise 1"
  ],
  "expressionsAEviter": [
    "Expression à éviter"
  ],
  "expressionsRecommandees": [
    "Expression recommandée"
  ],
  "etapesOubliees": [
    "Étape oubliée 1"
  ],
  "conseils": [
    "Conseil personnalisé 1"
  ],
  "agentSpeakTimePercent": 48,
  "clientSpeakTimePercent": 52,
  "durationSeconds": 135,
  "nextExercise": {
    "title": "Titre du nouvel exercice ciblé",
    "description": "Description succincte de l'exercice proposé",
    "objective": "Objectif pédagogique principal (ex: Traitement du refus de prix)",
    "instructions": "Consigne d'entraînement pour le conseiller"
  }
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: evaluationPrompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            result: { 
              type: Type.STRING,
              enum: [
                "Vente conclue",
                "Vente refusée",
                "Rendez-vous obtenu",
                "Rendez-vous refusé",
                "Client satisfait",
                "Client insatisfait",
                "Problème résolu",
                "Problème non résolu",
                "Client demande un rappel",
                "Client raccroche",
                "Appel abandonné",
                "Escalade vers un superviseur"
              ]
            },
            explicationResultat: { type: Type.STRING },
            criteria: {
              type: Type.OBJECT,
              properties: {
                respectScript: { type: Type.INTEGER },
                accueil: { type: Type.INTEGER },
                politesse: { type: Type.INTEGER },
                ecouteActive: { type: Type.INTEGER },
                empathie: { type: Type.INTEGER },
                reformulation: { type: Type.INTEGER },
                decouverteBesoins: { type: Type.INTEGER },
                gestionObjections: { type: Type.INTEGER },
                argumentation: { type: Type.INTEGER },
                confiance: { type: Type.INTEGER },
                clarteExplications: { type: Type.INTEGER },
                fluidite: { type: Type.INTEGER },
                gestionTemps: { type: Type.INTEGER },
                conclusion: { type: Type.INTEGER }
              },
              required: [
                "respectScript", "accueil", "politesse", "ecouteActive", "empathie",
                "reformulation", "decouverteBesoins", "gestionObjections", "argumentation",
                "confiance", "clarteExplications", "fluidite", "gestionTemps", "conclusion"
              ]
            },
            phrasesReussies: { type: Type.ARRAY, items: { type: Type.STRING } },
            erreurs: { type: Type.ARRAY, items: { type: Type.STRING } },
            expressionsAEviter: { type: Type.ARRAY, items: { type: Type.STRING } },
            expressionsRecommandees: { type: Type.ARRAY, items: { type: Type.STRING } },
            etapesOubliees: { type: Type.ARRAY, items: { type: Type.STRING } },
            conseils: { type: Type.ARRAY, items: { type: Type.STRING } },
            agentSpeakTimePercent: { type: Type.INTEGER },
            clientSpeakTimePercent: { type: Type.INTEGER },
            durationSeconds: { type: Type.INTEGER },
            nextExercise: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                objective: { type: Type.STRING },
                instructions: { type: Type.STRING }
              },
              required: ["title", "description", "objective", "instructions"]
            }
          },
          required: [
            "score", "result", "explicationResultat", "criteria", "phrasesReussies",
            "erreurs", "expressionsAEviter", "expressionsRecommandees", "etapesOubliees",
            "conseils", "agentSpeakTimePercent", "clientSpeakTimePercent", "durationSeconds",
            "nextExercise"
          ]
        }
      },
    });

    const evaluationText = response.text || "{}";
    const evaluationData = JSON.parse(evaluationText.trim());
    res.json(evaluationData);
  } catch (error) {
    console.log("[GEMINI] Info: Using high-fidelity offline fallback engine for evaluation.");
    const fallbackEvaluation = getFallbackEvaluation(campaignName, callType, clientProfile, history, duration);
    res.json(fallbackEvaluation);
  }
});

export default app;

// Configure Vite middleware or serve static assets based on environment
async function startServer() {
  // Only listen if we're not being used as a serverless function
  if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
    if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
}

startServer();
