"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CatchAllCourseDetails() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string[];


  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600"></div>
    </div>
  );
}