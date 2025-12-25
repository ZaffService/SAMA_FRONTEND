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
  onOrangeSelected?: () => void;
  onWaveSelected?: () => void;
  onCardSelected?: () => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  courseId,
  courseTitle,
  coursePrice,
  onOrangeSelected,
  onWaveSelected,
  onCardSelected,
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

  const handlePayment = () => {
    if (!selectedMethod) return;

    onClose(); // Close the payment method selection modal

    // Call the appropriate callback based on selected method
    if (selectedMethod === "orange" && onOrangeSelected) {
      onOrangeSelected();
    } else if (selectedMethod === "wave" && onWaveSelected) {
      onWaveSelected();
    } else if (selectedMethod === "visa" && onCardSelected) {
      onCardSelected();
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
