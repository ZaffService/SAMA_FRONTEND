/**
 * Utilitaires pour les requêtes sécurisées
 */

import logger from "./logger";

export function isValidResourceId(id: string | number): boolean {
  if (typeof id === "number") {
    return id > 0 && Number.isInteger(id);
  }
  if (typeof id === "string") {
    return id.length > 0 && /^\d/.test(id) && parseInt(id) > 0;
  }
  return false;
}

export function sanitizeInput(input: string): string {
  return input.replace(/[<]/g, "").trim();
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export async function safeFetch(url: string, options?: RequestInit) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    logger.error("Safe fetch error:", error);
    throw error;
  }
}
