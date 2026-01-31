"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CreateUserPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
            <span>Fonctionnalité temporairement indisponible</span>
          </CardTitle>
          <CardDescription>
            La création d'utilisateurs est actuellement en maintenance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-yellow-800">
                  Maintenance en cours
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Cette fonctionnalité sera réactivée prochainement. Veuillez
                  nous excuser pour la gêne occasionnée.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={() => router.push("/admin-dashboard")}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Retour au dashboard</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
