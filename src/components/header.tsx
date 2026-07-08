"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  User,
  Settings,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { useAvatar } from "@/infrastructure/storage/AvatarContext";
import { APP_ROUTES } from "@/lib/app-routes";
import { scrollToFormationsSection } from "@/lib/smooth-scroll";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const { user, logout, isLoading, isAuthenticated } = useLocalAuth();
  const { avatarUrl, firstName, lastName } = useAvatar();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    { label: "À propos", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  const navItemClass = (active: boolean) =>
    [
      "inline-flex items-center text-base xl:text-lg font-bold leading-none transition-opacity duration-200 hover:opacity-80",
      active
        ? "text-[var(--header-text-active)]"
        : "text-[var(--header-text-primary)]",
    ].join(" ");

  const studentSpaceLinkClass = (active: boolean) =>
    [
      "inline-flex items-center whitespace-nowrap text-base xl:text-lg font-bold leading-none transition-opacity duration-200 hover:opacity-80",
      active
        ? "text-[var(--header-text-active)]"
        : "text-[var(--bibocom-red)]",
    ].join(" ");

  const mobileItemClass = (active: boolean) =>
    [
      "block py-3 px-4 rounded-lg text-lg font-bold transition-all duration-200",
      active
        ? "bg-[var(--bibocom-red)] text-white"
        : "text-gray-700 hover:bg-gray-100",
    ].join(" ");

  const isHomeActive = pathname === "/";
  const isStudent = user?.role?.toUpperCase() === "STUDENT";
  const studentDashboardHref = APP_ROUTES.studentDashboard;
  const isStudentDashboardActive = pathname === studentDashboardHref;
  const accountLabel = firstName || displayName.split(" ")[0] || "Mon compte";

  const handleFormationsNav = (
    event: React.MouseEvent<HTMLAnchorElement>,
    closeMobileMenu = false,
  ) => {
    if (closeMobileMenu) {
      setMobileMenuOpen(false);
    }

    if (pathname === "/") {
      event.preventDefault();
      window.requestAnimationFrame(() => {
        scrollToFormationsSection();
      });
      return;
    }

    event.preventDefault();
    router.push("/#formations");
  };

  return (
    <>
      <header
        className={`fixed z-50 top-0 left-0 right-0 transition-all duration-300 ease-in-out ${
          isScrolled ? "top-0 left-0 right-0" : "top-0 left-0 right-0"
        }`}
      >
        <div
          className={`bg-[var(--header-bg)] shadow-lg transition-all duration-300 ease-in-out w-full rounded-none ${
            isScrolled ? "w-full rounded-none" : "w-full rounded-none"
          }`}
        >
          <div className="px-4 sm:px-6 md:px-10 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* GAUCHE */}
              <div className="flex-shrink-0 flex items-center">
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
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="lg:hidden h-10 w-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label={
                      mobileMenuOpen
                        ? "Fermer le menu"
                        : "Ouvrir le menu de navigation"
                    }
                  >
                    <Menu className="h-6 w-6 " />
                  </button>
                )}
              </div>

              {/* NAV DESKTOP */}
              <nav className="hidden lg:flex flex-1 items-center justify-center mt-6">
                <ul className="flex items-center gap-6 xl:gap-10">
                  {isAuthenticated ? (
                    <li className="flex items-center">
                      <Link
                        href="/#formations"
                        onClick={(e) => handleFormationsNav(e)}
                        className={navItemClass(isHomeActive)}
                      >
                        Formations
                      </Link>
                    </li>
                  ) : (
                    <>
                      <li className="flex items-center">
                        <Link href="/" className={navItemClass(isHomeActive)}>
                          Accueil
                        </Link>
                      </li>
                      <li className="flex items-center">
                        <Link
                          href="/#formations"
                          onClick={(e) => handleFormationsNav(e)}
                          className={navItemClass(false)}
                        >
                          Formations
                        </Link>
                      </li>
                    </>
                  )}
                  {navLinks.map(({ label, href }) => (
                    <li key={href} className="flex items-center">
                      <Link href={href} className={navItemClass(pathname === href)}>
                        {label}
                      </Link>
                    </li>
                  ))}
                  {isAuthenticated && isStudent && (
                    <li className="flex items-center">
                      <Link
                        href={studentDashboardHref}
                        className={studentSpaceLinkClass(isStudentDashboardActive)}
                      >
                        Mon espace
                      </Link>
                    </li>
                  )}
                </ul>
              </nav>

              {/* ACTIONS DROITE */}
              <div className="flex items-center">
                {isLoading ? (
                  <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
                ) : isAuthenticated ? (
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button
                        type="button"
                        aria-label="Ouvrir le menu de mon compte"
                        className="group flex items-center gap-2 rounded-full border border-[#C5D0E0] bg-white px-2 py-1.5 shadow-sm transition-all duration-200 hover:border-[var(--bibocom-blue)]/35 hover:bg-[#F4F8FF] hover:shadow-md data-[state=open]:border-[var(--bibocom-blue)]/45 data-[state=open]:bg-[#EAF2FF] lg:gap-2.5 lg:px-3 lg:py-2"
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold shadow-sm ring-2 ring-white lg:h-10 lg:w-10 ${
                            avatarUrl
                              ? "bg-gray-100"
                              : "bg-gradient-to-br from-[var(--bibocom-blue)] to-[#0A4AA8] text-white"
                          }`}
                        >
                          {avatarUrl ? (
                            <Image
                              src={avatarUrl}
                              alt={displayName}
                              width={40}
                              height={40}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            initials
                          )}
                        </div>
                        <span className="hidden max-w-[110px] truncate text-sm font-bold text-[var(--bibocom-blue)] lg:block xl:max-w-[140px]">
                          {accountLabel}
                        </span>
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EAF2FF] text-[var(--bibocom-blue)] transition-colors group-hover:bg-[#DCE9FF] lg:h-8 lg:w-8">
                          <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </span>
                      </button>
                    </DropdownMenu.Trigger>

                    <DropdownMenu.Content
                      align="end"
                      sideOffset={10}
                      className="z-[60] w-[min(92vw,320px)] overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_24px_55px_-22px_rgba(15,23,42,0.4)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                    >
                      <div className="border-b bg-gradient-to-r from-gray-50 to-white p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-sm font-bold text-gray-700">
                            {avatarUrl ? (
                              <Image
                                src={avatarUrl}
                                alt={displayName}
                                width={44}
                                height={44}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              initials
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-base font-bold text-gray-900">
                              {displayName}
                            </p>
                            <p className="truncate text-xs text-gray-500">
                              {user?.email}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col p-2">
                        <Link
                          href={
                            user?.role === "ADMIN"
                              ? "/admin-dashboard"
                              : user?.role === "INSTRUCTOR"
                                ? "/instructor-dashboard"
                                : user?.role === "STUDENT"
                                  ? "/student-dashboard"
                                  : "/"
                          }
                          onClick={() => setMobileMenuOpen(false)}
                          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <span className="flex w-full items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                              <LayoutDashboard className="h-4 w-4" />
                            </span>
                            <span className="truncate leading-none">
                              Tableau de bord
                            </span>
                          </span>
                        </Link>

                        <Link
                          href="/user-profile"
                          onClick={() => setMobileMenuOpen(false)}
                          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <span className="flex w-full items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                              <User className="h-4 w-4" />
                            </span>
                            <span className="truncate leading-none">Profil</span>
                          </span>
                        </Link>

                        <Link
                          href="/parametres"
                          onClick={() => setMobileMenuOpen(false)}
                          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <span className="flex w-full items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-600 transition-colors group-hover:bg-slate-100">
                              <Settings className="h-4 w-4" />
                            </span>
                            <span className="truncate leading-none">
                              Paramètres
                            </span>
                          </span>
                        </Link>
                      </div>

                      <div className="border-t p-2">
                        <button
                          onClick={() => {
                            logout();
                            setMobileMenuOpen(false);
                          }}
                          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition-all hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                        >
                          <span className="flex w-full items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500 transition-colors group-hover:bg-red-100">
                              <LogOut className="h-4 w-4" />
                            </span>
                            <span className="truncate leading-none">
                              Déconnexion
                            </span>
                          </span>
                        </button>
                      </div>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                ) : (
                  <>
                    <div className="hidden lg:flex items-center bg-[var(--bibocom-red)] hover:bg-[var(--bibocom-red)]/90 rounded-2xl font-bold text-white shadow-md transition-all duration-200">
                      <Link
                        href="/register"
                        className="px-6 xl:px-8 py-3.5 xl:py-4 text-base xl:text-lg"
                      >
                        S'inscrire
                      </Link>
                      <span className="text-lg">/</span>
                      <Link
                        href="/login"
                        className="px-6 xl:px-8 py-3.5 xl:py-4 text-base xl:text-lg"
                      >
                        Se connecter
                      </Link>
                    </div>

                    <button
                      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                      className="lg:hidden h-10 w-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                      aria-label={
                        mobileMenuOpen
                          ? "Fermer le menu"
                          : "Ouvrir le menu de navigation"
                      }
                    >
                      <Menu className="h-6 w-6" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MENU MOBILE */}
        <div
          className={`
            lg:hidden fixed inset-0 bg-white z-[60] transition-transform duration-300 ease-in-out flex flex-col
            ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}
          `}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-900">Menu</h2>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Fermer le menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-6 py-6">
            <ul className="space-y-2">
              {isAuthenticated ? (
                <li>
                  <Link
                    href="/#formations"
                    onClick={(e) => handleFormationsNav(e, true)}
                    className={mobileItemClass(isHomeActive)}
                  >
                    Formations
                  </Link>
                </li>
              ) : (
                <>
                  <li>
                    <Link
                      href="/"
                      onClick={() => setMobileMenuOpen(false)}
                      className={mobileItemClass(isHomeActive)}
                    >
                      Accueil
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/#formations"
                      onClick={(e) => handleFormationsNav(e, true)}
                      className={mobileItemClass(false)}
                    >
                      Formations
                    </Link>
                  </li>
                </>
              )}
              {navLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={mobileItemClass(pathname === href)}
                  >
                    {label}
                  </Link>
                </li>
              ))}
              {isAuthenticated && isStudent && (
                <li>
                  <Link
                    href={studentDashboardHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className={[
                      "block py-3 px-4 rounded-lg text-lg font-bold transition-all duration-200",
                      isStudentDashboardActive
                        ? "bg-[var(--bibocom-red)] text-white"
                        : "text-[var(--bibocom-red)] hover:bg-gray-100",
                    ].join(" ")}
                  >
                    Mon espace
                  </Link>
                </li>
              )}
            </ul>
          </nav>

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
    </>
  );
}
