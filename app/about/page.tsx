"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const dynamic = "force-dynamic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Award, BookOpen, Target, Heart, Star } from "lucide-react";
import Link from "next/link";

export default function About() {
  const stats = [
    { icon: Users, label: "Étudiants formés", value: "10,000+" },
    { icon: BookOpen, label: "Cours disponibles", value: "200+" },
    { icon: Award, label: "Certifications délivrées", value: "5,000+" },
    { icon: Star, label: "Note moyenne", value: "4.8/5" },
  ];

  const team = [
    {
      name: "Marie Dupont",
      role: "Directrice Pédagogique",
      bio: "Experte en formation digitale avec 15 ans d'expérience.",
    },
    {
      name: "Jean Martin",
      role: "Chef de Projet Technique",
      bio: "Développeur full-stack passionné par l'éducation.",
    },
    {
      name: "Sophie Leroy",
      role: "Responsable Marketing",
      bio: "Spécialiste du marketing digital et de la communication.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-20 sm:pt-24 lg:pt-28">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 to-destructive/10 py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                À propos de BIBOCOM Digital
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Notre mission est de démocratiser l'accès à l'éducation de
                qualité en Afrique et dans le monde, en offrant des formations
                professionnelles accessibles à tous.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-6">Notre Mission</h2>
                  <p className="text-muted-foreground mb-6">
                    Chez BIBOCOM Digital, nous croyons que l'éducation est la
                    clé du développement personnel et professionnel. Notre
                    plateforme offre des cours de haute qualité conçus par des
                    experts africains et internationaux, accessibles partout et
                    à tout moment.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Target className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold">Accessibilité</h3>
                        <p className="text-sm text-muted-foreground">
                          Des formations adaptées à tous les niveaux et budgets.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Award className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold">Qualité</h3>
                        <p className="text-sm text-muted-foreground">
                          Contenus pédagogiques validés par des professionnels.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Heart className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold">Impact social</h3>
                        <p className="text-sm text-muted-foreground">
                          Contribuer au développement des compétences en
                          Afrique.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-muted/30 rounded-xl p-8">
                  <h3 className="text-xl font-bold mb-6 text-center">
                    Nos Valeurs
                  </h3>
                  <div className="space-y-4">
                    <div className="text-center">
                      <Badge className="mb-2">Excellence</Badge>
                      <p className="text-sm text-muted-foreground">
                        Nous visons l'excellence dans tous nos contenus
                        pédagogiques.
                      </p>
                    </div>
                    <div className="text-center">
                      <Badge className="mb-2">Innovation</Badge>
                      <p className="text-sm text-muted-foreground">
                        Utilisation des dernières technologies pour
                        l'apprentissage.
                      </p>
                    </div>
                    <div className="text-center">
                      <Badge className="mb-2">Inclusion</Badge>
                      <p className="text-sm text-muted-foreground">
                        Éducation accessible à tous, indépendamment du
                        background.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold mb-2">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">
                Notre Équipe
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                {team.map((member, index) => (
                  <div key={index} className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary to-destructive rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-white font-bold text-xl">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <h3 className="font-semibold mb-1">{member.name}</h3>
                    <p className="text-sm text-primary mb-3">{member.role}</p>
                    <p className="text-sm text-muted-foreground">
                      {member.bio}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Prêt à commencer votre apprentissage ?
            </h2>
            <p className="text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              Rejoignez notre communauté d'apprenants et développez vos
              compétences avec nos formations de qualité.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <Button size="lg" variant="secondary">
                  Découvrir les cours
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                >
                  S'inscrire gratuitement
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
