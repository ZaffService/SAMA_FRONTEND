"use client";

import { useState, use } from "react";

export const dynamic = "force-dynamic";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Lock,
  CheckCircle2,
  Clock,
  Users,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProtectRoute } from "@/application/use-cases/useProtectRoute";

const courseData = {
  1: {
    title: "Introduction au Marketing Digital",
    instructor: "AnikaZ",
    duration: "9h 36m",
    price: 148,
    originalPrice: 185,
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Capture%20d%E2%80%99%C3%A9cran%20du%202025-11-14%2010-37-25-VwlTc5hVNXuVB1m1tNv18c2PcWPgyg.png",
    rating: 4.7,
    students: 12500,
    lessons: 20,
  },
};

export default function Checkout({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { canAccess } = useProtectRoute({
    message: "Veuillez vous connecter pour acheter un cours.",
  });
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
    email: "",
    country: "France",
  });

  // Protection: Si pas d'accès, retourner null (redirection en cours)
  if (!canAccess) {
    return null;
  }

  const course = courseData[Number(id) as keyof typeof courseData];
  const discount = course.originalPrice
    ? course.originalPrice - course.price
    : 0;
  const tax = course.price * 0.2; // 20% TVA
  const total = course.price + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      router.push(`/payment-success/${id}`);
    }, 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Format card number with spaces
    if (name === "cardNumber") {
      const formatted = value
        .replace(/\s/g, "")
        .replace(/(\d{4})/g, "$1 ")
        .trim();
      setFormData({ ...formData, [name]: formatted });
    }
    // Format expiry date with slash
    else if (name === "expiryDate") {
      const formatted = value
        .replace(/\//g, "")
        .replace(/(\d{2})(\d{0,2})/, "$1/$2");
      setFormData({ ...formData, [name]: formatted });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  return (
    <div className="min-h-screen flex flex-col pt-16">
      <Header />

      <main className="flex-1 py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Finaliser l'achat</h1>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Payment Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Billing Information */}
                <div className="bg-card border rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Informations de facturation
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Email
                      </label>
                      <Input
                        type="email"
                        name="email"
                        placeholder="votre@email.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Pays
                      </label>
                      <select
                        className="w-full border rounded-lg px-3 py-2"
                        value={formData.country}
                        onChange={(e) =>
                          setFormData({ ...formData, country: e.target.value })
                        }
                      >
                        <option>France</option>
                        <option>Belgique</option>
                        <option>Suisse</option>
                        <option>Canada</option>
                        <option>Autre</option>
                      </select>
                    </div>

                    {/* Payment Method Selection */}
                    <div className="pt-4">
                      <h3 className="text-lg font-semibold mb-3">
                        Méthode de paiement
                      </h3>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("card")}
                          className={`border rounded-lg p-4 flex items-center justify-center gap-2 transition-colors ${
                            paymentMethod === "card"
                              ? "border-primary bg-primary/5"
                              : ""
                          }`}
                        >
                          <CreditCard className="h-5 w-5" />
                          Carte bancaire
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("paypal")}
                          className={`border rounded-lg p-4 flex items-center justify-center gap-2 transition-colors ${
                            paymentMethod === "paypal"
                              ? "border-primary bg-primary/5"
                              : ""
                          }`}
                        >
                          PayPal
                        </button>
                      </div>

                      {paymentMethod === "card" && (
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Numéro de carte
                            </label>
                            <Input
                              type="text"
                              name="cardNumber"
                              placeholder="1234 5678 9012 3456"
                              value={formData.cardNumber}
                              onChange={handleInputChange}
                              maxLength={19}
                              required
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Nom sur la carte
                            </label>
                            <Input
                              type="text"
                              name="cardName"
                              placeholder="JEAN DUPONT"
                              value={formData.cardName}
                              onChange={handleInputChange}
                              required
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium mb-2 block">
                                Date d'expiration
                              </label>
                              <Input
                                type="text"
                                name="expiryDate"
                                placeholder="MM/YY"
                                value={formData.expiryDate}
                                onChange={handleInputChange}
                                maxLength={5}
                                required
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block">
                                CVV
                              </label>
                              <Input
                                type="text"
                                name="cvv"
                                placeholder="123"
                                value={formData.cvv}
                                onChange={handleInputChange}
                                maxLength={3}
                                required
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {paymentMethod === "paypal" && (
                        <div className="border rounded-lg p-6 text-center">
                          <p className="text-muted-foreground mb-4">
                            Vous serez redirigé vers PayPal pour finaliser le
                            paiement
                          </p>
                          <Button
                            type="submit"
                            size="lg"
                            className="w-full"
                            disabled={isProcessing}
                          >
                            {isProcessing
                              ? "Redirection..."
                              : "Continuer avec PayPal"}
                          </Button>
                        </div>
                      )}
                    </div>

                    {paymentMethod === "card" && (
                      <Button
                        type="submit"
                        size="lg"
                        className="w-full mt-6"
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                            Traitement en cours...
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Payer {total.toFixed(2)} FCFA
                          </>
                        )}
                      </Button>
                    )}

                    <p className="text-xs text-muted-foreground text-center mt-4">
                      <Lock className="h-3 w-3 inline mr-1" />
                      Paiement 100% sécurisé. Vos données sont cryptées.
                    </p>
                  </form>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-card border rounded-xl p-6 sticky top-24">
                  <h2 className="text-xl font-semibold mb-4">Récapitulatif</h2>

                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <img
                        src={course.image || "/placeholder.svg"}
                        alt={course.title}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          par {course.instructor}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground pt-3 border-t">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        {course.rating}
                      </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Prix du cours
                        </span>
                        <span className="font-medium">{course.price} FCFA</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Réduction</span>
                          <span>-{discount} FCFA</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">TVA (20%)</span>
                        <span className="font-medium">
                          {tax.toFixed(2)} FCFA
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between text-lg font-bold pt-4 border-t">
                      <span>Total</span>
                      <span className="text-primary">
                        {total.toFixed(2)} FCFA
                      </span>
                    </div>

                    <div className="bg-primary/5 rounded-lg p-4 mt-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        Ce que vous obtenez
                      </h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          Accès à vie au cours
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          Certificat de réussite
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          Support de l'instructeur
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          Garantie 30 jours satisfait ou remboursé
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
