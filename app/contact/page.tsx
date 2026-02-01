"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Mail, Phone, MapPin, Send, MessageCircle, Clock } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulation d'envoi
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setSubmitStatus("success");
    setFormData({ name: "", email: "", subject: "", message: "" });

    // Reset status après 3 secondes
    setTimeout(() => setSubmitStatus("idle"), 3000);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email",
      value: "support@bibocomdigital.com",
      href: "mailto:support@bibocomdigital.com",
    },
    {
      icon: Phone,
      title: "Téléphone",
      value: "+221 33 123 45 67",
      href: "tel:+221331234567",
    },
    {
      icon: MapPin,
      title: "Adresse",
      value: "Dakar, Sénégal",
      href: "#",
    },
    {
      icon: Clock,
      title: "Heures d'ouverture",
      value: "Lun-Ven: 9h-18h | Sam: 9h-13h",
      href: "#",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <div className="bg-[var(--bibocom-blue)] text-white">
        <div className="container mx-auto px-6 py-20 lg:py-28">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            </h1>
            <p className="text              Contact
-xl text-blue-100 leading-relaxed">
              Vous avez des questions ou besoin d'aide ? Notre équipe est là pour vous accompagner.
              N'hésitez pas à nous contacter via le formulaire ou par téléphone.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Info Cards */}
      <div className="container mx-auto px-6 -mt-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {contactInfo.map((info, index) => (
            <a
              key={index}
              href={info.href}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow group"
            >
              <div className="w-14 h-14 bg-[var(--bibocom-blue)]/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[var(--bibocom-blue)] transition-colors">
                <info.icon className="w-7 h-7 text-[var(--bibocom-blue)] group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-semibold text-gray-500 text-sm mb-1">{info.title}</h3>
              <p className="text-gray-900 font-medium">{info.value}</p>
            </a>
          ))}
        </div>
      </div>

      {/* Contact Form */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="grid lg:grid-cols-2">
                {/* Info Side */}
                <div className="bg-[var(--bibocom-blue)] text-white p-8 lg:p-12">
                  <div className="flex items-center gap-3 mb-8">
                    <MessageCircle className="w-8 h-8" />
                    <h2 className="text-2xl font-bold">Parlons-en !</h2>
                  </div>
                  <p className="text-blue-100 mb-8 leading-relaxed">
                    Remplissez le formulaire et notre équipe vous répondra dans les plus brefs délais.
                    Nous sommes disponibles pour répondre à toutes vos questions.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                        <Mail className="w-5 h-5" />
                      </div>
                      <span>support@bibocomdigital.com</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                        <Phone className="w-5 h-5" />
                      </div>
                      <span>+221 33 123 45 67</span>
                    </div>
                  </div>
                </div>

                {/* Form Side */}
                <div className="p-8 lg:p-12">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Nom complet *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--bibocom-blue)] focus:border-transparent transition-all outline-none"
                          placeholder="Votre nom"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Email *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--bibocom-blue)] focus:border-transparent transition-all outline-none"
                          placeholder="votre@email.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="subject"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Sujet *
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--bibocom-blue)] focus:border-transparent transition-all outline-none"
                      >
                        <option value="">Sélectionnez un sujet</option>
                        <option value="support">Support technique</option>
                        <option value="billing">Question sur la facturation</option>
                        <option value="partnership">Partenariat</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Message *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--bibocom-blue)] focus:border-transparent transition-all outline-none resize-none"
                        placeholder="Décrivez votre demande..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 bg-[var(--bibocom-blue)] text-white font-semibold rounded-lg hover:bg-[var(--bibocom-blue)]/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Envoyer le message
                        </>
                      )}
                    </button>

                    {submitStatus === "success" && (
                      <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Message envoyé avec succès ! Nous vous répondrons sous 24h.
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold mb-4">
              Venez nous rendre visite
            </h2>
            <p className="text-gray-600">
              Notre équipe sera ravie de vous accueillir dans nos locaux.
            </p>
          </div>
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-4 h-96 flex items-center justify-center border border-gray-100">
              <div className="text-center text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-[var(--bibocom-blue)]" />
                <p className="text-lg font-medium">Carte Google Maps</p>
                <p className="text-sm">Dakar, Sénégal</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
