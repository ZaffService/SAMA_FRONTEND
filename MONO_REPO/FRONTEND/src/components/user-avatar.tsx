"use client";

import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface UserAvatarProps {
  src?: string;
  firstName?: string;
  lastName?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function UserAvatar({
  src,
  firstName = "U",
  lastName = "",
  size = "md",
  className = "",
}: UserAvatarProps) {
  // Générer les initiales
  const initials =
    `${firstName?.[0] || "U"}${lastName?.[0] || ""}`.toUpperCase();

  // Déterminer la taille
  const sizeMap = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-20 w-20",
  };

  return (
    <Avatar className={`${sizeMap[size]} border-2 ${className}`}>
      {src && <AvatarImage src={src} alt={`${firstName} ${lastName}`} />}
      <AvatarFallback className="text-sm font-bold bg-primary text-white">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
