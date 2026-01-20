"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  User,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  Bell,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { useAvatar } from "@/infrastructure/storage/AvatarContext";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { user, logout, isLoading, isAuthenticated } = useLocalAuth();
  const { avatarUrl, firstName, lastName } = useAvatar();
  const pathname = usePathname();

  // Detect scroll for header shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fermer le menu mobile lors du changement de route
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Bloquer le scroll quand le menu mobile est ouvert
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  // Calculer le nom complet avec logique robuste
  const getDisplayName = () => {
    // Priorité 1: firstName + lastName (si les deux existent)
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }

    // Priorité 2: display_name de l'utilisateur
    if (user?.display_name && user.display_name.trim()) {
      return user.display_name;
    }

    // Priorité 3: firstName seul
    if (firstName) {
      return firstName;
    }

    // Priorité 4: fallback générique
    return "Utilisateur";
  };

  // Calculer les initiales avec logique robuste
  const getInitials = () => {
    const displayName = getDisplayName();
    if (displayName === "Utilisateur") return "U";

    const names = displayName.split(" ");
    if (names.length >= 2) {
      return `${names[0][0] || ""}${names[names.length - 1][0] || ""}`.toUpperCase();
    }
    return (displayName[0] || "U").toUpperCase();
  };

  const displayName = getDisplayName();
  const initials = getInitials();

  // Get the correct dashboard URL based on user role
  const getDashboardUrl = () => {
    if (!user?.role) return "/student-dashboard";
    switch (user.role) {
      case "ADMIN":
        return "/admin-dashboard";
      case "INSTRUCTOR":
        return "/instructor-dashboard";
      case "STUDENT":
      default:
        return "/student-dashboard";
    }
  };

  const dashboardUrl = getDashboardUrl();

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 w-full bg-background/95 backdrop-blur-md border-b transition-all duration-300 ${
          scrolled ? "shadow-md border-border" : "border-transparent"
        }`}
      >
        <div className="container mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex h-16 sm:h-18 lg:h-20 items-center justify-between gap-3">
            {/* Logo - Always visible */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Logo />
            </Link>

            {/* Mobile: Empty space for layout balance */}
            <div className="flex-1 lg:hidden"></div>

            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden lg:flex items-center gap-6 flex-1 justify-center">
              {/* Mes Apprentissages - Only for authenticated users */}
              {isAuthenticated && (
                <Link href="/mes-apprentissages">
                  <span className="text-base font-semibold text-primary hover:text-primary/80 transition-colors">
                    Mes Apprentissages
                  </span>
                </Link>
              )}
            </div>

            {/* Right Section Desktop */}
            <div className="hidden lg:flex items-center gap-3 shrink-0">
              {isLoading ? (
                <div className="h-10 w-10 rounded-full bg-muted shimmer" />
              ) : isAuthenticated ? (
                <>
                  {/* User Avatar */}
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button className="flex items-center gap-2 p-2 pr-3 rounded-full hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full overflow-hidden bg-slate-200 text-slate-700 font-semibold text-sm">
                          {avatarUrl ? (
                            <Image
                              src={avatarUrl || "/placeholder.svg"}
                              alt={displayName}
                              width={36}
                              height={36}
                              className="h-full w-full object-cover rounded-full"
                            />
                          ) : (
                            <span>{initials}</span>
                          )}
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </DropdownMenu.Trigger>

                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        align="end"
                        sideOffset={8}
                        className="z-50 w-[280px] overflow-hidden rounded-2xl border bg-card shadow-xl animate-in fade-in-0 zoom-in-95"
                      >
                        {/* User Info Header */}
                        <div className="flex items-center gap-3 border-b bg-muted/50 px-4 py-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full overflow-hidden bg-slate-200 text-slate-700 font-semibold shrink-0">
                            {avatarUrl ? (
                              <Image
                                src={avatarUrl || "/placeholder.svg"}
                                alt={displayName}
                                width={48}
                                height={48}
                                className="h-full w-full object-cover rounded-full"
                              />
                            ) : (
                              <span className="text-lg">{initials}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {displayName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user?.email || user?.username}
                            </p>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="p-2 flex flex-col gap-1">
                          <DropdownMenu.Item className="focus:outline-none">
                            <Link
                              href={dashboardUrl}
                              className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl hover:bg-muted transition-colors cursor-pointer w-full"
                            >
                              <div className="flex items-center gap-2">
                                <LayoutDashboard className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span>Tableau de bord</span>
                              </div>
                            </Link>
                          </DropdownMenu.Item>

                          {/* <DropdownMenu.Item className="focus:outline-none">
                            <Link
                              href="/user-profile"
                              className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl hover:bg-muted transition-colors cursor-pointer w-full"
                            >
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span>Mon profil</span>
                              </div>
                            </Link>
                          </DropdownMenu.Item> */}
                        </div>

                        <div className="border-t p-2">
                          <DropdownMenu.Item
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl text-destructive hover:bg-destructive/10 transition-colors cursor-pointer w-full text-left"
                          >
                            <LogOut className="h-4 w-4 shrink-0" />
                            <span className="font-medium">Se déconnecter</span>
                          </DropdownMenu.Item>
                        </div>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </>
              ) : (
                <div className="flex flex-row items-center justify-center gap-3 sm:gap-4">
                 <Link 
                    className="px-6 py-3 rounded-xl text-base bg-transparent font-medium hover:bg-muted/50 transition-all"
                    href="/login">Se connecter</Link>
                  <Link  
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-base font-semibold rounded-lg transition-all"
                    href="/register">Créer un compte</Link>
                </div>
              )}
            </div>

            {/* Mobile: Hamburger Menu ONLY */}
            <div className="flex lg:hidden items-center shrink-0">
              {/* Hamburger Menu Button */}
              <button
                className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-muted transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary/20"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={
                  mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"
                }
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

      {/* Mobile Menu Overlay - ONLY AUTH BUTTONS */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 z-[60] bg-background animate-in slide-in-from-top-2 duration-200">
          <div className="container mx-auto px-4 pt-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 rounded-full bg-muted shimmer" />
              </div>
            ) : isAuthenticated ? (
              <div className="space-y-6">
                {/* User Info Card */}
                <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full overflow-hidden bg-slate-200 text-slate-700 font-semibold shrink-0">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl || "/placeholder.svg"}
                        alt={displayName}
                        width={56}
                        height={56}
                        className="h-full w-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-xl">{initials}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold truncate">
                      {displayName}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {user?.email || user?.username}
                    </p>
                  </div>
                </div>

                {/* Navigation Links for authenticated users */}
                <nav className="space-y-2 flex flex-col">
                  <Link
                    href="/mes-apprentissages"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-4 px-4 py-4 text-base font-semibold rounded-xl hover:bg-muted transition-colors min-h-[56px] touch-manipulation"
                  >
                    <span>Mes Apprentissages</span>
                  </Link>

                  <Link
                    href={dashboardUrl}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-4 px-4 py-4 text-base rounded-xl hover:bg-muted transition-colors min-h-[56px] touch-manipulation"
                  >
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="h-5 w-5 text-muted-foreground shrink-0" />
                      <span>Tableau de bord</span>
                    </div>
                  </Link>

                  {/* <Link
                    href="/user-profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-4 px-4 py-4 text-base rounded-xl hover:bg-muted transition-colors min-h-[56px] touch-manipulation"
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-muted-foreground shrink-0" />
                      <span>Mon profil</span>
                    </div>
                  </Link> */}
                </nav>

                {/* Logout Button */}
                <div className="pt-4 border-t">
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-4 px-4 py-4 text-base rounded-xl text-destructive hover:bg-destructive/10 transition-colors w-full text-left min-h-[56px] touch-manipulation"
                  >
                    <LogOut className="h-5 w-5 shrink-0" />
                    <span className="font-medium">Se déconnecter</span>
                  </button>
                </div>
              </div>
            ) : (
              /* ONLY AUTH BUTTONS - NO NAVIGATION LINKS */
              <div className="space-y-3 pt-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full"
                >
                  <Button
                    variant="outline"
                    className="w-full h-14 rounded-xl text-base font-medium"
                  >
                    Se connecter
                  </Button>
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full"
                >
                  <Button className="w-full h-14 rounded-xl font-semibold text-base">
                    Créer un compte
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
