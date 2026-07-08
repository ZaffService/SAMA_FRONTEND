"use client";

import { motion } from "framer-motion";
import { MapPin, Building2, TreePine } from "lucide-react";
import {
  REGION_LABELS,
  RESIDENCE_LABELS,
  SEXE_LABELS,
  type RegionType,
  type ResidenceType,
  type SexeType,
} from "@/infrastructure/api/user-api";
import { COUNTRIES } from "@/lib/countries";
import { staggerItem, staggerContainer } from "./animations";

export interface Step2Data {
  sexe: SexeType | "";
  region: RegionType | "";
  residenceType: ResidenceType | "";
  indicatif: string;
  telephone: string;
}

interface Step2LocationProps {
  data: Step2Data;
  onChange: (d: Step2Data) => void;
  originalPhone?: string;
  phonePlaceholder: string;
  errors?: Partial<Record<keyof Step2Data, string>>;
  disabled?: boolean;
}

const RESIDENCE_ICONS = {
  URBAN: Building2,
  RURAL: TreePine,
} as const;

export function Step2Location({
  data,
  onChange,
  originalPhone,
  phonePlaceholder,
  errors,
  disabled,
}: Step2LocationProps) {
  const set = <K extends keyof Step2Data>(field: K, value: Step2Data[K]) =>
    onChange({ ...data, [field]: value });

  const selectedCountry = COUNTRIES.find((c) => c.indicatif === data.indicatif);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={staggerContainer}
      className="space-y-5"
    >
      <motion.div variants={staggerItem} className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-[oklch(0.46_0.24_268)]" />
        <h3 className="text-lg font-bold text-slate-900">
          Localisation &amp; contact
        </h3>
      </motion.div>

      <motion.div
        variants={staggerItem}
        className="grid gap-4 sm:grid-cols-2"
      >
        <div>
          <label
            htmlFor="sexe"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Genre
          </label>
          <select
            id="sexe"
            value={data.sexe}
            disabled={disabled}
            onChange={(e) => set("sexe", e.target.value as SexeType)}
            className={[
              "h-12 w-full rounded-xl border bg-white px-4 text-sm outline-none transition-colors focus:border-[oklch(0.46_0.24_268)] focus:ring-2 focus:ring-[oklch(0.46_0.24_268)]/20",
              errors?.sexe ? "border-red-400" : "border-slate-200",
            ].join(" ")}
          >
            <option value="">Sélectionnez...</option>
            {Object.entries(SEXE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors?.sexe && (
            <p className="mt-1 text-xs text-red-600">{errors.sexe}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="region"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Région
          </label>
          <select
            id="region"
            value={data.region}
            disabled={disabled}
            onChange={(e) => set("region", e.target.value as RegionType)}
            className={[
              "h-12 w-full rounded-xl border bg-white px-4 text-sm outline-none transition-colors focus:border-[oklch(0.46_0.24_268)] focus:ring-2 focus:ring-[oklch(0.46_0.24_268)]/20",
              errors?.region ? "border-red-400" : "border-slate-200",
            ].join(" ")}
          >
            <option value="">Sélectionnez votre région</option>
            {Object.entries(REGION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors?.region && (
            <p className="mt-1 text-xs text-red-600">{errors.region}</p>
          )}
        </div>
      </motion.div>

      <motion.div variants={staggerItem}>
        <p className="mb-2 text-sm font-medium text-slate-700">
          Type de résidence
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(RESIDENCE_LABELS) as [ResidenceType, string][]).map(
            ([value, label]) => {
              const Icon = RESIDENCE_ICONS[value];
              const selected = data.residenceType === value;
              return (
                <motion.button
                  key={value}
                  type="button"
                  disabled={disabled}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => set("residenceType", value)}
                  className={[
                    "flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all",
                    selected
                      ? "border-[oklch(0.46_0.24_268)] bg-[oklch(0.96_0.03_265)] shadow-sm"
                      : errors?.residenceType
                        ? "border-red-400 bg-white"
                        : "border-slate-200 bg-white hover:border-slate-300",
                  ].join(" ")}
                >
                  <Icon
                    className={[
                      "h-5 w-5",
                      selected
                        ? "text-[oklch(0.46_0.24_268)]"
                        : "text-slate-400",
                    ].join(" ")}
                  />
                  <span className="text-sm font-semibold text-slate-900">
                    {label}
                  </span>
                  <span className="text-xs text-slate-500">
                    {value === "URBAN"
                      ? "Zone urbaine ou périurbaine"
                      : "Zone rurale ou village"}
                  </span>
                </motion.button>
              );
            },
          )}
        </div>
        {errors?.residenceType && (
          <p className="mt-1 text-xs text-red-600">{errors.residenceType}</p>
        )}
      </motion.div>

      <motion.div variants={staggerItem}>
        <label
          htmlFor="phone"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Téléphone
        </label>
        {originalPhone ? (
          <div className="flex gap-2">
            <div className="flex h-12 w-28 shrink-0 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-600">
              <span>{selectedCountry?.flag}</span>
              <span>{data.indicatif}</span>
            </div>
            <input
              id="phone"
              type="tel"
              readOnly
              value={`${data.indicatif} ${data.telephone}`}
              className="h-12 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-600"
            />
          </div>
        ) : (
          <div className="flex gap-2">
            <select
              value={data.indicatif}
              disabled={disabled}
              onChange={(e) => {
                set("indicatif", e.target.value);
                set("telephone", "");
              }}
              className="h-12 w-28 shrink-0 rounded-xl border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[oklch(0.46_0.24_268)]"
            >
              {COUNTRIES.map((country) => (
                <option key={country.indicatif} value={country.indicatif}>
                  {country.flag} {country.indicatif}
                </option>
              ))}
            </select>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              placeholder={phonePlaceholder}
              value={data.telephone}
              disabled={disabled}
              maxLength={selectedCountry?.localLength || 15}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                const max = selectedCountry?.localLength || 15;
                if (value.length <= max) set("telephone", value);
              }}
              className={[
                "h-12 flex-1 rounded-xl border bg-white px-4 text-sm outline-none transition-colors focus:border-[oklch(0.46_0.24_268)] focus:ring-2 focus:ring-[oklch(0.46_0.24_268)]/20",
                errors?.telephone
                  ? "border-red-400"
                  : "border-slate-200",
              ].join(" ")}
            />
          </div>
        )}
        {originalPhone && (
          <p className="mt-1 text-xs text-slate-500">
            Votre numéro est déjà enregistré
          </p>
        )}
        {errors?.telephone && (
          <p className="mt-1 text-xs text-red-600">{errors.telephone}</p>
        )}
      </motion.div>
    </motion.div>
  );
}
