"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  LogOut,
  LayoutDashboard,
  User,
  Settings,
  Search,
  BookOpen,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import { useAvatar } from "@/infrastructure/storage/AvatarContext";
import { MegaMenuOverlay } from "@/components/mega-menu-overlay";
import { CoursesApi, BackendCourse } from "@/infrastructure/api/courses-api";
import { CategoriesApi } from "@/infrastructure/api/categories-api";
import type { Category } from "@/domain/entities/course";
import logger from "@/shared/helpers/logger";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formationsMenuOpen, setFormationsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<(BackendCourse & { type: 'course' })[]>([]);
  const [categorySuggestions, setCategorySuggestions] = useState<(Category & { type: 'category' })[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allCourses, setAllCourses] = useState<BackendCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [searchDataLoaded, setSearchDataLoaded] = useState(false);

  const { user, logout, isLoading, isAuthenticated } = useLocalAuth();
  const { avatarUrl, firstName, lastName } = useAvatar();

  // Charger cours + catégories uniquement quand la recherche s'ouvre (évite des requêtes inutiles sur /student-dashboard)
  useEffect(() => {
    if (!searchOpen || searchDataLoaded) return;

    const loadAllData = async () => {
      try {
        setCoursesLoading(true);
        setCategoriesLoading(true);
        const [coursesResult, categoriesResult] = await Promise.all([
          CoursesApi.getCourses(1, 100),
          CategoriesApi.getCategories(),
        ]);
        setAllCourses(coursesResult.courses);
        setAllCategories(categoriesResult);
        setSearchDataLoaded(true);
      } catch (error) {
        logger.error("Erreur lors du chargement des données de recherche:", error);
      } finally {
        setCoursesLoading(false);
        setCategoriesLoading(false);
      }
    };

    loadAllData();
  }, [searchOpen, searchDataLoaded]);

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
    setSearchOpen(false);
    setShowSuggestions(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Filtrer les suggestions en temps réel (cours et catégories)
  useEffect(() => {
    if (searchQuery.trim()) {
      // Filtrer les cours
      const filteredCourses = allCourses.filter(
        (course) =>
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.categoryName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      // Filtrer les catégories
      const filteredCategories = allCategories.filter(
        (category) =>
          category.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      // Combiner les résultats (max 6 suggestions: mix de cours et catégories)
      const courseSuggestions = filteredCourses.slice(0, 4).map(c => ({ ...c, type: 'course' as const }));
      const categorySuggestionsResult = filteredCategories.slice(0, 2).map(c => ({ ...c, type: 'category' as const }));
      
      setSuggestions(courseSuggestions);
      setCategorySuggestions(categorySuggestionsResult);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setCategorySuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, allCourses, allCategories]);

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
    // { label: "E-book", href: "/e-book" },
    { label: "À propos", href: "/about" },
    // { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ];

  const formationsLink = { label: "Formations" };

  // Handler pour ouvrir le mega menu (mobile et desktop)
  const handleFormationsClick = () => {
    setFormationsMenuOpen(true);
    setMobileMenuOpen(false);
  };

  // Handler pour soumettre la recherche
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
      setShowSuggestions(false);
    }
  };

  // Handler pour sélectionner une suggestion (cours ou catégorie)
  const handleSuggestionClick = (item: (BackendCourse & { type: 'course' }) | (Category & { type: 'category' })) => {
    if ('type' in item && item.type === 'category') {
      // Catégorie: rediriger vers la page d'accueil avec le paramètre de catégorie
      router.push(`/?category=${item.id}#formations-section`);
    } else {
      // Cours: rediriger vers la page de détails du cours
      const course = item as BackendCourse;
      router.push(`/course-details/${course.id}`);
    }
    setSearchOpen(false);
    setSearchQuery("");
    setShowSuggestions(false);
    setMobileMenuOpen(false);
  };

  // Focus input search quand il s'ouvre
  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  // Fermer les suggestions quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".search-container")) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Vérifie si on doit appliquer le style centré (page d'accueil + desktop + non connecté)
  const isHomePage = pathname === "/";
  const shouldCenterHeader = isHomePage && !isAuthenticated && !isLoading;

  return (
    <>
      <header
        className={`fixed z-50 top-0 left-0 right-0 transition-all duration-300 ease-in-out ${
          isScrolled
            ? "top-0 left-0 right-0"
            : "top-0 left-0 right-0"
        }`}
      >
        <div
          className={`bg-[var(--header-bg)] shadow-lg transition-all duration-300 ease-in-out w-full rounded-none ${
            isScrolled
              ? "w-full rounded-none"
              : "w-full rounded-none"
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
                    aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu de navigation"}
                  >
                    <Menu className="h-6 w-6 " />
                  </button>
                )}
              </div>

              {/* NAV DESKTOP */}
              <nav className="hidden lg:flex flex-1 justify-center items-center">
                {!searchOpen ? (
                  <ul className="flex items-center gap-8 xl:gap-12 h-12 transition-all duration-300">
                    {/* Accueil */}
                    <li className="h-full flex items-center mt-5">
                      <Link href="/" className={`h-full flex items-center text-base xl:text-lg font-bold transition-opacity duration-200 hover:opacity-80 ${pathname === "/" ? "text-[var(--header-text-active)]" : "text-[var(--header-text-primary)]"}`}>
                        Accueil
                      </Link>
                    </li>
                    {/* Formations - Mega menu */}
                    <li className="h-full flex items-center">
                      <button onClick={handleFormationsClick} className={`h-full flex items-center gap-1 text-base xl:text-lg font-bold transition-opacity duration-200 hover:opacity-80 ${formationsMenuOpen ? "text-[var(--header-text-active)]" : "text-[var(--header-text-primary)]"}`}>
                        {formationsLink.label}
                        <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${formationsMenuOpen ? "rotate-180" : ""}`} />
                      </button>
                    </li>
                    {/* Autres liens */}
                    {navLinks.map(({ label, href }) => (
                      <li key={href} className="h-full flex items-center mt-5">
                        <Link href={href} className={`h-full flex items-center text-base xl:text-lg font-bold transition-opacity duration-200 hover:opacity-80 ${pathname === href ? "text-[var(--header-text-active)]" : "text-[var(--header-text-primary)]"}`}>
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="relative search-container flex items-center w-full max-w-2xl animate-slide-in">
                    <form onSubmit={handleSearchSubmit} className="flex-1">
                      <div className="relative">
                        <input
                          ref={searchInputRef}
                          id="search-input"
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                          placeholder="Rechercher une formation..."
                          className="w-full pl-12 pr-10 py-3 text-base bg-white border-2 border-gray-200 rounded-full focus:outline-none focus:border-[var(--bibocom-red)] transition-all duration-300 shadow-lg"
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              setSearchOpen(false);
                              setShowSuggestions(false);
                            }
                          }}
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearchQuery("");
                              setSuggestions([]);
                              setShowSuggestions(false);
                              searchInputRef.current?.focus();
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </form>

                    {/* Suggestions dropdown */}
                    {showSuggestions && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in">
                        {coursesLoading ? (
                          <div className="p-4 text-center text-gray-500">
                            Recherche en cours...
                          </div>
                        ) : (
                          <>
                            {/* Suggestions de catégories */}
                            {categorySuggestions.length > 0 && (
                              <>
                                <div className="px-4 py-2 bg-purple-50 border-b border-purple-100">
                                  <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">
                                    Catégories
                                  </p>
                                </div>
                                {categorySuggestions.map((category) => (
                                  <button
                                    key={category.id}
                                    onClick={() => handleSuggestionClick(category)}
                                    className="w-full flex items-center gap-4 p-4 hover:bg-purple-50 transition-colors border-b border-gray-50 last:border-b-0"
                                  >
                                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                      <Search className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div className="flex-1 text-left">
                                      <h4 className="font-bold text-gray-900 text-sm">
                                        {category.name}
                                      </h4>
                                      <p className="text-xs text-gray-500 mt-1">
                                        Voir toutes les formations dans {category.name}
                                      </p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-gray-400" />
                                  </button>
                                ))}
                              </>
                            )}
                            
                            {/* Suggestions de formations */}
                            {suggestions.length > 0 && (
                              <>
                                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Formations suggérées
                                  </p>
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                  {suggestions.map((course) => (
                                    <button
                                      key={course.id}
                                      onClick={() => handleSuggestionClick(course)}
                                      className="w-full flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                                    >
                                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                                        {course.thumbnailUrl ? (
                                          <img
                                            src={course.thumbnailUrl}
                                            alt={course.title}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center bg-[var(--bibocom-red)]/10">
                                            <BookOpen className="h-6 w-6 text-[var(--bibocom-red)]" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 text-left">
                                        <h4 className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-[var(--bibocom-red)]">
                                          {course.title}
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                          {course.categoryName}
                                        </p>
                                        <div className="flex items-center gap-3 mt-2">
                                          {course.level && (
                                            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                                              {course.level}
                                            </span>
                                          )}
                                          {course.price === 0 ? (
                                            <span className="text-xs font-semibold text-green-600">
                                              Gratuit
                                            </span>
                                          ) : (
                                            <span className="text-xs font-semibold text-gray-900">
                                              {course.price?.toLocaleString()} CFA
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                            
                            {/* Aucun résultat */}
                            {suggestions.length === 0 && categorySuggestions.length === 0 && (
                              <div className="p-6 text-center">
                                <Search className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-500">Aucune formation trouvée</p>
                                <p className="text-sm text-gray-400 mt-1">
                                  Essayez avec un autre mot-clé
                                </p>
                              </div>
                            )}
                            
                            <div className="p-3 bg-gray-50 border-t border-gray-100">
                              <button
                                onClick={handleSearchSubmit}
                                className="w-full py-2 text-sm font-semibold text-[var(--bibocom-red)] hover:bg-[var(--bibocom-red)]/10 rounded-lg transition-colors"
                              >
                                Voir tous les résultats pour "{searchQuery}"
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Bouton recherche / fermer */}
                <button
                  onClick={() => {
                    if (searchOpen) {
                      if (searchQuery.trim()) {
                        router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
                      }
                      setSearchOpen(false);
                      setSearchQuery("");
                      setShowSuggestions(false);
                    } else {
                      setSearchOpen(true);
                    }
                  }}
                  className="ml-4 h-10 w-10 flex items-center justify-center rounded-full bg-[var(--bibocom-red)] text-white hover:bg-[var(--bibocom-red)]/90 transition-all duration-300 shadow-lg"
                  aria-label="Rechercher"
                >
                  {searchOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Search className="h-5 w-5" />
                  )}
                </button>
              </nav>

              {/* ACTIONS DROITE */}
              <div className="flex items-center">
                {isLoading ? (
                  <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
                ) : isAuthenticated ? (
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
                            <p className="truncate text-base font-bold text-gray-900">{displayName}</p>
                            <p className="truncate text-xs text-gray-500">{user?.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col p-2">
                        <Link
                          href={ user?.role === "ADMIN" ? "/admin-dashboard" : user?.role === "INSTRUCTOR" ? "/instructor-dashboard" : user?.role === "STUDENT" ? "/student-dashboard" : "/" }
                          onClick={() => setMobileMenuOpen(false)}
                          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <span className="flex w-full items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                              <LayoutDashboard className="h-4 w-4" />
                            </span>
                            <span className="truncate leading-none">Tableau de bord</span>
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
                            <span className="truncate leading-none">Paramètres</span>
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
                          <span className="truncate leading-none">Déconnexion</span>
                        </span>
                      </button>
                      </div>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                ) : (
                  <>
                    <div className="hidden lg:flex items-center bg-[var(--bibocom-red)] hover:bg-[var(--bibocom-red)]/90 rounded-2xl font-bold text-white shadow-md transition-all duration-200">
                      <Link href="/register" className="px-6 xl:px-8 py-3.5 xl:py-4 text-base xl:text-lg">
                        S'inscrire
                      </Link>
                      <span className="text-lg">/</span>
                      <Link href="/login" className="px-6 xl:px-8 py-3.5 xl:py-4 text-base xl:text-lg">
                        Se connecter
                      </Link>
                    </div>

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

        {/* MENU MOBILE - Champ de recherche masqué */}
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
              {/* Formations - Mega menu */}
              <li>
                <button onClick={handleFormationsClick} className="w-full flex items-center justify-between py-3 px-4 rounded-lg text-lg font-bold text-gray-700 hover:bg-gray-100 transition-all duration-200">
                  <span>{formationsLink.label}</span>
                  <ChevronDown className="h-5 w-5" />
                </button>
              </li>
              {/* Accueil */}
              <li>
                <Link href="/" onClick={() => setMobileMenuOpen(false)} className={`block py-3 px-4 rounded-lg text-lg font-bold transition-all duration-200 ${pathname === "/" ? "bg-[var(--bibocom-red)] text-white" : "text-gray-700 hover:bg-gray-100"}`}>
                  Accueil
                </Link>
              </li>
              {/* Autres liens */}
              {navLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} onClick={() => setMobileMenuOpen(false)} className={`block py-3 px-4 rounded-lg text-lg font-bold transition-all duration-200 ${pathname === href ? "bg-[var(--bibocom-red)] text-white" : "text-gray-700 hover:bg-gray-100"}`}>
                    {label}
                  </Link>
                </li>
              ))}
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

      {formationsMenuOpen && (
        <MegaMenuOverlay
          isOpen={formationsMenuOpen}
          onClose={() => setFormationsMenuOpen(false)}
        />
      )}
    </>
  );
}
