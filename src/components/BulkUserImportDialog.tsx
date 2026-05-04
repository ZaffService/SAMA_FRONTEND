"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, UploadCloud } from "lucide-react";
import {
  UserApi,
  type ImportUsersResponse,
} from "@/infrastructure/api/user-api";
import logger from "@/shared/helpers/logger";

const MAX_IMPORT_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".csv"];
const ALLOWED_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/csv",
  "text/plain",
]);

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

const isValidImportFile = (file: File): boolean => {
  const lowerName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) =>
    lowerName.endsWith(ext),
  );
  const hasValidMime = file.type ? ALLOWED_MIME_TYPES.has(file.type) : false;
  return hasValidExtension || hasValidMime;
};

const normalizeCellValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toString();
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value instanceof Date) return value.toLocaleDateString("fr-FR");
  return String(value);
};

export interface BulkUserImportDialogProps {
  onImportSuccess?: (result: ImportUsersResponse) => void;
}

export function BulkUserImportDialog({
  onImportSuccess,
}: BulkUserImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportUsersResponse | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setFileError(null);
    setSubmitError(null);
    setResult(null);
    setIsImporting(false);
    setIsPreviewLoading(false);
    setPreviewError(null);
    setPreviewHeaders([]);
    setPreviewRows([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setSubmitError(null);
    setResult(null);
    setPreviewError(null);
    setPreviewHeaders([]);
    setPreviewRows([]);

    if (!isValidImportFile(selectedFile)) {
      setFile(null);
      setFileError(
        "Type de fichier non autorisé. Utilisez un fichier Excel (.xlsx, .xls) ou CSV.",
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    if (selectedFile.size > MAX_IMPORT_SIZE_BYTES) {
      setFile(null);
      setFileError("Fichier trop volumineux (max 10MB).");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setFile(selectedFile);
    setFileError(null);
    setIsPreviewLoading(true);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const buffer = reader.result;
        if (!(buffer instanceof ArrayBuffer)) {
          throw new Error("Impossible de lire le fichier.");
        }

        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        if (!firstSheet) {
          throw new Error("Aucune feuille trouvée dans le fichier.");
        }

        const rows = XLSX.utils.sheet_to_json(firstSheet, {
          header: 1,
          blankrows: false,
          defval: "",
        }) as Array<Array<unknown>>;

        if (!rows.length) {
          throw new Error("Aucune donnée trouvée dans le fichier.");
        }

        const [rawHeaders, ...rawRows] = rows;
        const headers = rawHeaders.map((header, index) => {
          const value = normalizeCellValue(header).trim();
          return value || `Colonne ${index + 1}`;
        });

        const preview = rawRows.slice(0, 10).map((row) =>
          headers.map((_, index) => normalizeCellValue(row?.[index])),
        );

        setPreviewHeaders(headers);
        setPreviewRows(preview);
        setPreviewError(null);
      } catch (error) {
        logger.error("❌ Prévisualisation import: erreur", error);
        setPreviewError(
          error instanceof Error
            ? error.message
            : "Impossible de prévisualiser le fichier.",
        );
      } finally {
        setIsPreviewLoading(false);
      }
    };

    reader.onerror = () => {
      setIsPreviewLoading(false);
      setPreviewError("Impossible de lire le fichier.");
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const handleClearFile = () => {
    setFile(null);
    setFileError(null);
    setResult(null);
    setPreviewHeaders([]);
    setPreviewRows([]);
    setPreviewError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!file) {
      setFileError("Veuillez sélectionner un fichier à importer.");
      return;
    }

    setIsImporting(true);
    setSubmitError(null);
    setResult(null);

    try {
      const response = await UserApi.importUsers(file);
      setResult(response);

      if (response.imported > 0) {
        onImportSuccess?.(response);
      }
    } catch (error) {
      logger.error("❌ Import utilisateurs: erreur", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Erreur inconnue lors de l'import.",
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#302D47] bg-[#1F1D2B] p-5 text-white shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">
          Importation massive d&apos;utilisateurs
        </h2>
        <p className="mt-1 text-sm text-white/70">
          Importez un fichier Excel (.xlsx, .xls) ou CSV pour créer plusieurs
          utilisateurs en une seule opération.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <div className="rounded-lg border border-dashed border-[#3B3754] bg-[#26233A]/45 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="text-sm font-semibold text-white" htmlFor="file">
                Fichier à importer
              </label>
            </div>
            <div className="mt-2 space-y-2">
              <Input
                id="file"
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                disabled={isImporting}
                className="sr-only"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="flex w-full items-center justify-between gap-3 rounded-md border border-dashed border-[#3B3754] bg-[#1F1D2B] px-4 py-3 text-left text-sm text-white/80 transition hover:border-[#80B5FF] hover:bg-[#26233A] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2A365F] text-[#80B5FF]">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      {file ? "Changer le fichier" : "Choisir un fichier"}
                    </p>
                    <p className="text-xs text-white/60">
                      {file
                        ? file.name
                        : "Cliquez pour sélectionner un fichier .xlsx, .xls ou .csv"}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#80B5FF]">
                  Parcourir
                </span>
              </button>
              <p className="text-xs text-white/60">
                Taille max : 10MB. Formats acceptés : .xlsx, .xls, .csv
              </p>
              <p className="text-xs text-white/60">
                Colonnes obligatoires : email, prenom, nom. Optionnelles :
                telephone, role, password.
              </p>
              {file && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
                  <span className="font-semibold text-white">{file.name}</span>
                  <span>• {formatFileSize(file.size)}</span>
                  <button
                    type="button"
                    onClick={handleClearFile}
                    className="text-[#80B5FF] hover:text-[#A9CCFF]"
                  >
                    Retirer le fichier
                  </button>
                </div>
              )}
              {fileError && (
                <p className="text-xs text-red-600">{fileError}</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-[#302D47] bg-[#1F1D2B] p-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-white">
                Prévisualisation des 10 premières lignes
              </p>
              <p className="text-xs text-white/60">
                Vérifiez rapidement les colonnes avant l&apos;import.
              </p>
            </div>
            <div className="mt-3">
              {isPreviewLoading && (
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Prévisualisation en cours...
                </div>
              )}
              {!isPreviewLoading && previewError && (
                <p className="text-xs text-red-600">{previewError}</p>
              )}
              {!isPreviewLoading &&
                !previewError &&
                previewHeaders.length === 0 && (
                  <p className="text-xs text-white/60">
                    Sélectionnez un fichier pour afficher l&apos;aperçu.
                  </p>
                )}
              {!isPreviewLoading &&
                !previewError &&
                previewHeaders.length > 0 && (
                  <div className="max-h-64 overflow-auto">
                    <table className="min-w-full text-left text-xs text-white/80">
                      <thead className="bg-[#26233A] text-[11px] uppercase text-white/65">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Ligne</th>
                          {previewHeaders.map((header, index) => (
                            <th key={`${header}-${index}`} className="px-3 py-2 font-semibold">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2F2B45]">
                        {previewRows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={previewHeaders.length + 1}
                              className="px-3 py-3 text-center text-xs text-white/60"
                            >
                              Aucune ligne détectée.
                            </td>
                          </tr>
                        ) : (
                          previewRows.map((row, rowIndex) => (
                            <tr key={`preview-row-${rowIndex}`} className="hover:bg-[#26233A]/60">
                              <td className="px-3 py-2 text-white/60">
                                {rowIndex + 2}
                              </td>
                              {previewHeaders.map((_, colIndex) => (
                                <td
                                  key={`preview-cell-${rowIndex}-${colIndex}`}
                                  className="px-3 py-2"
                                >
                                  {row[colIndex] || "-"}
                                </td>
                              ))}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
          </div>

          {submitError && (
            <div className="rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-300">
              {submitError}
            </div>
          )}

          {result && (
            <div
              className={`rounded-lg border p-4 text-sm ${
                result.failed > 0
                  ? "border-amber-500/40 bg-amber-950/30"
                  : "border-emerald-500/40 bg-emerald-950/30"
              }`}
            >
              <p className="font-semibold text-white">{result.message}</p>
              <div className="mt-3 grid gap-2 text-xs text-white/80 sm:grid-cols-2">
                <div>
                  Total traité :{" "}
                  <span className="font-semibold">{result.totalProcessed}</span>
                </div>
                <div>
                  Importés :{" "}
                  <span className="font-semibold">{result.imported}</span>
                </div>
                <div>
                  Déjà existants :{" "}
                  <span className="font-semibold">{result.alreadyExists}</span>
                </div>
                <div>
                  Échecs : <span className="font-semibold">{result.failed}</span>
                </div>
              </div>

              {result.errors?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-red-300">
                    Erreurs détectées
                  </p>
                  <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs text-red-300">
                    {result.errors.map((err, index) => (
                      <li key={`${err.line}-${index}`}>
                        Ligne {err.line}: {err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.existingUsers?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-white/80">
                    Utilisateurs déjà existants
                  </p>
                  <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs text-white/70">
                    {result.existingUsers.map((user, index) => (
                      <li key={`${user.email}-${index}`}>
                        {user.prenom} {user.nom} ({user.email})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={resetState}
            disabled={isImporting}
            className="border-[#3B3754] bg-[#1F1D2B] text-white hover:bg-[#26233A] hover:text-white"
          >
            Réinitialiser
          </Button>
          <Button
            type="submit"
            disabled={!file || isImporting}
            className="bg-[#80B5FF] text-[#0E1B46] hover:bg-[#A9CCFF]"
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Import en cours...
              </>
            ) : (
              "Importer"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
