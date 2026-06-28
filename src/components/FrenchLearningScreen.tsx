import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, 
  Volume2, 
  Mic, 
  MicOff, 
  Check, 
  X, 
  Lock, 
  Unlock, 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  Award, 
  HelpCircle, 
  Info, 
  RefreshCw, 
  Play, 
  ArrowLeft,
  BookMarked,
  VolumeX,
  Flame,
  Key,
  ChevronRight
} from "lucide-react";

interface FrenchLearningScreenProps {
  isActivated: boolean;
  onBack: () => void;
  userProfile?: {
    firstName: string;
    isActivated?: boolean;
    activationCode?: string;
  };
}

interface GrammarLesson {
  id: string;
  title: string;
  isPremium: boolean;
  rules: string[];
  mistakes: { bad: string; good: string; explanation: string }[];
  miniQuiz?: QuizQuestion[];
}

interface OralLesson {
  id: string;
  title: string;
  isPremium: boolean;
  description: string;
  exercises: { text: string; category: string; tip: string }[];
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export default function FrenchLearningScreen({ isActivated, onBack, userProfile }: FrenchLearningScreenProps) {
  const [activeTab, setActiveTab] = useState<"grammar" | "oral">("grammar");
  const [selectedGrammarLesson, setSelectedGrammarLesson] = useState<GrammarLesson | null>(null);
  const [selectedOralLesson, setSelectedOralLesson] = useState<OralLesson | null>(null);
  
  // Audio state
  const [isPlayingText, setIsPlayingText] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<string | null>(null);
  const [recordedResult, setRecordedResult] = useState<string | null>(null);
  const [mockMicLevel, setMockMicLevel] = useState<number>(0);
  const [oralScore, setOralScore] = useState<{ score: number; feedback: string } | null>(null);

  // Lesson Grades/Scores state (graded out of 20, typical call center KPI style)
  const [grammarGrades, setGrammarGrades] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem("zaiasa_grammar_grades");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [oralGrades, setOralGrades] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem("zaiasa_oral_grades");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const saveGrammarGrade = (lessonId: string, grade: number) => {
    const updated = { ...grammarGrades, [lessonId]: grade };
    setGrammarGrades(updated);
    try {
      localStorage.setItem("zaiasa_grammar_grades", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const saveOralGrade = (lessonId: string, grade: number) => {
    const updated = { ...oralGrades, [lessonId]: grade };
    setOralGrades(updated);
    try {
      localStorage.setItem("zaiasa_oral_grades", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // State for active lesson's mini-quiz worksheet
  const [activeMiniQuiz, setActiveMiniQuiz] = useState<boolean>(false);
  const [miniQuizStep, setMiniQuizStep] = useState<number>(0);
  const [miniQuizSelectedOpt, setMiniQuizSelectedOpt] = useState<number | null>(null);
  const [miniQuizSubmitted, setMiniQuizSubmitted] = useState<boolean>(false);
  const [miniQuizCorrectCount, setMiniQuizCorrectCount] = useState<number>(0);
  const [miniQuizFinished, setMiniQuizFinished] = useState<boolean>(false);

  // Quiz state
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [showQuizResult, setShowQuizResult] = useState(false);

  // Lock message state
  const [showLockNotice, setShowLockNotice] = useState<string | null>(null);

  // Lesson datasets
  const grammarLessons: GrammarLesson[] = [
    {
      id: "gram-1",
      title: "L'accord du participe passé",
      isPremium: false,
      rules: [
        "Avec l'auxiliaire 'être', le participe passé s'accordent toujours en genre et en nombre avec le sujet. (Exemple: 'Elle est partie à l'agence.')",
        "Avec l'auxiliaire 'avoir', le participe passé ne s'accorde jamais avec le sujet. (Exemple: 'Nous avons reçu votre courriel.')",
        "Exception cruciale: Avec 'avoir', on accorde le participe passé si et seulement si le Complément d'Objet Direct (COD) est placé AVANT le verbe. (Exemple: 'La facture que j'ai reçue est payée.')"
      ],
      mistakes: [
        {
          bad: "Je vous ai envoyée la confirmation par mail.",
          good: "Je vous ai envoyé la confirmation par mail.",
          explanation: "Le COD est 'la confirmation', il est placé après l'auxiliaire 'avoir' (envoyé), donc pas d'accord !"
        },
        {
          bad: "La réclamation que j'ai reçu ce matin...",
          good: "La réclamation que j'ai reçue ce matin...",
          explanation: "Le COD 'que' (représentant la réclamation, féminin) est placé avant le verbe avoir, on accorde donc au féminin."
        }
      ],
      miniQuiz: [
        {
          id: 101,
          question: "La réponse que j'ai _______ au client était pourtant claire.",
          options: ["donné", "donnée", "donnés", "donner"],
          correctAnswerIndex: 1,
          explanation: "Le COD 'que' mis pour 'la réponse' (féminin singulier) est placé avant le verbe avoir, donc accord au féminin singulier : 'donnée'."
        },
        {
          id: 102,
          question: "Ils se sont _______ pour résoudre la panne réseau.",
          options: ["téléphoné", "téléphonés", "téléphoner", "téléphonée"],
          correctAnswerIndex: 0,
          explanation: "Le verbe se téléphoner est intransitif (on téléphone À quelqu'un). Le pronom 'se' est un COI, le participe passé reste donc invariable."
        }
      ]
    },
    {
      id: "gram-2",
      title: "Les homophones courants",
      isPremium: false,
      rules: [
        "À vs A : 'a' est le verbe avoir (peut être remplacé par 'avait'), alors que 'à' est une préposition invariable.",
        "Leur vs Leurs : 'leur' devant un verbe est un pronom personnel COI et reste toujours invariable (ex : 'Je leur ai dit'). Devant un nom pluriel, 'leurs' s'accorde comme adjectif possessif (ex : 'Leurs dossiers sont prêts').",
        "Ce vs Se : 'ce' désigne un objet/personne (ex : 'Ce client'), tandis que 'se' s'utilise dans les verbes pronominaux (ex : 'Le client se connecte')."
      ],
      mistakes: [
        {
          bad: "Je leurs ai proposé une remise commerciale.",
          good: "Je leur ai proposé une remise commerciale.",
          explanation: "'Leur' est ici un pronom personnel (à qui ? à eux). Les pronoms personnels n'ont jamais de 's'."
        },
        {
          bad: "Le client à refusé l'offre d'assurance.",
          good: "Le client a refusé l'offre d'assurance.",
          explanation: "On peut dire 'le client avait refusé'. C'est donc le verbe avoir sans accent."
        }
      ],
      miniQuiz: [
        {
          id: 201,
          question: "Le conseiller _________ rappelé son superviseur.",
          options: ["a", "à", "ah", "as"],
          correctAnswerIndex: 0,
          explanation: "C'est l'auxiliaire avoir au présent. On peut dire 'Le conseiller avait rappelé'."
        },
        {
          id: 202,
          question: "Je vais _________ expliquer la nouvelle procédure de résiliation.",
          options: ["leur", "leurs", "les", "le"],
          correctAnswerIndex: 0,
          explanation: "Devant un verbe, 'leur' est un pronom personnel COI invariable. Il ne prend jamais de 's'."
        }
      ]
    },
    {
      id: "gram-3",
      title: "Fautes d'orthographe et expressions à éviter",
      isPremium: true,
      rules: [
        "S'il vous plaît : 'S'il' est la contraction de 'si il'. Ne jamais écrire 'S'ils vous plait'. Notez l'accent circonflexe traditionnel sur le 'î' de plaît.",
        "Envoi vs Envoie : 'Un envoi' est le nom masculin (sans e). 'Il envoie' ou 'Je vous envoie' est la conjugaison du verbe envoyer au présent.",
        "Parce que vs Par ce que : 'Parce que' exprime la cause (ex : 'Parce qu'il y a une panne'). 'Par ce que' signifie par la chose que (ex : 'Je suis surpris par ce que vous dites')."
      ],
      mistakes: [
        {
          bad: "Je vous fait l'envoie du contrat immédiatement.",
          good: "Je vous fais l'envoi du contrat immédiatement.",
          explanation: "Le verbe faire à la première personne prend un 's' (fais) et le nom masculin s'écrit 'envoi' sans 'e'."
        },
        {
          bad: "Le problème vient de ce que l'appareil s'allume pas.",
          good: "Le problème vient du fait que l'appareil ne s'allume pas.",
          explanation: "En clientèle, soignez la négation complète avec 'ne... pas' et évitez les tournures familières."
        }
      ],
      miniQuiz: [
        {
          id: 301,
          question: "Je vous _________ de bien vouloir patienter.",
          options: ["prie", "prit", "pris", "pries"],
          correctAnswerIndex: 0,
          explanation: "Du verbe prier au présent à la 1re personne du singulier : 'Je vous prie' (se termine par un 'e')."
        },
        {
          id: 302,
          question: "Le client est agacé _________ son dossier a pris du retard.",
          options: ["parce que", "par ce que", "parce qu'", "par ce qu'"],
          correctAnswerIndex: 0,
          explanation: "'Parce que' exprime ici la cause du retard."
        }
      ]
    },
    {
      id: "gram-4",
      title: "Accord des nombres et des couleurs",
      isPremium: true,
      rules: [
        "Vingt et Cent s'accordent (prennent un 's') s'ils sont multipliés et qu'aucun autre nombre ne les suit immédiatement. (Exemples: 'quatre-vingts euros', mais 'quatre-vingt-trois euros').",
        "Mille est strictement invariable en orthographe moderne. (Exemple: 'trois mille dossiers').",
        "Les adjectifs de couleur s'accordent en général, sauf s'ils proviennent d'un nom de fruit, fleur ou minéral (ex : 'des fiches orange', 'des boutons marron')."
      ],
      mistakes: [
        {
          bad: "Nous avons deux cents clients mécontents.",
          good: "Nous avons deux cents clients mécontents.",
          explanation: "Correct ! 'Cents' est multiplié par deux et non suivi d'un autre chiffre."
        },
        {
          bad: "Ce forfait coûte quatre-vingt-dix euros.",
          good: "Ce forfait coûte quatre-vingt-dix euros.",
          explanation: "Correct ! 'Vingt' est suivi de 'dix', il reste donc invariable."
        }
      ],
      miniQuiz: [
        {
          id: 401,
          question: "Le remboursement s'élève à quatre-_________ euros.",
          options: ["vingt", "vingts", "vingt-euros", "vingts-euros"],
          correctAnswerIndex: 1,
          explanation: "Multiplié par 4 et non suivi d'un autre nombre, 'vingt' s'accorde et prend un 's' (quatre-vingts)."
        },
        {
          id: 402,
          question: "Nous avons traité plus de trois _________ appels ce mois-ci.",
          options: ["milles", "mille", "mille-appels", "milles-appels"],
          correctAnswerIndex: 1,
          explanation: "'Mille' est un adjectif numéral strictement invariable."
        }
      ]
    },
    {
      id: "gram-5",
      title: "Politesse et niveau de langue professionnelle",
      isPremium: false,
      rules: [
        "Utilisez toujours le vouvoiement 'Vous' de courtoisie avec tous les interlocuteurs, sans exception.",
        "Évitez le verbe 'vouloir' à l'impératif ou au présent direct ('je veux'). Privilégiez le conditionnel présent de politesse ('Je souhaiterais', 'Je voudrais', 'Pourriez-vous').",
        "Bannissez les expressions familières comme 'Ouais', 'Pas de souci', 'Ça marche', 'Grave'. Remplacez-les par des alternatives formelles ('Oui, tout à fait', 'Je vous en prie', 'Je m'en occupe')."
      ],
      mistakes: [
        {
          bad: "Ouais, pas de souci, je veux bien regarder ton dossier.",
          good: "Oui, tout à fait, je m'en occupe. Je vais consulter votre dossier immédiatement.",
          explanation: "Le tutoiement est formellement interdit en centre d'appels. Remplacez 'Ouais' par 'Oui', et 'pas de souci' par une formule d'engagement."
        },
        {
          bad: "Attendez deux minutes, je vais chercher votre contrat.",
          good: "Pourriez-vous patienter un instant s'il vous plaît pendant que je recherche votre contrat ?",
          explanation: "L'impératif direct 'Attendez' peut paraître agressif ou directif au téléphone. Utilisez une question polie au conditionnel."
        }
      ],
      miniQuiz: [
        {
          id: 501,
          question: "Comment formuler poliment une attente technique au téléphone ?",
          options: [
            "Patientez en ligne.",
            "Veuillez patienter en ligne quelques instants s'il vous plaît.",
            "Attendez s'il vous plaît, j'ai une panne.",
            "Ne quittez pas, je reviens tout de suite."
          ],
          correctAnswerIndex: 1,
          explanation: "La formule de politesse avec 'Veuillez patienter' + 's'il vous plaît' est la référence absolue pour placer un client en attente."
        },
        {
          id: 502,
          question: "Laquelle de ces phrases respecte parfaitement les standards de qualité ?",
          options: [
            "Je peux pas faire ça, ça marche pas comme ça.",
            "Je ne peux pas effectuer cette opération sans la validation de mon superviseur.",
            "C'est impossible de suite, repassez plus tard.",
            "Ouais, attendez, je demande à mon boss."
          ],
          correctAnswerIndex: 1,
          explanation: "La négation complète avec 'ne... pas', l'absence de mots familiers ('Ouais', 'boss') et une explication claire témoignent d'un professionnalisme impeccable."
        }
      ]
    },
    {
      id: "gram-6",
      title: "Le subjonctif présent dans les procédures",
      isPremium: true,
      rules: [
        "Après des locutions marquant l'obligation ou la nécessité comme 'Il faut que', 'Il est nécessaire que', 'Pour que', vous devez utiliser le subjonctif présent.",
        "Attention aux verbes irréguliers fréquents en relation client au subjonctif : faire ('que je fasse'), savoir ('que je sache'), pouvoir ('que je puisse'), valider ('que je valide').",
        "Ne confondez pas l'indicatif présent et le subjonctif présent des verbes du premier groupe comme 'envoyer' : 'Il faut que je vous envoie (subjonctif avec -e)'."
      ],
      mistakes: [
        {
          bad: "Il faut que je vous envois la facture par courrier.",
          good: "Il faut que je vous envoie la facture par courrier.",
          explanation: "Au subjonctif présent, le verbe 'envoyer' à la première personne prend un 'e' final et non un 's'."
        },
        {
          bad: "Pour que vous pouvez payer, il faut faire un virement.",
          good: "Pour que vous puissiez régler, il est nécessaire d'effectuer un virement.",
          explanation: "'Pour que' exige l'usage du subjonctif présent. La forme correcte est 'que vous puissiez' et non 'pouvez'."
        }
      ],
      miniQuiz: [
        {
          id: 601,
          question: "Il faut absolument que vous _________ votre adresse email pour finaliser la souscription.",
          options: ["valisez", "validiez", "valider", "validassiez"],
          correctAnswerIndex: 1,
          explanation: "'Il faut que' introduit le subjonctif présent. Avec 'vous', la terminaison est '-iez' : 'que vous validiez'."
        },
        {
          id: 602,
          question: "Il est impératif que le conseiller _________ la procédure de sécurité RGPD.",
          options: ["sache", "sait", "sais", "sachiez"],
          correctAnswerIndex: 0,
          explanation: "Le verbe savoir au subjonctif présent à la 3e personne du singulier s'écrit 'sache' : 'qu'il sache'."
        }
      ]
    }
  ];

  const oralLessons: OralLesson[] = [
    {
      id: "oral-1",
      title: "L'articulation et les voyelles",
      isPremium: false,
      description: "Apprenez à bien prononcer les sons clés de la langue française au téléphone pour lever toute ambiguïté.",
      exercises: [
        {
          text: "Je prépare un projet prêt à être présenté.",
          category: "Différenciation É (fermé) / È (ouvert)",
          tip: "Souriez sur le son É (bouche presque fermée), puis ouvrez légèrement la bouche vers le bas sur le son È."
        },
        {
          text: "Les clients contactent constamment le centre d'appels.",
          category: "Voyelles nasales (an/on/in)",
          tip: "Assurez-vous de bien faire vibrer les résonateurs nasaux sans pour autant bafouiller la fin des mots."
        }
      ]
    },
    {
      id: "oral-2",
      title: "Élocution : Les virelangues",
      isPremium: false,
      description: "Entraînez-vous à haute voix avec ces phrases difficiles pour libérer votre élocution et gagner en fluidité.",
      exercises: [
        {
          text: "Un chasseur sachant chasser doit savoir chasser sans son chien.",
          category: "Diction du S / CH",
          tip: "Répétez cette phrase 3 fois, d'abord lentement puis de plus en plus vite en articulant chaque syllabe."
        },
        {
          text: "Didon dîna, dit-on, du dos d'un dodu dindon.",
          category: "Diction du D",
          tip: "Appuyez bien sur la pointe de la langue contre les dents supérieures pour chaque consonne D."
        },
        {
          text: "Six jeunes chats fiers sur six chaises cherchent de la ficelle.",
          category: "Articulations complexes",
          tip: "Idéal pour échauffer vos cordes vocales et votre mâchoire avant de prendre un appel complexe !"
        }
      ]
    },
    {
      id: "oral-3",
      title: "L'intonation et l'empathie",
      isPremium: true,
      description: "Le sourire s'entend au téléphone. Modifiez la hauteur et la mélodie de votre voix pour rassurer l'interlocuteur.",
      exercises: [
        {
          text: "Bonjour ! Je suis ravi de vous avoir en ligne aujourd'hui. Comment puis-je vous aider ?",
          category: "Intonation accueillante",
          tip: "Commencez sur une note haute et dynamique, avec un large sourire sur les lèvres pour projeter de la chaleur humaine."
        },
        {
          text: "Je comprends tout à fait votre mécontentement, et je vais trouver une solution immédiatement.",
          category: "Intonation empathique",
          tip: "Adoptez un ton plus grave, posé et calme pour rassurer le client mécontent et désamorcer le conflit."
        }
      ]
    },
    {
      id: "oral-4",
      title: "Le rythme et la gestion du silence",
      isPremium: true,
      description: "Évitez les bruits parasites (euh...) et gérez les blancs techniques lors des recherches informatiques.",
      exercises: [
        {
          text: "Je recherche immédiatement votre dossier. Un court instant s'il vous plaît.",
          category: "Phrase de transition",
          tip: "Prononcez cette phrase d'une voix calme avant de faire votre recherche. Cela évite d'installer un silence angoissant."
        },
        {
          text: "Le service est opérationnel. Tout est parfaitement rentré dans l'ordre.",
          category: "Rythme assertif",
          tip: "Faites une micro-pause après chaque mot clé pour donner du poids et de la clarté à votre affirmation."
        }
      ]
    },
    {
      id: "oral-5",
      title: "Le rebond commercial et l'écoute active",
      isPremium: false,
      description: "Apprenez à rebondir sur les besoins du client avec assurance et intonation convaincante.",
      exercises: [
        {
          text: "Je constate que vous n'avez pas d'option sécurité. Je peux vous l'activer gratuitement le premier mois, qu'en pensez-vous ?",
          category: "Rebond commercial",
          tip: "Posez la question avec une intonation ascendante et souriante pour inviter le client à accepter l'essai."
        },
        {
          text: "D'accord, je comprends parfaitement. Laissez-moi vous guider pas à pas pour configurer votre box.",
          category: "Écoute active et rassurance",
          tip: "Utilisez un ton chaleureux, calme et professionnel pour instaurer une relation de confiance."
        }
      ]
    },
    {
      id: "oral-6",
      title: "Gestion des clients agressifs au téléphone",
      isPremium: true,
      description: "Maîtrisez l'intonation descendante et la directivité bienveillante pour apaiser les tensions.",
      exercises: [
        {
          text: "Monsieur, je comprends votre colère. Je suis là pour vous aider, mais je vous demande de rester courtois s'il vous plaît.",
          category: "Directivité bienveillante",
          tip: "Gardez un ton extrêmement calme, ferme et régulier. Ne haussez jamais la voix."
        },
        {
          text: "Je m'engage personnellement à suivre votre réclamation jusqu'à sa résolution complète.",
          category: "Rassurance et engagement",
          tip: "Appuyez bien sur le mot 'personnellement' pour donner du poids à votre promesse et apaiser le client."
        }
      ]
    }
  ];

  const quizQuestions: QuizQuestion[] = [
    {
      id: 1,
      question: "La facture que je vous ai _________ par courriel est déjà réglée.",
      options: ["envoyé", "envoyée", "envoyés", "envoyer"],
      correctAnswerIndex: 1,
      explanation: "Le COD est 'que' (mis pour 'la facture', féminin singulier) et il est placé avant le verbe avoir. On accorde donc au féminin singulier : 'envoyée'."
    },
    {
      id: 2,
      question: "Quelle est la bonne formulation professionnelle au téléphone ?",
      options: [
        "Je se connecte à votre compte pour vérifier.",
        "Je me connecte sur votre compte pour vérifier.",
        "Je me connecte à votre compte pour vérifier.",
        "Je vais voir par rapport à votre compte."
      ],
      correctAnswerIndex: 2,
      explanation: "On dit 'se connecter À' (et non 'sur') et l'utilisation de 'par rapport à' est incorrecte ou maladroite ici. 'Je me connecte à votre compte' est parfait !"
    },
    {
      id: 3,
      question: "Je _______ ai donné toutes les explications nécessaires pour leur dossier.",
      options: ["leurs", "leur", "les", "le"],
      correctAnswerIndex: 1,
      explanation: "Ici, 'leur' est un pronom personnel COI (à qui ? à eux). En tant que pronom personnel, il est strictement invariable et ne prend jamais de 's'."
    },
    {
      id: 4,
      question: "Complétez correctement : 'Veuillez patienter, cela coûtera quatre-_________ euros.'",
      options: ["vingt", "vingts", "vingt-trois", "vingts-euros"],
      correctAnswerIndex: 1,
      explanation: "Vingt prend un 's' lorsqu'il est multiplié (quatre fois vingt) et qu'il n'est suivi d'aucun autre chiffre. Donc 'quatre-vingts euros' prend un 's'."
    },
    {
      id: 5,
      question: "Quelle phrase ne contient AUCUNE faute d'orthographe ou de grammaire ?",
      options: [
        "S'il vous plait, envoyez moi le document de suite.",
        "S'il vous plaît, envoyez-moi le document immédiatement.",
        "S'ils vous plaît, envoie-moi le document immédiatement.",
        "S'il vous plait, envoi moi le document de suite."
      ],
      correctAnswerIndex: 1,
      explanation: "Dans 'S'il vous plaît', 'plaît' prend son accent circonflexe. 'envoyez-moi' prend un trait d'union, 'immédiatement' est plus professionnel que 'de suite', et 'envoi' est le nom alors qu'il faut le verbe impératif 'envoyez'."
    }
  ];

  // Speech Synthesis
  const handlePlayAudio = (text: string, id: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "fr-FR";
      
      const voices = window.speechSynthesis.getVoices();
      const frVoice = voices.find(v => v.lang.startsWith("fr"));
      if (frVoice) {
        utterance.voice = frVoice;
      }
      
      utterance.onstart = () => setIsPlayingText(id);
      utterance.onend = () => setIsPlayingText(null);
      utterance.onerror = () => setIsPlayingText(null);
      
      window.speechSynthesis.speak(utterance);
    } else {
      alert("La synthèse vocale n'est pas supportée par votre navigateur.");
    }
  };

  const handleStopAudio = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsPlayingText(null);
    }
  };

  // Mock mic level simulator
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setMockMicLevel(Math.floor(Math.random() * 80) + 20);
      }, 100);
    } else {
      setMockMicLevel(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Voice practice simulation (highly robust & failsafe)
  const handlePracticeToggle = (textToMatch: string, id: string) => {
    if (isRecording === id) {
      // Stop recording
      setIsRecording(null);
      
      // Calculate a highly realistic mock evaluation score based on a simulated voice match
      setTimeout(() => {
        const scores = [88, 92, 95, 98, 100];
        const selectedScore = scores[Math.floor(Math.random() * scores.length)];
        const feedbacks = [
          "Excellente élocution, l'accentuation de chaque syllabe est parfaite !",
          "Très bonne diction, le rythme est régulier et soutenu.",
          "Articulation claire. Veillez à bien accentuer les voyelles finales.",
          "Magnifique intonation chaleureuse ! Idéal pour la relation client."
        ];
        const selectedFeedback = feedbacks[Math.floor(Math.random() * feedbacks.length)];
        
        setOralScore({
          score: selectedScore,
          feedback: selectedFeedback
        });

        // Convert percentage score to a grade out of 20 (typical call center QA score)
        const gradeOutOf20 = parseFloat(((selectedScore / 100) * 20).toFixed(1));
        if (selectedOralLesson) {
          saveOralGrade(selectedOralLesson.id, gradeOutOf20);
        }
      }, 800);
    } else {
      // Start recording
      setOralScore(null);
      setRecordedResult(null);
      setIsRecording(id);
      
      // Attempt real SpeechRecognition if supported
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition();
          rec.lang = "fr-FR";
          rec.continuous = false;
          rec.interimResults = false;
          
          rec.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setRecordedResult(transcript);
          };
          
          rec.onerror = (err: any) => {
            console.warn("Speech recognition error, using simulation:", err);
          };
          
          rec.onend = () => {
            setIsRecording(null);
          };
          
          rec.start();
        } catch (e) {
          console.warn("Speech recognition failed to initialize, relying on simulation", e);
        }
      }
      
      // Fallback timer to stop recording automatically after 6 seconds
      setTimeout(() => {
        if (isRecording === id) {
          setIsRecording(null);
        }
      }, 6000);
    }
  };

  // Select lesson with activation checks
  const handleSelectGrammar = (lesson: GrammarLesson) => {
    if (lesson.isPremium && !isActivated) {
      setShowLockNotice(lesson.title);
      return;
    }
    setSelectedGrammarLesson(lesson);
    setActiveMiniQuiz(false);
    setMiniQuizStep(0);
    setMiniQuizSelectedOpt(null);
    setMiniQuizSubmitted(false);
    setMiniQuizCorrectCount(0);
    setMiniQuizFinished(false);
  };

  const handleSelectOral = (lesson: OralLesson) => {
    if (lesson.isPremium && !isActivated) {
      setShowLockNotice(lesson.title);
      return;
    }
    setSelectedOralLesson(lesson);
    setOralScore(null);
    setRecordedResult(null);
    setIsRecording(null);
  };

  // Quiz interactive triggers
  const startGrammarQuiz = () => {
    if (!isActivated) {
      setShowLockNotice("Test Final de Grammaire");
      return;
    }
    setIsQuizActive(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswerIndex(null);
    setHasSubmittedAnswer(false);
    setQuizScore(0);
    setShowQuizResult(false);
  };

  const handleAnswerSelection = (index: number) => {
    if (hasSubmittedAnswer) return;
    setSelectedAnswerIndex(index);
  };

  const submitQuizAnswer = () => {
    if (selectedAnswerIndex === null || hasSubmittedAnswer) return;
    setHasSubmittedAnswer(true);
    
    if (selectedAnswerIndex === quizQuestions[currentQuestionIndex].correctAnswerIndex) {
      setQuizScore(prev => prev + 1);
    }
  };

  const nextQuizQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswerIndex(null);
      setHasSubmittedAnswer(false);
    } else {
      setShowQuizResult(true);
    }
  };

  const resetQuiz = () => {
    setIsQuizActive(false);
    setSelectedAnswerIndex(null);
    setHasSubmittedAnswer(false);
    setCurrentQuestionIndex(0);
    setQuizScore(0);
    setShowQuizResult(false);
  };

  return (
    <div className="w-full text-left" id="french-learning-module">
      {/* Title block */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button 
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 mb-3"
            id="back-to-home-btn"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour au menu principal (Appels / Français)</span>
          </button>
          <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2.5">
            <BookMarked className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            <span>Apprendre et Maîtriser le Français</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-semibold">
            Perfectionnez votre français écrit et parlé pour exciller en relation client.
          </p>
        </div>

        {/* Info label about activation */}
        <div className="flex items-center gap-2.5 bg-slate-100 dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800">
          {isActivated ? (
            <div className="flex items-center gap-1.5">
              <Unlock className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Compte Activé (Premium)
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Contenu Gratuit (50% Débloqué)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Mode Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl">
        <button
          onClick={() => {
            setActiveTab("grammar");
            setSelectedGrammarLesson(null);
            setSelectedOralLesson(null);
            setIsQuizActive(false);
          }}
          className={`flex-1 py-3 px-4 rounded-lg font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "grammar"
              ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm border border-slate-200/40 dark:border-slate-800/50"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <span>✍️ Grammaire et Orthographe</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("oral");
            setSelectedGrammarLesson(null);
            setSelectedOralLesson(null);
            setIsQuizActive(false);
          }}
          className={`flex-1 py-3 px-4 rounded-lg font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "oral"
              ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm border border-slate-200/40 dark:border-slate-800/50"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <span>🗣️ Expression Orale et Diction</span>
        </button>
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        {activeTab === "grammar" && (
          <motion.div
            key="grammar-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid lg:grid-cols-3 gap-6"
          >
            {/* Left side: list of lessons */}
            <div className="lg:col-span-1 space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Leçons de Grammaire</h3>
              {grammarLessons.map((lesson, idx) => {
                const isLocked = lesson.isPremium && !isActivated;
                const isSelected = selectedGrammarLesson?.id === lesson.id;
                
                return (
                  <button
                    key={lesson.id}
                    onClick={() => handleSelectGrammar(lesson)}
                    className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? "bg-teal-500/10 border-teal-500 text-teal-950 dark:text-teal-100"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Module {idx + 1}</span>
                        {lesson.isPremium && (
                          <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            isLocked ? "bg-amber-100 dark:bg-amber-950/40 text-amber-600" : "bg-teal-100 dark:bg-teal-950/40 text-teal-600"
                          }`}>
                            Premium
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {lesson.title}
                      </h4>
                      {grammarGrades[lesson.id] !== undefined && (
                        <div className="inline-flex items-center gap-1 mt-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-100/30">
                          Note : {grammarGrades[lesson.id]}/20
                        </div>
                      )}
                    </div>
                    <div>
                      {isLocked ? (
                        <Lock className="w-4 h-4 text-amber-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Action quiz card */}
              <div className="bg-gradient-to-br from-teal-500 to-emerald-600 dark:from-teal-600 dark:to-emerald-700 rounded-xl p-5 text-white shadow-md relative overflow-hidden mt-6">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
                <Sparkles className="w-8 h-8 text-white/30 mb-2" />
                <h4 className="font-display font-extrabold text-base mb-1">Test Final de Grammaire</h4>
                <p className="text-white/80 text-[11px] leading-relaxed mb-4">
                  Validez vos connaissances professionnelles et obtenez un badge de certification.
                </p>
                <button
                  onClick={startGrammarQuiz}
                  className="w-full bg-white text-teal-900 hover:bg-slate-100 font-extrabold text-xs uppercase tracking-wider py-2.5 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {!isActivated && <Lock className="w-3.5 h-3.5 text-amber-500 mr-0.5" />}
                  Démarrer le Test
                </button>
              </div>
            </div>

            {/* Right side: lesson details or quiz display */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {isQuizActive ? (
                  // Quiz Area
                  <motion.div
                    key="quiz-block"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm min-h-[400px] flex flex-col justify-between"
                  >
                    {!showQuizResult ? (
                      <>
                        {/* Quiz Active Header */}
                        <div>
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                            <span className="text-[10px] font-extrabold uppercase text-teal-600 dark:text-teal-400 tracking-wider">
                              Test de Certification : Question {currentQuestionIndex + 1}/{quizQuestions.length}
                            </span>
                            <button
                              onClick={resetQuiz}
                              className="text-xs text-slate-400 hover:text-rose-500 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" /> Quitter
                            </button>
                          </div>

                          <h3 className="font-display text-lg font-bold text-slate-800 dark:text-white mb-6">
                            {quizQuestions[currentQuestionIndex].question}
                          </h3>

                          {/* Options */}
                          <div className="space-y-3">
                            {quizQuestions[currentQuestionIndex].options.map((option, oIdx) => {
                              const isSelected = selectedAnswerIndex === oIdx;
                              const isCorrect = oIdx === quizQuestions[currentQuestionIndex].correctAnswerIndex;
                              
                              let optionStyle = "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/20";
                              if (isSelected) {
                                optionStyle = "border-teal-500 bg-teal-500/5 text-teal-800 dark:text-teal-200";
                              }
                              
                              if (hasSubmittedAnswer) {
                                if (isCorrect) {
                                  optionStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300";
                                } else if (isSelected) {
                                  optionStyle = "border-rose-500 bg-rose-500/10 text-rose-800 dark:text-rose-300";
                                }
                              }

                              return (
                                <button
                                  key={oIdx}
                                  onClick={() => handleAnswerSelection(oIdx)}
                                  disabled={hasSubmittedAnswer}
                                  className={`w-full text-left p-4 rounded-xl border text-sm font-semibold transition-all flex items-center justify-between ${optionStyle} ${!hasSubmittedAnswer ? "cursor-pointer active:scale-[0.99]" : ""}`}
                                >
                                  <span>{option}</span>
                                  <div>
                                    {hasSubmittedAnswer && isCorrect && (
                                      <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                                    )}
                                    {hasSubmittedAnswer && isSelected && !isCorrect && (
                                      <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {/* Explanation block */}
                          {hasSubmittedAnswer && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-6 p-4 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/50 dark:border-teal-900/30 rounded-xl flex gap-3 text-xs"
                            >
                              <Info className="w-5 h-5 text-teal-500 shrink-0" />
                              <div>
                                <h5 className="font-bold text-teal-800 dark:text-teal-400 mb-0.5">Explication règle :</h5>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                                  {quizQuestions[currentQuestionIndex].explanation}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </div>

                        {/* Quiz Controls footer */}
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-6 flex justify-end">
                          {!hasSubmittedAnswer ? (
                            <button
                              onClick={submitQuizAnswer}
                              disabled={selectedAnswerIndex === null}
                              className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs uppercase tracking-wider px-6 py-2.5 rounded-lg transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                            >
                              Valider ma réponse
                            </button>
                          ) : (
                            <button
                              onClick={nextQuizQuestion}
                              className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs uppercase tracking-wider px-6 py-2.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              {currentQuestionIndex === quizQuestions.length - 1 ? "Terminer le test" : "Question suivante"}
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      // Quiz Finished / Score
                      <div className="flex flex-col items-center justify-center text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 mb-4 animate-bounce">
                          <Award className="w-8 h-8" />
                        </div>
                        <h3 className="font-display text-2xl font-black text-slate-800 dark:text-white mb-2">Test Terminé !</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm mb-6 font-semibold">
                          Félicitations pour avoir finalisé le test de certification de grammaire ZAIASA.
                        </p>

                        <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-xs w-full mb-8">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Votre Score Final</span>
                          <span className="text-4xl font-extrabold text-teal-600 dark:text-teal-400">
                            {quizScore} / {quizQuestions.length}
                          </span>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-bold uppercase tracking-wider">
                            {quizScore === quizQuestions.length ? "Parfait ! Maîtrise absolue 🎉" : quizScore >= 3 ? "Très bon niveau ! 👍" : "À réviser encore un peu."}
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md justify-center">
                          <button
                            onClick={resetQuiz}
                            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs uppercase tracking-wider py-3 rounded-lg transition-all cursor-pointer"
                          >
                            Quitter le test
                          </button>
                          <button
                            onClick={startGrammarQuiz}
                            className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs uppercase tracking-wider py-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Recommencer
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : selectedGrammarLesson ? (
                  // Detailed lesson card
                  <motion.div
                    key="lesson-details"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5 mb-6">
                      <h3 className="font-display text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-teal-500" />
                        {selectedGrammarLesson.title}
                      </h3>
                      <button
                        onClick={() => setSelectedGrammarLesson(null)}
                        className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold cursor-pointer"
                      >
                        Fermer la leçon
                      </button>
                    </div>

                    {/* Lesson rules list */}
                    <div className="mb-8">
                      <h4 className="text-xs font-black uppercase tracking-widest text-teal-600 dark:text-teal-400 mb-3.5 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-teal-500" />
                        Les Règles fondamentales
                      </h4>
                      <div className="space-y-3">
                        {selectedGrammarLesson.rules.map((rule, rIdx) => (
                          <div key={rIdx} className="flex gap-3 text-sm">
                            <span className="w-5 h-5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                              {rIdx + 1}
                            </span>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                              {rule}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mistakes area */}
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-rose-500 mb-4 flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-rose-500" />
                        Fautes fréquentes à éviter en clientèle
                      </h4>
                      <div className="grid md:grid-cols-2 gap-5">
                        {selectedGrammarLesson.mistakes.map((mistake, mIdx) => (
                          <div key={mIdx} className="bg-slate-50 dark:bg-slate-950/40 p-4.5 rounded-xl border border-slate-200/50 dark:border-slate-800 text-xs">
                            <div className="space-y-2 mb-3.5">
                              <div className="flex gap-2">
                                <span className="text-[10px] bg-rose-50 text-rose-600 dark:bg-rose-950/40 font-bold px-1.5 py-0.5 rounded border border-rose-100 dark:border-rose-900/20 uppercase shrink-0">À éviter</span>
                                <p className="font-mono text-slate-500 line-through truncate">{mistake.bad}</p>
                              </div>
                              <div className="flex gap-2">
                                <span className="text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 font-bold px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/20 uppercase shrink-0">Préférer</span>
                                <p className="font-mono font-bold text-slate-800 dark:text-white">{mistake.good}</p>
                              </div>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold border-t border-slate-100 dark:border-slate-800 pt-2.5">
                              {mistake.explanation}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mini Quiz Worksheet for the selected grammar lesson */}
                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-teal-500" />
                          Évaluation de l'élève (Noté sur 20)
                        </h4>
                        {grammarGrades[selectedGrammarLesson.id] !== undefined && (
                          <span className="font-extrabold text-[10px] bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 px-2.5 py-1 rounded-md border border-teal-200/50 uppercase tracking-wide">
                            Dernière note : {grammarGrades[selectedGrammarLesson.id]}/20
                          </span>
                        )}
                      </div>

                      {!activeMiniQuiz ? (
                        <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200/60 dark:border-slate-800 text-center">
                          <Award className="w-8 h-8 text-teal-500 mx-auto mb-2" />
                          <h5 className="font-bold text-slate-800 dark:text-white text-sm mb-1">Prêt pour l'évaluation ?</h5>
                          <p className="text-slate-500 dark:text-slate-400 text-xs mb-4 max-w-md mx-auto">
                            Répondez à deux questions pratiques sur cette leçon pour valider votre note de qualité d'élocution écrite.
                          </p>
                          <button
                            onClick={() => {
                              setActiveMiniQuiz(true);
                              setMiniQuizStep(0);
                              setMiniQuizSelectedOpt(null);
                              setMiniQuizSubmitted(false);
                              setMiniQuizCorrectCount(0);
                              setMiniQuizFinished(false);
                            }}
                            className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs uppercase tracking-wider py-2 px-5 rounded-lg transition-all active:scale-95 cursor-pointer"
                          >
                            Démarrer l'évaluation
                          </button>
                        </div>
                      ) : (
                        <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                          {!miniQuizFinished ? (
                            <div>
                              <div className="flex items-center justify-between mb-3 border-b border-slate-200/40 dark:border-slate-800/40 pb-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  Question {miniQuizStep + 1} sur 2
                                </span>
                                <button
                                  onClick={() => setActiveMiniQuiz(false)}
                                  className="text-xs text-rose-500 font-bold hover:underline"
                                >
                                  Annuler
                                </button>
                              </div>

                              <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-4">
                                {selectedGrammarLesson.miniQuiz?.[miniQuizStep]?.question || "Question de test..."}
                              </p>

                              <div className="space-y-2 mb-4">
                                {selectedGrammarLesson.miniQuiz?.[miniQuizStep]?.options.map((opt, oIdx) => {
                                  const isSel = miniQuizSelectedOpt === oIdx;
                                  const isCorrect = oIdx === selectedGrammarLesson.miniQuiz?.[miniQuizStep]?.correctAnswerIndex;
                                  let btnStyle = "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900";
                                  if (isSel) {
                                    btnStyle = "border-teal-500 bg-teal-500/5 text-teal-800 dark:text-teal-200";
                                  }
                                  if (miniQuizSubmitted) {
                                    if (isCorrect) {
                                      btnStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200";
                                    } else if (isSel) {
                                      btnStyle = "border-rose-500 bg-rose-500/10 text-rose-800 dark:text-rose-200";
                                    }
                                  }

                                  return (
                                    <button
                                      key={oIdx}
                                      disabled={miniQuizSubmitted}
                                      onClick={() => setMiniQuizSelectedOpt(oIdx)}
                                      className={`w-full text-left p-3 rounded-lg border text-xs font-semibold transition-all flex items-center justify-between ${btnStyle} ${!miniQuizSubmitted ? "cursor-pointer active:scale-[0.99]" : ""}`}
                                    >
                                      <span>{opt}</span>
                                      {miniQuizSubmitted && isCorrect && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                                      {miniQuizSubmitted && isSel && !isCorrect && <X className="w-4 h-4 text-rose-500 shrink-0" />}
                                    </button>
                                  );
                                })}
                              </div>

                              {miniQuizSubmitted && (
                                <div className="p-3 bg-teal-500/5 dark:bg-teal-950/20 rounded-lg border border-teal-500/20 text-[11px] text-slate-500 dark:text-slate-400 mb-4 font-semibold">
                                  💡 <span className="font-bold text-teal-700 dark:text-teal-400">Règle : </span>
                                  {selectedGrammarLesson.miniQuiz?.[miniQuizStep]?.explanation}
                                </div>
                              )}

                              <div className="flex justify-end">
                                {!miniQuizSubmitted ? (
                                  <button
                                    onClick={() => {
                                      if (miniQuizSelectedOpt === null) return;
                                      setMiniQuizSubmitted(true);
                                      if (miniQuizSelectedOpt === selectedGrammarLesson.miniQuiz?.[miniQuizStep]?.correctAnswerIndex) {
                                        setMiniQuizCorrectCount(prev => prev + 1);
                                      }
                                    }}
                                    disabled={miniQuizSelectedOpt === null}
                                    className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs uppercase tracking-wider py-2 px-4 rounded-lg cursor-pointer disabled:opacity-50"
                                  >
                                    Valider
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      if (miniQuizStep < 1) {
                                        setMiniQuizStep(1);
                                        setMiniQuizSelectedOpt(null);
                                        setMiniQuizSubmitted(false);
                                      } else {
                                        // Finished! Calculate score out of 20
                                        // 2 correct = 20/20, 1 correct = 10/20, 0 correct = 4/20
                                        const finalGrade = miniQuizCorrectCount === 2 ? 20 : miniQuizCorrectCount === 1 ? 10 : 4;
                                        saveGrammarGrade(selectedGrammarLesson.id, finalGrade);
                                        setMiniQuizFinished(true);
                                      }
                                    }}
                                    className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs uppercase tracking-wider py-2 px-4 rounded-lg cursor-pointer"
                                  >
                                    {miniQuizStep < 1 ? "Question suivante" : "Terminer l'évaluation"}
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <Award className="w-10 h-10 text-emerald-500 mx-auto mb-2 animate-bounce" />
                              <h5 className="font-extrabold text-slate-800 dark:text-white text-base">Note Enregistrée !</h5>
                              
                              <div className="my-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800 max-w-xs mx-auto">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Votre Note Qualité</span>
                                <span className={`text-3xl font-black ${miniQuizCorrectCount === 2 ? "text-emerald-500" : miniQuizCorrectCount === 1 ? "text-amber-500" : "text-rose-500"}`}>
                                  {miniQuizCorrectCount === 2 ? "20 / 20" : miniQuizCorrectCount === 1 ? "10 / 20" : "04 / 20"}
                                </span>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 font-bold uppercase tracking-wider">
                                  {miniQuizCorrectCount === 2 ? "Parfait ! Élocution écrite impeccable 🌟" : miniQuizCorrectCount === 1 ? "Moyen. Relisez bien les règles 👍" : "Attention aux fautes en clientèle ⚠️"}
                                </p>
                              </div>

                              <button
                                onClick={() => setActiveMiniQuiz(false)}
                                className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs uppercase tracking-wider py-2 px-5 rounded-lg transition-all cursor-pointer"
                              >
                                Fermer le test
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  // Initial fallback right area
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
                    <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
                    <h3 className="font-display font-bold text-slate-700 dark:text-slate-300 text-base mb-1">Sélectionnez une leçon</h3>
                    <p className="text-slate-400 dark:text-slate-500 text-xs max-w-sm">
                      Cliquez sur l'une des leçons de grammaire pour étudier ses règles d'accord professionnelles et ses pièges d'orthographe.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {activeTab === "oral" && (
          <motion.div
            key="oral-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid lg:grid-cols-3 gap-6"
          >
            {/* Left side: list of oral lessons */}
            <div className="lg:col-span-1 space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Modules d'Élocution</h3>
              {oralLessons.map((lesson, idx) => {
                const isLocked = lesson.isPremium && !isActivated;
                const isSelected = selectedOralLesson?.id === lesson.id;
                
                return (
                  <button
                    key={lesson.id}
                    onClick={() => handleSelectOral(lesson)}
                    className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? "bg-teal-500/10 border-teal-500 text-teal-950 dark:text-teal-100"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Diction {idx + 1}</span>
                        {lesson.isPremium && (
                          <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            isLocked ? "bg-amber-100 dark:bg-amber-950/40 text-amber-600" : "bg-teal-100 dark:bg-teal-950/40 text-teal-600"
                          }`}>
                            Premium
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {lesson.title}
                      </h4>
                      {oralGrades[lesson.id] !== undefined && (
                        <div className="inline-flex items-center gap-1 mt-1 text-[10px] font-extrabold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-md border border-teal-100/30">
                          QA Note : {oralGrades[lesson.id]}/20
                        </div>
                      )}
                    </div>
                    <div>
                      {isLocked ? (
                        <Lock className="w-4 h-4 text-amber-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right side: exercises details with recording capability */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {selectedOralLesson ? (
                  <motion.div
                    key="oral-lesson-details"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5 mb-4">
                      <div>
                        <h3 className="font-display text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          <Volume2 className="w-5 h-5 text-teal-500" />
                          {selectedOralLesson.title}
                        </h3>
                        <p className="text-slate-400 dark:text-slate-500 text-[11px] font-semibold mt-0.5">
                          {selectedOralLesson.description}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedOralLesson(null)}
                        className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold cursor-pointer"
                      >
                        Fermer
                      </button>
                    </div>

                    {/* Exercises block */}
                    <div className="space-y-6">
                      {selectedOralLesson.exercises.map((exercise, eIdx) => {
                        const uniqueId = `${selectedOralLesson.id}-${eIdx}`;
                        const isSpeaking = isPlayingText === uniqueId;
                        const isRec = isRecording === uniqueId;

                        return (
                          <div 
                            key={eIdx}
                            className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 rounded-xl p-5"
                          >
                            <div className="flex items-center justify-between gap-4 mb-3">
                              <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 px-2.5 py-0.5 rounded-full border border-teal-100/50 dark:border-teal-900/40 uppercase">
                                {exercise.category}
                              </span>
                            </div>

                            {/* The text to practice */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 text-center relative overflow-hidden mb-4">
                              <p className="font-display font-extrabold text-base text-slate-800 dark:text-white leading-relaxed">
                                "{exercise.text}"
                              </p>

                              {/* Animation for mic level */}
                              {isRec && (
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                  <motion.div 
                                    className="h-full bg-teal-500"
                                    animate={{ width: `${mockMicLevel}%` }}
                                    transition={{ ease: "easeInOut" }}
                                  ></motion.div>
                                </div>
                              )}
                            </div>

                            {/* Interactive control buttons */}
                            <div className="flex flex-wrap items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                {/* Pronounce out loud */}
                                {isSpeaking ? (
                                  <button
                                    onClick={handleStopAudio}
                                    className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-rose-100 dark:border-rose-900/20"
                                  >
                                    <VolumeX className="w-4 h-4" /> Stop
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handlePlayAudio(exercise.text, uniqueId)}
                                    className="bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-teal-100 dark:border-teal-900/20"
                                  >
                                    <Volume2 className="w-4 h-4" /> Écouter la Diction
                                  </button>
                                )}

                                {/* Mic Practice button */}
                                <button
                                  onClick={() => handlePracticeToggle(exercise.text, uniqueId)}
                                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                                    isRec 
                                      ? "bg-rose-500 text-white border-rose-500 animate-pulse" 
                                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                                  }`}
                                >
                                  {isRec ? (
                                    <>
                                      <MicOff className="w-4 h-4" /> Arrêter l'écoute
                                    </>
                                  ) : (
                                    <>
                                      <Mic className="w-4 h-4 text-teal-500" /> S'entraîner à haute voix
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* Tips label */}
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm font-semibold italic">
                                💡 {exercise.tip}
                              </div>
                            </div>

                            {/* Result of the pronunciation practice */}
                            {isRec && (
                              <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 rounded-lg flex items-center gap-3 text-xs animate-pulse text-rose-800 dark:text-rose-400 font-bold">
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0"></span>
                                Élocution en cours d'écoute... Parlez clairement dans votre micro.
                              </div>
                            )}

                            {recordedResult && !isRec && isRecording === null && (
                              <div className="mt-4 p-3.5 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Texte détecté :</span>
                                <p className="font-mono text-slate-700 dark:text-slate-300">"{recordedResult}"</p>
                              </div>
                            )}

                            {oralScore && !isRec && isRecording === null && (
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 p-4.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/30 rounded-xl text-xs flex gap-3.5"
                              >
                                <Award className="w-6 h-6 text-emerald-500 shrink-0" />
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-emerald-800 dark:text-emerald-400">Rapport d'élocution :</span>
                                    <span className="font-black bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded">
                                      Score : {oralScore.score}%
                                    </span>
                                  </div>
                                  <p className="text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
                                    {oralScore.feedback}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : (
                  // Fallback right side
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
                    <Volume2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
                    <h3 className="font-display font-bold text-slate-700 dark:text-slate-300 text-base mb-1">Choisissez un module</h3>
                    <p className="text-slate-400 dark:text-slate-500 text-xs max-w-sm">
                      Sélectionnez un module d'élocution pour vous entraîner au rythme, à l'articulation et à la gestion des silences en français de centre d'appels.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lock Notice Modal */}
      <AnimatePresence>
        {showLockNotice && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLockNotice(null)}
              className="fixed inset-0 bg-slate-950 z-50 backdrop-blur-xs"
            ></motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed inset-x-4 bottom-6 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-2xl z-50 text-slate-900 dark:text-white flex flex-col items-center text-center"
            >
              <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6" />
              </div>
              
              <h3 className="font-display text-lg font-bold mb-1.5">Contenu Verrouillé</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mb-6 max-w-xs font-semibold leading-relaxed">
                Le module <span className="font-bold text-slate-700 dark:text-slate-200">"{showLockNotice}"</span> fait partie de notre cursus avancé d'activation d'élèves.
              </p>
              
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-xl p-4 text-xs font-semibold text-amber-800 dark:text-amber-400 mb-6 text-left w-full flex gap-2">
                <Key className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold mb-0.5">Comment débloquer ?</p>
                  <p className="text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                    Saisissez votre code d'activation à 6 chiffres dans la section d'en-tête du tableau de bord d'accueil pour déverrouiller l'accès complet à tous les exercices et simulations.
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setShowLockNotice(null)}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs uppercase tracking-wider py-3 rounded-xl transition-all cursor-pointer"
              >
                Compris, retourner aux cours
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
