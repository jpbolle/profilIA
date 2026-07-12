// ================================================
//   POOL DE QUESTIONS — ProfilIA
//   6 questions par domaine (sélection al de 4/domaine à chaque quiz)
//   Format : { theme, question, answers[3] avec profile }
//   Profils : reflechi | pragmatique | technophile
// ================================================

export const QUESTION_POOL = [
    // ============ ÉTHIQUE 🤔 (6 questions) ============
    {
        theme: "Éthique 🤔",
        question: "Lorsqu'un outil IA te propose d'automatiser une correction ou de générer des exercices, tu te demandes d'abord :",
        answers: [
            { text: "Quels effets cela peut-il avoir sur la perception de la justice ou de l'équité chez mes élèves.", profile: "reflechi" },
            { text: "Si le gain de temps justifie d'en déléguer une partie à l'IA.", profile: "pragmatique" },
            { text: "Quelle tâche suivante tu pourrais automatiser pour gagner encore en efficacité.", profile: "technophile" }
        ]
    },
    {
        theme: "Éthique 🤔",
        question: "Une IA produit un contenu ambigu ou potentiellement inapproprié. Quelle est ta réaction ?",
        answers: [
            { text: "Tu questionnes la pertinence de continuer à utiliser cet outil et en parles à tes collègues.", profile: "reflechi" },
            { text: "Tu reformules le prompt ou corriges le résultat, sans trop t'inquiéter.", profile: "pragmatique" },
            { text: "Tu écartes le contenu problématique et poursuis comme si de rien n'était.", profile: "technophile" }
        ]
    },
    {
        theme: "Éthique 🤔",
        question: "Face à des exemples IA qui renforcent certains stéréotypes sociaux (genre, origine…), tu :",
        answers: [
            { text: "Lances une discussion avec tes élèves sur les stéréotypes et la façon dont ils se glissent dans les productions IA.", profile: "reflechi" },
            { text: "Évites d'utiliser ce contenu et t'en cherches un autre.", profile: "pragmatique" },
            { text: "Laisses passer, \"ce n'est pas mon combat\".", profile: "technophile" }
        ]
    },
    {
        theme: "Éthique 🤔",
        question: "Un·e collègue utilise une IA pour générer des commentaires de bulletins pour ses 120 élèves, sans le mentionner aux familles. Ta réaction ?",
        answers: [
            { text: "C'est problématique — la transparence envers les familles est une obligation déontologique.", profile: "reflechi" },
            { text: "C'est discutable, mais l'usage reste légitime si le contenu est relu.", profile: "pragmatique" },
            { text: "C'est pragmatique — personne n'a besoin de savoir comment les outils sont utilisés.", profile: "technophile" }
        ]
    },
    {
        theme: "Éthique 🤔",
        question: "Si une IA utilisée en classe produit un contenu biaisé pour un élève, qui est selon toi principalement responsable ?",
        answers: [
            { text: "La responsabilité est nécessairement partagée — c'est précisément là le problème éthique.", profile: "reflechi" },
            { text: "L'enseignant·e qui a choisi de l'utiliser sans vérification préalable.", profile: "pragmatique" },
            { text: "L'entreprise qui a développé l'outil — c'est à elle de garantir la qualité.", profile: "technophile" }
        ]
    },
    {
        theme: "Éthique 🤔",
        question: "Dans ta pratique, à quelle fréquence déclares-tu explicitement à tes élèves que tu as utilisé une IA pour préparer un cours ou une évaluation ?",
        answers: [
            { text: "Systématiquement — c'est un principe que je me suis fixé.", profile: "reflechi" },
            { text: "Parfois — quand ça me semble pertinent d'en faire un sujet de discussion.", profile: "pragmatique" },
            { text: "Jamais — je l'utilise mais je n'en parle pas.", profile: "technophile" }
        ]
    },

    // ============ ÉCOLOGIQUE 🌱 (6 questions) ============
    {
        theme: "Écologique 🌱",
        question: "Quand tu intègres une activité IA en classe, tu penses à :",
        answers: [
            { text: "Privilégier des outils IA sobres, paramétrer leur usage et limiter les requêtes.", profile: "reflechi" },
            { text: "Utiliser les outils IA du marché sans vérifier leur impact, mais limiter leur usage au strict nécessaire.", profile: "pragmatique" },
            { text: "Utiliser les IA les plus performantes, peu importe leur empreinte environnementale.", profile: "technophile" }
        ]
    },
    {
        theme: "Écologique 🌱",
        question: "Un élève souhaite faire un projet créatif avec une IA générative très gourmande en énergie. Tu :",
        answers: [
            { text: "L'accompagnes pour penser à l'impact écologique et cherches des alternatives plus sobres.", profile: "reflechi" },
            { text: "Acceptes mais expliques que ce projet doit rester exceptionnel.", profile: "pragmatique" },
            { text: "Valides avec enthousiasme, la priorité étant la créativité et l'innovation.", profile: "technophile" }
        ]
    },
    {
        theme: "Écologique 🌱",
        question: "Lorsque tu découvres que la formation d'un grand modèle IA équivaut à plusieurs années de consommation électrique d'un foyer :",
        answers: [
            { text: "Cela t'incite à réfléchir à ton usage et à informer ton entourage.", profile: "reflechi" },
            { text: "Tu te dis que c'est le prix du progrès technologique.", profile: "pragmatique" },
            { text: "Tu ne changes rien à tes pratiques, \"ce n'est pas mon problème\".", profile: "technophile" }
        ]
    },
    {
        theme: "Écologique 🌱",
        question: "Savais-tu qu'une requête à un grand modèle IA consomme environ 10 fois plus d'énergie qu'une recherche Google ?",
        answers: [
            { text: "Oui, et j'en tiens compte dans mes usages au quotidien.", profile: "reflechi" },
            { text: "J'en avais une vague idée mais sans chiffre précis.", profile: "pragmatique" },
            { text: "Non, je l'ignorais complètement — et cela ne changera pas mes usages.", profile: "technophile" }
        ]
    },
    {
        theme: "Écologique 🌱",
        question: "Choisir un modèle d'IA frugal plutôt qu'un modèle énergivore pour une tâche donnée te semble être :",
        answers: [
            { text: "Un critère de choix que j'intègre ou veux intégrer systématiquement dans mes usages.", profile: "reflechi" },
            { text: "Un réflexe intéressant à développer, comme trier ses déchets.", profile: "pragmatique" },
            { text: "Un détail marginal — les gains sont négligeables à mon échelle.", profile: "technophile" }
        ]
    },
    {
        theme: "Écologique 🌱",
        question: "As-tu déjà abordé l'impact environnemental du numérique et de l'IA avec tes élèves ?",
        answers: [
            { text: "Régulièrement — c'est un fil rouge dans mon enseignement.", profile: "reflechi" },
            { text: "Une ou deux fois, informellement, quand l'occasion s'est présentée.", profile: "pragmatique" },
            { text: "Jamais — ce n'est pas la priorité dans ma discipline.", profile: "technophile" }
        ]
    },

    // ============ JURIDIQUE ⚖️ (6 questions) ============
    {
        theme: "Juridique ⚖️",
        question: "Avant de partager un contenu généré par IA sur le blog ou le réseau de ton établissement :",
        answers: [
            { text: "Tu vérifies systématiquement les droits d'utilisation et la provenance des données.", profile: "reflechi" },
            { text: "Tu ajoutes une mention que c'est généré par IA, sans trop creuser.", profile: "pragmatique" },
            { text: "Tu partages sans t'interroger, \"c'est public, non ?\".", profile: "technophile" }
        ]
    },
    {
        theme: "Juridique ⚖️",
        question: "On t'informe que certaines IA conservent les données saisies dans les prompts pour entraîner leurs modèles. Tu :",
        answers: [
            { text: "Revois tes pratiques et informes tes élèves sur les données à ne jamais partager.", profile: "reflechi" },
            { text: "Rappelles ce risque à l'occasion, mais continues à utiliser l'outil de la même façon.", profile: "pragmatique" },
            { text: "Considères que tes usages n'ont rien à cacher, donc aucune importance.", profile: "technophile" }
        ]
    },
    {
        theme: "Juridique ⚖️",
        question: "Un élève utilise un chatbot IA pour réaliser un devoir. Tu :",
        answers: [
            { text: "L'accompagnes pour citer correctement ses sources et respecter la propriété intellectuelle.", profile: "reflechi" },
            { text: "Précises que ce n'est pas interdit, mais que la responsabilité reste à l'élève.", profile: "pragmatique" },
            { text: "T'en fiches, tant que le travail est rendu.", profile: "technophile" }
        ]
    },
    {
        theme: "Juridique ⚖️",
        question: "Lorsque tu utilises un outil IA grand public (ChatGPT, Gemini, Copilot…), mets-tu des données personnelles d'élèves (noms, notes) dans tes prompts ?",
        answers: [
            { text: "Jamais — je sais que c'est problématique du point de vue du RGPD.", profile: "reflechi" },
            { text: "Rarement — j'essaie d'éviter mais sans règle précise.", profile: "pragmatique" },
            { text: "Oui, régulièrement — c'est utile pour contextualiser mes demandes.", profile: "technophile" }
        ]
    },
    {
        theme: "Juridique ⚖️",
        question: "Tu utilises une image générée par IA pour illustrer un support de cours. Du point de vue du droit d'auteur, cette pratique te semble :",
        answers: [
            { text: "Potentiellement problématique — les modèles se sont entraînés sur des œuvres protégées.", profile: "reflechi" },
            { text: "Floue juridiquement — la question n'est pas encore tranchée en Belgique.", profile: "pragmatique" },
            { text: "Tout à fait légale — une image générée par IA n'est pas protégée.", profile: "technophile" }
        ]
    },
    {
        theme: "Juridique ⚖️",
        question: "Un·e élève mineur·e te demande s'il/elle peut ouvrir un compte sur ChatGPT pour ses devoirs. Tu lui réponds :",
        answers: [
            { text: "Non — ces plateformes ont des restrictions d'âge (13 ou 16 ans selon les cas) qu'il faut respecter.", profile: "reflechi" },
            { text: "Je lui conseille d'en discuter d'abord avec un parent.", profile: "pragmatique" },
            { text: "Oui, sans restriction — je ne vois pas de problème.", profile: "technophile" }
        ]
    },

    // ============ ESPRIT CRITIQUE 🧠 (6 questions) ============
    {
        theme: "Esprit Critique 🧠",
        question: "Lorsque tu utilises un texte ou une image produits par IA, tu :",
        answers: [
            { text: "Analyses systématiquement la cohérence et cherches d'éventuelles erreurs, et encourages les élèves à faire de même.", profile: "reflechi" },
            { text: "Parcours rapidement le contenu pour vérifier que \"ça tient la route\".", profile: "pragmatique" },
            { text: "Fais confiance à l'IA, car \"c'est plus fiable que Wikipédia\".", profile: "technophile" }
        ]
    },
    {
        theme: "Esprit Critique 🧠",
        question: "Un élève te rapporte que le chatbot IA a inventé une fausse information plausible. Ta réaction :",
        answers: [
            { text: "Tu saisis l'occasion pour organiser une activité de vérification collaborative.", profile: "reflechi" },
            { text: "Tu corriges le résultat et demandes à l'élève d'être attentif à l'avenir.", profile: "pragmatique" },
            { text: "Tu minimises l'incident, \"ce sont des cas isolés, ça arrive\".", profile: "technophile" }
        ]
    },
    {
        theme: "Esprit Critique 🧠",
        question: "Lorsque tu abordes l'IA avec tes élèves, tu :",
        answers: [
            { text: "Fais systématiquement un détour par le doute, la source, la pluralité des points de vue.", profile: "reflechi" },
            { text: "Proposes l'IA comme un outil parmi d'autres, utile pour explorer des idées.", profile: "pragmatique" },
            { text: "Mets en avant l'IA comme référence fiable pour la production d'informations.", profile: "technophile" }
        ]
    },
    {
        theme: "Esprit Critique 🧠",
        question: "Une IA te produit un texte fluide, bien structuré, avec des références précises. Ton réflexe est :",
        answers: [
            { text: "Vérifier les affirmations clés et croiser les sources avant tout usage.", profile: "reflechi" },
            { text: "Le relire attentivement mais sans vérification systématique des sources.", profile: "pragmatique" },
            { text: "L'utiliser tel quel — la qualité formelle est un indicateur suffisant.", profile: "technophile" }
        ]
    },
    {
        theme: "Esprit Critique 🧠",
        question: "Les IA « hallucinent » parfois : elles produisent des informations fausses avec assurance. À quelle fréquence as-tu détecté ce phénomène ?",
        answers: [
            { text: "Souvent — je l'intègre systématiquement dans mon évaluation des sorties IA.", profile: "reflechi" },
            { text: "Une ou deux fois — c'est un phénomène que je connais.", profile: "pragmatique" },
            { text: "Jamais — je ne l'ai pas encore rencontré.", profile: "technophile" }
        ]
    },
    {
        theme: "Esprit Critique 🧠",
        question: "As-tu des pratiques pédagogiques spécifiques pour entraîner tes élèves à identifier un contenu généré par IA ?",
        answers: [
            { text: "Oui — une démarche explicite, outillée, que je peux décrire.", profile: "reflechi" },
            { text: "J'y réfléchis mais sans démarche stabilisée pour l'instant.", profile: "pragmatique" },
            { text: "Non — pas encore, ce n'est pas prioritaire dans ma pratique.", profile: "technophile" }
        ]
    }
];

export const THEMES = ["Éthique 🤔", "Écologique 🌱", "Juridique ⚖️", "Esprit Critique 🧠"];
