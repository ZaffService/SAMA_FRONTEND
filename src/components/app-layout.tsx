"use client";

import { ReactNode } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ProfileCompletionBanner } from "@/components/profile-completion-banner";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#e9eff4] to-white">
      <Header />
      <ProfileCompletionBanner />
      <main className="flex-1 pt-[200px]">{children}</main>
      <Footer />
    </div>
  );
}
