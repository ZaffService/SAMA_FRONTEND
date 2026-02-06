"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Mail, Phone, MapPin, Send, MessageCircle, Clock } from "lucide-react";
import { showContactFormSuccess } from "@/shared/helpers/sweet-alert";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation functions
  const validateName = (name: string): string | undefined => {
    if (!name.trim()) return "Le nom est obligatoire";
    if (name.trim().length < 2) return "Le nom doit contenir au moins 2 caractères";
    if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(name.trim())) return "Le nom ne doit contenir que des lettres";
    return undefined;
  };

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) return "L'email est obligatoire";
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) return "Veuillez entrer un email valide";
    return undefined;
  };

  const validateSubject = (subject: string): string | undefined => {
    if (!subject) return "Veuillez sélectionner un sujet";
    return undefined;
  };

  const validateMessage = (message: string): string | undefined => {
    if (!message.trim()) return "Le message est obligatoire";
    if (message.trim().length < 10) return "Le message doit contenir au moins 10 caractères";
    if (message.trim().length > 1000) return "Le message ne doit pas dépasser 1000 caractères";
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    const nameError = validateName(formData.name);
    const emailError = validateEmail(formData.email);
    const subjectError = validateSubject(formData.subject);
    const messageError = validateMessage(formData.message);

    if (nameError) newErrors.name = nameError;
    if (emailError) newErrors.email = emailError;
    if (subjectError) newErrors.subject = subjectError;
    if (messageError) newErrors.message = messageError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Simulation d'envoi
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setFormData({ name: "", email: "", subject: "", message: "" });
    
    // Afficher le toast de succès avec SweetAlert2
    showContactFormSuccess();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email",
      value: "contact@bibocomdigital.com",
      // href: "mailto:contact@bibocomdigital.com",
    },
    {
      icon: Phone,
      title: "Téléphone",
      value: "+221 33 801 01 84",
      // href: "tel:+221 33 801 01 84",
    },
    {
      icon: MapPin,
      title: "Adresse",
      value: "Dakar, Sénégal",
      href: "#",
    },
    {
      icon: Clock,
      title: "Horaires",
      value: "Lun-Ven: 9h-18h",
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
            <p
              key={index}
              // href={info.href}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow group "
            >
              <div className="w-14 h-14 bg-[var(--bibocom-blue)]/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[var(--bibocom-blue)] transition-colors">
                <info.icon className="w-7 h-7 text-[var(--bibocom-blue)] group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-semibold text-gray-500 text-sm mb-1">{info.title}</h3>
              <p className="text-gray-900 font-medium">{info.value}</p>
            </p>
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
                      <span>contact@bibocomdigital.com</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                        <Phone className="w-5 h-5" />
                      </div>
                      <span>+221 33 801 01 84</span>
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
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[var(--bibocom-blue)] focus:border-transparent transition-all outline-none ${
                            errors.name ? "border-red-500" : "border-gray-200"
                          }`}
                          placeholder="Votre nom"
                        />
                        {errors.name && (
                          <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Email *
                        </label>
                        <input
                          type="text"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[var(--bibocom-blue)] focus:border-transparent transition-all outline-none ${
                            errors.email ? "border-red-500" : "border-gray-200"
                          }`}
                          placeholder="votre@email.com"
                        />
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                        )}
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
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[var(--bibocom-blue)] focus:border-transparent transition-all outline-none ${
                          errors.subject ? "border-red-500" : "border-gray-200"
                        }`}
                      >
                        <option value="">Sélectionnez un sujet</option>
                        <option value="support">Support technique</option>
                        <option value="billing">Question sur la facturation</option>
                        <option value="partnership">Partenariat</option>
                        <option value="other">Autre</option>
                      </select>
                      {errors.subject && (
                        <p className="mt-1 text-sm text-red-500">{errors.subject}</p>
                      )}
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
                        rows={5}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[var(--bibocom-blue)] focus:border-transparent transition-all outline-none resize-none ${
                          errors.message ? "border-red-500" : "border-gray-200"
                        }`}
                        placeholder="Décrivez votre demande..."
                      />
                      {errors.message && (
                        <p className="mt-1 text-sm text-red-500">{errors.message}</p>
                      )}
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
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3858.8432936213253!2d-17.46017722489144!3d14.720150185779398!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xec173bc8180b45f%3A0x6d219f9a2aa32b0e!2sBibocom%20Digital!5e0!3m2!1sfr!2ssn!4v1769986860510!5m2!1sfr!2ssn"
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Carte Google Maps - Bibocom Digital"
              />
            </div>
            <div className="text-center mt-4">
              <p className="text-gray-600">Dakar, Sénégal</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
