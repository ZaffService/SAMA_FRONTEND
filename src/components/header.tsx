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

  const { user, logout, isLoading, isAuthenticated } = useLocalAuth();
  const { avatarUrl, firstName, lastName } = useAvatar();
  const pathname = usePathname();

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
    setMobileMenuOpen(false); // Fermer le menu hamburger si ouvert
  };

  return (
    <>
      <header className="fixed z-50 w-full top-0">
        <div className="bg-[var(--header-bg)] shadow-lg">
          {/* Conteneur avec max-width pour centrer le contenu */}
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 py-5">
            <div className="flex items-center justify-between gap-8">
              {/* LOGO */}
              <Link href="/" className="flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt="Bibocom Logo"
                  width={100}
                  height={30}
                  priority
                  className="w-[80px] sm:w-[100px] lg:w-[110px] h-auto"
                />
              </Link>

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

              {/* ACTIONS DROITE - DESKTOP */}
              <div className="hidden lg:flex items-center">
                {isLoading ? (
                  <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
                ) : isAuthenticated ? (
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button className="flex items-center gap-2 px-4 py-2.5 rounded-full hover:bg-gray-100 transition-all duration-200">
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
                        className="flex items-center gap-3 px-4 py-3 text-sm font-semibold hover:bg-gray-100 transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Tableau de bord
                      </Link>

                      <Link
                        href="/user-profile"
                        className="flex items-center gap-3 px-4 py-3 text-sm font-semibold hover:bg-gray-100 transition-colors"
                      >
                        <User className="h-4 w-4" />
                        Profil
                      </Link>

                      <button
                        onClick={logout}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-gray-100 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Déconnexion
                      </button>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                ) : (
                  <div className="flex items-center bg-[var(--bibocom-red)] hover:bg-[var(--bibocom-red)]/90 rounded-2xl font-bold text-white shadow-md transition-all duration-200">
                    <Link href="/register" className="px-6 xl:px-8 py-3.5 xl:py-4 text-base xl:text-lg">
                      S'inscrire
                    </Link>
                    <span className="text-lg">/</span>
                    <Link href="/login" className="px-6 xl:px-8 py-3.5 xl:py-4 text-base xl:text-lg">
                      Se connecter
                    </Link>
                  </div>
                )}
              </div>

              {/* BOUTON HAMBURGER - MOBILE */}
              <div className="lg:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
                >
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MENU MOBILE */}
        <div
          className={`
            lg:hidden fixed inset-0 bg-white z-40 transition-transform duration-300 ease-in-out
            ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}
          `}
          style={{ top: "80px" }}
        >
          <div className="flex flex-col h-full overflow-y-auto">
            {/* Navigation Links */}
            <nav className="flex-1 px-6 py-8">
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
                
                {/* Formations - Ouvre le mega menu overlay sur mobile aussi */}
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

            {/* Actions User - Mobile */}
            <div className="border-t border-gray-200 p-6 space-y-4">
              {isLoading ? (
                <div className="h-12 rounded-xl bg-gray-200 animate-pulse" />
              ) : isAuthenticated ? (
                <div className="space-y-4">
                  {/* User Info */}
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={displayName}
                          width={48}
                          height={48}
                        />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{displayName}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                  </div>

                  {/* User Actions */}
                  <Link
                    href="/student-dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-base font-semibold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    Tableau de bord
                  </Link>

                  <Link
                    href="/user-profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-base font-semibold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    <User className="h-5 w-5" />
                    Profil
                  </Link>

                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-base font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    Déconnexion
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full py-4 px-6 text-center bg-[var(--bibocom-red)] hover:bg-[var(--bibocom-red)]/90 text-white font-bold rounded-xl transition-all duration-200 shadow-md"
                  >
                    S'inscrire
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full py-4 px-6 text-center border-2 border-[var(--bibocom-red)] text-[var(--bibocom-red)] hover:bg-[var(--bibocom-red)] hover:text-white font-bold rounded-xl transition-all duration-200"
                  >
                    Se connecter
                  </Link>
                </div>
              )}
            </div>
          </div>
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