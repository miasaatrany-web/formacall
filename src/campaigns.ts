export interface Campaign {
  id: string;
  name: string;
  description: string;
  difficulty: number;
  color: string;
  duration: string;
  type: "incoming" | "outgoing";
  script: { phase: string; details: string; sentence: string }[];
  tips: string[];
  proExpressions: string[];
  wordsToAvoid: string[];
  commonErrors: string[];
  bestPractices: string[];
  possibleClients: {
    firstName: string;
    lastName: string;
    age: number;
    city: string;
    profession: string;
    product: string;
    mood: string;
    objective: string;
    history: string;
  }[];
}

export const CAMPAIGNS: Campaign[] = [
  // ==========================================
  // APPELS ENTRANTS (INCOMING) - 5 CAMPAIGNES
  // ==========================================
  {
    id: "service-client-internet",
    name: "Support Technique Internet",
    description: "Support Technique : Diagnostiquer et résoudre une panne réseau complète chez un abonné impatient.",
    difficulty: 1,
    color: "emerald",
    duration: "3-5 min",
    type: "incoming",
    script: [
      {
        phase: "Accueil",
        details: "Saluer poliment, se présenter (Zaiasa Telecom), et demander l'identité de l'interlocuteur.",
        sentence: "Bonjour et bienvenue chez Zaiasa Telecom. Je m'appelle [Votre Prénom], comment puis-je vous aider aujourd'hui ?"
      },
      {
        phase: "Identification",
        details: "Demander le numéro de contrat, l'adresse de raccordement ou le numéro de téléphone.",
        sentence: "Pour accéder à votre dossier, pourriez-vous me communiquer votre numéro de contrat ou votre adresse e-mail s'il vous plaît ?"
      },
      {
        phase: "Diagnostic",
        details: "Poser des questions précises sur l'état physique de la box internet et les voyants lumineux.",
        sentence: "Très bien. Pouvez-vous me dire de quelle couleur sont les voyants de votre box internet, et s'ils clignotent ?"
      },
      {
        phase: "Résolution",
        details: "Proposer de redémarrer la box ou planifier l'intervention à distance d'un technicien.",
        sentence: "Je vous invite à débrancher le câble d'alimentation pendant 10 secondes, puis à le rebrancher. Je lance un test à distance."
      },
      {
        phase: "Conclusion",
        details: "Résumer l'action entreprise, s'assurer de la satisfaction, saluer de façon professionnelle.",
        sentence: "Le problème est résolu (ou le technicien passera mardi). Avez-vous d'autres questions ? Zaiasa Telecom vous remercie, bonne journée."
      }
    ],
    tips: [
      "Laissez le client exprimer sa frustration sans lui couper la parole.",
      "Utilisez des phrases rassurantes comme 'Je comprends tout à fait votre situation' ou 'Je fais le nécessaire'.",
      "Restez technique mais clair, évitez le jargon trop complexe."
    ],
    proExpressions: [
      "Je comprends tout à fait votre désagrément.",
      "Je prends immédiatement votre dossier en main.",
      "Soyez rassuré(e), nous allons trouver une solution ensemble.",
      "Pourriez-vous patienter un instant pendant que je procède à une vérification ?"
    ],
    wordsToAvoid: [
      "Je sais pas",
      "C'est pas de notre faute",
      "Y a un bug",
      "Faut attendre",
      "C'est comme ça"
    ],
    commonErrors: [
      "S'énerver face au mécontentement du client.",
      "Oublier de valider l'identité du client avant de manipuler sa ligne.",
      "Couper la parole pendant que le client explique sa panne."
    ],
    bestPractices: [
      "Pratiquer l'écoute active et reformuler la panne du client.",
      "Accompagner pas à pas le client lors de la manipulation de la box.",
      "Remercier le client pour sa patience."
    ],
    possibleClients: [
      {
        firstName: "Jean-Pierre",
        lastName: "Dubois",
        age: 54,
        city: "Lyon",
        profession: "Professeur de mathématiques",
        product: "Box Fibre Zaiasa Connect",
        mood: "mécontent",
        objective: "Récupérer internet d'urgence pour corriger des examens en ligne.",
        history: "Client fidèle depuis 5 ans, très peu d'incidents signalés par le passé."
      },
      {
        firstName: "Sophie",
        lastName: "Martin",
        age: 29,
        city: "Paris",
        profession: "Graphiste Freelance",
        product: "Box Fibre Premium Speed",
        mood: "pressée et anxieuse",
        objective: "Doit envoyer un projet de création graphique à son client avant midi.",
        history: "A eu une micro-coupure la semaine dernière."
      }
    ]
  },
  {
    id: "support-technique-tv",
    name: "Diagnostic Décodeur TV",
    description: "Diagnostic & Assistance : Guider un abonné âgé pour réinitialiser son décodeur TV qui affiche un écran noir.",
    difficulty: 2,
    color: "blue",
    duration: "4-6 min",
    type: "incoming",
    script: [
      {
        phase: "Accueil & Écoute",
        details: "Accueillir le client avec empathie et noter précisément les symptômes de la panne TV.",
        sentence: "Bonjour, vous êtes bien au support technique Zaiasa TV. Je m'appelle [Votre Prénom]. Que se passe-t-il sur votre téléviseur ?"
      },
      {
        phase: "Identification du matériel",
        details: "Faire préciser la marque de la TV et le modèle du décodeur (Evolution ou mini-box).",
        sentence: "Afin de vous guider au mieux, pourriez-vous me dire si un code d'erreur ou un message précis s'affiche sur votre écran ?"
      },
      {
        phase: "Manipulation assistée",
        details: "Faire effectuer un redémarrage électrique complet ou une réinitialisation d'usine via le bouton caché.",
        sentence: "Nous allons effectuer une réinitialisation. Veuillez maintenir enfoncé le bouton Reset situé à l'arrière du décodeur."
      },
      {
        phase: "Contrôle & Explication",
        details: "Vérifier le retour de l'image et expliquer l'origine de la panne avec des mots simples (mise à jour bloquée).",
        sentence: "Parfait, l'image revient. Il s'agissait simplement d'une mise à jour logicielle qui avait besoin d'être relancée."
      },
      {
        phase: "Prise de congé",
        details: "Valider que tout fonctionne, proposer un conseil pour éviter que cela se reproduise, saluer poliment.",
        sentence: "Tout est en ordre. Je vous conseille d'éteindre le décodeur la nuit. Je vous souhaite une excellente soirée TV !"
      }
    ],
    tips: [
      "Faites parler le client en lui demandant de décrire physiquement les branchements.",
      "Validez chaque étape ('Est-ce que vous voyez un voyant rouge ?') avant de passer à la suivante.",
      "Félicitez le client pour sa manipulation : cela renforce sa confiance."
    ],
    proExpressions: [
      "Nous allons résoudre cela pas à pas.",
      "Je vous guide dans la manipulation, c'est très simple.",
      "Parfait, vous avez fait exactement ce qu'il fallait.",
      "Est-ce que l'écran affiche à nouveau le menu principal ?"
    ],
    wordsToAvoid: [
      "C'est mort",
      "Votre matos est vieux",
      "Faut tout racheter",
      "C'est un problème d'usine",
      "Démerdez-vous"
    ],
    commonErrors: [
      "Aller trop vite et ne pas attendre que le décodeur redémarre réellement.",
      "Parler avec un ton condescendant ou impatient.",
      "Suggérer immédiatement de changer de matériel sans tenter de diagnostic."
    ],
    bestPractices: [
      "Vérifier d'abord les branchements HDMI de base avant les réinitialisations complexes.",
      "Rassurer le client sur le fait que ses enregistrements TV ne seront pas effacés.",
      "S'assurer que le client est bien assis en face de son téléviseur."
    ],
    possibleClients: [
      {
        firstName: "Marc",
        lastName: "Gérard",
        age: 72,
        city: "Bordeaux",
        profession: "Retraité de la fonction publique",
        product: "Zaiasa TV Box Evolution",
        mood: "confus et intimidé",
        objective: "Souhaite regarder le match de football qui commence dans 20 minutes.",
        history: "A du mal avec la technologie, a besoin d'être guidé pas à pas avec beaucoup de calme."
      },
      {
        firstName: "Léa",
        lastName: "Kovacs",
        age: 35,
        city: "Nantes",
        profession: "Infirmière",
        product: "Zaiasa TV Connect Pro",
        mood: "fatiguée",
        objective: "Veut juste que sa TV fonctionne pour ses enfants après une longue garde de nuit.",
        history: "Contrat récent, décodeur changé il y a un mois."
      }
    ]
  },
  {
    id: "reclamation-facturation",
    name: "Réclamation Facture Mobile",
    description: "Gestion des Litiges : Résoudre une réclamation de hors-forfait d'un client furieux et lui proposer un geste commercial.",
    difficulty: 3,
    color: "amber",
    duration: "4-6 min",
    type: "incoming",
    script: [
      {
        phase: "Accueil & Calme",
        details: "Saluer poliment, se présenter et rassurer immédiatement le client quant à la prise en charge de sa contestation.",
        sentence: "Bonjour Monsieur/Madame, bienvenue chez Zaiasa. Je m'appelle [Votre Prénom], je comprends votre surprise à la lecture de votre facture. Analysons cela ensemble."
      },
      {
        phase: "Vérification du compte",
        details: "Vérifier le numéro de téléphone et l'identité pour accéder à la facture détaillée.",
        sentence: "Afin d'ouvrir votre dossier et d'analyser vos lignes, pourriez-vous me confirmer votre numéro de téléphone et votre nom ?"
      },
      {
        phase: "Explication de la facture",
        details: "Expliquer de manière factuelle l'origine du hors-forfait (appels vers numéros surtaxés ou à l'étranger).",
        sentence: "Je vois que la facture comporte un montant de 45€ de hors-forfait lié à un appel de 12 minutes émis vers un numéro spécial le 14 de ce mois."
      },
      {
        phase: "Négociation & Geste Commercial",
        details: "Proposer une remise à titre exceptionnel et commercial pour conserver le client satisfait.",
        sentence: "Au vu de votre fidélité, je suis disposé à vous accorder une remise exceptionnelle de 50% sur ce hors-forfait sur votre prochaine facture."
      },
      {
        phase: "Clôture & Sécurisation",
        details: "Conseiller d'activer l'option gratuite de blocage des numéros surtaxés et prendre congé.",
        sentence: "J'active pour vous l'option gratuite de blocage des appels surtaxés pour éviter ce désagrément à l'avenir. Est-ce que cela vous convient ?"
      }
    ],
    tips: [
      "Ne contestez pas directement la consommation du client, appuyez-vous sur les relevés objectifs.",
      "Soyez proactif en proposant une solution technique (le blocage du hors-forfait) en plus du geste financier.",
      "Gardez un ton calme et rassurant pour faire baisser la tension."
    ],
    proExpressions: [
      "Regardons ensemble le détail de vos consommations.",
      "À titre exceptionnel et commercial, je fais le nécessaire.",
      "Je comprends tout à fait que ce montant soit surprenant.",
      "Nous allons sécuriser votre ligne pour l'avenir."
    ],
    wordsToAvoid: [
      "Vous avez consommé",
      "C'est marqué sur le contrat",
      "C'est de votre faute",
      "On ne rembourse pas"
    ],
    commonErrors: [
      "Accuser le client d'avoir menti.",
      "Refuser d'expliquer la facture en renvoyant vers l'espace client.",
      "S'agacer face aux reproches sur les tarifs."
    ],
    bestPractices: [
      "Expliquer clairement la différence entre numéros classiques et numéros surtaxés.",
      "Appliquer le geste immédiatement en l'affichant sur le dossier.",
      "Faire valider l'accord de résolution complète avant de raccrocher."
    ],
    possibleClients: [
      {
        firstName: "Alain",
        lastName: "Raimbault",
        age: 49,
        city: "Marseille",
        profession: "Chauffeur de taxi",
        product: "Forfait Zaiasa illimité 100Go",
        mood: "très en colère",
        objective: "Se faire rembourser intégralement les 45€ qu'il estime injustes.",
        history: "Client depuis 2 ans, n'a jamais eu de hors-forfait."
      },
      {
        firstName: "Karine",
        lastName: "Lemoine",
        age: 38,
        city: "Rennes",
        profession: "Institutrice",
        product: "Forfait Mobile Zaiasa Smart",
        mood: "déçue et méfiante",
        objective: "Comprendre pourquoi sa facture est doublée pour l'abonnement de son fils.",
        history: "A souscrit l'offre pour son fils adolescent le mois dernier."
      }
    ]
  },
  {
    id: "retention-resiliation",
    name: "Service Rétention Client",
    description: "Rétention Client : Convaincre un abonné mécontent qui souhaite résilier d'accepter une offre exclusive pour rester.",
    difficulty: 4,
    color: "purple",
    duration: "5-7 min",
    type: "incoming",
    script: [
      {
        phase: "Accueil & Analyse des motifs",
        details: "Accueillir le client poliment, écouter ses raisons de vouloir résilier et les noter précisément.",
        sentence: "Bonjour, vous êtes bien au service de gestion des abonnements. Je m'appelle [Votre Prénom], qu'est-ce qui vous motive à résilier votre contrat aujourd'hui ?"
      },
      {
        phase: "Valorisation de la relation",
        details: "Mettre en valeur son ancienneté et les services dont il bénéficie actuellement.",
        sentence: "Je vois que vous êtes un client fidèle depuis plus de 4 ans. C'est un réel plaisir de vous compter parmi nous, et j'aimerais vraiment trouver une solution."
      },
      {
        phase: "Contre-proposition ciblée",
        details: "Présenter une offre tarifaire ou de services sur-mesure, imbattable par rapport à la concurrence.",
        sentence: "Pour vous remercier de votre fidélité, je vous propose de basculer sur notre forfait haut de gamme avec une remise de 50% pendant un an, sans engagement."
      },
      {
        phase: "Traitement de l'objection finale",
        details: "Démontrer l'avantage d'éviter les frais de résiliation ou les démarches administratives compliquées.",
        sentence: "En restant chez nous, vous évitez les frais de changement d'opérateur et la coupure de ligne. Le changement de tarif est immédiat."
      },
      {
        phase: "Validation de l'engagement",
        details: "Enregistrer l'accord de reconduction, annuler la demande de résiliation et confirmer par écrit.",
        sentence: "C'est parfait ! J'annule immédiatement votre demande de résiliation et applique votre nouveau tarif préférentiel. Vous allez recevoir un SMS de confirmation."
      }
    ],
    tips: [
      "Ne proposez pas l'offre maximale tout de suite, avancez par étapes.",
      "Focalisez-vous sur le confort : pas de changement de SIM, aucun papier à renvoyer.",
      "Assurez-vous d'avoir identifié le vrai motif (prix, réseau, besoin de changer de téléphone) avant de proposer l'offre."
    ],
    proExpressions: [
      "Votre fidélité mérite une attention toute particulière.",
      "Voici une offre exclusive que je peux activer uniquement aujourd'hui.",
      "Nous tenons beaucoup à vous garder parmi nos abonnés.",
      "C'est une formule tout confort et sans surcoût."
    ],
    wordsToAvoid: [
      "Partez si vous voulez",
      "On ne peut rien faire",
      "C'est trop tard",
      "Allez chez le concurrent"
    ],
    commonErrors: [
      "Laisser partir le client sans faire de proposition.",
      "Argumenter agressivement contre le concurrent.",
      "Ne pas écouter la vraie raison du départ."
    ],
    bestPractices: [
      "Calculer l'économie réelle réalisée sur l'année grâce à la remise.",
      "Faire parler le client sur ses réels besoins de données mobiles.",
      "Conserver un sourire et une voix dynamique pour rassurer le client."
    ],
    possibleClients: [
      {
        firstName: "Julien",
        lastName: "Moreau",
        age: 33,
        city: "Nantes",
        profession: "Développeur Web",
        product: "Forfait Fibre + Mobile Zaiasa Family",
        mood: "déterminé",
        objective: "Résilier pour passer chez un concurrent moins cher de 15€ par mois.",
        history: "Client régulier, a déjà contacté le chat le mois dernier pour des soucis de débit."
      },
      {
        firstName: "Valérie",
        lastName: "Perrin",
        age: 46,
        city: "Tours",
        profession: "Comptable",
        product: "Forfait Mobile Zaiasa Solo",
        mood: "hésitante",
        objective: "Savoir s'il y a un avantage à rester plutôt que de partir pour une offre flash concurrente.",
        history: "Contrat arrivant à échéance dans 2 semaines."
      }
    ]
  },
  {
    id: "banque-premium",
    name: "Service Client Banque VIP",
    description: "Gestion de Crise VIP : Gérer un client fortuné furieux suite à des agios inattendus et négocier son maintien.",
    difficulty: 5,
    color: "rose",
    duration: "7-10 min",
    type: "incoming",
    script: [
      {
        phase: "Accueil sous haute tension",
        details: "Faire preuve d'un calme olympien face aux attaques du client. Écouter sans interrompre et s'excuser sincèrement.",
        sentence: "Bonjour Monsieur/Madame [Nom]. Je comprends parfaitement votre mécontentement. Je vais immédiatement regarder ce qui s'est passé."
      },
      {
        phase: "Analyse minutieuse",
        details: "Vérifier l'historique des transactions, expliquer de manière objective la cause du découvert (décalage de virement).",
        sentence: "Après vérification, je vois qu'un virement important est arrivé le 12, alors qu'un prélèvement a eu lieu le 10, ce qui a généré ces frais."
      },
      {
        phase: "Explication de la politique bancaire",
        details: "Rappeler les règles bancaires automatiques avec diplomatie, sans accuser le client, mais en restant ferme sur les procédures.",
        sentence: "Ces agios sont calculés automatiquement par notre système informatique dès que le solde devient négatif."
      },
      {
        phase: "Négociation & Geste Commercial",
        details: "Proposer un remboursement exceptionnel de 50% ou 100% des frais sous condition de mise en place d'une réserve de sécurité ou d'un virement automatique.",
        sentence: "Au vu de votre fidélité, je suis prêt à faire un geste exceptionnel et à vous rembourser l'intégralité de ces frais aujourd'hui."
      },
      {
        phase: "Fidélisation & Clôture",
        details: "S'assurer que le client est calmé, proposer un service d'alerte SMS gratuit pour éviter de nouveaux découverts, et valider la satisfaction.",
        sentence: "Les frais seront recrédités sous 48h. Pour votre sérénité, j'active gratuitement notre service d'alertes SMS. Tout vous convient ?"
      }
    ],
    tips: [
      "Ne prenez jamais la colère du client personnellement.",
      "Parlez avec un ton de voix plus bas et plus lent que d'habitude pour apaiser naturellement l'interlocuteur.",
      "Ne dites jamais 'C'est de votre faute' ou 'Vous n'aviez qu'à faire attention'."
    ],
    proExpressions: [
      "Je vous présente mes excuses au nom de notre établissement pour ce désagrément.",
      "Votre fidélité est notre priorité absolue, nous allons trouver un terrain d'entente.",
      "Je procède immédiatement au remboursement à titre purement commercial.",
      "Je comprends que cette situation soit contrariante."
    ],
    wordsToAvoid: [
      "Vous avez tort",
      "C'est écrit dans le contrat",
      "C'est votre problème",
      "Pas possible",
      "Calmez-vous"
    ],
    commonErrors: [
      "Dire au client de se calmer (cela dédouble sa colère).",
      "Refuser tout remboursement sans analyser le profil de fidélité.",
      "S'énerver et raccrocher au nez du client."
    ],
    bestPractices: [
      "S'excuser au nom de l'entreprise au tout début de l'appel pour désamorcer la tension.",
      "Trouver un accord gagnant-gagnant (remboursement en échange d'une souscription ou d'un engagement).",
      "Confirmer la résolution de vive voix et par écrit."
    ],
    possibleClients: [
      {
        firstName: "Charles-Henri",
        lastName: "De la Touche",
        age: 58,
        city: "Paris 16",
        profession: "Avocat d'affaires",
        product: "Compte Premium Carte Visa Infinite",
        mood: "furieux et condescendant",
        objective: "Exige le remboursement immédiat de 120 € de frais sous peine de clôturer tous ses comptes (500 000 € d'encours).",
        history: "Client depuis 15 ans avec d'immenses avoirs, ne tolère aucune erreur administrative."
      },
      {
        firstName: "Nathalie",
        lastName: "Dumont",
        age: 45,
        city: "Geneva (résidente)",
        profession: "Consultante en finance internationale",
        product: "Compte Privé Gold",
        mood: "froide et menaçante",
        objective: "Conteste 80 € d'agios, menace d'en parler sur ses réseaux sociaux professionnels.",
        history: "Utilise beaucoup de prélèvements automatiques étrangers, a déjà demandé une faveur l'année dernière."
      }
    ]
  },

  // ==========================================
  // APPELS SORTANTS (OUTGOING) - 5 CAMPAIGNES
  // ==========================================
  {
    id: "qualification-fiche",
    name: "Qualification de Fiche",
    description: "Qualification & Intérêt : Valider l'éligibilité et l'intérêt d'un prospect pour l'installation de panneaux solaires.",
    difficulty: 1,
    color: "emerald",
    duration: "3-5 min",
    type: "outgoing",
    script: [
      {
        phase: "Introduction & Accord",
        details: "Se présenter de manière courtoise, expliquer l'origine de l'appel (demande d'information) et vérifier sa disponibilité.",
        sentence: "Bonjour Monsieur/Madame, je m'appelle [Votre Prénom] de la société Eco-Zaiasa. Je vous appelle suite à votre intérêt exprimé en ligne pour les panneaux solaires. Êtes-vous bien disponible 2 minutes ?"
      },
      {
        phase: "Vérification Statut",
        details: "Demander si le prospect est propriétaire de sa maison individuelle pour valider le premier critère d'éligibilité.",
        sentence: "Afin de qualifier votre dossier, confirmez-vous que vous êtes bien propriétaire de votre maison individuelle ?"
      },
      {
        phase: "Analyse Facture Énergie",
        details: "S'enquérir du budget moyen consacré à l'électricité pour mesurer la rentabilité future.",
        sentence: "D'accord. Pourriez-vous me dire quel est le montant mensuel approximatif de votre facture d'électricité ?"
      },
      {
        phase: "Validation de l'intérêt",
        details: "Valider si le prospect souhaite faire des économies d'énergie et s'il est ouvert à recevoir une simulation gratuite.",
        sentence: "Parfait. Seriez-vous intéressé par une simulation d'économie d'énergie gratuite et personnalisée d'ici quelques jours ?"
      },
      {
        phase: "Clôture amicale",
        details: "Remercier le prospect, confirmer la transmission de la fiche à un conseiller technique et prendre congé poliment.",
        sentence: "C'est bien noté. Votre fiche est qualifiée, un de nos experts régionaux vous contactera. Merci pour votre temps et excellente journée !"
      }
    ],
    tips: [
      "Soyez dynamique et chaleureux dès les premières secondes pour éviter que le prospect ne raccroche.",
      "Écoutez attentivement et notez fidèlement les chiffres de consommation électrique.",
      "Ne tentez pas de vendre l'équipement immédiatement, le but est uniquement de qualifier la fiche."
    ],
    proExpressions: [
      "Je vous appelle simplement pour faire le point sur votre demande.",
      "C'est une démarche informative sans aucun engagement de votre part.",
      "Nous validons simplement votre éligibilité aux dispositifs d'aide.",
      "Merci pour ces précisions précieuses."
    ],
    wordsToAvoid: [
      "Acheter",
      "Payer maintenant",
      "Dépêchez-vous",
      "Signature obligatoire"
    ],
    commonErrors: [
      "Parler avec un ton robotique de centre d'appels.",
      "Insister lourdement si le prospect se déclare locataire (non éligible).",
      "Oublier de demander l'accord de disponibilité au début."
    ],
    bestPractices: [
      "Vérifier l'exactitude des coordonnées du client.",
      "Mettre en avant les économies potentielles sur un ton optimiste.",
      "Prendre congé avec enthousiasme."
    ],
    possibleClients: [
      {
        firstName: "Robert",
        lastName: "Garnier",
        age: 62,
        city: "Limoges",
        profession: "Artisan électricien à la retraite",
        product: "Aucun (Prospect)",
        mood: "curieux et poli",
        objective: "Savoir si sa toiture orientée Sud-Est est adaptée pour le solaire.",
        history: "A cliqué sur une publicité Facebook d'Eco-Zaiasa hier soir."
      },
      {
        firstName: "Céline",
        lastName: "Dufour",
        age: 41,
        city: "Orléans",
        profession: "Cadre administrative",
        product: "Aucun (Prospect)",
        mood: "pressée mais réceptive",
        objective: "Réduire sa facture d'électricité de 180€/mois pour sa famille nombreuse.",
        history: "Recherche activement des solutions d'économie d'énergie pour sa maison construite en 2012."
      }
    ]
  },
  {
    id: "prise-rdv-pompe-chaleur",
    name: "Téléprospection & Prise de RDV",
    description: "Prise de Rendez-vous : Contacter des propriétaires pour fixer un rendez-vous à domicile avec un conseiller en efficacité énergétique.",
    difficulty: 2,
    color: "blue",
    duration: "4-6 min",
    type: "outgoing",
    script: [
      {
        phase: "Accroche professionnelle",
        details: "Rappeler le cadre officiel des aides de transition écologique et éveiller l'intérêt.",
        sentence: "Bonjour Monsieur/Madame, je suis [Votre Prénom] de la société Zaiasa Énergie. Je vous appelle pour faire le point sur l'éligibilité de votre logement aux nouvelles subventions de l'État pour l'installation d'une pompe à chaleur. Êtes-vous bien la personne en charge du logement ?"
      },
      {
        phase: "Présentation de l'opportunité",
        details: "Expliquer brièvement les avantages financiers de la pompe à chaleur et de la prise en charge des aides.",
        sentence: "Avec les récents décrets, l'État peut financer vos travaux jusqu'à 80%. Cela vous permet de remplacer votre ancienne chaudière gaz ou fioul à moindre coût."
      },
      {
        phase: "Proposition de diagnostic à domicile",
        details: "Amener la nécessité d'une visite de conformité technique gratuite pour valider le dossier.",
        sentence: "Pour valider l'éligibilité technique de votre habitation, notre technicien-conseil doit effectuer un diagnostic gratuit de 20 minutes chez vous."
      },
      {
        phase: "Négociation de la date",
        details: "Proposer une alternative de créneaux horaires pour verrouiller le rendez-vous.",
        sentence: "Notre technicien sera dans votre commune ce jeudi après-midi. Est-ce que 14h30 ou 17h vous conviendrait le mieux ?"
      },
      {
        phase: "Verrouillage & Confirmation",
        details: "Valider l'adresse exacte, le numéro de contact et annoncer l'envoi du SMS de confirmation.",
        sentence: "Parfait, c'est noté pour jeudi à 14h30 à votre adresse. Je vous envoie immédiatement un SMS de confirmation. Je vous remercie pour votre accueil, à jeudi !"
      }
    ],
    tips: [
      "Vendez la gratuité et l'importance du diagnostic de conformité, pas l'appareil en lui-même.",
      "Soyez ferme mais poli sur la prise de rendez-vous : donnez l'impression d'un agenda très demandé.",
      "Confirmez l'adresse pour valider le sérieux de la démarche."
    ],
    proExpressions: [
      "Notre conseiller effectue simplement une visite de conformité sans aucun engagement.",
      "Les aides d'État ont été revalorisées ce mois-ci.",
      "C'est une étude technique entièrement prise en charge par notre groupe.",
      "Je bloque ce créneau pour vous de manière définitive."
    ],
    wordsToAvoid: [
      "Vente",
      "Commercial",
      "Signer un contrat",
      "Combien vous gagnez"
    ],
    commonErrors: [
      "Bafouiller lors de l'accroche, ce qui trahit un manque d'assurance.",
      "Laisser le prospect refuser la visite en disant simplement 'envoyez-moi un mail'.",
      "Oublier de valider que le conjoint sera également présent."
    ],
    bestPractices: [
      "Rassurer sur le fait qu'aucun devis payant ne sera proposé durant cette visite.",
      "Mettre en valeur le professionnalisme du technicien local.",
      "Utiliser l'alternative pour les choix d'horaire ('mardi ou mercredi ?')."
    ],
    possibleClients: [
      {
        firstName: "Michel",
        lastName: "Fontaine",
        age: 51,
        city: "Dijon",
        profession: "Technicien de maintenance",
        product: "Aucun (Prospect)",
        mood: "sceptique mais intéressé par l'économie",
        objective: "Remplacer sa chaudière fioul vieillissante qui consomme énormément.",
        history: "A rempli un formulaire de contact sur un comparateur de travaux de chauffage."
      },
      {
        firstName: "Chantal",
        lastName: "Gomez",
        age: 67,
        city: "Besançon",
        profession: "Retraitée",
        product: "Aucun (Prospect)",
        mood: "méfiante envers le démarchage",
        objective: "Vouloir faire des travaux mais a peur des arnaques fréquentes sur les pompes à chaleur.",
        history: "A déjà été démarchée plusieurs fois par le passé."
      }
    ]
  },
  {
    id: "televente-assurance-auto",
    name: "Télévente Assurance Auto",
    description: "Vente Directe B2C : Proposer une formule d'assurance tous risques supérieure à un client assuré au tiers.",
    difficulty: 3,
    color: "amber",
    duration: "5-7 min",
    type: "outgoing",
    script: [
      {
        phase: "Accroche & Connexion",
        details: "Se présenter, rappeler que le client est déjà chez nous, et éveiller la curiosité avec un avantage exclusif.",
        sentence: "Bonjour Monsieur/Madame [Nom], je m'appelle [Votre Prénom] de Zaiasa Assurances. Je vous appelle pour faire un point sur votre contrat auto."
      },
      {
        phase: "Découverte des besoins",
        details: "Poser des questions sur l'évolution de l'usage du véhicule, les trajets professionnels et la peur du sinistre.",
        sentence: "Votre véhicule roule-t-il toujours autant ? Avez-vous pensé aux risques de vandalisme ou de bris de glace lors de vos trajets ?"
      },
      {
        phase: "Présentation de la formule Tous Risques",
        details: "Valoriser les garanties (assistance 0km, bris de glace, panne) et faire le lien avec les besoins détectés.",
        sentence: "Avec notre formule Tous Risques, vous bénéficiez d'une protection totale. Même si vous êtes responsable, vos réparations sont couvertes."
      },
      {
        phase: "Traitement des objections",
        details: "Répondre à l'objection du prix en calculant le coût journalier ou en offrant les deux premiers mois.",
        sentence: "Je comprends que le budget soit important. Cependant, cela représente seulement 30 centimes de plus par jour pour une tranquillité totale."
      },
      {
        phase: "Closing (Conclusion)",
        details: "Engager le client vers la signature électronique en validant les coordonnées bancaires et en créant l'urgence.",
        sentence: "Afin de valider cette formule dès aujourd'hui et de bénéficier des 2 mois offerts, je vous envoie le lien de signature par SMS ?"
      }
    ],
    tips: [
      "Ne vendez pas un prix, vendez la sécurité et l'absence de tracas.",
      "Posez des questions ouvertes ('Qu'est-ce qui vous ferait choisir une assurance supérieure ?').",
      "Considérez chaque refus temporaire comme une demande d'information supplémentaire."
    ],
    proExpressions: [
      "C'est une offre exclusive réservée à nos clients fidèles.",
      "Imaginez que vous tombiez en panne demain devant chez vous, l'assistance est incluse.",
      "Nous prenons en charge la totalité de la transition de contrat.",
      "Qu'est-ce qui vous fait hésiter aujourd'hui ?"
    ],
    wordsToAvoid: [
      "C'est cher",
      "Y a pas mieux",
      "Obligatoire",
      "Je vous force pas",
      "Signez vite"
    ],
    commonErrors: [
      "Parler sans s'arrêter sans écouter les objections du client.",
      "Abandonner dès le premier 'Non' ou 'Pas intéressé'.",
      "Mentir sur les franchises ou les petites lignes du contrat."
    ],
    bestPractices: [
      "Faire un calcul comparatif clair entre le coût d'une panne et le prix de la mensualité.",
      "Garder un ton souriant, dynamique et confiant du début à la fin.",
      "Valider chaque accord partiel ('Vous êtes d'accord que l'assistance 0km est indispensable ?')."
    ],
    possibleClients: [
      {
        firstName: "Thierry",
        lastName: "Leroy",
        age: 42,
        city: "Toulouse",
        profession: "Commercial itinérant",
        product: "Zaiasa Auto Tiers Simple",
        mood: "méfiant et pragmatique",
        objective: "Éviter de dépenser plus, mais a peur de perdre son permis ou son outil de travail.",
        history: "N'a jamais eu de sinistre depuis 10 ans, estime qu'il conduit très bien."
      },
      {
        firstName: "Amandine",
        lastName: "Vidal",
        age: 31,
        city: "Strasbourg",
        profession: "Secrétaire médicale",
        product: "Zaiasa Auto Tiers Plus",
        mood: "hésitante",
        objective: "Voudrait être mieux protégée car elle a déménagé dans un quartier sensible.",
        history: "A demandé un devis en ligne il y a 3 mois mais n'a pas donné suite."
      }
    ]
  },
  {
    id: "assurance-vie",
    name: "Conseil & Assurance Vie",
    description: "Conseil & Placement : Conseiller et convaincre un prospect qualifié de finaliser l'ouverture d'un contrat d'Assurance Vie haut de gamme.",
    difficulty: 4,
    color: "purple",
    duration: "6-8 min",
    type: "outgoing",
    script: [
      {
        phase: "Prise de contact",
        details: "Rappeler le projet d'épargne exprimé en ligne par le prospect et instaurer un climat de confiance chaleureux.",
        sentence: "Bonjour Monsieur/Madame [Nom]. Je fais suite à votre simulation d'épargne sur notre site. Vous souhaitiez préparer un projet financier ?"
      },
      {
        phase: "Bilan Patrimonial",
        details: "Sonder la capacité de versement mensuel, l'horizon de placement (court, moyen ou long terme) et l'aversion au risque.",
        sentence: "Pour affiner notre proposition, quel montant envisagez-vous d'épargner chaque mois et quel est votre horizon de placement ?"
      },
      {
        phase: "Présentation de l'offre Multi-supports",
        details: "Expliquer les avantages fiscaux de l'assurance vie et le compromis sécurité (fonds euros) et rendement (unités de compte).",
        sentence: "Notre contrat Zaiasa Patrimoine vous permet de sécuriser votre capital tout en dynamisant votre épargne grâce à notre gestion pilotée."
      },
      {
        phase: "Objections Fiscalité & Risque",
        details: "Démystifier le mythe de l'argent 'bloqué' pendant 8 ans et rassurer sur la solidité des fonds financiers.",
        sentence: "Sachez que votre argent reste disponible à tout moment en cas de besoin. Les 8 ans ne concernent que l'optimisation fiscale."
      },
      {
        phase: "Closing & Prise de RDV Expert",
        details: "Valider l'adhésion au principe et planifier l'appel final de signature avec le gestionnaire de patrimoine agréé.",
        sentence: "Je vous propose de bloquer un créneau de 15 minutes mardi à 14h avec notre conseiller patrimonial pour finaliser votre dossier."
      }
    ],
    tips: [
      "Adoptez un ton posé, sérieux et extrêmement professionnel : vous manipulez de l'argent.",
      "Soyez transparent sur les risques tout en insistant sur l'accompagnement personnalisé.",
      "Utilisez le vocabulaire financier approprié : 'versement programmé', 'arbitrage', 'fiscalité avantageuse'."
    ],
    proExpressions: [
      "C'est un support idéal pour valoriser votre capital sur le long terme.",
      "L'assurance-vie est également un excellent outil de transmission de patrimoine hors succession.",
      "Nous adaptons la répartition selon votre propre profil de risque.",
      "Votre capital reste totalement liquide, vous pouvez effectuer des rachats."
    ],
    wordsToAvoid: [
      "C'est risqué",
      "Vous allez tout perdre",
      "C'est bloqué",
      "On place ça au pif",
      "Faut payer un max"
    ],
    commonErrors: [
      "Promettre des rendements garantis élevés sur des supports risqués (interdit par la loi).",
      "Ne pas écouter les craintes d'épargne du client.",
      "Forcer la souscription sans faire de bilan patrimonial conforme."
    ],
    bestPractices: [
      "Toujours rappeler le cadre légal et sécurisé de l'établissement bancaire.",
      "Valoriser l'absence de frais sur les versements pour l'offre en cours.",
      "Faire formuler par le client son projet (achat immobilier, retraite, transmission)."
    ],
    possibleClients: [
      {
        firstName: "Bernard",
        lastName: "Rousseau",
        age: 61,
        city: "Nice",
        profession: "Architecte",
        product: "Aucun (Prospect)",
        mood: "exigeant et méfiant",
        objective: "Placer 50 000 € suite à la vente d'un terrain, souhaite un rendement correct mais craint la fiscalité.",
        history: "A déjà eu des mauvaises surprises avec une banque traditionnelle."
      },
      {
        firstName: "Khadija",
        lastName: "Benzema",
        age: 48,
        city: "Lille",
        profession: "Directrice de Ressources Humaines",
        product: "Compte Courant Zaiasa",
        mood: "très occupée et rationnelle",
        objective: "Préparer sa retraite avec des versements automatiques mensuels de 300 €.",
        history: "Excellente cliente, cherche un placement simple, automatisé et performant."
      }
    ]
  },
  {
    id: "enquete-satisfaction",
    name: "Enquête Qualité & Up-sell",
    description: "Suivi & Up-sell : Réaliser l'enquête de satisfaction auprès d'un client box internet récent et lui proposer un forfait mobile illimité exclusif.",
    difficulty: 5,
    color: "rose",
    duration: "5-7 min",
    type: "outgoing",
    script: [
      {
        phase: "Présentation & Clarté",
        details: "Expliquer l'objectif de l'appel (enquête qualité de la box) sur un ton amical et non commercial.",
        sentence: "Bonjour Monsieur/Madame, je m'appelle [Votre Prénom] du service qualité de Zaiasa. Je vous contacte pour réaliser notre enquête de satisfaction suite à votre installation internet il y a 2 semaines. Auriez-vous une minute ?"
      },
      {
        phase: "Évaluation & Recueil",
        details: "Poser des questions sur l'efficacité de la connexion, le débit et le travail de l'installateur.",
        sentence: "Parfait. Sur une échelle de 1 à 10, quel niveau de satisfaction attribuez-vous à la vitesse de votre navigation et à la ponctualité de notre technicien ?"
      },
      {
        phase: "Valorisation du Service",
        details: "Remercier chaleureusement pour les bonnes notes et introduire l'avantage exclusif abonné.",
        sentence: "Un grand merci pour vos retours positifs ! C'est grâce à des abonnés comme vous que nous progressons. Pour vous en remercier, vous bénéficiez de notre statut VIP."
      },
      {
        phase: "Présentation offre Mobile VIP",
        details: "Dévoiler la promotion exclusive (-60% à vie) sur le forfait mobile 5G illimité pour récompenser sa fidélité.",
        sentence: "Grâce à votre box, vous avez droit à notre forfait mobile 5G illimité pour seulement 9,99€ par mois à vie au lieu de 24,99€. C'est une offre réservée uniquement à nos abonnés satisfaits."
      },
      {
        phase: "Levée de l'objection de portabilité",
        details: "Rassurer sur la conservation du numéro et la gratuité des démarches de transfert.",
        sentence: "Vous n'avez rien à faire : nous nous chargeons de récupérer votre numéro actuel gratuitement et d'annuler votre ancien forfait. C'est sans coupure de service."
      }
    ],
    tips: [
      "Démarrez strictement comme un appel de service client, pas de vente immédiate.",
      "N'abordez l'offre commerciale que si le client a donné de bonnes notes (satisfaction établie).",
      "Valorisez le concept d'abonné VIP pour susciter la fierté du client."
    ],
    proExpressions: [
      "Votre avis est ce qui nous importe le plus.",
      "En tant que client box, ce forfait vous est réservé en priorité.",
      "Nous gérons l'intégralité du changement de manière transparente.",
      "C'est une opportunité unique de regrouper vos factures et d'économiser."
    ],
    wordsToAvoid: [
      "Je vous démarche",
      "C'est payant",
      "Forfait obligatoire",
      "Signez tout de suite"
    ],
    commonErrors: [
      "Forcer l'offre mobile si le client a exprimé une déception sur la box (incohérence totale).",
      "Parler de vente dès la première phrase de l'appel.",
      "Ne pas noter les remarques de l'enquête qualité."
    ],
    bestPractices: [
      "Vérifier la bonne élocution et un rythme calme.",
      "Remercier le client deux fois pour ses retours.",
      "Mettre en valeur l'avantage économique d'avoir un compte unique (Box + Mobile)."
    ],
    possibleClients: [
      {
        firstName: "Frédéric",
        lastName: "Simon",
        age: 37,
        city: "Metz",
        profession: "Professeur de sport",
        product: "Box Fibre Zaiasa Connect",
        mood: "très satisfait",
        objective: "Donner un avis positif car la fibre fonctionne à merveille depuis son installation.",
        history: "A souscrit l'offre il y a 15 jours suite à un déménagement."
      },
      {
        firstName: "Nadia",
        lastName: "Chabane",
        age: 44,
        city: "Montpellier",
        profession: "Architecte d'intérieur",
        product: "Box Fibre Zaiasa Premium",
        mood: "globalement satisfaite mais pressée",
        objective: "Participer rapidement à l'enquête pour retourner à son travail.",
        history: "A eu un léger retard du technicien à l'installation mais le service fonctionne parfaitement."
      }
    ]
  }
];
