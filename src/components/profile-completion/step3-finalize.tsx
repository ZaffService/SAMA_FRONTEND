"use client";

import { motion, type Variants } from "framer-motion";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { Info, ShieldCheck, Lock } from "lucide-react";
import {
  DISABILITY_TYPE_LABELS,
  type DisabilityType,
} from "@/infrastructure/api/user-api";
import { staggerItem } from "./animations";

export interface Step3Data {
  disability: boolean;
  consent: boolean;
  disabilityType: DisabilityType | "";
  disabilityDetails: string;
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
      className={[
        "peer inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent p-0.5 outline-none transition-colors duration-200",
        "focus-visible:ring-2 focus-visible:ring-[oklch(0.46_0.24_268)]/30 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked
          ? "bg-gradient-to-r from-[oklch(0.50_0.24_268)] to-[oklch(0.62_0.22_285)]"
          : "bg-slate-200",
      ].join(" ")}
    >
      <SwitchPrimitive.Thumb
        className={[
          "pointer-events-none block h-6 w-6 rounded-full bg-white",
          "shadow-[0_1px_4px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.04)]",
          "transition-transform duration-200 ease-out will-change-transform",
          "data-[state=unchecked]:translate-x-0",
          "data-[state=checked]:translate-x-6",
        ].join(" ")}
      />
    </SwitchPrimitive.Root>
  );
}

export function Step3Finalize({
  data,
  onChange,
  errors,
  disabled,
}: {
  data: Step3Data;
  onChange: (d: Step3Data) => void;
  errors?: { disabilityType?: string; consent?: string };
  disabled?: boolean;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
      className="space-y-6"
    >
      <motion.div variants={staggerItem as Variants}>
        <div className="mb-2 flex items-center gap-2 text-[oklch(0.46_0.24_268)]">
          <Info className="h-5 w-5" />
          <h3 className="text-lg font-bold text-slate-900">Accessibilité</h3>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-slate-900">
              Je suis en situation de handicap
            </div>
            <div className="text-xs text-slate-500">
              Nous adapterons l&apos;expérience à vos besoins.
            </div>
          </div>
          <Toggle
            checked={data.disability}
            onChange={(v) => onChange({ ...data, disability: v })}
            disabled={disabled}
          />
        </div>

        {data.disability && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-3 overflow-hidden"
          >
            <div>
              <label
                htmlFor="disabilityType"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Type de handicap <span className="text-red-500">*</span>
              </label>
              <select
                id="disabilityType"
                value={data.disabilityType}
                disabled={disabled}
                onChange={(e) =>
                  onChange({
                    ...data,
                    disabilityType: e.target.value as DisabilityType,
                  })
                }
                className={[
                  "h-12 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition-colors focus:border-[oklch(0.46_0.24_268)] focus:ring-2 focus:ring-[oklch(0.46_0.24_268)]/20",
                  errors?.disabilityType
                    ? "border-red-400"
                    : "border-slate-200",
                ].join(" ")}
              >
                <option value="">Sélectionnez le type</option>
                {Object.entries(DISABILITY_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {errors?.disabilityType && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.disabilityType}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="disabilityDetails"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Détails supplémentaires (optionnel)
              </label>
              <textarea
                id="disabilityDetails"
                value={data.disabilityDetails}
                disabled={disabled}
                onChange={(e) =>
                  onChange({ ...data, disabilityDetails: e.target.value })
                }
                placeholder="Précisez si besoin..."
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-[oklch(0.46_0.24_268)] focus:ring-2 focus:ring-[oklch(0.46_0.24_268)]/20"
              />
            </div>
          </motion.div>
        )}
      </motion.div>

      <motion.div variants={staggerItem as Variants}>
        <div className="mb-2 flex items-center gap-2 text-[oklch(0.46_0.24_268)]">
          <ShieldCheck className="h-5 w-5" />
          <h3 className="text-lg font-bold text-slate-900">Consentement</h3>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange({ ...data, consent: !data.consent })}
          className={[
            "relative flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all disabled:opacity-60",
            data.consent
              ? "border-[oklch(0.46_0.24_268)] bg-[oklch(0.96_0.03_265)]"
              : errors?.consent
                ? "border-red-400 bg-white"
                : "border-slate-200 bg-white hover:border-slate-300",
          ].join(" ")}
        >
          <div
            className={[
              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
              data.consent
                ? "border-[oklch(0.46_0.24_268)] bg-[oklch(0.46_0.24_268)]"
                : "border-slate-300 bg-white",
            ].join(" ")}
          >
            {data.consent && (
              <motion.svg
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="h-3.5 w-3.5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path d="M5 13l4 4L19 7" />
              </motion.svg>
            )}
          </div>
          <span className="text-sm leading-relaxed text-slate-700">
            J&apos;accepte que mes données soient utilisées pour améliorer mon
            expérience sur la plateforme. Je peux retirer mon consentement à
            tout moment.
          </span>
        </button>
        {errors?.consent && (
          <p className="mt-2 text-xs text-red-600">{errors.consent}</p>
        )}

        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[oklch(0.96_0.03_265)] px-3 py-1.5 text-xs font-semibold text-[oklch(0.46_0.24_268)]">
          <Lock className="h-3.5 w-3.5" />
          Vos données sont protégées
        </div>
      </motion.div>
    </motion.div>
  );
}
