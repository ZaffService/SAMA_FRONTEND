import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ProfileSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <ProfileSkeleton />
      </main>
      <Footer />
    </div>
  );
}
