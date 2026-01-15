import React from "react";
import { BookOpen, Clock, Bell, Search, X } from "lucide-react";

export default function EmptyCoursesState() {


  return (
    <section className="w-full py-12 px-4 md:px-6 lg:px-8">
  <div className="max-w-7xl mx-auto">
    {/* Titre de la section */}
    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
      Découvrez nos formations
    </h2>

    {/* Card principale - Incitation à l'inscription */}
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-xl p-8 md:p-12 text-white">
      <div className="max-w-3xl mx-auto text-center">
        {/* Icône */}
        <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full mb-6">
          <BookOpen className="w-12 h-12 text-white" />
        </div>

        {/* Titre accrocheur */}
        <h3 className="text-2xl md:text-4xl font-bold mb-4">
          Soyez parmi les premiers à accéder à nos formations exclusives !
        </h3>

        {/* Description engageante */}
        <p className="text-blue-50 text-base md:text-lg mb-10 leading-relaxed">
          Nos experts préparent des cours exceptionnels qui transformeront votre parcours d&apos;apprentissage. 
          Créez votre compte dès maintenant pour être averti en priorité et ne rien manquer !
        </p>

        {/* Cards informatives */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Card Accès prioritaire */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-left border border-white/20">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 bg-yellow-400 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🌟</span>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-lg">
                  Accès prioritaire
                </h4>
                <p className="text-sm text-blue-100 leading-relaxed">
                  Soyez les premiers informés du lancement de chaque nouveau cours
                </p>
              </div>
            </div>
          </div>

          {/* Card Notification instantanée */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-left border border-white/20">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 bg-green-400 rounded-lg flex items-center justify-center">
                <Bell className="w-7 h-7 text-green-900" />
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-lg">
                  Alertes instantanées
                </h4>
                <p className="text-sm text-blue-100 leading-relaxed">
                  Recevez une notification dès qu&apos;une formation est disponible
                </p>
              </div>
            </div>
          </div>

          {/* Card Offres exclusives */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-left border border-white/20">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 bg-purple-400 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎁</span>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-lg">
                  Offres exclusives
                </h4>
                <p className="text-sm text-blue-100 leading-relaxed">
                  Profitez d&apos;avantages réservés aux membres inscrits
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Boutons CTA principaux */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <a 
            href="/register"
          className="px-10 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg text-center"
          >
            Créer mon compte gratuitement
          </a>
          <a 
            href="/login"
            className="px-10 py-4 bg-transparent text-white border-2 border-white rounded-lg font-semibold hover:bg-white/10 transition-all text-center"
          >
            J&apos;ai déjà un compte
          </a>
        </div>

        {/* Petit texte rassurant */}
        <p className="text-blue-100 text-sm">
          ✨ Inscription gratuite • Sans engagement • Accès immédiat
        </p>
      </div>
    </div>

    {/* Card Compteur d'attente / Urgence */}
    <div className="mt-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border-2 border-orange-200">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center flex-shrink-0">
          <Clock className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-gray-900 mb-2 text-lg flex items-center gap-2">
            Lancement imminent !
          </h4>
          <p className="text-gray-700 leading-relaxed mb-3">
            Nos formateurs mettent la touche finale à des contenus exceptionnels. 
            <strong className="text-orange-600"> Ne ratez pas le lancement</strong> - 
            inscrivez-vous maintenant et complétez votre profil pour être 100% prêt !
          </p>
          <div className="flex items-center gap-2 text-sm text-orange-700 font-medium">
            <span className="inline-block w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
            Déjà <strong>247 personnes</strong> en liste d&apos;attente
          </div>
        </div>
      </div>
    </div>

    {/* Card Pendant que vous attendez */}
    <div className="mt-6 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-xl">
          💡
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 mb-2 text-lg">
            En attendant, préparez-vous !
          </h4>
          <p className="text-gray-700 leading-relaxed">
            Créez votre compte en 2 minutes, complétez votre profil d&apos;apprenant, 
            définissez vos objectifs et explorez notre catalogue. Vous serez ainsi 
            <strong> prêt à démarrer</strong> dès la publication du premier cours !
          </p>
        </div>
      </div>
    </div>
  </div>
</section>
  );
}
