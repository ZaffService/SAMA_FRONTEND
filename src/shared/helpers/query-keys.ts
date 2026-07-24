/**
 * Stratégie de queryKeys TanStack Query
 *
 * Règle : une clé = une ressource (ou une vue de ressource).
 * Après une mutation, on invalide UNIQUEMENT les clés concernées.
 *
 * Exemples :
 * - createCategory → invalidate categoryKeys.list()
 * - updateCourse   → invalidate courseKeys.detail(id) + courseKeys.lists()
 */

export const categoryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoryKeys.all, "list"] as const,
  list: () => [...categoryKeys.lists()] as const,
  details: () => [...categoryKeys.all, "detail"] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
};

export const courseKeys = {
  all: ["courses"] as const,
  lists: () => [...courseKeys.all, "list"] as const,
  /** Liste paginée / filtrée */
  list: (filters: {
    page: number;
    perPage: number;
    query?: string;
    categoryId?: string;
    fetchAll?: boolean;
  }) => [...courseKeys.lists(), filters] as const,
  filters: () => [...courseKeys.all, "filters"] as const,
  details: () => [...courseKeys.all, "detail"] as const,
  detail: (courseId: string) => [...courseKeys.details(), courseId] as const,
  enrolled: () => [...courseKeys.all, "enrolled"] as const,
};

export const lessonKeys = {
  all: ["lessons"] as const,
  list: (courseId: string) => [...lessonKeys.all, "list", courseId] as const,
  detail: (lessonId: string) =>
    [...lessonKeys.all, "detail", lessonId] as const,
};

/**
 * URLs signées : TTL court (voir useSignedVideoUrl).
 * Ne jamais mettre un staleTime long ici.
 */
export const videoKeys = {
  all: ["videos"] as const,
  signed: (lessonId: string) =>
    [...videoKeys.all, "signed", lessonId] as const,
};
