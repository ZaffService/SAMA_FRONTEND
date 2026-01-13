"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CatchAllCourseDetails() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string[];

  useEffect(() => {
    if (slug && slug.length >= 2 && slug[0] === 'undefined') {
      // PayDunya redirect with token
      const courseId = slug[1];
      router.push(`/course-details/${courseId}`);
    } else {
      // Invalid path, redirect to 404
      router.push('/not-found');
    }
  }, [slug, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600"></div>
    </div>
  );
}