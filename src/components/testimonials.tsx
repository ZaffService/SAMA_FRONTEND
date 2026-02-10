"use client";

import { useLocalAuth } from "@/infrastructure/storage/useAuth";
import Image from "next/image";

const StarRating = () => (
  <div className="flex gap-0.5">
    {[...Array(5)].map((_, i) => (
      <svg
        key={i}
        className="w-4 h-4 text-[#d93030] fill-current"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

export function Testimonials() {
  const { isAuthenticated } = useLocalAuth();

  // Masquer si l'utilisateur est connecté
  if (isAuthenticated) {
    return null;
  }

  return (
    <section className="relative w-full">
      {/* Testimonials Section */}
      <div className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left Side - Light blue gradient background */}
          <div className="relative bg-[#e8f4fc] py-8 px-4 lg:px-8 lg:py-12">
            {/* Decorative wave pattern at top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0A2A66] via-[#0A2A66] to-[#0A2A66] opacity-30"></div>
            
            <div className="relative max-w-md mx-auto lg:ml-auto lg:mr-8">
              {/* Avatar positioned to the left, overlapping */}
              <div className="absolute -left-4 lg:-left-25 z-10">
                <div className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full border-4 border-[#d93030] overflow-hidden shadow-xl bg-white">
                  <img
                    src="/hero-instructor.jpg"
                    alt="Témoignage cliente"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Speech bubble card */}
              <div className="flex items-start gap-4">
  {/* Avatar */}
  {/* <img
    src="/avatar-blandine.jpg"
    alt="Blandine"
    className="w-12 h-12 rounded-full object-cover"
  /> */}

  {/* Message bubble */}
  <div className="bg-white rounded-2xl shadow-md p-4 max-w-md">
    <p className="text-[#0A2A66] text-sm md:text-base leading-relaxed">
  Super expérience de formation ! <br />
  Grâce à BIBOCOM Digital, j'ai trouvé un nouvel emploi !
</p>

    <div className="mt-2">
      <StarRating />
    </div>

    {/* <span className="block mt-2 text-xs text-gray-500 italic">
      Blandine V.
    </span> */}
  </div>
</div>

            </div>
          </div>

          {/* Right Side - Blue background card + CTA */}
          <div className="flex flex-col">
            {/* Testimonial Arnaud K. */}
            <div className="bg-[#0A2A66] py-8 px-4 lg:px-8 lg:py-12 flex items-center justify-center">
              <div className="text-center text-white max-w-sm">
                {/* Avatar */}
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white overflow-hidden mx-auto mb-4 shadow-lg">
                  <img
                    src="/bibo1.png"
                    alt="Arnaud K."
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* <h3 className="text-xl md:text-2xl font-bold mb-3">Arnaud K.</h3> */}
                
                <p className="text-white/95 text-sm md:text-base leading-relaxed mb-4">
                  Des cours de qualité et des formateurs au top.<br />
                  Je recommande vivement !
                </p>
                
                <div className="flex justify-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-4 h-4 text-[#d93030] fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>

            {/* GAP entre Arnaud et CTA */}
            <div className="bg-[#e8f4fc] h-8 md:h-12"></div>

            {/* CTA Black Section - inside right column */}
            <div className="bg-[#d93030] py-8 md:py-10 px-4 lg:px-8 ">
              <div className="text-center">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-5">
                  Prêt(e) à booster votre carrière ?
                </h2>
                <button className="bg-[#0A2A66] hover:bg-[#0A2A66]/90 text-white font-semibold py-3 px-8 md:px-10 rounded-md text-base md:text-lg transition-all duration-300 hover:scale-105 shadow-lg">
                  Rejoindre BIBOCOM Digital
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}