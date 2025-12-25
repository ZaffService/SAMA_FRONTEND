"use client";

import { useState } from "react";
import { ChevronDown, Search, HelpCircle, MessageCircle } from "lucide-react";
import Link from "next/link";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  // Catégorie: Inscription et Compte
  {
    id: 1,
    category: "Inscription et Compte",
    question: "Comment créer un compte sur BIBOCOM DIGITAL ?",
    answer:
      "Pour créer un compte, cliquez sur le bouton 'S'inscrire' en haut de la page. Remplissez le formulaire avec vos informations (nom, prénom, email, téléphone) et créez un mot de passe sécurisé. Vous recevrez un email de confirmation pour activer votre compte.",
  },
  {
    id: 2,
    category: "Inscription et Compte",
    question: "J'ai oublié mon mot de passe, que faire ?",
    answer:
      "Cliquez sur 'Mot de passe oublié ?' sur la page de connexion. Entrez votre adresse email et vous recevrez un lien pour réinitialiser votre mot de passe. Ce lien est valide pendant 24 heures.",
  },
  {
    id: 3,
    category: "Inscription et Compte",
    question: "Comment modifier mes informations personnelles ?",
    answer:
      "Une fois connecté, accédez à votre tableau de bord étudiant, puis cliquez sur 'Mon Profil'. Vous pourrez modifier votre nom, prénom, email, numéro de téléphone et photo de profil.",
  },

  // Catégorie: Cours et Formations
  {
    id: 4,
    category: "Cours et Formations",
    question: "Comment accéder aux cours ?",
    answer:
      "Après vous être connecté, rendez-vous dans la section 'Tous les cours'. Cliquez sur le cours qui vous intéresse. Si le cours est gratuit, vous y aurez accès immédiatement. Si le cours est payant, vous devrez d'abord procéder au paiement.",
  },
  {
    id: 5,
    category: "Cours et Formations",
    question:
      "Quelle est la différence entre un cours gratuit et un cours premium ?",
    answer:
      "Les cours gratuits offrent un contenu d'introduction de qualité. Les cours premium incluent des modules avancés, des exercices pratiques, des quiz d'évaluation, un certificat de fin de formation et un support personnalisé de nos formateurs.",
  },
  {
    id: 6,
    category: "Cours et Formations",
    question: "Les cours sont-ils accessibles à vie ?",
    answer:
      "Oui ! Une fois que vous avez acheté un cours, vous y avez accès à vie. Vous pouvez le suivre à votre rythme et y revenir autant de fois que vous le souhaitez.",
  },
  {
    id: 7,
    category: "Cours et Formations",
    question: "Puis-je télécharger les cours pour les consulter hors ligne ?",
    answer:
      "Les vidéos ne sont pas téléchargeables pour des raisons de droits d'auteur. Cependant, tous les supports de cours (PDF, exercices, ressources) sont téléchargeables depuis votre espace étudiant.",
  },

  // Catégorie: Paiement
  {
    id: 8,
    category: "Paiement",
    question: "Quels sont les moyens de paiement acceptés ?",
    answer:
      "Nous acceptons les paiements via Wave Mobile Money et Orange Money. Ces méthodes sont sécurisées et vous permettent de payer directement depuis votre téléphone mobile.",
  },
  {
    id: 9,
    category: "Paiement",
    question: "Le paiement est-il sécurisé ?",
    answer:
      "Absolument ! Nous utilisons des passerelles de paiement sécurisées (Wave et Orange Money) qui sont certifiées et conformes aux normes de sécurité bancaires. Vos informations de paiement ne sont jamais stockées sur nos serveurs.",
  },
  {
    id: 10,
    category: "Paiement",
    question: "Puis-je obtenir un remboursement ?",
    answer:
      "Nous offrons une garantie satisfait ou remboursé de 7 jours. Si vous n'êtes pas satisfait d'un cours, contactez-nous à support@bibocomdigital.com dans les 7 jours suivant l'achat pour demander un remboursement complet.",
  },

  // Catégorie: Certificats
  {
    id: 11,
    category: "Certificats",
    question: "Comment obtenir mon certificat de formation ?",
    answer:
      "Pour obtenir votre certificat, vous devez compléter 100% du cours et réussir le quiz final avec un score minimum de 80%. Le certificat sera automatiquement disponible dans votre espace étudiant.",
  },
  {
    id: 12,
    category: "Certificats",
    question: "Les certificats sont-ils reconnus ?",
    answer:
      "Nos certificats attestent de votre participation et de votre réussite à nos formations. Ils sont reconnus par de nombreuses entreprises au Sénégal et en Afrique de l'Ouest comme preuve de vos compétences en Marketing Digital.",
  },

  // Catégorie: Support Technique
  {
    id: 13,
    category: "Support Technique",
    question: "J'ai un problème technique, qui contacter ?",
    answer:
      "Pour toute assistance technique, envoyez-nous un email à support@bibocomdigital.com avec une description détaillée de votre problème. Notre équipe vous répondra dans les 24 heures.",
  },
  {
    id: 14,
    category: "Support Technique",
    question: "Les vidéos ne se chargent pas, que faire ?",
    answer:
      "Vérifiez d'abord votre connexion internet. Si le problème persiste, essayez de vider le cache de votre navigateur ou d'utiliser un autre navigateur (Chrome, Firefox, Safari). Si cela ne résout pas le problème, contactez notre support technique.",
  },
];

const categories = Array.from(new Set(faqData.map((item) => item.category)));

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Toutes");
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (id: number) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const filteredFAQ = faqData.filter((item) => {
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "Toutes" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary via-blue-600 to-blue-700 text-white">
        <div className="container mx-auto px-6 py-16 lg:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6 backdrop-blur-sm">
              <HelpCircle className="w-8 h-8" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Centre d'Aide
            </h1>
            <p className="text-lg text-blue-100 mb-8">
              Trouvez rapidement des réponses à vos questions
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une question..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white text-gray-900 placeholder-gray-500 shadow-lg focus:outline-none focus:ring-4 focus:ring-white/30 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12 lg:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Category Filters */}
          <div className="flex flex-wrap gap-3 mb-12">
            <button
              onClick={() => setSelectedCategory("Toutes")}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedCategory === "Toutes"
                  ? "bg-primary text-white shadow-lg shadow-primary/25"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-300"
              }`}
            >
              Toutes
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === category
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-300"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {filteredFAQ.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Aucun résultat trouvé
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Essayez avec d'autres mots-clés ou contactez notre support
                </p>
              </div>
            ) : (
              filteredFAQ.map((item) => (
                <div
                  key={item.id}
                  className="group bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 dark:border-slate-700"
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex-1 pr-4">
                      <span className="inline-block px-3 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full mb-2">
                        {item.category}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">
                        {item.question}
                      </h3>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-500 transition-transform duration-300 flex-shrink-0 ${
                        openItems.includes(item.id) ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openItems.includes(item.id) ? "max-h-96" : "max-h-0"
                    }`}
                  >
                    <div className="px-6 pb-5 text-gray-600 dark:text-gray-400 leading-relaxed">
                      {item.answer}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Contact Section */}
          <div className="mt-16 bg-gradient-to-br from-primary/10 via-blue-50/50 to-primary/10 dark:from-primary/20 dark:via-slate-800 dark:to-primary/20 rounded-2xl p-8 lg:p-12 border border-primary/20">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Vous ne trouvez pas votre réponse ?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Notre équipe est là pour vous aider. Contactez-nous et nous vous
                répondrons dans les plus brefs délais.
              </p>
              <div className="flex justify-center">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-300 border border-gray-200 dark:border-slate-700 hover:shadow-lg"
                >
                  <MessageCircle className="w-5 h-5" />
                  Retour à l'accueil
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
