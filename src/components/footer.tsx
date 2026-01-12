import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-900 dark:via-blue-950/20 dark:to-slate-900">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />

      {/* Main Footer Content */}
      <div className="relative border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
            {/* Colonne 1 : Contact */}
            <div className="space-y-5">
              <div>
                <h3 className="font-bold text-lg text-foreground mb-1 relative inline-block">
                  Contact
                  <span className="absolute -bottom-1 left-0 w-12 h-0.5 bg-gradient-to-r from-primary to-blue-600 rounded-full" />
                </h3>
              </div>
              <ul className="space-y-4">
                <li className="group">
                  <a
                    href="mailto:contact@bibocomdigital.com"
                    className="text-sm text-muted-foreground hover:text-primary transition-all duration-300 inline-flex items-center gap-2 group-hover:translate-x-1"
                  >
                    <svg
                      className="w-4 h-4 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="font-medium">
                      contact@bibocomdigital.com
                    </span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Colonne 2 : Navigation */}
            <div className="space-y-5">
              <div>
                <h3 className="font-bold text-lg text-foreground mb-1 relative inline-block">
                  Navigation
                  <span className="absolute -bottom-1 left-0 w-12 h-0.5 bg-gradient-to-r from-primary to-blue-600 rounded-full" />
                </h3>
              </div>
              <ul className="space-y-3">
                <li className="group">
                  <Link
                    href="/"
                    className="text-sm text-muted-foreground hover:text-primary transition-all duration-300 inline-flex items-center gap-2 group-hover:translate-x-1"
                  >
                    <span className="w-1 h-1 rounded-full bg-primary group-hover:w-2 transition-all duration-300" />
                    Accueil
                  </Link>
                </li>
                <li className="group">
                  <Link
                    href="/courses"
                    className="text-sm text-muted-foreground hover:text-primary transition-all duration-300 inline-flex items-center gap-2 group-hover:translate-x-1"
                  >
                    <span className="w-1 h-1 rounded-full bg-primary group-hover:w-2 transition-all duration-300" />
                    Tous les cours
                  </Link>
                </li>
              </ul>
            </div>

            {/* Colonne 3 : Support */}
            <div className="space-y-5">
              <div>
                <h3 className="font-bold text-lg text-foreground mb-1 relative inline-block">
                  Support
                  <span className="absolute -bottom-1 left-0 w-12 h-0.5 bg-gradient-to-r from-primary to-blue-600 rounded-full" />
                </h3>
              </div>
              <ul className="space-y-3">
                <li className="group">
                  <Link
                    href="/faq"
                    className="text-sm text-muted-foreground hover:text-primary transition-all duration-300 inline-flex items-center gap-2 group-hover:translate-x-1"
                  >
                    <span className="w-1 h-1 rounded-full bg-primary group-hover:w-2 transition-all duration-300" />
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Colonne 4 : Suivez-nous */}
            <div className="space-y-5">
              <div>
                <h3 className="font-bold text-lg text-foreground mb-1 relative inline-block">
                  Suivez-nous
                  <span className="absolute -bottom-1 left-0 w-12 h-0.5 bg-gradient-to-r from-primary to-blue-600 rounded-full" />
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Rejoignez notre communauté et restez à jour avec nos dernières
                formations.
              </p>
              <div className="flex gap-3">
                <a
                  href="https://tiktok.com/@bibocomdigital"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-center transition-all duration-300 hover:scale-110"
                  aria-label="TikTok"
                >
                  <svg
                    className="h-8 w-8 text-foreground group-hover:text-black dark:group-hover:text-white transition-colors duration-300"
                    fill="currentColor"
                    viewBox="0 0 448 512"
                  >
                    <path d="M448 209.91a210.06 210.06 0 0 1-122.77-39.25v178.72A162.55 162.55 0 1 1 185 188.31v89.89a74.62 74.62 0 1 0 52.23 71.18V0h88a121.18 121.18 0 0 0 1.86 22.17A122.18 122.18 0 0 0 381 102.39a121.43 121.43 0 0 0 67 20.14z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar avec design amélioré */}
        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="container mx-auto px-6 lg:px-8 py-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                &copy; {currentYear}{" "}
                <span className="font-semibold text-foreground">
                  BIBOCOM DIGITAL
                </span>
                . Tous droits réservés.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
