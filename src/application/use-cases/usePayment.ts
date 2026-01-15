import { PaymentApi } from "@/infrastructure/api/payment-api";
import { useState } from "react";

export const usePayment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPaymentIntent = async (userId: string, courseId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // APPEL API RÉEL - PAS DE SIMULATION
      const response = await PaymentApi.createPaymentIntent(userId, courseId);
      return response.paymentUrl; // URL PAYDUNYA RÉELLE
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de paiement");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPayment = async (token: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // APPEL API RÉEL - PAS DE SIMULATION
      return await PaymentApi.verifyPayment(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de vérification");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { createPaymentIntent, verifyPayment, isLoading, error };
};
