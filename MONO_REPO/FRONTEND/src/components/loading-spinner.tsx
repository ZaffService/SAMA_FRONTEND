import { Loader2 } from "lucide-react";

export function LoadingSpinner({
  size = "default",
  className = "",
}: {
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="h-24 w-24 rounded-full border-4 border-muted animate-pulse mb-4 mx-auto" />
          <Loader2 className="h-24 w-24 animate-spin text-primary absolute inset-0" />
        </div>
        <div className="flex items-center gap-2 justify-center">
          <div className="font-bold text-2xl">BIBOCOM</div>
          <div className="text-2xl text-primary">DIGITAL</div>
        </div>
        <p className="text-muted-foreground mt-2">Chargement en cours...</p>
      </div>
    </div>
  );
}

export function ContentLoader() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-muted rounded w-1/4" />
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-4 bg-muted rounded w-1/2" />
      <div className="grid grid-cols-3 gap-4 mt-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-muted rounded-xl" />
        ))}
      </div>
    </div>
  );
}
