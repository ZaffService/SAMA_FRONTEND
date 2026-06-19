"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import ClientLogin from "./client-login";

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#002c75]" />
        </div>
      }
    >
      <ClientLogin />
    </Suspense>
  );
}
