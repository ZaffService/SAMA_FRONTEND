import { Metadata } from "next";
import ForgotPassword from "./client";

export const metadata: Metadata = {
  title: "Mot de passe oublié - Bibocom Digital",
  description: "Réinitialisez votre mot de passe",
};

export default function ForgotPasswordPage() {
  return <ForgotPassword />;
}
