"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Smartphone } from "lucide-react";

interface OrangeMoneyOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  courseTitle: string;
  coursePrice: number;
}

export function OrangeMoneyOtpModal({
  isOpen,
  onClose,
  onSuccess,
  courseTitle,
  coursePrice,
}: OrangeMoneyOtpModalProps) {
  const [otp, setOtp] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState("");

  const handleValidateOtp = async () => {
    if (otp.length !== 4) {
      setError("Le code OTP doit contenir 4 chiffres");
      return;
    }

    setIsValidating(true);
    setError("");

    // Simulation de validation
    setTimeout(() => {
      if (otp === "1234") {
        setIsValidating(false);
        onSuccess();
        onClose();
        setOtp("");
      } else {
        setIsValidating(false);
        setError("Code OTP incorrect. Le cours ne sera pas validé.");
      }
    }, 1500);
  };

  const handleClose = () => {
    setOtp("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-white" />
            </div>
            Orange Money
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Validation du paiement
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Course Info */}
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-semibold text-sm mb-1">{courseTitle}</h3>
            <p className="text-orange-600 font-bold">
              {coursePrice.toLocaleString()} FCFA
            </p>
          </div>

          {/* Instructions */}
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Étape 1 : Composez</h4>
              <div className="bg-white border-2 border-dashed border-blue-300 p-3 rounded text-center">
                <code className="text-lg font-mono font-bold text-blue-600">
                  #144#391#
                </code>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Composez ce code USSD sur votre téléphone pour générer votre
                code OTP
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">
                Étape 2 : Entrez le code OTP reçu
              </h4>
              <Input
                type="text"
                placeholder="0000"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setOtp(value);
                  setError("");
                }}
                className="text-center text-lg font-mono tracking-widest"
                maxLength={4}
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 Pour cette simulation, utilisez le code :{" "}
                <strong>1234</strong>
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isValidating}
            >
              Annuler
            </Button>
            <Button
              onClick={handleValidateOtp}
              className="flex-1"
              disabled={otp.length !== 4 || isValidating}
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validation...
                </>
              ) : (
                "Valider le paiement"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
