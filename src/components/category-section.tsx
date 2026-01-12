"use client";

import type React from "react";
import Link from "next/link";
import {
  Code,
  BarChart3,
  Palette,
  Briefcase,
  Shield,
  Megaphone,
  ArrowRight,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: React.ElementType;
  count: number;
  color: string;
  bgColor: string;
}

const categories: Category[] = [
  {
    id: "marketing-digital",
    name: "Marketing Digital",
    icon: Megaphone,
    count: 24,
    color: "text-blue-600",
    bgColor: "bg-blue-100 hover:bg-blue-200",
  },
  {
    id: "developpement-web",
    name: "Développement Web",
    icon: Code,
    count: 18,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100 hover:bg-emerald-200",
  },
  {
    id: "data-science",
    name: "Data Science",
    icon: BarChart3,
    count: 12,
    color: "text-purple-600",
    bgColor: "bg-purple-100 hover:bg-purple-200",
  },
  {
    id: "design-ux-ui",
    name: "Design UX/UI",
    icon: Palette,
    count: 15,
    color: "text-pink-600",
    bgColor: "bg-pink-100 hover:bg-pink-200",
  },
  {
    id: "business",
    name: "Business",
    icon: Briefcase,
    count: 10,
    color: "text-amber-600",
    bgColor: "bg-amber-100 hover:bg-amber-200",
  },
  {
    id: "cybersecurite",
    name: "Cybersécurité",
    icon: Shield,
    count: 8,
    color: "text-red-600",
    bgColor: "bg-red-100 hover:bg-red-200",
  },
];

/**
 * Section catégories avec icônes colorées
 */
export function CategorySection() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Explorer par catégorie
            </h2>
            <p className="text-muted-foreground">
              Trouvez le cours parfait dans votre domaine d'intérêt
            </p>
          </div>
          <Link
            href="/courses"
            className="hidden md:flex items-center gap-2 text-primary font-medium hover:underline"
          >
            Voir toutes les catégories
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/courses?category=${category.id}`}
              className={`group flex flex-col items-center p-6 rounded-2xl ${category.bgColor} transition-all duration-300 hover:scale-105 hover:shadow-lg`}
            >
              <div
                className={`mb-4 p-4 rounded-2xl bg-white shadow-sm ${category.color}`}
              >
                <category.icon className="h-7 w-7" />
              </div>
              <h3 className="font-semibold text-sm text-center text-foreground mb-1">
                {category.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {category.count} cours
              </p>
            </Link>
          ))}
        </div>

        {/* Mobile View All Link */}
        <div className="mt-8 text-center md:hidden">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-primary font-medium"
          >
            Voir toutes les catégories
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
