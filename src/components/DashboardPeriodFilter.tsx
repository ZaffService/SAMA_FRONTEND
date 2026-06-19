"use client";

import { useEffect, useState } from "react";
import { fr } from "react-day-picker/locale";
import {
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  type DashboardPeriod,
  type DashboardPeriodParams,
  formatDashboardPeriodLabel,
  toDateInputValue,
} from "@/shared/helpers/dashboard-period";

interface DashboardPeriodFilterProps {
  value: DashboardPeriodParams;
  activePeriod?: DashboardPeriod;
  onChange: (period: DashboardPeriodParams) => void;
  loading?: boolean;
  variant?: "default" | "toolbar";
}

function parseDateInput(value: string): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined;
  }
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateInputString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatPickerLabel(value: string): string {
  const date = parseDateInput(value);
  if (!date) {
    return "Choisir une date";
  }
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface DatePickerFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

function DatePickerField({
  label,
  value,
  onChange,
  disabled = false,
  minDate,
  maxDate,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = parseDateInput(value);

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
        {label}
      </p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "flex h-11 w-full min-w-[180px] items-center justify-between gap-2 rounded-lg border border-[#3B3754] bg-[#181721] px-4 text-left text-sm text-white transition-colors",
              "hover:border-[#4A4568] hover:bg-[#26233A]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A9F5E5]/30",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            <span className="truncate font-medium">
              {formatPickerLabel(value)}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-white/40" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-auto border-[#3B3754] bg-[#1F1D2B] p-0 text-white shadow-2xl"
        >
          <Calendar
            mode="single"
            locale={fr}
            selected={selected}
            onSelect={(date) => {
              if (!date) {
                return;
              }
              onChange(toDateInputString(date));
              setOpen(false);
            }}
            disabled={(date) => {
              if (minDate && date < minDate) {
                return true;
              }
              if (maxDate && date > maxDate) {
                return true;
              }
              return false;
            }}
            defaultMonth={selected}
            className="rounded-xl bg-[#1F1D2B] text-white [--cell-size:2.25rem]"
            classNames={{
              today: "bg-[#302D47] text-white rounded-md",
              selected:
                "bg-[#DA1712] text-white hover:bg-[#DA1712] hover:text-white focus:bg-[#DA1712] focus:text-white rounded-md",
              day: "text-white/90 hover:bg-[#302D47] rounded-md",
              weekday: "text-white/50 text-[0.8rem]",
              caption_label: "text-white font-medium",
              button_previous:
                "text-white hover:bg-[#302D47] border border-[#3B3754]",
              button_next:
                "text-white hover:bg-[#302D47] border border-[#3B3754]",
              outside: "text-white/25",
              disabled: "text-white/20 opacity-50",
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function DashboardPeriodFilter({
  value,
  activePeriod,
  onChange,
  loading = false,
  variant = "default",
}: DashboardPeriodFilterProps) {
  const [draft, setDraft] = useState<DashboardPeriodParams>(value);

  useEffect(() => {
    setDraft({
      startDate: toDateInputValue(value.startDate ?? ""),
      endDate: toDateInputValue(value.endDate ?? ""),
    });
  }, [value.startDate, value.endDate]);

  const applyDraft = () => {
    if (!draft.startDate || !draft.endDate) {
      return;
    }
    onChange({
      startDate: draft.startDate,
      endDate: draft.endDate,
    });
  };

  const startDateObj = parseDateInput(draft.startDate ?? "");
  const endDateObj = parseDateInput(draft.endDate ?? "");

  const resolvedPeriod =
    activePeriod ??
    (value.startDate && value.endDate
      ? { startDate: value.startDate, endDate: value.endDate }
      : undefined);

  if (variant === "toolbar") {
    return (
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-end">
        <DatePickerField
          label="Début"
          value={draft.startDate ?? ""}
          maxDate={endDateObj}
          disabled={loading}
          onChange={(startDate) =>
            setDraft((prev) => ({ ...prev, startDate }))
          }
        />
        <DatePickerField
          label="Fin"
          value={draft.endDate ?? ""}
          minDate={startDateObj}
          disabled={loading}
          onChange={(endDate) =>
            setDraft((prev) => ({ ...prev, endDate }))
          }
        />
        <Button
          type="button"
          onClick={applyDraft}
          disabled={loading || !draft.startDate || !draft.endDate}
          className="h-11 w-full shrink-0 rounded-lg bg-[#DA1712] px-6 text-sm font-medium text-white hover:bg-[#b9130f] sm:w-auto"
        >
          Appliquer
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#3B3754] bg-[#1F1D2B] p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-white/40">
            Période d&apos;analyse
          </p>
          <p className="text-base font-medium text-white">
            {formatDashboardPeriodLabel(resolvedPeriod)}
          </p>
          <p className="text-xs text-white/40">
            Filtrez les KPIs et graphiques sur l&apos;intervalle choisi.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-end">
          <DatePickerField
            label="Début"
            value={draft.startDate ?? ""}
            maxDate={endDateObj}
            disabled={loading}
            onChange={(startDate) =>
              setDraft((prev) => ({ ...prev, startDate }))
            }
          />

          <div className="hidden h-11 shrink-0 items-center justify-center pb-0.5 sm:flex">
            <ChevronRight className="h-4 w-4 text-white/30" />
          </div>

          <DatePickerField
            label="Fin"
            value={draft.endDate ?? ""}
            minDate={startDateObj}
            disabled={loading}
            onChange={(endDate) =>
              setDraft((prev) => ({ ...prev, endDate }))
            }
          />

          <Button
            type="button"
            onClick={applyDraft}
            disabled={loading || !draft.startDate || !draft.endDate}
            className="h-11 shrink-0 rounded-lg bg-[#DA1712] px-6 text-white hover:bg-[#b9130f]"
          >
            Appliquer
          </Button>

          {/* Année en cours — retiré : le filtre par dates suffit */}
        </div>
      </div>
    </div>
  );
}
