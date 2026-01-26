import { useState, useCallback, useRef, useEffect } from 'react';
import { FileUploadService, UploadStatus, UploadProgress, UploadResult, UploadOptions } from '@/services/fileUploadService';

export interface FileUploadState {
  status: UploadStatus;
  progress: UploadProgress | null;
  result: UploadResult | null;
  retryCount: number;
  maxRetries: number;
}

export interface UseFileUploadOptions extends Omit<UploadOptions, 'onProgress' | 'onStatusChange'> {
  autoStart?: boolean;
  validateFile?: boolean;
  maxFileSizeMB?: number;
  allowedFileTypes?: string[];
}

export interface UseFileUploadReturn {
  uploadState: FileUploadState;
  upload: (file: File, endpoint: string) => Promise<UploadResult>;
  retry: () => Promise<UploadResult>;
  cancel: () => void;
  reset: () => void;
  isUploading: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  isCancelled: boolean;
}

const initialState: FileUploadState = {
  status: UploadStatus.PENDING,
  progress: null,
  result: null,
  retryCount: 0,
  maxRetries: FileUploadService['DEFAULT_MAX_RETRIES'],
};

export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const {
    autoStart = true,
    validateFile = true,
    maxFileSizeMB = 100,
    allowedFileTypes = ['video/*'],
    maxRetries = FileUploadService['DEFAULT_MAX_RETRIES'],
    retryDelay,
    timeout,
  } = options;

  const [uploadState, setUploadState] = useState<FileUploadState>({
    ...initialState,
    maxRetries,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const currentFileRef = useRef<File | null>(null);
  const currentEndpointRef = useRef<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const updateState = useCallback((updates: Partial<FileUploadState>) => {
    setUploadState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleProgress = useCallback((progress: UploadProgress) => {
    updateState({ progress });
  }, [updateState]);

  const handleStatusChange = useCallback((status: UploadStatus) => {
    updateState({ status });
  }, [updateState]);

  const validateFileBeforeUpload = useCallback((file: File): { valid: boolean; error?: string } => {
    if (!validateFile) return { valid: true };

    // Validation de taille
    const sizeValidation = FileUploadService.validateFileSize(file, maxFileSizeMB);
    if (!sizeValidation.valid) return sizeValidation;

    // Validation de type
    const typeValidation = FileUploadService.validateFileType(file, allowedFileTypes);
    if (!typeValidation.valid) return typeValidation;

    return { valid: true };
  }, [validateFile, maxFileSizeMB, allowedFileTypes]);

  const performUpload = useCallback(async (
    file: File,
    endpoint: string,
    isRetry = false
  ): Promise<UploadResult> => {
    // Validation du fichier
    const validation = validateFileBeforeUpload(file);
    if (!validation.valid) {
      const result: UploadResult = {
        success: false,
        error: validation.error,
      };
      updateState({
        status: UploadStatus.FAILED,
        result,
      });
      return result;
    }

    // Créer un nouvel AbortController pour cette tentative
    abortControllerRef.current = new AbortController();

    // Reset progress for new upload
    if (!isRetry) {
      updateState({
        status: UploadStatus.PENDING,
        progress: null,
        result: null,
        retryCount: 0,
      });
    }

    try {
      const result = await FileUploadService.uploadFile(file, endpoint, {
        maxRetries,
        retryDelay,
        timeout,
        onProgress: handleProgress,
        onStatusChange: handleStatusChange,
        signal: abortControllerRef.current.signal,
      });

      updateState({ result });
      return result;
    } catch (error) {
      const errorResult: UploadResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };

      updateState({
        status: UploadStatus.FAILED,
        result: errorResult,
      });

      return errorResult;
    }
  }, [maxRetries, retryDelay, timeout, validateFileBeforeUpload, handleProgress, handleStatusChange, updateState]);

  const upload = useCallback(async (file: File, endpoint: string): Promise<UploadResult> => {
    currentFileRef.current = file;
    currentEndpointRef.current = endpoint;

    if (autoStart) {
      return performUpload(file, endpoint);
    } else {
      // Just set the file, don't start upload yet
      updateState({ status: UploadStatus.PENDING });
      return { success: true }; // Placeholder result
    }
  }, [autoStart, performUpload, updateState]);

  const retry = useCallback(async (): Promise<UploadResult> => {
    if (!currentFileRef.current || !currentEndpointRef.current) {
      const result: UploadResult = {
        success: false,
        error: 'No file to retry',
      };
      updateState({
        status: UploadStatus.FAILED,
        result,
      });
      return result;
    }

    const newRetryCount = uploadState.retryCount + 1;
    updateState({ retryCount: newRetryCount });

    return performUpload(currentFileRef.current, currentEndpointRef.current, true);
  }, [uploadState.retryCount, performUpload, updateState]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      updateState({ status: UploadStatus.CANCELLED });
    }
  }, [updateState]);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = null;
    currentFileRef.current = null;
    currentEndpointRef.current = null;
    setUploadState({ ...initialState, maxRetries });
  }, [maxRetries]);

  return {
    uploadState,
    upload,
    retry,
    cancel,
    reset,
    isUploading: uploadState.status === UploadStatus.UPLOADING,
    isCompleted: uploadState.status === UploadStatus.COMPLETED,
    isFailed: uploadState.status === UploadStatus.FAILED,
    isCancelled: uploadState.status === UploadStatus.CANCELLED,
  };
}