"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle, UserPlus } from "lucide-react";
import { AuthUseCases } from "@/application/use-cases/auth-use-cases";
import { toast } from "sonner";

const userCreationSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  role: z.enum(["STUDENT", "INSTRUCTOR", "ADMIN"]),
});

type UserCreationFormData = z.infer<typeof userCreationSchema>;

export function UserCreationForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<UserCreationFormData>({
    resolver: zodResolver(userCreationSchema),
  });

  const selectedRole = watch("role");

  // 🔐 Génération mot de passe
  const generatePassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const onSubmit = async (data: UserCreationFormData) => {
    setIsLoading(true);

    try {
      const password = generatePassword();

      await AuthUseCases.adminCreateUser({
        email: data.email,
        password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
      });

      // ✅ PLUS AUCUN APPEL À requestPasswordReset

      toast.success("Compte créé avec succès. Email envoyé à l'utilisateur.");
      setIsSuccess(true);
      reset();

      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la création du compte",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5 text-purple-600" />
            <span>Créer un compte utilisateur</span>
          </CardTitle>
          <CardDescription>
            Un email de bienvenue avec un mot de passe temporaire sera envoyé
            automatiquement.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Message de désactivation temporaire */}
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">
                  Fonctionnalité temporairement désactivée
                </p>
                <p className="text-sm">
                  La création d'utilisateurs est actuellement en maintenance.
                  Veuillez réessayer plus tard.
                </p>
              </div>
            </div>
          </div>

          {isSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <span>Compte créé avec succès</span>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 opacity-50 pointer-events-none"
          >
            <div>
              <Label>Prénom</Label>
              <Input {...register("firstName")} />
              {errors.firstName && (
                <p className="text-red-600 text-sm">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div>
              <Label>Nom</Label>
              <Input {...register("lastName")} />
              {errors.lastName && (
                <p className="text-red-600 text-sm">
                  {errors.lastName.message}
                </p>
              )}
            </div>

            <div>
              <Label>Email</Label>
              <Input type="email" {...register("email")} />
              {errors.email && (
                <p className="text-red-600 text-sm">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label>Rôle</Label>
              <Select
                value={selectedRole}
                onValueChange={(v) => setValue("role", v as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Étudiant</SelectItem>
                  <SelectItem value="INSTRUCTOR">Instructeur</SelectItem>
                  <SelectItem value="ADMIN">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full" disabled={true}>
              Fonctionnalité désactivée
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
