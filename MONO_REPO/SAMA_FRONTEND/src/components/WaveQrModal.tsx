"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Smartphone, Download } from "lucide-react";

interface WaveQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  courseTitle: string;
  coursePrice: number;
}

export function WaveQrModal({
  isOpen,
  onClose,
  onSuccess,
  courseTitle,
  coursePrice,
}: WaveQrModalProps) {
  const handleSimulatePayment = () => {
    // Simulation de paiement réussi
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">🐧</span>
            </div>
            Wave
          </DialogTitle>
          <p className="text-sm text-muted-foreground">Payez avec Wave</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Course Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-sm mb-1">{courseTitle}</h3>
            <p className="text-blue-600 font-bold">
              {coursePrice.toLocaleString()} FCFA
            </p>
          </div>

          {/* QR Code Section */}
          <div className="text-center space-y-4">
            <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-8 rounded-xl">
              <div className="bg-white p-4 rounded-lg inline-block">
                <div className="w-32 h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded mx-auto mb-2 flex items-center justify-center">
                      <span className="text-2xl">📱</span>
                    </div>
                    <p className="text-xs text-gray-600 font-medium">QR Code</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Scannez le code QR avec l'application Wave de votre téléphone
                pour effectuer le paiement
              </p>
            </div>
          </div>

          {/* Simulate Payment Button */}
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-sm text-yellow-800 mb-3">
              🧪 Mode simulation activé
            </p>
            <Button
              onClick={handleSimulatePayment}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Smartphone className="w-4 h-4 mr-2" />✓ Simuler le paiement Wave
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
