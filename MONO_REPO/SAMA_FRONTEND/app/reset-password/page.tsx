import { Metadata } from "next";
import ResetPassword from "./client";

export const metadata: Metadata = {
  title: "Réinitialiser le mot de passe - Bibocom Digital",
  description: "Entrez votre nouveau mot de passe",
};

export default function ResetPasswordPage() {
  return <ResetPassword />;
}
