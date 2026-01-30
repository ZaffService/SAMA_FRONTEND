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

  return (
    <>
      {/* HEADER */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[98%] max-w-[1800px]">
        <div className="bg-white rounded-2xl shadow-lg px-10 py-4">
          {/* GRID PRINCIPAL */}
          <div className="grid grid-cols-[auto_1fr_auto] items-center">
            {/* GAUCHE : LOGO */}
            <Link
              href="/"
              className="flex items-center gap-2 whitespace-nowrap relative top-3"
            >
              <span className="font-bold text-lg text-blue-600">
                BIBOCOM
              </span>
              <span className="font-semibold text-base text-red-500">
                Digital
              </span>
            </Link>

            {/* CENTRE : NAVIGATION */}
            <nav className="hidden lg:flex justify-center relative top-3">
              <ul className="flex items-center gap-10">
                {[
                  ["Accueil", "/"],
                  ["Formations", "/formations"],
                  ["À propos", "/about"],
                  ["E-learning", "/e-learning"],
                  ["Contact", "/contact"],
                ].map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-base font-medium text-slate-700 hover:text-primary transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* DROITE : ACTIONS */}
            <div className="hidden lg:flex justify-end items-center">
              {isLoading ? (
                <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse" />
              ) : isAuthenticated ? (
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-slate-100 transition">
                      <div className="h-8 w-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-sm font-semibold">
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
                        <p className="font-semibold text-sm truncate">
                          {displayName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {user?.email}
                        </p>
                      </div>

                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        <LogOut className="h-4 w-4" />
                        Se déconnecter
                      </button>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              ) : (
                <div className="bg-red-500 hover:bg-red-600 rounded-2xl text-base font-medium transition shadow-sm flex items-center">
                  <Link
                    href="/register"
                    className="text-white pl-7 pr-3 py-3 hover:opacity-90 transition"
                  >
                    S'inscrire
                  </Link>
                  <span className="text-white">/</span>
                  <Link
                    href="/login"
                    className="text-white pl-3 pr-7 py-3 hover:opacity-90 transition"
                  >
                    Se connecter
                  </Link>
                </div>
              )}
            </div>

            {/* MOBILE : MENU */}
            <div className="lg:hidden flex justify-end">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-slate-100 transition"
              >
                {mobileMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}