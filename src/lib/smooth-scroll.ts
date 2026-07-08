export const FORMATIONS_SECTION_ID = "formations";

const DEFAULT_HEADER_OFFSET = 96;

/**
 * Scroll fluide vers la section catégories / recherche de la page d'accueil.
 */
export function scrollToFormationsSection(
  offset = DEFAULT_HEADER_OFFSET,
): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const element = document.getElementById(FORMATIONS_SECTION_ID);
  if (!element) {
    return false;
  }

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const targetTop =
    element.getBoundingClientRect().top + window.scrollY - offset;

  window.scrollTo({
    top: Math.max(0, targetTop),
    behavior: prefersReducedMotion ? "auto" : "smooth",
  });

  return true;
}
