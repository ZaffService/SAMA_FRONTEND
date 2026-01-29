"use client";

import Image from "next/image";

interface LogoProps {
  variant?: "default" | "light";
  size?: "sm" | "md" | "lg";
}

export function Logo({ variant = "default", size = "md" }: LogoProps) {
  const sizeStyles = {
    sm: "max-w-[100px] sm:max-w-[130px]",
    md: "max-w-[110px] sm:max-w-[150px]",
    lg: "max-w-[120px] sm:max-w-[200px]",
  };

  const styleClass = sizeStyles[size];

  return (
    <div className={`flex items-center ${styleClass}`}>
      <Image
        src="/logo.png"
        alt="Bibocom Digital Logo"
        // width={300}
        // height={300}
        priority
        className="w-full h-auto object-contain"
      />
    </div>
  );
}
