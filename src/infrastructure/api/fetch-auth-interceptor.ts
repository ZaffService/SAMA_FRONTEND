"use client";

import logger from "@/shared/helpers/logger";
import { API_BASE_URL, API_ENDPOINTS, buildApiUrl } from "./baseConfig";
import {
  getAuthClientStatus,
  setAuthClientStatus,
} from "@/infrastructure/storage/auth-client-state";
import { BUSINESS_401_ERROR_CODES } from "@/lib/profile-form-errors";

const REFRESH_TOKEN_ENDPOINT = buildApiUrl("/user/refresh-token");
const INTERCEPTOR_FLAG = "__SAMA_AUTH_FETCH_INTERCEPTOR_INSTALLED__";

const EXCLUDED_AUTH_PATHS = new Set<string>([
  API_ENDPOINTS.USER.LOGIN,
  API_ENDPOINTS.USER.LOGOUT,
  "/user/refresh-token",
  API_ENDPOINTS.USER.CREATE_ACCOUNT,
  API_ENDPOINTS.USER.REQUEST_PASSWORD_RESET,
  API_ENDPOINTS.USER.RESET_PASSWORD,
  API_ENDPOINTS.USER.VERIFY_EMAIL,
  API_ENDPOINTS.AUTH.GOOGLE,
]);

let refreshPromise: Promise<boolean> | null = null;

function toAbsoluteUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return new URL(input, window.location.origin).toString();
  }
  if (input instanceof URL) {
    return input.toString();
  }
  return input.url;
}

function isBackendApiRequest(url: string): boolean {
  return url.startsWith(API_BASE_URL);
}

function isExcludedPath(url: string): boolean {
  const pathname = new URL(url).pathname;

  for (const excludedPath of EXCLUDED_AUTH_PATHS) {
    if (pathname === excludedPath || pathname.endsWith(excludedPath)) {
      return true;
    }
  }

  return false;
}

async function refreshToken(
  originalFetch: typeof window.fetch,
): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await originalFetch(REFRESH_TOKEN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      return response.ok;
    } catch (error) {
      logger.error(
        "❌ [fetch-auth-interceptor] Erreur pendant le refresh token:",
        error,
      );
      return false;
    }
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

function notifySessionExpired(requestUrl: string) {
  window.dispatchEvent(
    new CustomEvent("auth:session-expired", {
      detail: { requestUrl },
    }),
  );
}

function getEffectiveCredentials(
  input: RequestInfo | URL,
  init?: RequestInit,
): RequestCredentials | undefined {
  if (init?.credentials) {
    return init.credentials;
  }

  if (input instanceof Request) {
    return input.credentials;
  }

  return undefined;
}

function requestCanUseAuthCookies(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  requestUrl: string,
): boolean {
  const credentials = getEffectiveCredentials(input, init);

  if (credentials === "include") {
    return true;
  }

  if (credentials === "omit") {
    return false;
  }

  // Default fetch behavior (same-origin) still sends cookies for same-origin requests.
  const requestOrigin = new URL(requestUrl).origin;
  return requestOrigin === window.location.origin;
}

function emitSessionExpiredOnce(requestUrl: string): void {
  if (getAuthClientStatus() === "anonymous") {
    return;
  }

  setAuthClientStatus("anonymous");
  notifySessionExpired(requestUrl);
}

async function isBusiness401Response(response: Response): Promise<boolean> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return false;
  }

  try {
    const data = await response.clone().json();
    const code = data?.error?.code ?? data?.errorCode;
    return typeof code === "string" && BUSINESS_401_ERROR_CODES.has(code);
  } catch {
    return false;
  }
}

export function setupAuthFetchInterceptor(): void {
  if (typeof window === "undefined") {
    return;
  }

  const windowWithFlag = window as typeof window & {
    [INTERCEPTOR_FLAG]?: boolean;
  };

  if (windowWithFlag[INTERCEPTOR_FLAG]) {
    return;
  }

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const response = await originalFetch(input, init);

    if (response.status !== 401) {
      return response;
    }

    const requestUrl = toAbsoluteUrl(input);

    if (!isBackendApiRequest(requestUrl) || isExcludedPath(requestUrl)) {
      return response;
    }

    // Erreurs métier (ex. TELEPHONE_ALREADY_EXIST) renvoyées en 401 : ne pas déconnecter.
    if (await isBusiness401Response(response)) {
      return response;
    }

    // User is already anonymous (voluntary logout or already expired): ignore 401 globally.
    if (getAuthClientStatus() !== "authenticated") {
      return response;
    }

    if (!requestCanUseAuthCookies(input, init, requestUrl)) {
      return response;
    }

    const refreshSucceeded = await refreshToken(originalFetch);

    if (!refreshSucceeded) {
      emitSessionExpiredOnce(requestUrl);
      return response;
    }

    let retriedResponse: Response;

    if (input instanceof Request) {
      retriedResponse = init
        ? await originalFetch(new Request(input, init))
        : await originalFetch(input.clone());
    } else {
      retriedResponse = await originalFetch(input, init);
    }

    if (retriedResponse.status === 401) {
      if (!(await isBusiness401Response(retriedResponse))) {
        emitSessionExpiredOnce(requestUrl);
      }
    }

    return retriedResponse;
  };

  windowWithFlag[INTERCEPTOR_FLAG] = true;
}
