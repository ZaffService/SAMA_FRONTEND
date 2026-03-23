import Image from "next/image";

const partners = [
  { name: "FONAMIF", logo: "/partenaire1.png" },
  { name: "Ville de Dakar", logo: "/partenaire2.png" },
  { name: "MFB", logo: "/partenaire3.png" },
  { name: "Point Actu", logo: "/partenaire4.png" },
  { name: "CCIAD", logo: "/partenaire5.png" },
  { name: "FONAMIF", logo: "/partenaire1.png" },
  { name: "Ville de Dakar", logo: "/partenaire2.png" },
  { name: "MFB", logo: "/partenaire3.png" },
];

const TrustCarousel = () => {
  const allPartners = [...partners, ...partners];

  return (
    <section className="py-16 md:py-20 bg-[#f1f5f9] overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold tracking-widest uppercase text-[hsl(0_78%_50%)] mb-3">
            Nos partenaires
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-[hsl(220_80%_25%)]">
            Ils nous ont fait confiance
          </h2>
        </div>
      </div>

      <div className="relative partners-carousel">
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 z-10 bg-gradient-to-r from-[hsl(0_60%_97%)] to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-24 z-10 bg-gradient-to-l from-[hsl(0_60%_97%)] to-transparent pointer-events-none" />

        <div className="flex w-max animate-scroll-left items-center gap-10 px-4">
          {allPartners.map((partner, index) => (
            <div
              key={`${partner.name}-${index}`}
              className="flex-shrink-0"
              aria-hidden={index >= partners.length}
            >
              <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-white border border-[hsl(0_0%_90%)] shadow-md flex items-center justify-center p-4 md:p-5 transition-transform transition-shadow duration-300 hover:scale-[1.05] hover:shadow-xl">
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  width={144}
                  height={144}
                  sizes="(min-width: 768px) 144px, 128px"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustCarousel;
