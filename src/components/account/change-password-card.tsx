"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { AuthApi } from "@/infrastructure/api/auth-api";
import { getErrorMapping } from "@/shared/helpers/error-mapping";
import { validatePassword } from "@/lib/phone-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";

type ChangePasswordCardProps = {
  className?: string;
  variant?: "embedded" | "standalone";
};

export function ChangePasswordCard({
  className = "",
  variant = "embedded",
}: ChangePasswordCardProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const isStandalone = variant === "standalone";

  const validateForm = () => {
    const nextErrors: typeof errors = {};
    if (!currentPassword.trim()) {
      nextErrors.currentPassword = "Le mot de passe actuel est requis";
    }
    const newPasswordError = validatePassword(newPassword);
    if (newPasswordError) {
      nextErrors.newPassword = newPasswordError;
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = "Veuillez confirmer le mot de passe";
    } else if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    } else if (currentPassword && currentPassword === newPassword) {
      nextErrors.newPassword =
        "Le nouveau mot de passe doit être différent de l’actuel";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const data = await AuthApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await Swal.fire({
        title: "Mot de passe modifié",
        text: data.message || "Votre mot de passe a été mis à jour.",
        icon: "success",
        confirmButtonColor: "#002c75",
        confirmButtonText: "OK",
      });
    } catch (err) {
      const mapping = getErrorMapping(err);
      await Swal.fire({
        title: "Erreur",
        text: mapping.message,
        icon: "error",
        confirmButtonColor: "#dc2626",
        confirmButtonText: "Réessayer",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cardClassName = isStandalone
    ? `overflow-hidden border-0 shadow-lg rounded-2xl ${className}`
    : `shadow-lg border-gray-100 ${className || "mt-8 lg:mt-10"}`;

  const inputClassName = isStandalone
    ? "h-12 rounded-xl border-gray-200 bg-gray-50/50 px-4 text-base focus-visible:border-[#002c75] focus-visible:ring-[#002c75]/20"
    : "";

  return (
    <Card className={cardClassName}>
      <CardHeader
        className={
          isStandalone
            ? "border-b bg-gray-50/80 px-6 py-5 sm:px-8 sm:py-6"
            : undefined
        }
      >
        <div className={isStandalone ? "flex items-center gap-3" : undefined}>
          {isStandalone && (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100">
              <Lock className="h-5 w-5 text-[#002c75]" />
            </div>
          )}
          <div>
            <CardTitle
              className={
                isStandalone
                  ? "text-lg font-bold text-gray-900 sm:text-xl"
                  : "flex items-center gap-2 text-xl lg:text-2xl"
              }
            >
              {!isStandalone && (
                <Lock className="h-5 w-5 text-blue-600" />
              )}
              Changer le mot de passe
            </CardTitle>
            <CardDescription className={isStandalone ? "mt-1 text-sm" : undefined}>
              Modifiez votre mot de passe en saisissant l&apos;ancien puis le
              nouveau.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className={isStandalone ? "px-6 py-6 sm:px-8 sm:py-7" : undefined}>
        <form
          onSubmit={handleSubmit}
          className={`space-y-5 ${isStandalone ? "w-full" : "max-w-lg space-y-4"}`}
        >
          <div className="space-y-2">
            <Label
              htmlFor="currentPassword"
              className={isStandalone ? "text-sm font-medium text-gray-700" : undefined}
            >
              Mot de passe actuel
            </Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (errors.currentPassword) {
                    setErrors({ ...errors, currentPassword: undefined });
                  }
                }}
                className={`${inputClassName} ${
                  errors.currentPassword ? "border-red-500" : ""
                } ${isStandalone ? "pr-11" : "mt-1.5"}`}
                placeholder="Saisissez votre mot de passe actuel"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                aria-label={
                  showCurrent
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
              >
                {showCurrent ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-xs text-red-500">{errors.currentPassword}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="newPassword"
              className={isStandalone ? "text-sm font-medium text-gray-700" : undefined}
            >
              Nouveau mot de passe
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errors.newPassword) {
                    setErrors({ ...errors, newPassword: undefined });
                  }
                }}
                className={`${inputClassName} ${
                  errors.newPassword ? "border-red-500" : ""
                } ${isStandalone ? "pr-11" : "mt-1.5"}`}
                placeholder="Minimum 6 caractères"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                aria-label={
                  showNew
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
              >
                {showNew ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-xs text-red-500">{errors.newPassword}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className={isStandalone ? "text-sm font-medium text-gray-700" : undefined}
            >
              Confirmer le mot de passe
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) {
                    setErrors({ ...errors, confirmPassword: undefined });
                  }
                }}
                className={`${inputClassName} ${
                  errors.confirmPassword ? "border-red-500" : ""
                } ${isStandalone ? "pr-11" : "mt-1.5"}`}
                placeholder="Confirmez le nouveau mot de passe"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                aria-label={
                  showConfirm
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-500">{errors.confirmPassword}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className={
              isStandalone
                ? "mt-2 h-12 w-full rounded-xl bg-[#002c75] text-base font-semibold hover:bg-[#001a4d]"
                : "bg-blue-600 hover:bg-blue-700"
            }
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Mettre à jour le mot de passe"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
