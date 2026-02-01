"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  User,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { useAvatar } from "@/infrastructure/storage/AvatarContext";
import { MegaMenuOverlay } from "@/components/mega-menu-overlay";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formationsMenuOpen, setFormationsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const { user, logout, isLoading, isAuthenticated } = useLocalAuth();
  const { avatarUrl, firstName, lastName } = useAvatar();
  const pathname = usePathname();

  // Détection du scroll pour la transition du header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setFormationsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const displayName =
    firstName && lastName
      ? `${firstName} ${lastName}`
      : user?.display_name || "Utilisateur";

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const navLinks = [
    { label: "Accueil", href: "/" },
    { label: "À propos", href: "/about" },
    { label: "E-Book", href: "/e-book" },
    { label: "Contact", href: "/contact" },
  ];

  const formationsLink = { label: "Formations", href: "/courses" as const };

  // Handler pour ouvrir le mega menu (mobile et desktop)
  const handleFormationsClick = () => {
    setFormationsMenuOpen(true);
    setMobileMenuOpen(false);
  };

  // Vérifie si on doit appliquer le style centré (page d'accueil + desktop + non connecté)
  const isHomePage = pathname === "/";
  const shouldCenterHeader = isHomePage && !isAuthenticated && !isLoading;

  return (
    <>
      <header
        className={`fixed z-50 transition-all duration-300 ease-in-out ${
          // Sur mobile: toujours collé en haut
          // Sur desktop: arrondi seulement si page d'accueil + déconnecté + pas de scroll
          isScrolled || !shouldCenterHeader
            ? "top-0 left-0 right-0"
            : "lg:top-8 lg:left-4 lg:right-4 top-0 left-0 right-0"
        }`}
      >
        <div
          className={`bg-[var(--header-bg)] shadow-lg transition-all duration-300 ease-in-out ${
            isScrolled || !shouldCenterHeader
              ? "w-full rounded-none"
              : "w-full lg:max-w-[1800px] lg:mx-auto lg:rounded-2xl rounded-none"
          }`}
        >
          <div className="px-4 sm:px-6 md:px-10 py-5">
            <div className="flex items-center justify-between gap-4">
              {/* GAUCHE */}
              <div className="flex-shrink-0">
                {/* Logo - Mobile: toujours visible si déconnecté | Desktop: visible si déconnecté */}
                {!isAuthenticated && !isLoading ? (
                  <Link href="/">
                    <Image
                      src="/logo.png"
                      alt="Bibocom Logo"
                      width={100}
                      height={30}
                      priority
                      className="w-[80px] sm:w-[100px] lg:w-[110px] h-auto"
                    />
                  </Link>
                ) : (
                  /* Hamburger - Mobile uniquement si connecté */
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="lg:hidden h-10 w-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu de navigation"}
                  >
                    <Menu className="h-6 w-6" />
                  </button>
                )}
              </div>

              {/* NAV DESKTOP */}
              <nav className="hidden lg:flex flex-1 justify-center">
                <ul className="flex items-center gap-8 xl:gap-12 h-12">
                  {navLinks.map(({ label, href }) => (
                    <li key={href} className="h-full flex items-center mt-5">
                      <Link
                        href={href}
                        className={`
                          h-full flex items-center text-base xl:text-lg font-bold transition-opacity duration-200 hover:opacity-80
                          ${pathname === href ? "text-[var(--header-text-active)]" : "text-[var(--header-text-primary)]"}
                        `}
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                  {/* Formations - avec mega menu */}
                  <li className="h-full flex items-center">
                    <button
                      onClick={handleFormationsClick}
                      className={`
                        h-full flex items-center gap-1 text-base xl:text-lg font-bold transition-opacity duration-200 hover:opacity-80
                        ${formationsMenuOpen ? "text-[var(--header-text-active)]" : "text-[var(--header-text-primary)]"}
                      `}
                    >
                      {formationsLink.label}
                      <ChevronDown
                        className={`h-5 w-5 transition-transform duration-300 ${
                          formationsMenuOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </li>
                </ul>
              </nav>

              {/* ACTIONS DROITE */}
              <div className="flex items-center">
                {isLoading ? (
                  <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
                ) : isAuthenticated ? (
                  /* Si connecté: Avatar avec dropdown */
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button className="flex items-center gap-2 lg:px-4 lg:py-2.5 rounded-full hover:bg-gray-100 transition-all duration-200">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-sm overflow-hidden">
                          {avatarUrl ? (
                            <Image
                              src={avatarUrl}
                              alt={displayName}
                              width={40}
                              height={40}
                            />
                          ) : (
                            initials
                          )}
                        </div>
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      </button>
                    </DropdownMenu.Trigger>

                    <DropdownMenu.Content
                      align="end"
                      sideOffset={10}
                      className="w-[260px] rounded-2xl border bg-white shadow-xl overflow-hidden z-[60]"
                    >
                      <div className="p-4 border-b">
                        <p className="font-bold text-sm truncate">{displayName}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>

                      <Link
                        href="/student-dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-semibold hover:bg-gray-100 transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Tableau de bord
                      </Link>

                      <Link
                        href="/user-profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-semibold hover:bg-gray-100 transition-colors"
                      >
                        <User className="h-4 w-4" />
                        Profil
                      </Link>

                      <button
                        onClick={() => {
                          logout();
                          setMobileMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-gray-100 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Déconnexion
                      </button>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                ) : (
                  /* Si déconnecté */
                  <>
                    {/* Desktop - Boutons S'inscrire/Se connecter */}
                    <div className="hidden lg:flex items-center bg-[var(--bibocom-red)] hover:bg-[var(--bibocom-red)]/90 rounded-2xl font-bold text-white shadow-md transition-all duration-200">
                      <Link href="/register" className="px-6 xl:px-8 py-3.5 xl:py-4 text-base xl:text-lg">
                        S'inscrire
                      </Link>
                      <span className="text-lg">/</span>
                      <Link href="/login" className="px-6 xl:px-8 py-3.5 xl:py-4 text-base xl:text-lg">
                        Se connecter
                      </Link>
                    </div>

                    {/* Mobile - Hamburger uniquement */}
                    <button
                      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                      className="lg:hidden h-10 w-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                      aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu de navigation"}
                    >
                      <Menu className="h-6 w-6" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MENU MOBILE - Plein écran pour navigation uniquement */}
        <div
          className={`
            lg:hidden fixed inset-0 bg-white z-[60] transition-transform duration-300 ease-in-out flex flex-col
            ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}
          `}
        >
          {/* Header du menu mobile avec bouton X */}
          <div className="flex items-center justify-between px-6 py-5 border-b flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-900">Menu</h2>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Fermer le menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation Links - Zone scrollable */}
          <nav className="flex-1 overflow-y-auto px-6 py-8">
            <ul className="space-y-4">
              {navLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      block py-3 px-4 rounded-lg text-lg font-bold transition-all duration-200
                      ${pathname === href
                        ? "bg-[var(--bibocom-red)] text-white"
                        : "text-gray-700 hover:bg-gray-100"
                      }
                    `}
                  >
                    {label}
                  </Link>
                </li>
              ))}

              {/* Formations - Ouvre le mega menu overlay */}
              <li>
                <button
                  onClick={handleFormationsClick}
                  className="w-full flex items-center justify-between py-3 px-4 rounded-lg text-lg font-bold text-gray-700 hover:bg-gray-100 transition-all duration-200"
                >
                  <span>{formationsLink.label}</span>
                  <ChevronDown className="h-5 w-5" />
                </button>
              </li>
            </ul>
          </nav>

          {/* Boutons S'inscrire/Se connecter - Fixés en bas si déconnecté */}
          {!isAuthenticated && !isLoading && (
            <div className="px-6 py-6 border-t space-y-3 flex-shrink-0 bg-white">
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-3.5 text-center rounded-xl bg-[var(--bibocom-red)] text-white font-bold text-lg hover:bg-[var(--bibocom-red)]/90 transition-colors"
              >
                S'inscrire
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-3.5 text-center rounded-xl border-2 border-[var(--bibocom-red)] text-[var(--bibocom-red)] font-bold text-lg hover:bg-gray-50 transition-colors"
              >
                Se connecter
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* MEGA MENU - S'OUVRE SUR MOBILE ET DESKTOP */}
      <MegaMenuOverlay
        isOpen={formationsMenuOpen}
        onClose={() => setFormationsMenuOpen(false)}
      />
    </>
  );
}