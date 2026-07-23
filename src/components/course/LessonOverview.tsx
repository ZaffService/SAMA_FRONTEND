"use client";

import { Check, Clock, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type LessonOverviewProps = {
  sectionTitle?: string;
  title: string;
  description: string;
  levelLabel: string;
  durationLabel: string;
  formatLabel: string;
  learnPoints: string[];
  className?: string;
};

export function LessonOverview({
  sectionTitle,
  title,
  description,
  levelLabel,
  durationLabel,
  formatLabel,
  learnPoints,
  className,
}: LessonOverviewProps) {
  return (
    <div
      className={cn(
        "animate-in fade-in-0 duration-300 space-y-5 sm:space-y-6",
        className,
      )}
    >
      <header className="space-y-3">
        {sectionTitle ? (
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {sectionTitle}
          </p>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
          {title}
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">{description}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge
            variant="secondary"
            className="min-h-8 rounded-full px-3 py-1.5 text-xs font-medium"
          >
            <GraduationCap className="size-3.5" />
            {levelLabel}
          </Badge>
          <Badge
            variant="secondary"
            className="min-h-8 rounded-full px-3 py-1.5 text-xs font-medium"
          >
            <Clock className="size-3.5" />
            {durationLabel}
          </Badge>
          <Badge
            variant="secondary"
            className="min-h-8 rounded-full px-3 py-1.5 text-xs font-medium"
          >
            {formatLabel}
          </Badge>
        </div>
      </header>

      <Card className="rounded-2xl border-border shadow-[var(--shadow-card)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold sm:text-xl">
            Ce que vous apprendrez
          </CardTitle>
        </CardHeader>
        <CardContent>
          {learnPoints.length > 0 ? (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              {learnPoints.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3.5" strokeWidth={2.5} />
                  </span>
                  <span className="text-sm leading-6 text-foreground">
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Les objectifs d&apos;apprentissage apparaîtront ici une fois le
              contenu pédagogique détaillé dans les modules.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border shadow-[var(--shadow-card)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold sm:text-xl">
            Description
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-7 text-muted-foreground sm:text-base">
            {description}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
