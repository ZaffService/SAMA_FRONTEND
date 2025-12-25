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

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const initials =
    `${firstName?.[0] || user?.display_name?.[0] || "U"}${lastName?.[0] || ""}`.toUpperCase();

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 w-full bg-background/95 backdrop-blur-md border-b transition-all duration-300 ${
        scrolled ? "shadow-md border-border" : "border-transparent"
      }`}
    >
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex h-18 sm:h-20 lg:h-18 items-center justify-between gap-3 sm:gap-4 lg:gap-4">
          {/* Logo - Always visible */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Logo />
          </Link>

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

          {/* Right Section */}
          <div className="flex items-center gap-2 lg:gap-3 shrink-0">
            {isLoading ? (
              <div className="h-9 w-9 lg:h-10 lg:w-10 rounded-full bg-muted shimmer" />
            ) : isAuthenticated ? (
              <>
                {/* Notifications - Hidden on mobile */}
                <button className="hidden lg:flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted transition-colors relative">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <span className="absolute top-2 right-2 h-2 w-2 bg-primary rounded-full pulse-dot" />
                </button>

                {/* User Avatar - Visible on all screens */}
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button className="flex items-center gap-2 p-2 pr-2 lg:pr-3 rounded-full hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[48px] min-w-[48px] lg:min-h-0 lg:min-w-0">
                      <div className="flex h-8 w-8 lg:h-9 lg:w-9 items-center justify-center rounded-full overflow-hidden bg-slate-200 text-slate-700 font-semibold text-xs lg:text-sm">
                        {avatarUrl ? (
                          <Image
                            src={avatarUrl || "/placeholder.svg"}
                            alt={`${firstName} ${lastName}`}
                            width={32}
                            height={32}
                            className="h-full w-full object-cover rounded-full"
                          />
                        ) : (
                          <span>{initials}</span>
                        )}
                      </div>
                      <ChevronDown className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground hidden lg:block" />
                    </button>
                  </DropdownMenu.Trigger>

                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      align="end"
                      sideOffset={8}
                      className="z-50 w-[280px] max-w-[90vw] overflow-hidden rounded-2xl border bg-card shadow-xl animate-in fade-in-0 zoom-in-95"
                    >
                      {/* User Info Header */}
                      <div className="flex items-center gap-3 border-b bg-muted/50 px-4 py-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full overflow-hidden bg-slate-200 text-slate-700 font-semibold shrink-0">
                          {avatarUrl ? (
                            <Image
                              src={avatarUrl || "/placeholder.svg"}
                              alt={`${firstName} ${lastName}`}
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
                            {firstName && lastName
                              ? `${firstName} ${lastName}`
                              : user?.display_name || "Utilisateur"}
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
                            href="/student-dashboard"
                            className="flex flex-row items-center gap-3 px-3 py-2.5 text-sm rounded-xl hover:bg-muted transition-colors cursor-pointer w-full min-h-[44px]"
                          >
                            <LayoutDashboard className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>Tableau de bord</span>
                          </Link>
                        </DropdownMenu.Item>

                        <DropdownMenu.Item className="focus:outline-none">
                          <Link
                            href="/user-profile"
                            className="flex flex-row items-center gap-3 px-3 py-2.5 text-sm rounded-xl hover:bg-muted transition-colors cursor-pointer w-full min-h-[44px]"
                          >
                            <User className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>Mon profil</span>
                          </Link>
                        </DropdownMenu.Item>
                      </div>

                      <div className="border-t p-2">
                        <DropdownMenu.Item
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl text-destructive hover:bg-destructive/10 transition-colors cursor-pointer w-full text-left min-h-[44px]"
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
              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  asChild
                  variant="ghost"
                  className="h-11 sm:h-10 px-3 sm:px-4 lg:h-10 lg:px-4 rounded-xl text-sm lg:text-base min-w-[44px] sm:min-w-0"
                >
                  <Link href="/login">
                    <span className="hidden sm:inline">Se connecter</span>
                    <span className="sm:hidden">Connexion</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  className="h-11 sm:h-10 px-3 sm:px-4 lg:h-10 lg:px-5 rounded-xl font-semibold text-sm lg:text-base min-w-[44px] sm:min-w-0"
                >
                  <Link href="/register">
                    <span className="hidden sm:inline">Créer un compte</span>
                    <span className="sm:hidden">S'inscrire</span>
                  </Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button - Always visible on mobile */}

            <button
              className="lg:hidden flex h-12 w-12 items-center justify-center rounded-xl hover:bg-muted transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary/20"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-16 z-40 bg-background/95 backdrop-blur-md animate-in slide-in-from-top-2 duration-200">
            <div className="h-full overflow-y-auto">
              <div className="container mx-auto px-4 py-6 space-y-6">
                {/* Mobile Auth Section */}

                {!isLoading && !isAuthenticated ? (
                  <div className="space-y-4 pt-4 border-t">
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full"
                    >
                      <Button
                        variant="outline"
                        className="w-full h-12 rounded-xl bg-transparent text-base"
                      >
                        Se connecter
                      </Button>
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full"
                    >
                      <Button className="w-full h-12 rounded-xl font-semibold text-base">
                        Créer un compte
                      </Button>
                    </Link>
                  </div>
                ) : isAuthenticated ? (
                  <div className="space-y-4 pt-4 border-t">
                    {/* User Info in Mobile Menu */}
                    <div className="flex items-center gap-3 px-2 py-3 bg-muted/30 rounded-xl">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full overflow-hidden bg-slate-200 text-slate-700 font-semibold shrink-0">
                        {avatarUrl ? (
                          <Image
                            src={avatarUrl || "/placeholder.svg"}
                            alt={`${firstName} ${lastName}`}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover rounded-full"
                          />
                        ) : (
                          <span className="text-lg">{initials}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold truncate">
                          {firstName && lastName
                            ? `${firstName} ${lastName}`
                            : user?.display_name || "Utilisateur"}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {user?.email || user?.username}
                        </p>
                      </div>
                    </div>

                    {/* Mobile Navigation Links */}
                    <nav className="space-y-2">
                      <Link
                        href="/student-dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-4 px-4 py-4 text-base rounded-xl hover:bg-muted transition-colors min-h-[56px] touch-manipulation"
                      >
                        <LayoutDashboard className="h-5 w-5 text-muted-foreground shrink-0" />
                        <span>Mon apprentissage</span>
                      </Link>

                      <Link
                        href="/user-profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-4 px-4 py-4 text-base rounded-xl hover:bg-muted transition-colors min-h-[56px] touch-manipulation"
                      >
                        <User className="h-5 w-5 text-muted-foreground shrink-0" />
                        <span>Mon profil</span>
                      </Link>
                    </nav>

                    {/* Logout Button */}
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
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
