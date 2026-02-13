"use client";

import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import TestimonialCarousel from "@/components/testimonials-section";

export function Testimonials() {
  const { isAuthenticated } = useLocalAuth();

  if (isAuthenticated) {
    return null;
  }

  return <TestimonialCarousel />;
}
