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
