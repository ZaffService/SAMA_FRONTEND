"use client";

import { useEffect } from "react";

const RESTRICTED_INPUT_TYPES = new Set([
  "email",
  "tel",
  "url",
  "number",
  "date",
  "datetime-local",
  "time",
  "month",
  "week",
]);

const VALIDATION_ATTRIBUTES = [
  "required",
  "pattern",
  "min",
  "max",
  "minlength",
] as const;

function resolveInputMode(input: HTMLInputElement, originalType: string) {
  if (input.inputMode) return;

  if (originalType === "email") {
    input.inputMode = "email";
    return;
  }
  if (originalType === "tel") {
    input.inputMode = "tel";
    return;
  }
  if (originalType === "number") {
    input.inputMode = "numeric";
  }
}

function neutralizeInput(input: HTMLInputElement) {
  const originalType = input.getAttribute("type") || "text";

  if (RESTRICTED_INPUT_TYPES.has(originalType)) {
    input.type = "text";
    resolveInputMode(input, originalType);
  }

  for (const attribute of VALIDATION_ATTRIBUTES) {
    if (input.hasAttribute(attribute)) {
      input.removeAttribute(attribute);
    }
  }
}

function neutralizeForm(form: HTMLFormElement) {
  form.setAttribute("novalidate", "");

  form.querySelectorAll("input").forEach((element) => {
    if (element instanceof HTMLInputElement) {
      neutralizeInput(element);
    }
  });

  form.querySelectorAll("select, textarea").forEach((element) => {
    for (const attribute of VALIDATION_ATTRIBUTES) {
      if (element.hasAttribute(attribute)) {
        element.removeAttribute(attribute);
      }
    }
  });
}

function neutralizeDocument(root: ParentNode = document) {
  root.querySelectorAll("form").forEach((form) => {
    if (form instanceof HTMLFormElement) {
      neutralizeForm(form);
    }
  });

  root.querySelectorAll("input").forEach((element) => {
    if (element instanceof HTMLInputElement) {
      neutralizeInput(element);
    }
  });
}

export function DisableHtmlValidation() {
  useEffect(() => {
    neutralizeDocument();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            neutralizeDocument(node);
          }
        });

        if (
          mutation.type === "attributes" &&
          mutation.target instanceof HTMLInputElement
        ) {
          neutralizeInput(mutation.target);
        }

        if (
          mutation.type === "attributes" &&
          mutation.target instanceof HTMLFormElement
        ) {
          neutralizeForm(mutation.target);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["type", "required", "pattern", "min", "max", "minlength"],
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
