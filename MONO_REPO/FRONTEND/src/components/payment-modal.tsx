"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, Loader2 } from "lucide-react";
import Swal from "sweetalert2";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
  coursePrice: number;
}

export function PaymentModal({
  isOpen,
  onClose,
  courseId,
  courseTitle,
  coursePrice,
}: PaymentModalProps) {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<
    "orange" | "wave" | "visa" | null
  >(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentInitiated, setPaymentInitiated] = useState(false);

  const getPaymentMethodName = (method: "orange" | "wave" | "visa") => {
    const methods = {
      orange: "Orange Money",
      wave: "Wave",
      visa: "Carte Bancaire",
    };
    return methods[method];
  };

  const handlePayment = async () => {
    if (!selectedMethod || paymentInitiated) return;

    // Confirmation modal
    const result = await Swal.fire({
      title: "Confirmer le paiement",
      html: `
        <div style="text-align: left; padding: 10px;">
          <p style="margin-bottom: 15px; font-size: 15px; color: #6b7280;">
            <strong style="color: #1f2937;">Cours :</strong> ${courseTitle}
          </p>
          <p style="margin-bottom: 15px; font-size: 15px; color: #6b7280;">
            <strong style="color: #1f2937;">Montant :</strong> <span style="color: #3b82f6; font-weight: 600;">${coursePrice.toLocaleString()} FCFA</span>
          </p>
          <p style="margin-bottom: 0; font-size: 15px; color: #6b7280;">
            <strong style="color: #1f2937;">Méthode :</strong> ${getPaymentMethodName(selectedMethod)}
          </p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Confirmer le paiement",
      cancelButtonText: "Annuler",
      reverseButtons: true,
      background: "#ffffff",
      customClass: {
        popup: "rounded-2xl shadow-2xl",
        title: "text-xl font-semibold",
        htmlContainer: "text-left",
        confirmButton: "rounded-xl px-8 py-3 font-semibold",
        cancelButton: "rounded-xl px-8 py-3 font-medium",
      },
      buttonsStyling: true,
      focusCancel: false,
      width: "500px",
    });

    if (result.isConfirmed) {
      setPaymentInitiated(true);
      setIsProcessing(true);

      // Show processing modal
      Swal.fire({
        title: "Traitement en cours",
        html: `
          <div style="text-align: center; padding: 20px 0;">
            <div style="display: inline-block; width: 60px; height: 60px; border: 6px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="margin-top: 20px; color: #6b7280; font-size: 15px;">Veuillez patienter pendant que nous traitons votre paiement...</p>
          </div>
          <style>
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          </style>
        `,
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        background: "#ffffff",
        customClass: {
          popup: "rounded-2xl shadow-2xl",
        },
      });

      // Simulate payment processing
      setTimeout(async () => {
        setIsProcessing(false);

        // Success modal with animation
        await Swal.fire({
          title: "Paiement réussi !",
          html: `
            <div style="text-align: center; padding: 10px 0;">
              <div style="margin: 20px 0;">
                <svg style="width: 80px; height: 80px; margin: 0 auto; display: block;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="#10b981" stroke-width="2" fill="#d1fae5"/>
                  <path d="M8 12.5l2.5 2.5L16 9" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <p style="color: #6b7280; font-size: 15px; margin: 15px 0;">Votre paiement de <strong style="color: #3b82f6;">${coursePrice.toLocaleString()} FCFA</strong> a été effectué avec succès.</p>
              <p style="color: #10b981; font-weight: 600; font-size: 16px; margin-top: 15px;">Vous allez être redirigé vers votre cours...</p>
            </div>
          `,
          icon: "success",
          timer: 2500,
          timerProgressBar: true,
          showConfirmButton: false,
          background: "#ffffff",
          customClass: {
            popup: "rounded-2xl shadow-2xl",
            title: "text-2xl font-bold text-green-600",
          },
          didOpen: () => {
            // Add custom animation
            const popup = Swal.getPopup();
            if (popup) {
              popup.style.animation = "swal2-show 0.3s, scale-in 0.3s ease-out";
            }
          },
        });

        onClose();
        router.push(`/video-learning-module/${courseId}`);
      }, 3000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Paiement du cours</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Course Info */}
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-lg">{courseTitle}</h3>
            <p className="text-2xl font-bold text-primary">
              {coursePrice.toLocaleString()} FCFA
            </p>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <h4 className="font-medium text-center">
              Choisissez votre méthode de paiement
            </h4>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setSelectedMethod("orange")}
                className={`border-2 rounded-lg p-3 flex flex-col items-center gap-2 transition-all ${
                  selectedMethod === "orange"
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 hover:border-orange-300"
                }`}
              >
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-1">
                  <Image
                    src="/orange.svg"
                    alt="Orange Money"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <span className="font-medium text-xs text-center">
                  Orange Money
                </span>
              </button>

              <button
                onClick={() => setSelectedMethod("wave")}
                className={`border-2 rounded-lg p-3 flex flex-col items-center gap-2 transition-all ${
                  selectedMethod === "wave"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-1">
                  <Image
                    src="/wave.png"
                    alt="Wave"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <span className="font-medium text-xs text-center">Wave</span>
              </button>

              <button
                onClick={() => setSelectedMethod("visa")}
                className={`border-2 rounded-lg p-3 flex flex-col items-center gap-2 transition-all ${
                  selectedMethod === "visa"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-blue-400"
                }`}
              >
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-1">
                  <Image
                    src="/visa.jpg"
                    alt="Carte Bancaire"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <span className="font-medium text-xs text-center">
                  Carte Bancaire
                </span>
              </button>
            </div>
          </div>

          {/* Payment Button */}
          <Button
            onClick={handlePayment}
            disabled={!selectedMethod || isProcessing || paymentInitiated}
            className="w-full h-12"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Traitement du paiement...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Payer {coursePrice.toLocaleString()} FCFA
              </>
            )}
          </Button>

          {/* Info */}
          <p className="text-xs text-muted-foreground text-center">
            Paiement 100% sécurisé • Accès immédiat après paiement
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
