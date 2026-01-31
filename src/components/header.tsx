"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, LogOut } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { useAvatar } from "@/infrastructure/storage/AvatarContext";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isLoading, isAuthenticated } = useLocalAuth();
  const { avatarUrl, firstName, lastName } = useAvatar();
  const pathname = usePathname();

  useEffect(() => {
    setMobileMenuOpen(false);
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
    { label: "Formations", href: "/formations" },
    { label: "À propos", href: "/about" },
    { label: "E-learning", href: "/e-learning" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 lg:top-4 lg:left-1/2 lg:-translate-x-1/2 z-50 w-full lg:w-[98%] lg:max-w-[1800px]">
        <div className="bg-white lg:rounded-2xl shadow-lg px-4 sm:px-6 md:px-10 py-3 sm:py-4">
          <div className="flex items-center justify-between lg:grid lg:grid-cols-[auto_1fr_auto]">
            {/* LOGO */}
            <Link href="/" className="relative top-0 lg:top-3 flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Bibocom Logo"
                width={80}
                height={20}
                priority
                className="!w-[60px] sm:!w-[80px] !h-auto !max-w-none"
              />
            </Link>

            {/* NAVIGATION DESKTOP */}
            <nav className="hidden lg:flex justify-center relative top-3">
              <ul className="flex items-center gap-6 xl:gap-10">
                {navLinks.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`
                        text-sm xl:text-base font-bold transition-all duration-200
                        ${pathname === href ? "text-blue-600" : "text-[#0B2D5C]"}
                        hover:opacity-80
                      `}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* ACTIONS DROITE DESKTOP */}
            <div className="hidden lg:flex justify-end items-center">
              {isLoading ? (
                <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse" />
              ) : isAuthenticated ? (
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-slate-100 transition-all duration-200">
                      <div className="h-8 w-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-sm font-bold">
                        {avatarUrl ? (
                          <Image
                            src={avatarUrl}
                            alt={displayName}
                            width={32}
                            height={32}
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      align="end"
                      sideOffset={10}
                      className="w-[260px] rounded-2xl border bg-white shadow-xl overflow-hidden"
                    >
                      <div className="p-4 border-b">
                        <p className="font-bold text-sm truncate">
                          {displayName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {user?.email}
                        </p>
                      </div>
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-all duration-200"
                      >
                        <LogOut className="h-4 w-4" />
                        Se déconnecter
                      </button>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              ) : (
                <div className="bg-red-500 hover:bg-red-600 rounded-2xl text-sm xl:text-base font-bold transition-all duration-200 shadow-sm flex items-center">
                  <Link
                    href="/register"
                    className="text-white pl-5 xl:pl-7 pr-2 xl:pr-3 py-2 xl:py-3"
                  >
                    S'inscrire
                  </Link>
                  <span className="text-white">/</span>
                  <Link
                    href="/login"
                    className="text-white pl-2 xl:pl-3 pr-5 xl:pr-7 py-2 xl:py-3"
                  >
                    Se connecter
                  </Link>
                </div>
              )}
            </div>

            {/* BOUTON HAMBURGER MOBILE */}
            <div className="lg:hidden flex justify-end">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-all duration-200 relative z-50"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MENU MOBILE OVERLAY */}
      <div
        className={`
          fixed inset-0 z-40 lg:hidden transition-all duration-300 ease-in-out
          ${mobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"}
        `}
      >
        {/* Backdrop - fond noir semi-transparent */}
        <div
          className={`
            absolute inset-0 bg-black/50 backdrop-blur-sm
            transition-opacity duration-300
            ${mobileMenuOpen ? "opacity-100" : "opacity-0"}
          `}
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Menu Panel - glisse de haut en bas avec rebond */}
        <div
          className={`
            absolute top-[68px] left-0 right-0 lg:top-20 lg:left-2 lg:right-2 bg-white lg:rounded-2xl shadow-2xl overflow-hidden
            transition-all duration-300 ease-out
            ${
              mobileMenuOpen
                ? "translate-y-0 opacity-100 scale-100"
                : "-translate-y-4 opacity-0 scale-95"
            }
          `}
          style={{
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Navigation Links avec animation en cascade */}
          <nav className="py-4">
            <ul className="space-y-1">
              {navLinks.map(({ label, href }, index) => (
                <li
                  key={href}
                  style={{
                    transform: mobileMenuOpen
                      ? "translateY(0)"
                      : "translateY(-10px)",
                    opacity: mobileMenuOpen ? 1 : 0,
                    transition: `all 0.3s cubic-bezier(0.4, 0, 0.2, 1) ${
                      index * 50
                    }ms`,
                  }}
                >
                  <Link
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      block px-6 py-4 text-base font-bold transition-all duration-200
                      ${
                        pathname === href
                          ? "text-blue-600 bg-blue-50"
                          : "text-[#0B2D5C] hover:bg-slate-50"
                      }
                    `}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Boutons CTA Mobile */}
          <div
            className="border-t border-slate-100 p-4"
            style={{
              transform: mobileMenuOpen ? "translateY(0)" : "translateY(-10px)",
              opacity: mobileMenuOpen ? 1 : 0,
              transition: `all 0.3s cubic-bezier(0.4, 0, 0.2, 1) ${
                navLinks.length * 50
              }ms`,
            }}
          >
            {!isAuthenticated ? (
              <div className="flex gap-3">
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 bg-[#E74C3C] hover:bg-[#C0392B] text-white text-center py-3 rounded-xl font-bold transition-all duration-200 shadow-sm"
                >
                  S'inscrire
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 border-2 border-[#0B2D5C] text-[#0B2D5C] text-center py-3 rounded-xl font-bold hover:bg-slate-50 transition-all duration-200"
                >
                  Se connecter
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl">
                  <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-sm font-bold flex-shrink-0">
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
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{displayName}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}