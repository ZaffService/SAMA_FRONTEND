"use client";

import { useEffect, useState, use } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Download,
  Calendar,
  Mail,
  ArrowRight,
  Clock,
  BookOpen,
  Star,
  Users,
  Award,
  Play,
} from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { useCourseDetails } from "@/application/use-cases/useCourseDetails";
import { useYoutubeDuration } from "@/application/use-cases/useYoutubeDuration";
import Image from "next/image";

export default function PaymentSuccess({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [orderNumber] = useState(
    `BCD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
  );
  const { course, loading, error } = useCourseDetails(id);
  const [countdown, setCountdown] = useState(5);

  // Extraire l'URL YouTube
  const videoUrl = course?.additional_info?.video?.[0]?.source_youtube;
  const { duration: videoDuration } = useYoutubeDuration(videoUrl);

  // Mapping des niveaux supprimé selon mission - badges de niveau supprimés
  // const levelMapping = { ... }
  // const courseLevel = levelMapping[course?.additional_info?.course_level?.[0]] || 'Tous niveaux'

  useEffect(() => {
    // Trigger confetti animation
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  // Auto-redirect to course after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = `/video-learning-module/${id}`;
    }, 5000);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col pt-16">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-4 text-muted-foreground">
              Chargement des détails du cours...
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex flex-col pt-16">
        <Header />
        <main className="flex-1 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-destructive text-lg mb-4">
                {error || "Cours non trouvé"}
              </p>
              <Link href="/">
                <Button>Retour aux cours</Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pt-16">
      <Header />

      <main className="flex-1 py-16 bg-linear-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Success Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 mb-6 animate-in zoom-in-95 duration-500">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Paiement réussi ! 🎉
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Félicitations ! Vous avez accès à votre cours. Vous serez
                redirigé automatiquement vers votre cours dans {countdown}{" "}
                seconde{countdown !== 1 ? "s" : ""}.
              </p>
            </div>

            {/* Course Preview with Video */}
            <div className="bg-card border rounded-2xl overflow-hidden shadow-lg mb-8">
              <div className="grid md:grid-cols-2 gap-6 p-6">
                {/* Course Image & Video */}
                <div className="relative aspect-video rounded-xl overflow-hidden shadow-md">
                  <Image
                    src={course?.thumbnail_url || "/placeholder.svg"}
                    alt={course?.post_title}
                    fill
                    className="object-cover"
                  />
                  {videoUrl && (
                    <Link href={`/video-learning-module/${id}`}>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-colors cursor-pointer group">
                        <button className="flex h-16 w-16 items-center justify-center rounded-full bg-white group-hover:scale-110 transition-transform shadow-lg">
                          <Play
                            className="h-6 w-6 text-primary ml-1"
                            fill="currentColor"
                          />
                        </button>
                      </div>
                    </Link>
                  )}
                </div>

                {/* Course Info */}
                <div className="flex flex-col justify-between">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-3">
                      {course?.post_title}
                    </h2>
                    <p className="text-muted-foreground mb-6 line-clamp-3">
                      {course?.post_content
                        ?.replace(/<[^>]*>/g, "")
                        .substring(0, 200)}
                      ...
                    </p>

                    {/* Course Stats */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-yellow-500/20 px-3 py-1 rounded-lg w-fit">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">
                            {course?.ratings?.rating_avg || "4.8"}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ({course?.ratings?.rating_count || "1250"} avis)
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-primary" />
                          <span className="font-medium">
                            {videoDuration?.formatted || "9h 36m"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-primary" />
                          <span className="font-medium">Contenu structuré</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-primary" />
                          <span className="font-medium">Certificat inclus</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Link
                    href={`/video-learning-module/${id}`}
                    className="w-full"
                  >
                    <Button size="lg" className="w-full">
                      Accédez à votre cours
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-card border rounded-2xl p-8 mb-8 shadow-sm">
              <div className="grid md:grid-cols-3 gap-8">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Numéro de commande
                  </p>
                  <p className="font-mono font-bold text-lg text-primary">
                    {orderNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Date de la commande
                  </p>
                  <p className="font-semibold text-lg">
                    {new Date().toLocaleDateString("fr-FR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Instructeur
                  </p>
                  <p className="font-semibold text-lg">
                    {course?.post_author?.display_name || "Expert Formateur"}
                  </p>
                </div>
              </div>
            </div>

            {/* Confirmation Email */}
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-2xl p-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-green-900 dark:text-green-100 mb-1">
                    Email de confirmation envoyé
                  </p>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Un email récapitulatif a été envoyé à votre adresse.
                    Vérifiez votre dossier spam si vous ne le trouvez pas.
                  </p>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-card border rounded-2xl p-8 mb-8 shadow-sm">
              <h3 className="text-2xl font-semibold mb-6">Prochaines étapes</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold shrink-0 text-lg">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-lg mb-1">
                      Commencez le cours immédiatement
                    </p>
                    <p className="text-muted-foreground">
                      Accédez aux vidéos, ressources et exercices pratiques
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold shrink-0 text-lg">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-lg mb-1">
                      Explorez le programme complet
                    </p>
                    <p className="text-muted-foreground">
                      Apprenez à votre rythme sans limites de temps
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold shrink-0 text-lg">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-lg mb-1">
                      Obtenez votre certificat
                    </p>
                    <p className="text-muted-foreground">
                      Complétez le cours et recevez votre certificat
                      professionnel
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <Link href={`/video-learning-module/${id}`} className="w-full">
                <Button size="lg" className="w-full h-14">
                  <Play className="mr-2 h-4 w-4" />
                  Commencer le cours
                </Button>
              </Link>
              <Link href="/student-dashboard" className="w-full">
                <Button size="lg" variant="outline" className="w-full h-14">
                  <Calendar className="mr-2 h-4 w-4" />
                  Voir mon tableau de bord
                </Button>
              </Link>
            </div>

            {/* Download Receipt */}
            <div className="text-center">
              <Button
                variant="ghost"
                size="lg"
                className="text-muted-foreground hover:text-foreground"
              >
                <Download className="mr-2 h-4 w-4" />
                Télécharger le reçu (PDF)
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
