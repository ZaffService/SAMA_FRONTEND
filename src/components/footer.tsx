import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const platformLinks = [
    { label: "Accueil", href: "/" },
    { label: "Catalogue des cours", href: "/" },
    // { label: "E-book", href: "/e-book" },
    { label: "FAQ", href: "/faq" },
  ];

  const resourceLinks = [
    { label: "À propos", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Centre d'aide", href: "/faq" },
    // { label: "Support technique", href: "mailto:support@bibocomdigital.com" },
  ];

  const accountLinks = [
    { label: "Se connecter", href: "/login" },
    { label: "Créer un compte", href: "/register" },
    { label: "Mot de passe oublié", href: "/forgot-password" },
    // { label: "Espace apprenant", href: "/student-dashboard" },
  ];

  const linkClassName =
    "text-[16px] text-slate-600 leading-snug hover:text-[var(--bibocom-blue)] transition-colors";

  return (
    <footer className="bg-[var(--bibocom-gray-bg)] text-slate-900">
      <div className="container mx-auto px-6 lg:px-8 py-8 lg:py-10">
        <div className="rounded-3xl bg-white shadow-[0_30px_80px_-50px_rgba(15,23,42,0.45)] border border-slate-200/70 px-6 py-8 md:px-10 md:py-9">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            {/* Brand */}
            <div className="space-y-3">
              <Link href="/" className="inline-flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="Bibocom Digital"
                  width={130}
                  height={60}
                  className="h-auto w-auto object-contain"
                />
              </Link>
              <p className="text-[16px] text-slate-600 leading-snug">
                Plateforme e-learning complète pour développer vos compétences
                digitales et professionnelles en Afrique.
              </p>
              <ul className="space-y-1 text-[13px] text-slate-600">
                <li className="flex items-start gap-2">
                  <Mail className="mt-0.5 h-3.5 w-3.5 text-[var(--bibocom-red)]" />
                  <a
                    href="mailto:Recruformateur@bibocomdigital.com"
                    className="hover:text-[var(--bibocom-blue)] transition-colors"
                  >
                    contact@bibocomdigital.com
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <Mail className="mt-0.5 h-3.5 w-3.5 text-[var(--bibocom-red)]" />
                  <a
                    href="mailto:contact@bibocomdigital.com"
                    className="hover:text-[var(--bibocom-blue)] transition-colors"
                  >
                    Recruformateur@bibocomdigital.com
                  </a>
                </li>
                {/* <li className="flex items-start gap-2">
                  <Phone className="mt-0.5 h-3.5 w-3.5 text-[var(--bibocom-red)]" />
                  <a
                    href="tel:+221338010184"
                    className="hover:text-[var(--bibocom-blue)] transition-colors"
                  >
                    +221 33 801 01 84
                  </a>
                </li> */}
              </ul>
            </div>

            {/* Platform */}
            <div className="space-y-3 flex flex-col justify-center">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-900">
                Plateforme
              </h4>
              <ul className="space-y-1">
                {platformLinks.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className={linkClassName}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div className="space-y-3  flex flex-col justify-center">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-900">
                Ressources
              </h4>
              <ul className="space-y-1">
                {resourceLinks.map((item) => (
                  <li key={item.label} className="text-2xl">
                    {item.href.startsWith("mailto:") ? (
                      <a href={item.href} className={linkClassName}>
                        {item.label}
                      </a>
                    ) : (
                      <Link href={item.href} className={linkClassName}>
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Account */}
            <div className="space-y-3 flex flex-col justify-center">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-900">
                Compte
              </h4>
              <ul className="space-y-1">
                {accountLinks.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className={linkClassName}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-8 border-t border-slate-200 pt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-[12px] text-slate-500 leading-snug">
              &copy; {currentYear}{" "}
              <span className="font-semibold text-slate-900">
                BIBOCOM Digital
              </span>
              . Tous droits réservés.
            </p>
            <div className="flex flex-wrap gap-3 text-[12px]">
              <Link href="/faq" className={linkClassName}>
                FAQ
              </Link>
              <a
                href="mailto:support@bibocomdigital.com"
                className={linkClassName}
              >
                Support
              </a>
              <Link href="/contact" className={linkClassName}>
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
