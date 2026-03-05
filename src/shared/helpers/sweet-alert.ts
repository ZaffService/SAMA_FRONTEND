import Swal from "sweetalert2";

export function showSuccessToast(title: string, description?: string) {
  Swal.fire({
    icon: "success",
    title,
    text: description,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
}

export function showErrorToast(title: string, description?: string) {
  Swal.fire({
    icon: "error",
    title,
    text: description,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
}

export function showWarningToast(title: string, description?: string) {
  Swal.fire({
    icon: "warning",
    title,
    text: description,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
}

export function showInfoToast(title: string, description?: string) {
  Swal.fire({
    icon: "info",
    title,
    text: description,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
}

export function showLoginSuccess(userName: string) {
  Swal.fire({
    icon: "success",
    title: "Connexion réussie",
    text: `Bienvenue, ${userName}!`,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
}

export function showRegisterSuccess(email: string) {
  Swal.fire({
    icon: "success",
    title: "Inscription réussie",
    text: `Un email de vérification a été envoyé à ${email}`,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 5000,
    timerProgressBar: true,
  });
}

export function showLogoutSuccess() {
  Swal.fire({
    icon: "success",
    title: "Déconnexion réussie",
    text: "À bientôt!",
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
}

export function showLoginError(message: string) {
  Swal.fire({
    icon: "error",
    title: "Erreur de connexion",
    text: message,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
  });
}

export function showLoadingToast(title: string = "Chargement...") {
  Swal.fire({
    title,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
}

export function closeLoading() {
  Swal.close();
}

export function showQuitConfirmation(
  text?: string,
): Promise<{ isConfirmed: boolean }> {
  return Swal.fire({
    title: "Êtes-vous sûr ?",
    text: text || "Vos progrès ne seront pas sauvegardés.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Oui, quitter",
    cancelButtonText: "Annuler",
  });
}

export function showQuizFailureModal(): Promise<{
  action: "retake" | "view_answers" | "cancel";
}> {
  return Swal.fire({
    title: "Quiz non réussi",
    text: "Vous n'avez pas atteint le score minimum requis. Que souhaitez-vous faire ?",
    icon: "warning",
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonColor: "#3085d6",
    denyButtonColor: "#28a745",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Refaire le quiz",
    denyButtonText: "Voir les bonnes réponses",
    cancelButtonText: "Annuler",
  }).then((result) => {
    if (result.isConfirmed) {
      return { action: "retake" };
    } else if (result.isDenied) {
      return { action: "view_answers" };
    } else {
      return { action: "cancel" };
    }
  });
}

export function showCourseCreatedSuccess(
  title: string,
  callback?: () => void,
  customMessage?: string,
) {
  Swal.fire({
    icon: "success",
    title: "Cours créé avec succès !",
    text: customMessage || `Votre cours "${title}" a été publié.`,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
  }).then(() => {
    if (callback) callback();
  });
}

export function showCourseCreationError(message: string) {
  Swal.fire({
    icon: "error",
    title: "Erreur lors de la création du cours",
    text: message,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 5000,
    timerProgressBar: true,
  });
}

export function showDraftSavedSuccess(title: string, callback?: () => void) {
  Swal.fire({
    icon: "success",
    title: "Brouillon sauvegardé",
    text: `Le brouillon de "${title}" a été sauvegardé.`,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  }).then(() => {
    if (callback) callback();
  });
}

export function showContactFormSuccess() {
  Swal.fire({
    icon: "success",
    title: "Succès !",
    text: "Votre message a été envoyé avec succès.\nNotre équipe vous répondra sous 24h.",
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 5000,
    timerProgressBar: true,
  });
}

export function showDeleteLessonConfirmation(
  lessonTitle: string,
): Promise<{ isConfirmed: boolean; isDenied: boolean }> {
  return Swal.fire({
    title: "Supprimer la leçon ?",
    text: `Êtes-vous sûr de vouloir supprimer "${lessonTitle}" ? Cette action est irréversible.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Oui, supprimer",
    cancelButtonText: "Annuler",
  });
}

export function showLessonDeletedSuccess() {
  Swal.fire({
    icon: "success",
    title: "Leçon supprimée",
    text: "La leçon a été supprimée avec succès.",
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
}

export function showLessonUpdatedSuccess() {
  Swal.fire({
    icon: "success",
    title: "Leçon modifiée",
    text: "La leçon a été modifiée avec succès.",
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
}
