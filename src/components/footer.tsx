import Link from "next/link";
import Image from "next/image";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0A2A66] text-white">
      <div className="container mx-auto px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo BIBOCOM */}
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <Image
                src="/logo.png"
                alt="BIBOCOM Digital Logo"
                width={120}
                height={60}
                className="h-auto object-contain"
              />
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex items-center gap-4">
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider mb-2">Liens Rapide:</h4>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <Link href="/" className="hover:text-white transition-colors">
                  Accueil
                </Link>
                <span className="text-white/40">|</span>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider mb-2">Contact:</h4>
            <a
              href="mailto:contact@bibocom.com"
              className="text-sm text-white/80 hover:text-white transition-colors"
            >
              Email: contact@bibocomdigital.com
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/20">
        <div className="container mx-auto px-6 lg:px-8 py-4">
          <div className="text-center">
            <p className="text-sm text-white/80">
              &copy; {currentYear}{" "}
              <span className="font-semibold text-white">
                BIBOCOM DIGITAL
              </span>
              . Tous droits réservés.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
