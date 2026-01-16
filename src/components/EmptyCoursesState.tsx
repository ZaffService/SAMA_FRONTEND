import React from "react";
import {
  BookOpen,
  Star,
  Bell,
  Gift,
  ArrowRight,
  Clock,
  Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmptyCoursesState() {
  return (
    <section className="w-full py-12 px-4 md:px-6 lg:px-8 lg:mt-10">
      <div className="max-w-7xl mx-auto">
        {/* Titre de la section */}
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
          Découvrez nos formations
        </h2>

        {/* Card principale */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-xl p-8 md:p-12 text-white">
          <div className="max-w-3xl mx-auto text-center">
            {/* Icône principale */}
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full mb-6">
              <BookOpen className="w-12 h-12 text-white" />
            </div>

            {/* Titre */}
            <h3 className="text-2xl md:text-4xl font-bold mb-4">
              Soyez parmi les premiers à accéder à nos formations exclusives !
            </h3>

            {/* Description */}
            <p className="text-blue-50 text-base md:text-lg mb-10 leading-relaxed">
              Nos experts préparent des cours exceptionnels qui transformeront
              votre parcours d&apos;apprentissage. Créez votre compte dès
              maintenant pour être averti en priorité et ne rien manquer !
            </p>

            {/* Cards informatives */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Accès prioritaire */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-14 h-14 bg-yellow-400 rounded-lg flex items-center justify-center">
                    <Star className="w-7 h-7 text-yellow-900" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-lg">
                      Accès prioritaire
                    </h4>
                    <p className="text-sm text-blue-100 leading-relaxed">
                      Soyez les premiers informés du lancement de chaque nouveau
                      cours
                    </p>
                  </div>
                </div>
              </div>

              {/* Alertes */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-14 h-14 bg-green-400 rounded-lg flex items-center justify-center">
                    <Bell className="w-7 h-7 text-green-900" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-lg">
                      Alertes instantanées
                    </h4>
                    <p className="text-sm text-blue-100 leading-relaxed">
                      Recevez une notification dès qu&apos;une formation est
                      disponible
                    </p>
                  </div>
                </div>
              </div>

              {/* Offres exclusives */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-14 h-14 bg-purple-400 rounded-lg flex items-center justify-center">
                    <Gift className="w-7 h-7 text-purple-900" />
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

            {/* Boutons CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Button
                size="lg"
                className="bg-blue-50 hover:bg-blue-700 hover:text-white text-blue-600 px-6 py-3 text-base font-semibold rounded-lg transition-all"
                onClick={() => (window.location.href = "/register")}
              >
                Créer mon compte gratuitement
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <Button
                size="lg"
                className="bg-blue-50 hover:bg-blue-700 hover:text-white text-blue-600 px-6 py-3 text-base font-semibold rounded-lg transition-all"
                onClick={() => (window.location.href = "/login")}
              >
                J&apos;ai déjà un compte
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            {/* Texte rassurant */}
            <p className="text-blue-100 text-sm">
              Inscription gratuite • Sans engagement • Accès immédiat
            </p>
          </div>
        </div>

        {/* Urgence */}
        <div className="mt-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border-2 border-orange-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-2 text-lg">
                Lancement imminent !
              </h4>
              <p className="text-gray-700 leading-relaxed mb-3">
                Nos formateurs mettent la touche finale à des contenus
                exceptionnels.
                <strong className="text-orange-600">
                  {" "}
                  Ne ratez pas le lancement
                </strong>{" "}
                – inscrivez-vous maintenant !
              </p>
              <div className="flex items-center gap-2 text-sm text-orange-700 font-medium">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                Déjà <strong>247 personnes</strong> en liste d&apos;attente
              </div>
            </div>
          </div>
        </div>

        {/* Préparation */}
        <div className="mt-6 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 text-lg">
                En attendant, préparez-vous !
              </h4>
              <p className="text-gray-700 leading-relaxed">
                Créez votre compte, complétez votre profil et définissez vos
                objectifs. Vous serez <strong>prêt à démarrer</strong> dès la
                publication du premier cours !
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

