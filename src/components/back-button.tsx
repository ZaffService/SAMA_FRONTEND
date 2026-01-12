"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  href: string;
  text: string;
}

export function BackButton({ href, text }: BackButtonProps) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 hover:bg-white backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200/50 hover:border-gray-300"
    >
      <span className="text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">
        {text}
      </span>
    </Link>
  );
}
