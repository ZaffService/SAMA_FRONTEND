"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2 } from "lucide-react";

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle: string;
  onAccessCourse: () => void;
}

export function PaymentSuccessModal({
  isOpen,
  onClose,
  courseTitle,
  onAccessCourse,
}: PaymentSuccessModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Auto-close after 3 seconds and redirect
      const timer = setTimeout(() => {
        onAccessCourse();
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onAccessCourse, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-green-600">
            ✓ Paiement Réussi !
          </DialogTitle>
        </DialogHeader>

        <div className="text-center space-y-6">
          {/* Success Animation */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-gray-900">Félicitations !</h3>
            <p className="text-gray-600 leading-relaxed">
              Votre paiement a été validé avec succès. Vous avez maintenant
              accès au cours complet.
            </p>
          </div>

          {/* Course Info */}
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Cours débloqué :</strong> {courseTitle}
            </p>
          </div>

          {/* Action Button */}
          <Button
            onClick={() => {
              onAccessCourse();
              onClose();
            }}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Accéder au cours
          </Button>

          <p className="text-xs text-gray-500">
            Redirection automatique dans quelques secondes...
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
