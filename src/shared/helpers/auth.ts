/**
 * Auth helper utilities
 */

import logger from "./logger";

function setCookie(name: string, value: string, days: number = 7) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;secure;httponly=false`;
}

function getCookie(name: string): string | null {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(nameEQ) === 0)
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
}

export function clearTokens(): void {
  // Clear tokens from cookies
  deleteCookie("access_token");
  deleteCookie("refresh_token");
  deleteCookie("user_data");

  // Clear sessionStorage
  sessionStorage.clear();
}

export async function refreshAccessToken(): Promise<boolean> {
  try {
    const refreshToken = getCookie("refresh_token");
    if (!refreshToken) {
      logger.log("No refresh token available");
      return false;
    }

    const response = await fetch("", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      if (data.access_token) {
        setCookie("access_token", data.access_token, 1);
        if (data.refresh_token) {
          setCookie("refresh_token", data.refresh_token, 7);
        }
        logger.log("Access token refreshed successfully");
        return true;
      }
    }

    logger.log("Failed to refresh access token");
    return false;
  } catch (error) {
    logger.error("Error refreshing access token:", error);
    return false;
  }
}
