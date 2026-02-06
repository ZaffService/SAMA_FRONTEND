"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ArrowRight, Clock } from "lucide-react";

interface CoursePurchaseCongratsProps {
  courseId?: string;
}

export default function CoursePurchaseCongrats({ courseId }: CoursePurchaseCongratsProps) {
  const router = useRouter();

  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [countdown, setCountdown] = useState(5); // 5 seconds countdown

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsButtonDisabled(false);
    }
  }, [countdown]);

  const handleGoToCourse = () => {
    if (courseId) {
      router.push(`/course-details/${courseId}`);
    }
  };

  const handleContinue = () => {
    // Action for the second button, e.g., go to dashboard or something
    router.push("/mes-apprentissages");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        {/* Congratulatory Message */}
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Félicitations !
        </h2>
        <p className="text-lg text-gray-700 mb-6">
          Vous avez successfully acheté ce cours. Bienvenue dans votre nouveau parcours d'apprentissage !
        </p>

        {/* Course Info */}
        {courseId && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              🎉 Votre inscription au cours a été confirmée !
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-4">
          {/* Redirect to Course Button */}
          <button
            onClick={handleGoToCourse}
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-5 h-5" />
            Accéder à mon cours
          </button>

          {/* Disabled Button with Countdown */}
          <button
            onClick={handleContinue}
            disabled={isButtonDisabled}
            className={`w-full py-3 px-4 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              isButtonDisabled
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600"
            }`}
          >
            {isButtonDisabled ? (
              <>
                <Clock className="w-5 h-5" />
                Continuer ({countdown}s)
              </>
            ) : (
              <>
                <ArrowRight className="w-5 h-5" />
                Continuer vers mes apprentissages
              </>
            )}
          </button>
        </div>

        {/* Additional Message */}
        <p className="text-sm text-gray-500 mt-6">
          Vous pouvez maintenant commencer votre apprentissage. Bonne chance !
        </p>
      </div>
    </div>
  );
}
