"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Loader2, UploadCloud } from "lucide-react";
import Swal from "sweetalert2";
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

const createUserImportTemplate = (): void => {
  const templateData = [
    {
      email: "exemple@email.com",
      prenom: "Prénom",
      nom: "Nom",
      telephone: "+221771234567",
      role: "STUDENT",
      password: "",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Utilisateurs");

  worksheet["!cols"] = [
    { wch: 30 },
    { wch: 15 },
    { wch: 15 },
    { wch: 20 },
    { wch: 12 },
    { wch: 15 },
  ];

  XLSX.writeFile(workbook, "template_import_utilisateurs.xlsx");
};

export interface BulkUserImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess?: (result: ImportUsersResponse) => void;
}

export function BulkUserImportDialog({
  open,
  onOpenChange,
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

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetState();
    }
    onOpenChange(nextOpen);
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

      const swalTarget = document.getElementById("bulk-user-import-dialog");

      if (response.failed > 0) {
        await Swal.fire({
          icon: "warning",
          title: "Import terminé avec avertissements",
          text: response.message,
          confirmButtonText: "OK",
          confirmButtonColor: "#002c75",
          showCloseButton: true,
          heightAuto: false,
          target: swalTarget ?? undefined,
        });
      } else if (response.imported > 0) {
        await Swal.fire({
          icon: "success",
          title: "Import réussi",
          text: response.message,
          confirmButtonText: "OK",
          confirmButtonColor: "#002c75",
          showCloseButton: true,
          heightAuto: false,
          target: swalTarget ?? undefined,
        });
      } else {
        await Swal.fire({
          icon: "info",
          title: "Import terminé",
          text: response.message,
          confirmButtonText: "OK",
          confirmButtonColor: "#002c75",
          showCloseButton: true,
          heightAuto: false,
          target: swalTarget ?? undefined,
        });
      }

      if (response.imported > 0) {
        onImportSuccess?.(response);
      }
    } catch (error) {
      logger.error("❌ Import utilisateurs: erreur", error);
      const swalTarget = document.getElementById("bulk-user-import-dialog");
      await Swal.fire({
        icon: "error",
        title: "Erreur d'import",
        text:
          error instanceof Error
            ? error.message
            : "Erreur inconnue lors de l'import.",
        confirmButtonText: "OK",
        confirmButtonColor: "#002c75",
        showCloseButton: true,
        heightAuto: false,
        target: swalTarget ?? undefined,
      });
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        id="bulk-user-import-dialog"
        className="sm:max-w-2xl max-h-[90vh] overflow-hidden"
      >
        <DialogHeader>
          <DialogTitle>Importation massive d&apos;utilisateurs</DialogTitle>
          <DialogDescription>
            Importez un fichier Excel (.xlsx, .xls) ou CSV pour créer plusieurs
            utilisateurs en une seule opération.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4 max-h-[62vh] overflow-y-auto pr-2">
            <div className="rounded-lg border border-dashed border-gray-200 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="text-sm font-semibold text-gray-900" htmlFor="file">
                Fichier à importer
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={createUserImportTemplate}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Télécharger le template
              </Button>
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
                className="flex w-full items-center justify-between gap-3 rounded-md border border-dashed border-gray-300 bg-white px-4 py-3 text-left text-sm text-gray-700 transition hover:border-[#002c75] hover:bg-[#EEF4FF] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF4FF] text-[#002c75]">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {file ? "Changer le fichier" : "Choisir un fichier"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {file
                        ? file.name
                        : "Cliquez pour sélectionner un fichier .xlsx, .xls ou .csv"}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#002c75]">
                  Parcourir
                </span>
              </button>
              <p className="text-xs text-gray-500">
                Taille max : 10MB. Formats acceptés : .xlsx, .xls, .csv
              </p>
              <p className="text-xs text-gray-500">
                Colonnes obligatoires : email, prenom, nom. Optionnelles :
                telephone, role, password.
              </p>
              {file && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                  <span className="font-semibold text-gray-800">{file.name}</span>
                  <span>• {formatFileSize(file.size)}</span>
                  <button
                    type="button"
                    onClick={handleClearFile}
                    className="text-[#002c75] hover:text-[#001f54]"
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

            <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-gray-900">
                Prévisualisation des 10 premières lignes
              </p>
              <p className="text-xs text-gray-500">
                Vérifiez rapidement les colonnes avant l&apos;import.
              </p>
            </div>
            <div className="mt-3">
              {isPreviewLoading && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
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
                  <p className="text-xs text-gray-500">
                    Sélectionnez un fichier pour afficher l&apos;aperçu.
                  </p>
                )}
              {!isPreviewLoading &&
                !previewError &&
                previewHeaders.length > 0 && (
                  <div className="max-h-64 overflow-auto">
                    <table className="min-w-full text-left text-xs text-gray-700">
                      <thead className="bg-gray-50 text-[11px] uppercase text-gray-500">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Ligne</th>
                          {previewHeaders.map((header, index) => (
                            <th key={`${header}-${index}`} className="px-3 py-2 font-semibold">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {previewRows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={previewHeaders.length + 1}
                              className="px-3 py-3 text-center text-xs text-gray-500"
                            >
                              Aucune ligne détectée.
                            </td>
                          </tr>
                        ) : (
                          previewRows.map((row, rowIndex) => (
                            <tr key={`preview-row-${rowIndex}`}>
                              <td className="px-3 py-2 text-gray-500">
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
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {submitError}
            </div>
            )}

            {result && (
            <div
              className={`rounded-lg border p-4 text-sm ${
                result.failed > 0
                  ? "border-yellow-200 bg-yellow-50"
                  : "border-green-200 bg-green-50"
              }`}
            >
              <p className="font-semibold text-gray-900">{result.message}</p>
              <div className="mt-3 grid gap-2 text-xs text-gray-700 sm:grid-cols-2">
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
                  <p className="text-xs font-semibold text-red-700">
                    Erreurs détectées
                  </p>
                  <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs text-red-700">
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
                  <p className="text-xs font-semibold text-gray-700">
                    Utilisateurs déjà existants
                  </p>
                  <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs text-gray-700">
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isImporting}
            >
              Fermer
            </Button>
            <Button type="submit" disabled={!file || isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Import en cours...
                </>
              ) : (
                "Importer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
