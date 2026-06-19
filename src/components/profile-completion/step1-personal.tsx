"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import type { ProfileMetadataItem } from "@/infrastructure/api/user-api";
import { staggerItem, staggerContainer } from "./animations";

export interface Step1Data {
  ageRange: string;
  currentStatus: string;
  referralSource: string;
}

interface Step1PersonalProps {
  data: Step1Data;
  onChange: (d: Step1Data) => void;
  ageRangeOptions: ProfileMetadataItem[];
  currentStatusOptions: ProfileMetadataItem[];
  referralSourceOptions: ProfileMetadataItem[];
  errors?: Partial<Record<keyof Step1Data, string>>;
  disabled?: boolean;
  metadataReady?: boolean;
}

function FieldSelect({
  id,
  label,
  value,
  options,
  placeholder,
  error,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: ProfileMetadataItem[];
  placeholder: string;
  error?: string;
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={[
          "h-12 w-full appearance-none rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition-colors focus:border-[oklch(0.46_0.24_268)] focus:ring-2 focus:ring-[oklch(0.46_0.24_268)]/20",
          error ? "border-red-400" : "border-slate-200",
        ].join(" ")}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Step1Personal({
  data,
  onChange,
  ageRangeOptions,
  currentStatusOptions,
  referralSourceOptions,
  errors,
  disabled,
  metadataReady,
}: Step1PersonalProps) {
  const set = (field: keyof Step1Data, value: string) =>
    onChange({ ...data, [field]: value });

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={staggerContainer}
      className="space-y-5"
    >
      <motion.div variants={staggerItem} className="flex items-center gap-2">
        <Heart className="h-5 w-5 text-[oklch(0.46_0.24_268)]" />
        <h3 className="text-lg font-bold text-slate-900">
          Préférences personnelles
        </h3>
      </motion.div>

      <motion.div
        variants={staggerItem}
        className="grid gap-4 sm:grid-cols-2"
      >
        <FieldSelect
          id="ageRange"
          label="Tranche d'âge"
          value={data.ageRange}
          options={ageRangeOptions}
          placeholder="Sélectionnez..."
          error={errors?.ageRange}
          disabled={disabled || !metadataReady}
          onChange={(v) => set("ageRange", v)}
        />
        <FieldSelect
          id="currentStatus"
          label="Statut actuel"
          value={data.currentStatus}
          options={currentStatusOptions}
          placeholder="Sélectionnez..."
          error={errors?.currentStatus}
          disabled={disabled || !metadataReady}
          onChange={(v) => set("currentStatus", v)}
        />
      </motion.div>

      <motion.div variants={staggerItem}>
        <FieldSelect
          id="referralSource"
          label="Comment nous avez-vous connus ?"
          value={data.referralSource}
          options={referralSourceOptions}
          placeholder="Sélectionnez..."
          error={errors?.referralSource}
          disabled={disabled || !metadataReady}
          onChange={(v) => set("referralSource", v)}
        />
      </motion.div>
    </motion.div>
  );
}
