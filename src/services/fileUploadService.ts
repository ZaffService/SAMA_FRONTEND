import logger from "@/shared/helpers/logger";

export enum UploadStatus {
  PENDING = "PENDING",
  UPLOADING = "UPLOADING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  fileUrl?: string;
  error?: string;
}

export interface UploadOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  onProgress?: (progress: UploadProgress) => void;
  onStatusChange?: (status: UploadStatus) => void;
  signal?: AbortSignal;
}

export class FileUploadService {
  private static readonly DEFAULT_MAX_RETRIES = 3;
  private static readonly DEFAULT_RETRY_DELAY = 1000; // 1s
  private static readonly DEFAULT_TIMEOUT = 600000; // 10 minutes

  /**
   * Upload un fichier avec gestion des retries et progression
   */
  static async uploadFile(
    file: File,
    endpoint: string,
    options: UploadOptions = {},
  ): Promise<UploadResult> {
    const {
      maxRetries = this.DEFAULT_MAX_RETRIES,
      retryDelay = this.DEFAULT_RETRY_DELAY,
      timeout = this.DEFAULT_TIMEOUT,
      onProgress,
      onStatusChange,
      signal,
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        onStatusChange?.(UploadStatus.UPLOADING);

        const result = await this.performUpload(file, endpoint, {
          timeout,
          onProgress,
          signal,
        });

        onStatusChange?.(UploadStatus.COMPLETED);
        return result;
      } catch (error) {
        lastError = error as Error;

        // Si c'est la dernière tentative ou si l'upload a été annulé
        if (attempt === maxRetries || signal?.aborted) {
          onStatusChange?.(UploadStatus.FAILED);
          break;
        }

        // Attendre avant de retry (backoff exponentiel)
        const delay = retryDelay * Math.pow(2, attempt);
        logger.warn(
          `Upload attempt ${attempt + 1} failed, retrying in ${delay}ms:`,
          error,
        );
        await this.delay(delay);
      }
    }

    return {
      success: false,
      error: lastError?.message || "Upload failed after all retries",
    };
  }

  /**
   * Effectue l'upload réel d'un fichier
   */
  private static async performUpload(
    file: File,
    endpoint: string,
    options: {
      timeout: number;
      onProgress?: (progress: UploadProgress) => void;
      signal?: AbortSignal;
    },
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Gestion du timeout
      const timeoutId = setTimeout(() => {
        xhr.abort();
        reject(new Error(`Upload timeout after ${options.timeout}ms`));
      }, options.timeout);

      // Gestion de l'annulation
      if (options.signal) {
        options.signal.addEventListener("abort", () => {
          xhr.abort();
          clearTimeout(timeoutId);
          reject(new Error("Upload cancelled"));
        });
      }

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress: UploadProgress = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          };
          options.onProgress?.(progress);
        }
      });

      xhr.addEventListener("load", () => {
        clearTimeout(timeoutId);

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({
              success: true,
              fileUrl: response.fileUrl || response.url,
            });
          } catch (error) {
            resolve({
              success: true,
              fileUrl: xhr.responseText,
            });
          }
        } else {
          let errorMessage = `Upload failed with status ${xhr.status}`;
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            errorMessage =
              errorResponse.message || errorResponse.error || errorMessage;
          } catch (e) {
            // Ignore parse error
          }
          reject(new Error(errorMessage));
        }
      });

      xhr.addEventListener("error", () => {
        clearTimeout(timeoutId);
        reject(new Error("Network error during upload"));
      });

      xhr.addEventListener("abort", () => {
        clearTimeout(timeoutId);
        reject(new Error("Upload aborted"));
      });

      // Préparer et envoyer la requête
      const formData = new FormData();
      formData.append("file", file);

      xhr.open("POST", endpoint);
      xhr.setRequestHeader("Accept", "application/json");

      // Ajouter les credentials pour l'authentification
      xhr.withCredentials = true;

      xhr.send(formData);
    });
  }

  /**
   * Valide la taille du fichier avant upload
   */
  static validateFileSize(
    file: File,
    maxSizeMB: number = 100,
  ): { valid: boolean; error?: string } {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `Le fichier est trop volumineux. Taille maximum autorisée: ${maxSizeMB}MB`,
      };
    }
    return { valid: true };
  }

  /**
   * Valide le type de fichier
   */
  static validateFileType(
    file: File,
    allowedTypes: string[],
  ): { valid: boolean; error?: string } {
    if (allowedTypes.length === 0) return { valid: true };

    const isValid = allowedTypes.some((type) => {
      if (type.startsWith(".")) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      return file.type === type || file.type.startsWith(type + "/");
    });

    if (!isValid) {
      return {
        valid: false,
        error: `Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(", ")}`,
      };
    }

    return { valid: true };
  }

  /**
   * Utilitaire pour créer un délai
   */
  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
